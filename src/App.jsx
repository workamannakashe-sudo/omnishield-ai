import React, { useState, useEffect } from 'react';
import AuthPortal from './components/AuthPortal';
import OverviewTab from './components/OverviewTab';
import Phase1Tab from './components/Phase1Tab';
import Phase2Tab from './components/Phase2Tab';
import Phase3Tab from './components/Phase3Tab';
import CenterDashboard from './components/CenterDashboard';
import { 
  isFirebaseConnected, 
  subscribeFirebaseStatus, 
  writeDbState, 
  subscribeDbState 
} from './firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [clockTime, setClockTime] = useState('08:14:32 IST');

  // Shared Global States
  const [totalQuestions, setTotalQuestions] = useState(4872);
  const [threatLevel, setThreatLevel] = useState('Condition Green');
  const [threatCount, setThreatCount] = useState(3);
  
  // Real-time dynamic stats compiled from Center events
  const [unlockedCenters, setUnlockedCenters] = useState([]);
  const [papersPrinted, setPapersPrinted] = useState(0);
  
  // Cloud sync status state
  const [isCloudSync, setIsCloudSync] = useState(false);

  // Bloom's taxonomy percentages
  const [difficultyData, setDifficultyData] = useState([
    { name: 'L1 Remember', value: 12 },
    { name: 'L2 Understand', value: 18 },
    { name: 'L3 Apply', value: 28 },
    { name: 'L4 Analyse', value: 24 },
    { name: 'L5/L6 Evaluate+', value: 18 }
  ]);

  // Subject coverage percentages
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
      timestamp: '08:10:12 AM',
      options: [
        { text: "A. 40S and 60S subunit scanning", correct: true },
        { text: "B. 30S and 50S prokaryotic binding", correct: false },
        { text: "C. 80S direct initiation bypass", correct: false },
        { text: "D. 70S mono-cistronic translation", correct: false }
      ]
    },
    {
      id: 'PHYS-2026-H4',
      text: 'Calculate the magnetic flux density at the center of a circular current carrying loop of radius R.',
      subject: 'Physics',
      bloom: 'L3 Apply',
      similarity: '18.1%',
      timestamp: '08:08:45 AM',
      options: [
        { text: "A. μ0 I / (2R)", correct: true },
        { text: "B. μ0 I / (4πR)", correct: false },
        { text: "C. μ0 I R^2", correct: false },
        { text: "D. Zero", correct: false }
      ]
    },
    {
      id: 'CHEM-2026-F9',
      text: 'Identify the major product formed when toluene is treated with chlorine in the presence of FeCl3.',
      subject: 'Chemistry',
      bloom: 'L1 Remember',
      similarity: '9.2%',
      timestamp: '08:05:33 AM',
      options: [
        { text: "A. o- and p-chlorotoluene", correct: true },
        { text: "B. m-chlorotoluene", correct: false },
        { text: "C. Benzyl chloride", correct: false },
        { text: "D. Benzal chloride", correct: false }
      ]
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

  // Audit Logs (Terminal)
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

  // Broadcast channel helper
  const syncChannel = new BroadcastChannel('omnishield_sync');

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

  // Subscribe to Firebase Cloud Sync status
  useEffect(() => {
    return subscribeFirebaseStatus((status) => {
      setIsCloudSync(status);
    });
  }, []);

  // Fetch real-time backend question statistics on load and mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/questions/stats');
        if (res.ok) {
          const data = await res.json();
          const approved = data.counters.approved || 4872;
          setTotalQuestionsSynced(approved);

          // Update subject coverage percentages
          if (data.subject_split) {
            const total = approved || 1;
            const mappedSubjects = [
              { name: 'Biology', value: Math.round(((data.subject_split.Biology || 0) / total) * 100) },
              { name: 'Chemistry', value: Math.round(((data.subject_split.Chemistry || 0) / total) * 100) },
              { name: 'Physics', value: Math.round(((data.subject_split.Physics || 0) / total) * 100) }
            ];
            setSubjectDataSynced(mappedSubjects);
          }

          // Update Bloom's taxonomy distribution percentages
          if (data.bloom_distribution) {
            const total = approved || 1;
            const mappedBloom = [
              { name: 'L1 Remember', value: Math.round(((data.bloom_distribution['L1 Remember'] || 0) / total) * 100) },
              { name: 'L2 Understand', value: Math.round(((data.bloom_distribution['L2 Understand'] || 0) / total) * 100) },
              { name: 'L3 Apply', value: Math.round(((data.bloom_distribution['L3 Apply'] || 0) / total) * 100) },
              { name: 'L4 Analyse', value: Math.round(((data.bloom_distribution['L4 Analyse'] || 0) / total) * 100) },
              { name: 'L5/L6 Evaluate+', value: Math.round((((data.bloom_distribution['L5 Evaluate'] || 0) + (data.bloom_distribution['L6 Create'] || 0)) / total) * 100) }
            ];
            setDifficultyDataSynced(mappedBloom);
          }
        }
      } catch (err) {
        console.warn('Backend offline: using default seed stats.', err);
      }
    };
    fetchStats();
    
    // Poll stats every 10 seconds for real-time updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Firebase State updates
  useEffect(() => {
    const unsubscribe = subscribeDbState('omnishield_state', (data) => {
      if (!data) return;
      
      if (data.totalQuestions !== undefined) {
        setTotalQuestions(prev => prev !== data.totalQuestions ? data.totalQuestions : prev);
      }
      if (data.threatLevel !== undefined) {
        setThreatLevel(prev => prev !== data.threatLevel ? data.threatLevel : prev);
      }
      if (data.threatCount !== undefined) {
        setThreatCount(prev => prev !== data.threatCount ? data.threatCount : prev);
      }
      if (data.threatSignals !== undefined) {
        setThreatSignals(prev => JSON.stringify(prev) !== JSON.stringify(data.threatSignals) ? data.threatSignals : prev);
      }
      if (data.backupPaperArmed !== undefined) {
        setBackupPaperArmed(prev => prev !== data.backupPaperArmed ? data.backupPaperArmed : prev);
      }
      if (data.unlocked !== undefined) {
        setUnlocked(prev => prev !== data.unlocked ? data.unlocked : prev);
      }
      if (data.unlockedCenters !== undefined) {
        setUnlockedCenters(prev => JSON.stringify(prev) !== JSON.stringify(data.unlockedCenters) ? data.unlockedCenters : prev);
      }
      if (data.papersPrinted !== undefined) {
        setPapersPrinted(prev => prev !== data.papersPrinted ? data.papersPrinted : prev);
      }
      if (data.recentQuestions !== undefined) {
        setRecentQuestions(prev => JSON.stringify(prev) !== JSON.stringify(data.recentQuestions) ? data.recentQuestions : prev);
      }
      if (data.difficultyData !== undefined) {
        setDifficultyData(prev => JSON.stringify(prev) !== JSON.stringify(data.difficultyData) ? data.difficultyData : prev);
      }
      if (data.subjectData !== undefined) {
        setSubjectData(prev => JSON.stringify(prev) !== JSON.stringify(data.subjectData) ? data.subjectData : prev);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Local tab sync via BroadcastChannel as a fallback/redundant link
  useEffect(() => {
    const channel = new BroadcastChannel('omnishield_sync');
    
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'TOTAL_QUESTIONS_SYNC':
          setTotalQuestions(payload);
          break;
        case 'DIFFICULTY_DATA_SYNC':
          setDifficultyData(payload);
          break;
        case 'SUBJECT_DATA_SYNC':
          setSubjectData(payload);
          break;
        case 'RECENT_QUESTIONS_SYNC':
          setRecentQuestions(payload);
          break;
        case 'THREAT_LEVEL_SYNC':
          setThreatLevel(payload);
          break;
        case 'THREAT_COUNT_SYNC':
          setThreatCount(payload);
          break;
        case 'THREAT_SIGNALS_SYNC':
          setThreatSignals(payload);
          break;
        case 'BACKUP_PAPER_ARMED_SYNC':
          setBackupPaperArmed(payload);
          break;
        case 'UNLOCKED_SYNC':
          setUnlocked(payload);
          break;
        case 'UNLOCKED_CENTERS_SYNC':
          setUnlockedCenters(payload);
          break;
        case 'PAPERS_PRINTED_SYNC':
          setPapersPrinted(payload);
          break;

        case 'NTA_STATE_UPDATE':
          if (currentUser?.role === 'center') {
            setTotalQuestions(payload.totalQuestions);
            setThreatLevel(payload.threatLevel);
            setThreatSignals(payload.threatSignals);
            setBackupPaperArmed(payload.backupPaperArmed);
          }
          break;
          
        case 'QUESTION_GENERATED_SYNC':
          setTotalQuestions(payload.totalQuestions);
          setRecentQuestions(payload.recentQuestions);
          setDifficultyData(payload.difficultyData);
          setSubjectData(payload.subjectData);
          break;

        case 'ALERT_TRIGGERED_SYNC':
          setThreatLevel('Condition Red');
          setThreatCount(payload.threatCount);
          setThreatSignals(payload.threatSignals);
          break;

        case 'BACKUP_TRIGGERED_SYNC':
          setBackupPaperArmed(true);
          setThreatLevel('Condition Green (Secured)');
          setThreatSignals(payload.threatSignals);
          break;

        case 'UNLOCK_BROADCAST':
          if (currentUser?.role === 'center') {
            setUnlocked(true);
          }
          break;

        case 'CENTER_UNLOCKED':
          setUnlockedCenters(prev => {
            if (prev.includes(payload.centerCode)) return prev;
            return [...prev, payload.centerCode];
          });
          addSystemLog(`[SATELLITE] Sync Confirmed: Node ${payload.centerCode} Decrypted offline successfully.`);
          break;

        case 'CENTER_PRINTED':
          setPapersPrinted(prev => prev + payload.count);
          addSystemLog(`[PRINTER] Sync Confirmed: Node ${payload.centerCode} printed ${payload.count} watermarked sheets.`);
          break;
          
        default:
          break;
      }
    };

    return () => channel.close();
  }, [currentUser]);

  // Synced Wrapper State Setters
  const setTotalQuestionsSynced = (val) => {
    setTotalQuestions((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/totalQuestions', next);
      syncChannel.postMessage({ type: 'TOTAL_QUESTIONS_SYNC', payload: next });
      return next;
    });
  };

  const setDifficultyDataSynced = (val) => {
    setDifficultyData((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/difficultyData', next);
      syncChannel.postMessage({ type: 'DIFFICULTY_DATA_SYNC', payload: next });
      return next;
    });
  };

  const setSubjectDataSynced = (val) => {
    setSubjectData((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/subjectData', next);
      syncChannel.postMessage({ type: 'SUBJECT_DATA_SYNC', payload: next });
      return next;
    });
  };

  const setRecentQuestionsSynced = (val) => {
    setRecentQuestions((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/recentQuestions', next);
      syncChannel.postMessage({ type: 'RECENT_QUESTIONS_SYNC', payload: next });
      return next;
    });
  };

  const setThreatLevelSynced = (val) => {
    setThreatLevel(val);
    writeDbState('omnishield_state/threatLevel', val);
    syncChannel.postMessage({ type: 'THREAT_LEVEL_SYNC', payload: val });
  };

  const setThreatCountSynced = (val) => {
    setThreatCount((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/threatCount', next);
      syncChannel.postMessage({ type: 'THREAT_COUNT_SYNC', payload: next });
      return next;
    });
  };

  const setThreatSignalsSynced = (val) => {
    setThreatSignals((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/threatSignals', next);
      syncChannel.postMessage({ type: 'THREAT_SIGNALS_SYNC', payload: next });
      return next;
    });
  };

  const setBackupPaperArmedSynced = (val) => {
    setBackupPaperArmed(val);
    writeDbState('omnishield_state/backupPaperArmed', val);
    syncChannel.postMessage({ type: 'BACKUP_PAPER_ARMED_SYNC', payload: val });
  };

  const setUnlockedSynced = (val) => {
    setUnlocked(val);
    writeDbState('omnishield_state/unlocked', val);
    syncChannel.postMessage({ type: 'UNLOCKED_SYNC', payload: val });
  };

  const setUnlockedCentersSynced = (val) => {
    setUnlockedCenters((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/unlockedCenters', next);
      syncChannel.postMessage({ type: 'UNLOCKED_CENTERS_SYNC', payload: next });
      return next;
    });
  };

  const setPapersPrintedSynced = (val) => {
    setPapersPrinted((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      writeDbState('omnishield_state/papersPrinted', next);
      syncChannel.postMessage({ type: 'PAPERS_PRINTED_SYNC', payload: next });
      return next;
    });
  };

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
      // Only stream logs if logged in as NTA Operator
      if (currentUser?.role === 'nta') {
        const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
        addSystemLog(randomLog);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('overview');
  };

  // If not authenticated, render login gateway
  if (!currentUser) {
    return <AuthPortal onLoginSuccess={setCurrentUser} />;
  }

  // If logged in as Center Coordinator, render local center dashboard
  if (currentUser.role === 'center') {
    return (
      <CenterDashboard 
        currentUser={currentUser} 
        onLogout={handleLogout}
        totalQuestions={totalQuestions}
        unlocked={unlocked}
        setUnlocked={setUnlockedSynced}
        addSystemLog={addSystemLog}
        recentQuestions={recentQuestions}
        isCloudSync={isCloudSync}
      />
    );
  }

  // Render NTA Admin Dashboard Layout
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
            setTotalQuestions={setTotalQuestionsSynced}
            difficultyData={difficultyData}
            setDifficultyData={setDifficultyDataSynced}
            subjectData={subjectData}
            setSubjectData={setSubjectDataSynced}
            recentQuestions={recentQuestions}
            setRecentQuestions={setRecentQuestionsSynced}
            addSystemLog={addSystemLog}
          />
        );
      case 'phase2':
        return (
          <Phase2Tab 
            threatLevel={threatLevel}
            setThreatLevel={setThreatLevelSynced}
            threatCount={threatCount}
            setThreatCount={setThreatCountSynced}
            threatSignals={threatSignals}
            setThreatSignals={setThreatSignalsSynced}
            backupPaperArmed={backupPaperArmed}
            setBackupPaperArmed={setBackupPaperArmedSynced}
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
            setUnlocked={setUnlockedSynced}
            unlockLogs={unlockLogs}
            setUnlockLogs={setUnlockLogs}
            addSystemLog={addSystemLog}
            unlockedCenters={unlockedCenters}
            papersPrinted={papersPrinted}
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
          {/* Cloud Sync Status Indicator */}
          <div className="nav-status font-mono text-[10px] bg-bg3 border border-border px-2 py-0.5 rounded flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isCloudSync ? 'bg-green animate-pulse' : 'bg-blue'}`} />
            <span className={isCloudSync ? 'text-green' : 'text-blue-400'}>
              {isCloudSync ? 'CLOUD SYNC ACTIVE' : 'LOCAL TAB SYNC'}
            </span>
          </div>
          
          <div className="nav-status font-mono text-[11px]">
            <div className={`pulse-dot ${threatLevel === 'Condition Red' ? 'bg-red' : 'bg-green'}`} />
            {threatLevel === 'Condition Red' ? 'SYSTEM THREAT DETECTED' : 'SYSTEM NOMINAL'}
          </div>
          <div className="nav-time font-mono text-[11px]" id="clock">{clockTime}</div>
          <button 
            onClick={handleLogout}
            className="ml-2 px-2.5 py-1 rounded bg-bg3 border border-border text-[10px] text-text2 hover:text-white transition-all font-mono uppercase"
          >
            Sign Out
          </button>
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
