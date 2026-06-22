import unittest
import os
import json
import hashlib
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.database import get_session, Question, QuestionPaper, PaperQuestionLink, ExamType, Exam

class TestNewFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = next(get_session())
        
        # Ensure we have an active exam and exam type
        cls.exam_type = cls.db.exec(select(ExamType)).first()
        if not cls.exam_type:
            cls.exam_type = ExamType(name="NEET UG", category="Medical")
            cls.db.add(cls.exam_type)
            cls.db.commit()
            cls.db.refresh(cls.exam_type)
            
        cls.exam = cls.db.exec(select(Exam)).first()
        if not cls.exam:
            cls.exam = Exam(
                exam_type_id=cls.exam_type.id,
                name="NEET Test 2026",
                date="2026-06-25",
                shift="Morning",
                duration=180,
                status="SETUP"
            )
            cls.db.add(cls.exam)
            cls.db.commit()
            cls.db.refresh(cls.exam)

    def test_list_questions_pagination_and_sorting(self):
        """Test GET /api/questions supports limit, offset and desc sorting"""
        # Create two test questions
        q1 = Question(
            exam_type_id=self.exam_type.id,
            text_json=json.dumps({"en": "First custom question for pagination test"}),
            options_json=json.dumps({"en": {"A": "Yes", "B": "No"}}),
            answer="A",
            subject="Biology",
            chapter="Test",
            topic="Test",
            bloom_level="L1 Remember",
            difficulty="Easy",
            question_type="MCQ_single",
            source="Synthetic",
            audit_hash="test_hash_pagination_1",
            status="APPROVED"
        )
        q2 = Question(
            exam_type_id=self.exam_type.id,
            text_json=json.dumps({"en": "Second custom question for pagination test"}),
            options_json=json.dumps({"en": {"A": "Yes", "B": "No"}}),
            answer="A",
            subject="Chemistry",
            chapter="Test",
            topic="Test",
            bloom_level="L2 Understand",
            difficulty="Medium",
            question_type="MCQ_single",
            source="Synthetic",
            audit_hash="test_hash_pagination_2",
            status="APPROVED"
        )
        self.db.add(q1)
        self.db.add(q2)
        self.db.commit()
        self.db.refresh(q1)
        self.db.refresh(q2)

        # Retrieve limit=2
        res = self.client.get("/api/questions?status=APPROVED&limit=2")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 2)
        
        # Verify sorting by id desc (second question created should come first)
        self.assertEqual(data[0]["id"], q2.id)
        self.assertEqual(data[1]["id"], q1.id)

    def test_create_question_manually(self):
        """Test POST /api/questions to manually register questions"""
        payload = {
            "exam_type_id": self.exam_type.id,
            "text": "Identify the organic compound with formula CH4.",
            "options": {
                "A": "Methane",
                "B": "Ethane",
                "C": "Propane",
                "D": "Butane"
            },
            "answer": "A",
            "subject": "Chemistry",
            "bloom_level": "L1 Remember",
            "difficulty": "Easy"
        }
        res = self.client.post("/api/questions", json=payload, headers={"X-CSRF-Token": "test_csrf_token"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["subject"], "Chemistry")
        self.assertEqual(data["answer"], "A")
        
        # Verify it was inserted in database
        db_q = self.db.get(Question, data["id"])
        self.assertIsNotNone(db_q)
        self.assertEqual(json.loads(db_q.text_json)["en"], "Identify the organic compound with formula CH4.")

    def test_pdf_paper_upload_and_extraction(self):
        """Test POST /api/papers/upload-pdf runs OCR, inserts and links questions, and gets encrypted JSON bundle"""
        # Create a test PDF on the filesystem
        import fitz
        pdf_path = "test_upload_paper.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "1. Which gas is known as laughter gas?\n(A) Nitrous oxide\n(B) Carbon dioxide\n(C) Nitrogen\n(D) Oxygen\nAnswer: A")
        doc.save(pdf_path)
        doc.close()

        # Upload the PDF via API
        with open(pdf_path, "rb") as f:
            res = self.client.post("/api/papers/upload-pdf", data={
                "paper_name": "NEET Science Test",
                "exam_name": "NEET UG 2026",
                "exam_date": "2026-06-25",
                "shift": "Morning",
                "set_code": "B",
                "exam_type_id": self.exam_type.id,
                "duration": 180,
                "security_level": "HIGH",
                "sealed_by": "test_admin"
            }, files={
                "file": ("test_upload_paper.pdf", f, "application/pdf")
            }, headers={"X-CSRF-Token": "test_csrf_token"})

        # Cleanup PDF on disk
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

        self.assertEqual(res.status_code, 200)
        upload_data = res.json()
        self.assertTrue(upload_data["success"])
        self.assertGreater(upload_data["extracted_count"], 0)
        paper_id = upload_data["paper_id"]

        # Verify that questions were linked
        links = self.db.exec(select(PaperQuestionLink).where(PaperQuestionLink.paper_id == paper_id)).all()
        self.assertGreater(len(links), 0)

        # Test download bundle returns the encrypted questions JSON instead of PDF
        res_bundle = self.client.get(f"/api/papers/{paper_id}/download-bundle?key=OMNISHIELD-KEY-2026-NEET")
        self.assertEqual(res_bundle.status_code, 200)
        bundle_bytes = res_bundle.content
        
        # Verify AES-256 decryption of the GCM bundle
        iv = bundle_bytes[:12]
        ciphertext = bundle_bytes[12:-16]
        tag = bundle_bytes[-16:]
        
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        aes_key = hashlib.sha256(b"OMNISHIELD-KEY-2026-NEET").digest()
        
        decryptor = Cipher(
            algorithms.AES(aes_key),
            modes.GCM(iv, tag),
        ).decryptor()
        
        decrypted_data = decryptor.update(ciphertext) + decryptor.finalize()
        decrypted_json = json.loads(decrypted_data.decode('utf-8'))
        
        # Verify it is indeed structured questions JSON and contains our scanned question
        self.assertIsInstance(decrypted_json, list)
        self.assertGreater(len(decrypted_json), 0)
        self.assertTrue(any("laughter gas" in q["text"].lower() for q in decrypted_json))

if __name__ == "__main__":
    unittest.main()
