import unittest
import json
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app, seed_database
from app.database import engine, init_db, get_session, User, AuditLedger, Question, ExamCenter, SystemConfig
from app.routers.auth import hash_password

class TestOmniShieldAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize database schemas
        init_db()
        # Manually trigger seed data load for unit tests
        seed_database()
        
        cls.client = TestClient(app)
        
        # Ensure test operator user is registered for auth testing
        db = next(get_session())
        existing = db.exec(select(User).where(User.username == "test_operator")).first()
        if not existing:
            op_user = User(
                username="test_operator",
                password_hash=hash_password("testpass123"),
                role="Center",
                center_id=1
            )
            db.add(op_user)
            db.commit()

        existing_admin = db.exec(select(User).where(User.username == "test_admin")).first()
        if not existing_admin:
            admin_user = User(
                username="test_admin",
                password_hash=hash_password("adminpass123"),
                role="SuperAdmin"
            )
            db.add(admin_user)
            db.commit()

    def test_database_seeding(self):
        """Verify initial database seeds are loaded successfully"""
        db = next(get_session())
        questions_count = len(db.exec(select(Question)).all())
        centers_count = len(db.exec(select(ExamCenter)).all())
        config_threshold = db.exec(select(SystemConfig).where(SystemConfig.key == "similarity_threshold")).first()
        
        self.assertGreater(questions_count, 0)
        self.assertGreater(centers_count, 0)
        self.assertIsNotNone(config_threshold)
        self.assertEqual(config_threshold.value, "0.85")

    def test_audit_ledger_append_only(self):
        """Verify AuditLedger is append-only (blocks updates and deletes)"""
        db = next(get_session())
        
        # 1. Create a dummy log
        log = AuditLedger(
            actor_id="test_actor",
            actor_role="SuperAdmin",
            event_type="TEST_EVENT",
            event_hash="hash_dummy",
            payload_json="{}"
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        
        # 2. Try to update log -> should raise PermissionError
        log.actor_id = "malicious_updater"
        db.add(log)
        with self.assertRaises(Exception) as context:
            db.commit()
        db.rollback()
        
        # 3. Try to delete log -> should raise PermissionError
        db.delete(log)
        with self.assertRaises(Exception) as context:
            db.commit()
        db.rollback()

    def test_auth_login_flow(self):
        """Verify credentials check and JWT creation"""
        # Invalid login
        res = self.client.post("/api/auth/login", json={
            "username": "test_operator",
            "password": "wrongpassword"
        })
        self.assertEqual(res.status_code, 401)
        
        # Successful login
        res = self.client.post("/api/auth/login", json={
            "username": "test_operator",
            "password": "testpass123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "Center")
        self.assertIn("access_token", data)

    def test_role_based_access_control(self):
        """Verify endpoints reject requests with wrong role claims"""
        # Login as operator
        login_res = self.client.post("/api/auth/login", json={
            "username": "test_operator",
            "password": "testpass123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access admin-only route (/api/exams/create) -> should raise 403 Forbidden
        exam_payload = {
            "name": "Unauthorized Exam Name",
            "exam_type_id": 1,
            "date": "2026-06-10",
            "shift": "Morning",
            "duration": 180,
            "security_level": "CRITICAL",
            "config_json": {}
        }
        res = self.client.post("/api/exams/create", json=exam_payload, headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_exam_step_transitions(self):
        """Verify exam Day control step transition endpoint and real-time broadcasts"""
        # Login as admin
        login_res = self.client.post("/api/auth/login", json={
            "username": "test_admin",
            "password": "adminpass123"
        })
        token = login_res.json()["access_token"]
        headers = {
            "Authorization": f"Bearer {token}",
            "X-CSRF-Token": "test_csrf_token"
        }
        
        # Transition to step 3
        res = self.client.patch("/api/exams/1/step?step=3", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["current_step"], 3)
        self.assertEqual(data["label"], "BROADCAST_TOKEN")

    def test_watermark_endpoints(self):
        """Verify PDF watermarking and forensic extraction API routes"""
        res = self.client.post("/api/watermark/extract", files={
            "file": ("test.png", b"dummy_image_data_with_watermark_bits", "image/png")
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["candidate_roll"], "ROLL#2024001")

    def test_candidate_checkin(self):
        """Verify candidate check-in status update and counter updates"""
        headers = {"X-CSRF-Token": "test_csrf_token"}
        # Call checkin for a valid candidate
        res = self.client.post(
            "/api/centers/2/checkin",
            params={"roll_number": "ROLL#20260001", "present": True},
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "SUCCESS")
        self.assertEqual(res.json()["candidate_status"], "CHECKED_IN")

        # Verify invalid candidate returns 404
        res_invalid = self.client.post(
            "/api/centers/2/checkin",
            params={"roll_number": "ROLL#NONEXISTENT", "present": True},
            headers=headers
        )
        self.assertEqual(res_invalid.status_code, 404)

    def test_threat_simulation_and_backup(self):
        """Verify threat simulation categorization and dual-authority backup deployment"""
        headers = {"X-CSRF-Token": "test_csrf_token"}
        # Simulate non-critical threat
        res = self.client.post("/api/threats/simulate", json={
            "source": "Telegram mock channel",
            "snippet": "Mild threat warning",
            "similarity_score": 50.0
        }, headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["threat"]["verdict"], "ANALYSING")

        # Simulate critical threat
        res_critical = self.client.post("/api/threats/simulate", json={
            "source": "Telegram mock channel 2",
            "snippet": "CRITICAL leaked questions",
            "similarity_score": 85.0
        }, headers=headers)
        self.assertEqual(res_critical.status_code, 200)
        self.assertEqual(res_critical.json()["threat"]["verdict"], "CRITICAL")

        # Test dual-authority backup: missing one signature
        backup_fail = self.client.post("/api/threats/trigger-backup", json={
            "exam_id": 1,
            "authority_1_signed": True,
            "authority_2_signed": False,
            "operator_name": "Test NTA Director"
        }, headers=headers)
        self.assertEqual(backup_fail.status_code, 400)
        self.assertIn("Dual-authority approval check failed", backup_fail.json()["detail"])

        # Test dual-authority backup: success
        backup_success = self.client.post("/api/threats/trigger-backup", json={
            "exam_id": 1,
            "authority_1_signed": True,
            "authority_2_signed": True,
            "operator_name": "Test NTA Director"
        }, headers=headers)
        self.assertEqual(backup_success.status_code, 200)
        self.assertEqual(backup_success.json()["status"], "SUCCESS")

    def test_questions_stats(self):
        """Verify question statistics aggregation endpoint"""
        res = self.client.get("/api/questions/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("counters", data)
        self.assertIn("subject_split", data)
        self.assertIn("bloom_distribution", data)
        self.assertIn("throughput", data)
        self.assertGreater(data["counters"]["total"], 0)

if __name__ == "__main__":
    unittest.main()
