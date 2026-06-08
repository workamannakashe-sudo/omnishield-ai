import React, { useState, useEffect } from 'react';
import OverviewTab from './components/OverviewTab';
import Phase1Tab from './components/Phase1Tab';
import Phase2Tab from './components/Phase2Tab';
import Phase3Tab from './components/Phase3Tab';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [clockTime, setClockTime] = useState('08:14:32 IST');

  // Shared Global States
  const [totalQuestions, setTotalQuestions] = useState(4872);
  const [threatLevel, setThreatLevel] = useState('Condition Green');
  const [threatCount, setThreatCount] = useState(3);

  // Bloom's taxonomy percentages (start state)
  const [difficultyData, setDifficultyData] = useState([
    { name: 'L1 Remember', value: 12 },
    { name: 'L2 Understand', value: 18 },
    { name: 'L3 Apply', value: 28 },
    { name: 'L4 Analyse', value: 24 },
    { name: 'L5/L6 Evaluate+', value: 18 }
  ]);

  // Subject coverage percentages (start state)
  const [subjectData, setSubjectData] = useState([
    { name: 'Biology', value: 45 },
    { name: 'Chemistry', value: 35 },
    { name: 'Physics', value: 20 }
  ]);

  // Audit list
  const [recentQuestions, setRecentQuestions] = useState([
    {
      id: 'BIOL-2026-A2',
      text: 'Analyze the ribosomal subunit configuration during eukaryotic translation initiation phase.',
      subject: 'Biology',
      bloom: 'L4 Analyse',
      similarity: '14.5%',
      timestamp: '08:10:12 AM'
    },
    {
      id: 'PHYS-2026-H4',
      text: 'Calculate the magnetic flux density at the center of a circular current carrying loop of radius R.',
      subject: 'Physics',
      bloom: 'L3 Apply',
      similarity: '18.1%',
      timestamp: '08:08:45 AM'
    },
    {
      id: 'CHEM-2026-F9',
      text: 'Identify the major product formed when toluene is treated with chlorine in the presence of FeCl3.',
      subject: 'Chemistry',
      bloom: 'L1 Remember',
      similarity: '9.2%',
      timestamp: '08:05:33 AM'
    }
  ]);

  // Threat signals feed
  const [threatSignals, setThreatSignals] = useState([
    {
      timestamp: '08:12:31 AM',
      source: 'Telegram @leaks2026',
      snippet: '"NEET paper OUT! Biology full paper..."',
      similarity: '9%',
      status: 'FAKE',
      alert: false
    },
    {
      timestamp: '08:09:14 AM',
      source: 'Telegram @neetleaks',
      snippet: '"Helicase question confirmed in paper A"',
      similarity: '18%',
      status: 'FAKE',
      alert: false
    },
    {
      timestamp: '07:58:02 AM',
      source: 'Dark web forum',
      snippet: '"Full MCQ set — physics section..."',
      similarity: '44%',
      status: 'ANALYSING',
      alert: false
    }
  ]);

  // Phase 2 / Backup Protocol States
  const [backupPaperArmed, setBackupPaperArmed] = useState(false);
  const [backupStep1, setBackupStep1] = useState(false);
  const [backupStep2, setBackupStep2] = useState(false);

  // Phase 3 States
  const [unlocked, setUnlocked] = useState(false);
  const [unlockLogs, setUnlockLogs] = useState([]);

  // Audit Logs (Terminal) - 4-second auto-update logs
  const [systemLogs, setSystemLogs] = useState([
    '[08:14:31] [SYS] Agent-B validated Q#4872 — APPROVED [Bloom L3]',
    '[08:14:29] [SYS] Edge server IN-MH-042 pinged heartbeat — OK',
    '[08:14:27] [SYS] Scout: Telegram signal detected — similarity 12% — FAKE',
    '[08:14:21] [SYS] Q#4871 passed similarity filter (score 0.71 < 0.85)',
    '[08:14:18] [SYS] Watermark test: roll#2024001 extracted successfully',
    '[08:14:10] [SYS] Backup paper checksum verified — SHA-256 match',
    '[08:13:58] [SYS] Satellite channel ISRO-SAT3 connected',
    '[08:13:44] [SYS] Q#4870 discarded — similarity 0.91 > threshold'
  ]);

  // Function to add new log with timestamp
  const addSystemLog = (message) => {
    const n = new Date();
    const timeStr = n.toTimeString().slice(0, 8);
    setSystemLogs((prev) => [`[${timeStr}] ${message}`, ...prev]);
  };

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date();
      setClockTime(n.toTimeString().slice(0, 8) + ' IST');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-appending logs simulation (every 4 seconds)
  useEffect(() => {
    const logPool = [
      '[SYS] Database replication health check: OK.',
      '[EDGE] Ping received from Center IN-DL-021. Status: locked.',
      '[EDGE] Ping received from Center IN-KA-098. Status: locked.',
      '[EDGE] Ping received from Center IN-WB-105. Status: locked.',
      '[OSINT] Swept Telegram public channel neet_leaks_2026. Result: No anomalies.',
      '[OSINT] Swept Tor Onion mirror indexes. Result: 100% nominal.',
      '[DB] Cryptographic hash verification check: PASS.',
      '[SYS] Edge server health check complete. 5,000/5,000 active nodes synchronized.'
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      addSystemLog(randomLog);
    }, 4000); // Exact 4-second interval

    return () => clearInterval(interval);
  }, []);

  // Render current active tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab 
            threatLevel={threatLevel} 
            totalQuestions={totalQuestions} 
            threatCount={threatCount}
            systemLogs={systemLogs}
          />
        );
      case 'phase1':
        return (
          <Phase1Tab 
            totalQuestions={totalQuestions}
            setTotalQuestions={setTotalQuestions}
            difficultyData={difficultyData}
            setDifficultyData={setDifficultyData}
            subjectData={subjectData}
            setSubjectData={setSubjectData}
            recentQuestions={recentQuestions}
            setRecentQuestions={setRecentQuestions}
            addSystemLog={addSystemLog}
          />
        );
      case 'phase2':
        return (
          <Phase2Tab 
            threatLevel={threatLevel}
            setThreatLevel={setThreatLevel}
            threatCount={threatCount}
            setThreatCount={setThreatCount}
            threatSignals={threatSignals}
            setThreatSignals={setThreatSignals}
            backupPaperArmed={backupPaperArmed}
            setBackupPaperArmed={setBackupPaperArmed}
            backupStep1={backupStep1}
            setBackupStep1={setBackupStep1}
            backupStep2={backupStep2}
            setBackupStep2={setBackupStep2}
            addSystemLog={addSystemLog}
          />
        );
      case 'phase3':
        return (
          <Phase3Tab 
            unlocked={unlocked}
            setUnlocked={setUnlocked}
            unlockLogs={unlockLogs}
            setUnlockLogs={setUnlockLogs}
            addSystemLog={addSystemLog}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-blue/30 relative">
      {/* Top Header Navigation */}
      <div className="nav">
        <div className="nav-logo">
          <div className="shield">
            <svg viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M14 2L3 6.5V15C3 21.5 7.8 27.6 14 29C20.2 27.6 25 21.5 25 15V6.5L14 2Z" stroke="#38b6ff" strokeWidth="1.5" fill="rgba(56,182,255,0.08)"/>
              <path d="M9 15.5L12.5 19L19 12" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">OmniShield AI</div>
            <div className="logo-sub">EXAM SECURITY PLATFORM</div>
          </div>
        </div>
        <div className="nav-right">
          <div className="nav-status font-mono text-[11px]">
            <div className={`pulse-dot ${threatLevel === 'Condition Red' ? 'bg-red' : 'bg-green'}`} />
            {threatLevel === 'Condition Red' ? 'SYSTEM THREAT DETECTED' : 'SYSTEM NOMINAL'}
          </div>
          <div className="nav-time font-mono text-[11px]" id="clock">{clockTime}</div>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="tabs">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          ● Overview
        </button>
        <button 
          onClick={() => setActiveTab('phase1')} 
          className={`tab ${activeTab === 'phase1' ? 'active' : ''}`}
        >
          Phase 1 — Generation
          <span className="tab-badge" style={{ backgroundColor: 'var(--green)' }} />
        </button>
        <button 
          onClick={() => setActiveTab('phase2')} 
          className={`tab ${activeTab === 'phase2' ? 'active' : ''}`}
        >
          Phase 2 — Threat Intel
          <span className="tab-badge" style={{ backgroundColor: 'var(--amber)' }} />
        </button>
        <button 
          onClick={() => setActiveTab('phase3')} 
          className={`tab ${activeTab === 'phase3' ? 'active' : ''}`}
        >
          Phase 3 — Exam Day
          <span className="tab-badge" style={{ backgroundColor: 'var(--blue)' }} />
        </button>
      </div>

      {/* Render Component Content */}
      <div className="p-5 max-w-7xl mx-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}
