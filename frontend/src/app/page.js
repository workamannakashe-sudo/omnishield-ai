"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, KeyRound, Printer, Upload, 
  Award, FileText, Server, AlertTriangle, Users, Settings as SettingsIcon, 
  Database, Activity, Bot, ChevronRight, CheckCircle, XCircle, Search, 
  Plus, Play, RefreshCw, BarChart2, Eye, EyeOff, Lock, Unlock, Mail, Phone, Globe
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { jsPDF } from 'jspdf';

export default function CommandCenterApp() {
  const [role, setRole] = useState('SuperAdmin'); // SuperAdmin, ExamBoard, Center, Invigilator, Candidate
  const [activeTab, setActiveTab] = useState('overview');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [activeExam, setActiveExam] = useState(1);
  const [systemLogs, setSystemLogs] = useState([
    { ts: "17:08:12", type: "system", msg: "OmniShield Core Engine initialized successfully." },
    { ts: "17:08:15", type: "info", msg: "Connected to PostgreSQL database cluster." },
    { ts: "17:08:18", type: "green", msg: "Redis connection active on pub/sub channel." },
    { ts: "17:08:21", type: "purple", msg: "Scout Agent started OSINT scraping: Telegram, Twitter, Pastebin." },
    { ts: "17:08:24", type: "cyan", msg: "DWT-SVD Watermarking agent loaded on edge-sim nodes." }
  ]);

  // Live Metrics state
  const [metrics, setMetrics] = useState({
    questionsBanked: 4872,
    edgeServersOnline: 5000,
    activeThreats: 1,
    registeredCandidates: 240000,
    centersOnline: 5000,
    papersDownloaded: 0,
    candidatesLoggedIn: 0,
    submissionsReceived: 0,
    proctoringAlerts: 0,
    systemUptime: "99.98%"
  });

  // Simulated active threats state
  const [threatSignals, setThreatSignals] = useState([
    { id: 1, ts: "16:45:21", source: "Telegram @leak_neet2026", snippet: "NEET Biology direct PDF copy...", similarity: 14.2, verdict: "FAKE" },
    { id: 2, ts: "17:01:10", source: "Dark Web Mirror #4", snippet: "UPSC GS Paper I full leaks direct torrent...", similarity: 44.1, verdict: "ANALYSING" }
  ]);

  // Simulated exam types library
  const [examTypes, setExamTypes] = useState([
    { id: 1, name: "NEET UG", category: "Medical entrance", sections: 3 },
    { id: 2, name: "JEE Main", category: "Engineering entrance", sections: 3 },
    { id: 3, name: "UPSC CSE", category: "Civil services", sections: 1 },
    { id: 4, name: "IBPS PO", category: "Banking", sections: 3 },
    { id: 5, name: "CAT", category: "MBA", sections: 3 }
  ]);

  // Simulated Exams list
  const [exams, setExams] = useState([
    { id: 1, name: "NEET UG 2026", type: "NEET UG", date: "2026-06-14", shift: "Morning", status: "SETUP", security: "CRITICAL" },
    { id: 2, name: "UPSC CSE Prelims 2026", type: "UPSC CSE", date: "2026-06-20", shift: "Morning", status: "SETUP", security: "CRITICAL" },
    { id: 3, name: "JEE Main Shift A", type: "JEE Main", date: "2026-06-25", shift: "Morning", status: "SETUP", security: "HIGH" }
  ]);

  // Simulated Questions Bank
  const [questions, setQuestions] = useState([
    { id: 1, subject: "Biology", text: "Analyze the ribosomal subunit configuration during eukaryotic translation initiation phase.", bloom: "L4 Analyse", difficulty: "Hard", type: "MCQ_single", status: "APPROVED", sim: "14.2%" },
    { id: 2, subject: "Physics", text: "Calculate the magnetic flux density at the center of a circular current carrying loop of radius R.", bloom: "L3 Apply", difficulty: "Medium", type: "MCQ_single", status: "APPROVED", sim: "9.1%" },
    { id: 3, subject: "Chemistry", text: "Identify the major product formed when toluene is treated with chlorine in the presence of FeCl3.", bloom: "L1 Remember", difficulty: "Easy", type: "MCQ_single", status: "APPROVED", sim: "5.4%" }
  ]);

  // Staged Question Imports (OCR Staging)
  const [stagedPapers, setStagedPapers] = useState([
    { id: 1, filename: "NEET_Biology_2023.pdf", status: "STAGED", extracted: 90, imported: 0, quality: 97, uploaded_by: "board_admin" }
  ]);
  const [stagedQuestions, setStagedQuestions] = useState([
    { id: 101, q_number: 1, text: "Which enzyme is responsible for unwinding the DNA double helix during replication?", options: { A: "Primase", B: "Helicase", C: "DNA Pol I", D: "Ligase" }, correct: "B", confidence: 0.98, status: "UNREVIEWED" },
    { id: 102, q_number: 2, text: "Evaluate the electrodynamic coefficient multiplier inside a non-conductive dielectric boundary.", options: { A: "Increases by K", B: "Decreases by K", C: "Square power of K", D: "Remains constant" }, correct: "B", confidence: 0.74, status: "UNREVIEWED" } // low confidence triggers amber review
  ]);

  // Paper Builder selected questions list
  const [paperBuilderQuestions, setPaperBuilderQuestions] = useState([]);
  
  // Proctor alerts state
  const [proctorAlerts, setProctorAlerts] = useState([
    { id: 1, candidate: "ROLL#2024001", type: "NO_FACE", severity: "CRITICAL", ts: "17:09:02", msg: "Face not detected in WebRTC feed for >30s." },
    { id: 2, candidate: "ROLL#2024105", type: "TAB_SWITCH", severity: "MEDIUM", ts: "17:10:14", msg: "Window lost focus: possible tab swap." }
  ]);

  // Center download statuses for grid
  const [centers, setCenters] = useState([
    { id: 1, name: "Delhi Technical Institute", city: "Delhi", count: 250, status: "LOCKED", ping: "17:12:05" },
    { id: 2, name: "Mumbai Academy of Science", city: "Mumbai", count: 180, status: "LOCKED", ping: "17:12:02" },
    { id: 3, name: "Bangalore Central School", city: "Bangalore", count: 300, status: "LOCKED", ping: "17:11:58" },
    { id: 4, name: "Kolkata Engineering College", city: "Kolkata", count: 150, status: "LOCKED", ping: "17:12:01" },
    { id: 5, name: "Jaipur High School", city: "Jaipur", count: 120, status: "LOCKED", ping: "17:11:45" }
  ]);

  // Watermark forensic lookup
  const [forensicRoll, setForensicRoll] = useState('');
  const [forensicResult, setForensicResult] = useState(null);

  // AI Assistant chat
  const [chatMessages, setChatMessages] = useState([
    { sender: "assistant", text: "Hello Operator, I am your Claude-powered security coordinator. I have access to the active exam metadata, current threat level, and center download metrics. Ask me anything." }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Config parameters state
  const [config, setConfig] = useState({
    sim_threshold: 0.85,
    auto_trigger: 72,
    scan_interval: 60,
    email_smtp: "smtp.nta.gov.in",
    sms_sender: "OMNISH"
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // State for manual question entry form
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualSubject, setManualSubject] = useState('Biology');
  const [manualBloom, setManualBloom] = useState('L3 Apply');
  const [manualOptionA, setManualOptionA] = useState('');
  const [manualOptionB, setManualOptionB] = useState('');
  const [manualOptionC, setManualOptionC] = useState('');
  const [manualOptionD, setManualOptionD] = useState('');
  const [manualCorrect, setManualCorrect] = useState('A');

  const handleManualAddQuestion = (e) => {
    e.preventDefault();
    if (!manualQuestion.trim() || !manualOptionA.trim() || !manualOptionB.trim() || !manualOptionC.trim() || !manualOptionD.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const newQ = {
      id: questions.length + 1,
      subject: manualSubject,
      text: manualQuestion,
      bloom: manualBloom,
      difficulty: "Medium",
      type: "MCQ_single",
      status: "APPROVED",
      sim: "0.0% (Manual)",
      options: {
        A: manualOptionA,
        B: manualOptionB,
        C: manualOptionC,
        D: manualOptionD
      },
      correct: manualCorrect
    };

    setQuestions(prev => [newQ, ...prev]);
    setMetrics(prev => ({ ...prev, questionsBanked: prev.questionsBanked + 1 }));
    addLog("green", `[MANUAL ADD] Question #${newQ.id} registered into the secure database.`);

    // Reset fields
    setManualQuestion('');
    setManualOptionA('');
    setManualOptionB('');
    setManualOptionC('');
    setManualOptionD('');
    setManualCorrect('A');

    alert("Question added to bank successfully!");
  };

  const handleDownloadPDF = (candidateRoll = "ROLL#2024001") => {
    try {
      const doc = new jsPDF();
      const center = "IN-MH-402";
      const dateStr = new Date().toLocaleDateString();
      
      const drawWatermark = (pdf) => {
        pdf.setTextColor(225, 225, 225);
        pdf.setFontSize(8);
        pdf.setFont("Helvetica", "bold");
        
        for (let y = 35; y < 290; y += 45) {
          for (let x = 10; x < 210; x += 70) {
            pdf.text(`${center} - ROLL#${candidateRoll}`, x, y, { angle: 315 });
          }
        }
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont("Helvetica", "normal");
      };

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(0, 50, 100);
      doc.text("NATIONAL TESTING AGENCY (NTA)", 105, 15, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text("NEET (UG) 2026 - CONFIDENTIAL EXAM BOOKLET", 105, 22, { align: "center" });
      
      doc.setDrawColor(0, 50, 100);
      doc.setLineWidth(0.5);
      doc.line(15, 26, 195, 26);
      
      doc.setFillColor(245, 247, 250);
      doc.rect(15, 30, 180, 25, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, 30, 180, 25, "S");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`CANDIDATE ROLL: ${candidateRoll}`, 20, 36);
      doc.text(`CENTER CODE: ${center}`, 20, 42);
      doc.text(`EXAM DATE: ${dateStr}`, 20, 48);
      
      doc.text(`VARIANT SEED: 0x4E2A`, 110, 36);
      doc.text(`STATUS: OFFLINE DECRYPTED`, 110, 42);
      doc.text("SECURITY PROTOCOL: DWT-SVD COMPLIANT", 110, 48);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      let yPos = 68;
      drawWatermark(doc);
      
      questions.forEach((q, idx) => {
        if (yPos > 255) {
          doc.addPage();
          drawWatermark(doc);
          yPos = 25;
        }
        
        doc.setFont("Helvetica", "bold");
        const qNumText = `Q${idx + 1}. `;
        const qText = q.text || "";
        const splitText = doc.splitTextToSize(qText, 160);
        
        doc.text(qNumText, 15, yPos);
        doc.text(splitText, 25, yPos);
        
        yPos += (splitText.length * 5) + 3;
        
        doc.setFont("Helvetica", "normal");
        const optionsList = [
          { text: "A. Option Alpha" },
          { text: "B. Option Beta" },
          { text: "C. Option Gamma" },
          { text: "D. Option Delta" }
        ];
        
        optionsList.forEach((opt) => {
          if (yPos > 265) {
            doc.addPage();
            drawWatermark(doc);
            yPos = 25;
          }
          
          doc.text(opt.text, 25, yPos);
          yPos += 5;
        });
        
        yPos += 4;
      });
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`CONFIDENTIAL · SECURED BY OMNISHIELD AI · DWT-SVD ENCODED`, 15, 288);
        doc.text(`Page ${i} of ${pageCount}`, 195, 288, { align: "right" });
      }
      
      doc.save(`NEET_2026_Exam_Paper_${center}_${candidateRoll}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("PDF download failed: " + e.message);
    }
  };

  // Clock Ticker
  const [clockTime, setClockTime] = useState('17:08:58 IST');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClockTime(now.toTimeString().slice(0, 8) + ' IST');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSockets effect
  useEffect(() => {
    let socket;
    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const defaultProtocol = isHttps ? 'wss' : 'ws';
      const defaultPort = isHttps ? '' : ':8000';
      const defaultWsUrl = `${defaultProtocol}://${window.location.hostname}${defaultPort}/ws/events`;
      
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsWsConnected(true);
        addLog("system", `Established real-time WebSocket connection to OmniShield Backend: ${wsUrl}`);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleWsMessage(payload);
        } catch (err) {
          console.error("Failed parsing WS message", err);
        }
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        addLog("warn", "WebSocket disconnected. Reconnecting in background...");
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    } catch (err) {
      console.error("Failed to construct WebSocket:", err);
      setIsWsConnected(false);
      // Fallback log
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8);
      setSystemLogs(prev => [
        { ts: timeStr, type: "warn", msg: "WebSocket blocked/unreachable. Running in local simulated mode." },
        ...prev
      ]);
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const addLog = (type, msg) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    setSystemLogs(prev => [{ ts: timeStr, type, msg }, ...prev]);
  };

  const handleWsMessage = (data) => {
    const { event, data: payload } = data;
    switch (event) {
      case "SYSTEM_LOG":
        addLog(payload.type, payload.message);
        break;
      case "NEW_QUESTION":
        setMetrics(prev => ({ ...prev, questionsBanked: prev.questionsBanked + 1 }));
        addLog("green", `Agent pipeline generated Question #${payload.question_id}`);
        break;
      case "LEAK_ALERT":
        setMetrics(prev => ({ ...prev, activeThreats: prev.activeThreats + 1 }));
        addLog("red", `CRITICAL leak warning detected by Scout Agent from ${payload.source}`);
        break;
      case "CENTER_DOWNLOAD_SUCCESS":
        setCenters(prev => prev.map(c => c.id === payload.center_id ? { ...c, status: payload.status } : c));
        setMetrics(prev => ({ ...prev, papersDownloaded: prev.papersDownloaded + 1 }));
        addLog("green", `Center node ${payload.name} successfully decrypted and downloaded booklet.`);
        break;
      case "CANDIDATE_CHECKIN":
        setMetrics(prev => ({ ...prev, candidatesLoggedIn: prev.candidatesLoggedIn + 1 }));
        break;
      default:
        break;
    }
  };

  // Simulated background task triggers for offline/standalone run:
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate heartbeats
      const randomCenterIdx = Math.floor(Math.random() * centers.length);
      setCenters(prev => prev.map((c, i) => i === randomCenterIdx ? { ...c, ping: new Date().toTimeString().slice(0, 8) } : c));
    }, 8000);
    return () => clearInterval(interval);
  }, [centers]);

  // Exam Day Protocol Steps
  const [protocolSteps, setProtocolSteps] = useState([
    { label: "DISTRIBUTE", status: "done", desc: "Sealed AES packages loaded to MinIO storage" },
    { label: "LOCK", status: "done", desc: "Invigilator credentials hashed into DB" },
    { label: "BROADCAST_TOKEN", status: "active", desc: "Broadcasting decrypt key via satellite link" },
    { label: "UNLOCK", status: "pending", desc: "Local edge servers rebuild core key" },
    { label: "WATERMARK", status: "pending", desc: "Embed watermarks into candidate files" },
    { label: "GENERATE", status: "pending", desc: "Physical papers loaded to printer spools" }
  ]);

  const advanceProtocol = () => {
    const activeIdx = protocolSteps.findIndex(s => s.status === 'active');
    if (activeIdx === -1) return;
    setProtocolSteps(prev => prev.map((s, idx) => {
      if (idx === activeIdx) return { ...s, status: 'done' };
      if (idx === activeIdx + 1) return { ...s, status: 'active' };
      return s;
    }));
    addLog("cyan", `State machine advanced: ${protocolSteps[activeIdx].label} completed.`);
  };

  // Exam Config Form Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: '', type: 'NEET UG', date: '2026-06-14', shift: 'Morning', duration: 180, total_marks: 720, passing_marks: 360,
    languages: ['English'], sections: [{ name: 'Section A', count: 45, marks: 4, negative: -1, type: 'MCQ_single' }]
  });

  const handleCreateExam = () => {
    const newExam = {
      id: exams.length + 1,
      name: wizardData.name || `${wizardData.type} Entrance Exam`,
      type: wizardData.type,
      date: wizardData.date,
      shift: wizardData.shift,
      status: "SETUP",
      security: "CRITICAL"
    };
    setExams([...exams, newExam]);
    addLog("green", `New exam configured successfully: ${newExam.name}`);
    setWizardStep(1);
    setActiveTab("overview");
  };

  // Question Generator trigger
  const [genSubject, setGenSubject] = useState('Biology');
  const [genDifficulty, setGenDifficulty] = useState('Medium');
  const [genType, setGenType] = useState('MCQ_single');
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerGen = async () => {
    setIsGenerating(true);
    addLog("purple", "Triggering Agent generation pipeline...");
    // Simulate pipeline latency
    setTimeout(() => {
      const newQ = {
        id: questions.length + 1,
        subject: genSubject,
        text: genSubject === "Physics" 
          ? "Evaluate the electrodynamic force variance when a magnetic dipole moves past a closed surface."
          : "Assess the molecular binding of tRNA inside standard prokaryotic nucleosome bundles.",
        bloom: "L3 Apply",
        difficulty: genDifficulty,
        type: genType,
        status: "APPROVED",
        sim: "8.1%"
      };
      setQuestions(prev => [newQ, ...prev]);
      setMetrics(prev => ({ ...prev, questionsBanked: prev.questionsBanked + 1 }));
      setIsGenerating(false);
      addLog("green", `Question validation completed. Q#${newQ.id} approved and AES encrypted.`);
    }, 1800);
  };

  // Paper Sealing
  const [sealedPaper, setSealedPaper] = useState(null);
  const [isSealing, setIsSealing] = useState(false);

  const sealActivePaper = () => {
    setIsSealing(true);
    setTimeout(() => {
      const hash = "SHA256:d8c4b9a2e6f71b089c6e3d2a71d0e1948c5b6a310c8f9b2d7e";
      setSealedPaper({
        hash,
        sealed_at: new Date().toLocaleTimeString(),
        operator: "SuperAdmin"
      });
      setIsSealing(false);
      setExams(prev => prev.map(e => e.id === 1 ? { ...e, status: "SEALED" } : e));
      addLog("cyan", `Sealed PAPER-A: Checksum registered into immutable audit ledger.`);
    }, 1200);
  };

  // Dual auth trigger backup paper
  const [directorApproved, setDirectorApproved] = useState(false);
  const [chairmanApproved, setChairmanApproved] = useState(false);
  const [backupActive, setBackupActive] = useState(false);

  const triggerBackupProtocol = () => {
    if (!directorApproved || !chairmanApproved) return;
    setBackupActive(true);
    addLog("red", "SECURITY ALERT: High leak risk triggers backup protocol. Swapped active target to PAPER-B.");
  };

  // OCR Review Approve/Discard
  const handleReviewQ = (id, action) => {
    setStagedQuestions(prev => prev.map(q => q.id === id ? { ...q, status: action } : q));
    addLog("info", `Staged Q#${id} marked as ${action}`);
  };

  // Forensics Trace Roll
  const handleForensicLookup = () => {
    if (!forensicRoll) return;
    setForensicResult({
      roll: forensicRoll,
      center: "Mumbai Academy of Science (IN-MH-402)",
      status: "COMPLETED",
      time: "10:14:02 IST",
      watermark: "DWT-SVD (Embedded)",
      confidence: "99.8%",
      hash: "VALID (SHA-256 Match)"
    });
  };

  // AI assistant chat send
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    // Mock Claude Sonnet context aware answer
    setTimeout(() => {
      const respText = `OmniShield Security Log (Context: active exam NEET 2026, status: ${exams[0].status}, active threats: ${metrics.activeThreats}): All edge nodes are currently reporting normal heartbeats. Dual-auth is armed. Let me know if you need to dispatch emergency codes.`;
      setChatMessages(prev => [...prev, { sender: "assistant", text: respText }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg text-gray-200 selection:bg-blue/30 relative font-display scanlines pb-10">
      
      {/* Top Header */}
      <header className="nav border-b border-borderCls bg-panel/85 backdrop-blur px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue/10 rounded border border-blue/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-white">OmniShield AI</h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Universal Exam Integrity & Control</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Selector */}
          <div className="flex items-center gap-2 bg-bg border border-borderCls rounded px-2.5 py-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">Active Target:</label>
            <select 
              value={activeExam} 
              onChange={(e) => setActiveExam(Number(e.target.value))} 
              className="bg-transparent text-xs text-white outline-none font-medium cursor-pointer"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id} className="bg-panel">{e.name} ({e.status})</option>
              ))}
            </select>
          </div>

          {/* Role selector to mock views */}
          <div className="flex items-center gap-2 bg-bg border border-borderCls rounded px-2.5 py-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">Role View:</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="bg-transparent text-xs text-white outline-none font-medium cursor-pointer"
            >
              <option value="SuperAdmin" className="bg-panel">SuperAdmin</option>
              <option value="ExamBoard" className="bg-panel">ExamBoard Admin</option>
              <option value="Center" className="bg-panel">Center Operator</option>
              <option value="Invigilator" className="bg-panel">Invigilator</option>
              <option value="Candidate" className="bg-panel">Candidate Portal</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Sync State */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-panel border border-borderCls">
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-green animate-pulse' : 'bg-blue'}`} />
              <span className="text-[10px] text-gray-400 uppercase">{isWsConnected ? 'WEB_SOCKET ACTIVE' : 'LOCAL CACHE'}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-panel border border-borderCls">
              <span className={`w-1.5 h-1.5 rounded-full ${metrics.activeThreats > 1 ? 'bg-red animate-pulse' : 'bg-green'}`} />
              <span className="text-[10px] text-gray-400 uppercase">{metrics.activeThreats > 1 ? 'THREAT DETECTED' : 'SECURE'}</span>
            </div>

            <div className="text-gray-300 tracking-wider">{clockTime}</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-2 bg-panel border border-borderCls rounded-xl p-4 h-fit">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest px-2 mb-2">OPERATOR DIRECTORY</div>
          
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'overview' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Activity className="w-4 h-4" />
            1. Command Center
          </button>
          
          <button onClick={() => setActiveTab('config')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'config' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <SettingsIcon className="w-4 h-4" />
            2. Exam Configuration
          </button>
          
          <button onClick={() => setActiveTab('generation')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'generation' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Database className="w-4 h-4" />
            3. Question Bank & OCR
          </button>

          <button onClick={() => setActiveTab('builder')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'builder' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <FileText className="w-4 h-4" />
            4. Paper Builder
          </button>

          <button onClick={() => setActiveTab('candidates')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'candidates' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Users className="w-4 h-4" />
            5. Candidate Control
          </button>

          <button onClick={() => setActiveTab('threats')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'threats' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <AlertTriangle className="w-4 h-4" />
            6. Threat Intel
          </button>

          <button onClick={() => setActiveTab('examday')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'examday' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Award className="w-4 h-4" />
            7. Exam Day Control
          </button>

          <button onClick={() => setActiveTab('download')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'download' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Server className="w-4 h-4" />
            8. Center Portal
          </button>

          <button onClick={() => setActiveTab('proctoring')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'proctoring' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Eye className="w-4 h-4" />
            9. Live Proctoring
          </button>

          <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'preview' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Lock className="w-4 h-4" />
            10. Paper Previewer
          </button>

          <button onClick={() => setActiveTab('forensics')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'forensics' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Search className="w-4 h-4" />
            11. Forensics & Audit
          </button>

          <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'analytics' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <BarChart2 className="w-4 h-4" />
            12. Analytics
          </button>

          <button onClick={() => setActiveTab('assistant')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'assistant' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <Bot className="w-4 h-4" />
            13. AI Coordinator
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'settings' ? 'bg-blue/10 text-blue border border-blue/30' : 'hover:bg-bg/40 text-gray-400 hover:text-white'}`}>
            <SettingsIcon className="w-4 h-4" />
            14. Global Config
          </button>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="lg:col-span-3 space-y-6">

          {/* TAB 1: COMMAND CENTER (Universal Dashboard) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-panel border border-borderCls p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">Questions Banked</span>
                  <span className="text-xl font-bold text-white mt-1">{metrics.questionsBanked.toLocaleString()}</span>
                </div>
                <div className="bg-panel border border-borderCls p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">Edge Servers Online</span>
                  <span className="text-xl font-bold text-green mt-1">{metrics.edgeServersOnline.toLocaleString()}</span>
                </div>
                <div className="bg-panel border border-borderCls p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">Active OSINT Leaks</span>
                  <span className={`text-xl font-bold mt-1 ${metrics.activeThreats > 1 ? 'text-red animate-pulse' : 'text-amber'}`}>{metrics.activeThreats}</span>
                </div>
                <div className="bg-panel border border-borderCls p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">Centers Downloaded</span>
                  <span className="text-xl font-bold text-blue mt-1">{metrics.papersDownloaded} / 5,000</span>
                </div>
                <div className="bg-panel border border-borderCls p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">Proctoring Alarms</span>
                  <span className="text-xl font-bold text-purple mt-1">{metrics.proctoringAlerts}</span>
                </div>
              </div>

              {/* India SVG Topology Map & Activity logs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Simulated Heartbeat Topology Mapping */}
                <div className="bg-panel border border-borderCls rounded-xl p-4 md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-borderCls">
                    <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue inline-block animate-ping" />
                      Edge Server Node Topology Map
                    </h3>
                    <span className="text-[10px] font-mono text-gray-400">WORLD VIEW TOGGLE</span>
                  </div>

                  <div className="w-full h-[280px] bg-bg border border-borderCls rounded-lg relative overflow-hidden flex items-center justify-center">
                    <div className="text-center space-y-1 z-10 pointer-events-none">
                      <Globe className="w-10 h-10 text-borderCls mx-auto animate-spin" style={{ animationDuration: '60s' }} />
                      <span className="text-[9px] font-mono text-gray-400 uppercase block tracking-wider">India/International Grid Active</span>
                    </div>

                    {/* Pulse nodes based on active center heartbeats */}
                    {centers.map((c, i) => {
                      const pos = [
                        { left: '48%', top: '30%' }, // Delhi
                        { left: '42%', top: '55%' }, // Mumbai
                        { left: '46%', top: '75%' }, // Bangalore
                        { left: '68%', top: '48%' }, // Kolkata
                        { left: '38%', top: '40%' }  // Jaipur
                      ][i];
                      return (
                        <div key={c.id} className="absolute flex flex-col items-center group cursor-pointer" style={pos}>
                          <span className={`w-2 h-2 rounded-full ${c.status === 'DOWNLOADED' ? 'bg-blue' : 'bg-green'} glow-active`} />
                          <span className="hidden group-hover:block bg-panel text-[8px] font-mono text-white p-1 rounded border border-borderCls mt-1 z-20">
                            {c.name} ({c.ping})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Event Logs panel */}
                <div className="bg-panel border border-borderCls rounded-xl p-4 flex flex-col justify-between h-[346px]">
                  <div className="pb-2 border-b border-borderCls">
                    <h3 className="text-xs font-bold uppercase text-white">Live System Log Feed</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
                    {systemLogs.map((log, idx) => (
                      <div key={idx} className="text-[10px] font-mono leading-relaxed border-b border-borderCls/30 pb-1.5">
                        <span className="text-gray-500">[{log.ts}]</span>{' '}
                        <span className={`
                          ${log.type === 'green' ? 'text-green' : ''}
                          ${log.type === 'red' ? 'text-red font-semibold' : ''}
                          ${log.type === 'purple' ? 'text-purple' : ''}
                          ${log.type === 'cyan' ? 'text-cyan' : ''}
                          ${log.type === 'system' ? 'text-blue' : ''}
                          ${log.type === 'info' ? 'text-gray-300' : ''}
                        `}>{log.msg}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => addLog("red", "[ALERT] Global Emergency abort command broadcasted by SuperAdmin!")} 
                    className="w-full mt-3 py-2 bg-red/10 border border-red/30 hover:bg-red text-red hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all"
                  >
                    Global Emergency Abort
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: EXAM CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-borderCls flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold uppercase text-white">Exam Configuration Wizard</h2>
                  <p className="text-[10px] text-gray-400">Initialize and configure any exam with negative markings, attempt rules, or proctoring parameters.</p>
                </div>
                <span className="text-xs font-mono bg-bg border border-borderCls px-2 py-0.5 rounded text-blue">Step {wizardStep} of 3</span>
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Exam Name</label>
                      <input 
                        value={wizardData.name} 
                        onChange={(e) => setWizardData({...wizardData, name: e.target.value})}
                        placeholder="e.g. UPSC CSE Prelims 2026" 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white outline-none focus:border-blue" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Exam Template Type</label>
                      <select 
                        value={wizardData.type}
                        onChange={(e) => setWizardData({...wizardData, type: e.target.value})}
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white outline-none"
                      >
                        {examTypes.map(t => (
                          <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Exam Date</label>
                      <input type="date" value={wizardData.date} onChange={(e) => setWizardData({...wizardData, date: e.target.value})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Shift Type</label>
                      <select value={wizardData.shift} onChange={(e) => setWizardData({...wizardData, shift: e.target.value})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white outline-none">
                        <option value="Morning">Morning (09:00 - 12:00)</option>
                        <option value="Afternoon">Afternoon (14:00 - 17:00)</option>
                        <option value="Evening">Evening (18:00 - 21:00)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Duration (mins)</label>
                      <input type="number" value={wizardData.duration} onChange={(e) => setWizardData({...wizardData, duration: Number(e.target.value)})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white outline-none" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={() => setWizardStep(2)} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-4">
                    <h3 className="text-xs font-bold text-white">Section 1 Definition</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-400 uppercase">Name</label>
                        <input value={wizardData.sections[0].name} onChange={(e) => {
                          const sects = [...wizardData.sections];
                          sects[0].name = e.target.value;
                          setWizardData({...wizardData, sections: sects});
                        }} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-400 uppercase">Question Count</label>
                        <input type="number" value={wizardData.sections[0].count} onChange={(e) => {
                          const sects = [...wizardData.sections];
                          sects[0].count = Number(e.target.value);
                          setWizardData({...wizardData, sections: sects});
                        }} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-400 uppercase">Correct Marks</label>
                        <input type="number" value={wizardData.sections[0].marks} onChange={(e) => {
                          const sects = [...wizardData.sections];
                          sects[0].marks = Number(e.target.value);
                          setWizardData({...wizardData, sections: sects});
                        }} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-400 uppercase">Negative Marks</label>
                        <input type="number" value={wizardData.sections[0].negative} onChange={(e) => {
                          const sects = [...wizardData.sections];
                          sects[0].negative = Number(e.target.value);
                          setWizardData({...wizardData, sections: sects});
                        }} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setWizardStep(1)} className="px-4 py-2 bg-panel border border-borderCls text-gray-300 rounded text-xs font-semibold uppercase tracking-wider">
                      Back
                    </button>
                    <button onClick={() => setWizardStep(3)} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white">Security & Conduct Rules</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Proctoring Level</label>
                        <select className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white">
                          <option>None (Center Offline Proctoring)</option>
                          <option>Basic Image Snapshotting</option>
                          <option>Full WebRTC + AI Face Mesh Proctoring</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Language Selection</label>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {['English', 'Hindi', 'Tamil', 'Kannada', 'Bengali'].map(lang => (
                            <span key={lang} className="text-[10px] bg-panel border border-borderCls px-2 py-1 rounded text-white flex items-center gap-1 cursor-pointer">
                              <CheckCircle className="w-3 h-3 text-green" /> {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setWizardStep(2)} className="px-4 py-2 bg-panel border border-borderCls text-gray-300 rounded text-xs font-semibold uppercase tracking-wider">
                      Back
                    </button>
                    <button onClick={handleCreateExam} className="px-5 py-2 bg-green hover:bg-green/90 text-black rounded text-xs font-bold uppercase tracking-wider">
                      Complete Configuration
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: QUESTION BANK & OCR */}
          {activeTab === 'generation' && (
            <div className="space-y-6">
              
              {/* Manual/AI Question generation config */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls">
                  <h3 className="text-xs font-bold uppercase text-white">AI Question Generation Pipeline</h3>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Subject</label>
                    <select value={genSubject} onChange={(e) => setGenSubject(e.target.value)} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white">
                      <option value="Biology">Biology</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Difficulty</label>
                    <select value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white">
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Very Hard">Very Hard</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Format</label>
                    <select value={genType} onChange={(e) => setGenType(e.target.value)} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white">
                      <option value="MCQ_single">MCQ Single Correct</option>
                      <option value="MCQ_multiple">MCQ Multi Correct</option>
                      <option value="Numerical">Numerical/Integer</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={triggerGen}
                      disabled={isGenerating}
                      className="w-full py-2 bg-blue hover:bg-blue/90 disabled:bg-blue/40 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      {isGenerating ? 'Drafting...' : 'Run Pipeline'}
                    </button>
                  </div>
                </div>

                {/* Staging Pipeline steps display */}
                {isGenerating && (
                  <div className="grid grid-cols-5 gap-2 pt-3 border-t border-borderCls/30">
                    {["Drafting", "Similarity Scan", "Validator Review", "Bloom Classifier", "AES Encrypt"].map((s, idx) => (
                      <div key={idx} className="bg-bg border border-borderCls p-2 rounded text-center animate-pulse">
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">Step {idx + 1}</span>
                        <span className="text-[10px] text-blue font-semibold mt-0.5 block">{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Question Registration Panel */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls">
                  <h3 className="text-xs font-bold uppercase text-white">Manual Question Registration Console</h3>
                </div>
                <form onSubmit={handleManualAddQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Subject</label>
                      <select 
                        value={manualSubject} 
                        onChange={(e) => setManualSubject(e.target.value)} 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                      >
                        <option value="Biology">Biology</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Bloom's Taxonomy</label>
                      <select 
                        value={manualBloom} 
                        onChange={(e) => setManualBloom(e.target.value)} 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                      >
                        <option value="L1 Remember">L1 Remember</option>
                        <option value="L2 Understand">L2 Understand</option>
                        <option value="L3 Apply">L3 Apply</option>
                        <option value="L4 Analyse">L4 Analyse</option>
                        <option value="L5 Evaluate">L5 Evaluate</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Correct Answer Option</label>
                      <select 
                        value={manualCorrect} 
                        onChange={(e) => setManualCorrect(e.target.value)} 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 uppercase">Question Text</label>
                    <textarea 
                      value={manualQuestion} 
                      onChange={(e) => setManualQuestion(e.target.value)} 
                      placeholder="Type question content here..." 
                      className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white min-h-[60px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Option A</label>
                      <input 
                        type="text" 
                        value={manualOptionA} 
                        onChange={(e) => setManualOptionA(e.target.value)} 
                        placeholder="Option A description" 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Option B</label>
                      <input 
                        type="text" 
                        value={manualOptionB} 
                        onChange={(e) => setManualOptionB(e.target.value)} 
                        placeholder="Option B description" 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Option C</label>
                      <input 
                        type="text" 
                        value={manualOptionC} 
                        onChange={(e) => setManualOptionC(e.target.value)} 
                        placeholder="Option C description" 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Option D</label>
                      <input 
                        type="text" 
                        value={manualOptionD} 
                        onChange={(e) => setManualOptionD(e.target.value)} 
                        placeholder="Option D description" 
                        className="w-full bg-bg border border-borderCls rounded p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase tracking-wider"
                  >
                    Register & Encrypt Question
                  </button>
                </form>
              </div>

              {/* Staged uploads panel */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue" />
                    OCR Question Paper Upload Staging
                  </h3>
                  <button className="px-3 py-1 bg-blue/10 border border-blue/30 text-blue rounded text-[10px] uppercase font-semibold">
                    Upload New Document (.pdf / .docx)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-borderCls/60 text-gray-500 font-mono text-[10px]">
                        <th className="pb-2">FILENAME</th>
                        <th className="pb-2">EXTRACTED</th>
                        <th className="pb-2">QUALITY CONFIDENCE</th>
                        <th className="pb-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stagedPapers.map(p => (
                        <tr key={p.id} className="border-b border-borderCls/30">
                          <td className="py-2.5 text-white font-medium">{p.filename}</td>
                          <td className="py-2.5 font-mono">{p.extracted} questions</td>
                          <td className="py-2.5 text-green font-mono">{p.quality}%</td>
                          <td className="py-2.5">
                            <span className="bg-amber/15 border border-amber/30 text-amber text-[9px] font-mono px-2 py-0.5 rounded uppercase">{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Staging review list */}
                <div className="space-y-3 pt-3 border-t border-borderCls/50">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">EXTRACTED ITEMS REVIEW</span>
                  {stagedQuestions.map(sq => (
                    <div key={sq.id} className="bg-bg border border-borderCls rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-blue font-bold">Staged Question #{sq.q_number}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${sq.confidence >= 0.9 ? 'bg-green/10 text-green border border-green/30' : 'bg-amber/10 text-amber border border-amber/30'}`}>
                            Conf: {Math.round(sq.confidence * 100)}%
                          </span>
                          <button onClick={() => handleReviewQ(sq.id, 'APPROVED')} className="px-2.5 py-1 bg-green hover:bg-green/90 text-black rounded text-[10px] font-bold uppercase">Approve</button>
                          <button onClick={() => handleReviewQ(sq.id, 'SKIPPED')} className="px-2.5 py-1 bg-red/10 border border-red/30 text-red rounded text-[10px] font-bold uppercase">Discard</button>
                        </div>
                      </div>

                      <p className="text-xs text-white leading-relaxed font-medium">{sq.text}</p>
                      
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {Object.entries(sq.options).map(([k, v]) => (
                          <div key={k} className={`p-2 rounded text-[10px] font-mono border ${sq.correct === k ? 'border-green bg-green/5 text-green' : 'border-borderCls/30 text-gray-400'}`}>
                            {k}. {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: QUESTION PAPER BUILDER */}
          {activeTab === 'builder' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Available questions bank */}
                <div className="bg-panel border border-borderCls rounded-xl p-4 md:col-span-1 space-y-3">
                  <h3 className="text-xs font-bold uppercase text-white pb-2 border-b border-borderCls">Approved Question Bank</h3>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {questions.map(q => (
                      <div 
                        key={q.id} 
                        onClick={() => setPaperBuilderQuestions([...paperBuilderQuestions, q])}
                        className="bg-bg border border-borderCls rounded p-3 text-left space-y-1.5 cursor-pointer hover:border-blue transition-all"
                      >
                        <div className="flex justify-between items-center text-[8px] font-mono">
                          <span className="text-blue">{q.subject}</span>
                          <span className="text-amber">{q.difficulty}</span>
                        </div>
                        <p className="text-[10px] text-white leading-relaxed font-medium truncate">{q.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question paper canvas */}
                <div className="bg-panel border border-borderCls rounded-xl p-4 md:col-span-2 space-y-4">
                  <div className="pb-2 border-b border-borderCls flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-white">Paper Set Canvas</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={sealActivePaper} 
                        disabled={paperBuilderQuestions.length === 0 || isSealing}
                        className="px-3 py-1 bg-green hover:bg-green/90 disabled:bg-green/40 text-black rounded text-[10px] font-bold uppercase flex items-center gap-1"
                      >
                        {isSealing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                        {isSealing ? 'Sealing...' : 'Seal Paper'}
                      </button>
                    </div>
                  </div>

                  {paperBuilderQuestions.length === 0 ? (
                    <div className="h-[220px] bg-bg border border-dashed border-borderCls rounded-lg flex items-center justify-center">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Drag or click questions from the bank to populate</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {paperBuilderQuestions.map((q, idx) => (
                        <div key={idx} className="bg-bg border border-borderCls p-3 rounded-lg flex items-start justify-between gap-3">
                          <div className="flex gap-2.5">
                            <span className="text-xs font-mono text-blue font-bold">#{idx + 1}</span>
                            <div>
                              <p className="text-xs text-white leading-relaxed font-medium">{q.text}</p>
                              <div className="flex gap-2 mt-1 text-[8px] font-mono text-gray-400">
                                <span>Subject: {q.subject}</span>
                                <span>Bloom: {q.bloom}</span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => setPaperBuilderQuestions(paperBuilderQuestions.filter((_, i) => i !== idx))} className="text-red hover:text-red/80 font-mono text-[9px] uppercase">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {sealedPaper && (
                    <div className="bg-green/5 border border-green/30 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-green font-bold uppercase">
                        <CheckCircle className="w-4 h-4" /> Paper Sealed and Registered
                      </div>
                      <div className="font-mono text-[9px] text-gray-300 break-all space-y-0.5">
                        <div>Hash: {sealedPaper.hash}</div>
                        <div>Sealed At: {sealedPaper.sealed_at} | Operator: {sealedPaper.operator}</div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* TAB 5: CANDIDATE CONTROL */}
          {activeTab === 'candidates' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-borderCls flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold uppercase text-white">Candidate Management</h2>
                  <p className="text-[10px] text-gray-400">Import student logs, auto-allocate testing center slots, and compile admit cards.</p>
                </div>
                <button className="px-4 py-2 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4" /> Bulk Import (CSV)
                </button>
              </div>

              {/* Admit card generator preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-white font-mono">Simulated Admit Card Preview</h3>
                  
                  <div className="bg-white text-black p-5 rounded-lg border-2 border-blue shadow-lg space-y-4 select-none relative overflow-hidden">
                    
                    {/* Diagonal Watermark Overlay */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none text-xs font-mono font-bold flex flex-wrap gap-4 rotate-12 uppercase">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <span key={i}>ROLL#2024001 SECURED</span>
                      ))}
                    </div>

                    <div className="text-center border-b border-gray-300 pb-2">
                      <h4 className="font-bold text-xs font-display text-blue-900 tracking-wider">NATIONAL TESTING AGENCY (NTA)</h4>
                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">NEET UG 2026 - CONFIDENTIAL ADMIT CARD</p>
                    </div>

                    <div className="flex gap-4">
                      {/* Photo Placeholder */}
                      <div className="w-20 h-24 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 space-y-1 text-[9px] font-mono">
                        <div><strong className="text-gray-600">Candidate Name:</strong> AMAN NAKASHE</div>
                        <div><strong className="text-gray-600">Roll Number:</strong> ROLL#2024001</div>
                        <div><strong className="text-gray-600">Exam Category:</strong> GENERAL</div>
                        <div><strong className="text-gray-600">Exam Center:</strong> Mumbai Academy of Science</div>
                        <div><strong className="text-gray-600">Reporting Time:</strong> 08:00 AM IST</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-300 pt-2 flex justify-between items-center text-[7px] font-mono text-gray-500">
                      <span>SIGNATURE VERIFICATION REQUIRED</span>
                      <span>DWT-SVD COMPLIANT</span>
                    </div>

                  </div>
                </div>

                {/* Candidate stats */}
                <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-4">
                  <h3 className="text-xs font-bold text-white font-mono">Registration & Allocation Metrics</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-borderCls/30 pb-1.5">
                      <span className="text-gray-400">Total Registered Candidates:</span>
                      <span className="font-mono text-white">240,000</span>
                    </div>
                    <div className="flex justify-between border-b border-borderCls/30 pb-1.5">
                      <span className="text-gray-400">Allocated Centers:</span>
                      <span className="font-mono text-green font-semibold">5,000 / 5,000</span>
                    </div>
                    <div className="flex justify-between border-b border-borderCls/30 pb-1.5">
                      <span className="text-gray-400">Watermarks Generated:</span>
                      <span className="font-mono text-blue font-semibold">240,000</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: THREAT INTEL */}
          {activeTab === 'threats' && (
            <div className="space-y-6">
              
              {/* Risk Gauge Needle */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber" />
                    Threat Risk Needle Index
                  </h3>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${metrics.activeThreats > 1 ? 'bg-red/10 text-red border border-red/30' : 'bg-green/10 text-green border border-green/30'}`}>
                    {metrics.activeThreats > 1 ? 'Condition Red (Critical)' : 'Condition Green'}
                  </span>
                </div>

                <div className="w-full bg-bg border border-borderCls rounded-lg p-4 flex flex-col items-center">
                  <div className="flex justify-between w-full text-[9px] font-mono text-gray-500 max-w-md">
                    <span>MINIMAL</span>
                    <span>ELEVATED</span>
                    <span>CRITICAL</span>
                  </div>
                  {/* Needle track */}
                  <div className="w-full h-2 bg-gradient-to-r from-green via-amber to-red rounded-full mt-2 max-w-md relative">
                    <div 
                      className="w-1.5 h-4 bg-white border border-black absolute -top-1 rounded shadow-lg transition-all duration-1000"
                      style={{ left: metrics.activeThreats > 1 ? '90%' : '20%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Feed table */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-white">Scout Agent Intelligence Feed</h3>
                  <button 
                    onClick={() => {
                      setMetrics(prev => ({ ...prev, activeThreats: 2 }));
                      addLog("red", "OSINT: Critical leak risk signal match identified on Telegram.");
                    }}
                    className="px-3 py-1 bg-amber/10 border border-amber/30 text-amber hover:bg-amber hover:text-black rounded text-[10px] font-bold uppercase transition-all"
                  >
                    Simulate Threat Match
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-borderCls/60 text-gray-500 font-mono text-[10px]">
                        <th className="pb-2">SOURCE</th>
                        <th className="pb-2">RAW CONTENT</th>
                        <th className="pb-2">SIMILARITY</th>
                        <th className="pb-2">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threatSignals.map(t => (
                        <tr key={t.id} className={`border-b border-borderCls/30 ${t.verdict === 'ANALYSING' ? 'bg-amber/5' : ''}`}>
                          <td className="py-2.5 font-bold text-white">{t.source}</td>
                          <td className="py-2.5 text-gray-400 truncate max-w-xs">{t.snippet}</td>
                          <td className="py-2.5 font-mono text-amber">{t.similarity}%</td>
                          <td className="py-2.5">
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${t.verdict === 'FAKE' ? 'bg-green/10 text-green border border-green/30' : 'bg-amber/10 text-amber border border-amber/30'}`}>
                              {t.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dual Authority Paper trigger panel */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls">
                  <h3 className="text-xs font-bold uppercase text-white font-mono">Dual-Authority Verification Protocol</h3>
                </div>

                <div className="text-xs text-gray-400 leading-relaxed">
                  Triggering the backup set (PAPER-B) requires dual-signing validation. Credentials must be approved by both the NTA Director and Chairman.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg border border-borderCls p-3 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">NTA Director Code:</span>
                    <input 
                      type="checkbox" 
                      checked={directorApproved} 
                      onChange={(e) => setDirectorApproved(e.target.checked)} 
                      className="w-4 h-4 text-blue rounded border-borderCls focus:ring-blue cursor-pointer"
                    />
                  </div>
                  <div className="bg-bg border border-borderCls p-3 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">NTA Chairman Code:</span>
                    <input 
                      type="checkbox" 
                      checked={chairmanApproved} 
                      onChange={(e) => setChairmanApproved(e.target.checked)} 
                      className="w-4 h-4 text-blue rounded border-borderCls focus:ring-blue cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={triggerBackupProtocol}
                  disabled={!directorApproved || !chairmanApproved || backupActive}
                  className="w-full py-3 bg-red/10 border border-red/30 hover:bg-red disabled:bg-red/5 disabled:border-red/10 disabled:text-red/30 text-red hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {backupActive ? '✓ BACKUP PROTOCOL ENGAGED' : '⚡ Trigger Backup Paper (PAPER-B)'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 7: EXAM DAY CONTROL */}
          {activeTab === 'examday' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-borderCls flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold uppercase text-white">Exam Day State Machine</h2>
                  <p className="text-[10px] text-gray-400">Advance state machine variables, dispatch decrypt tokens, and issue emergency overlays.</p>
                </div>
                <button 
                  onClick={advanceProtocol}
                  className="px-4 py-2 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                >
                  Advance Phase <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Stepper Timeline */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
                {protocolSteps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`border p-3.5 rounded-lg flex flex-col justify-between ${
                      step.status === 'done' ? 'border-green bg-green/5 text-green' :
                      step.status === 'active' ? 'border-blue bg-blue/5 text-blue animate-pulse' :
                      'border-borderCls bg-bg text-gray-500'
                    }`}
                  >
                    <span className="text-[8px] font-mono block">STEP 0{idx+1}</span>
                    <span className="text-xs font-bold block mt-1 tracking-wide">{step.label}</span>
                    <span className="text-[8px] leading-tight block mt-1 text-gray-400">{step.desc}</span>
                  </div>
                ))}
              </div>

              {/* Emergency action triggers */}
              <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-4">
                <h3 className="text-xs font-bold text-white font-mono">Emergency Operator Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => addLog("red", "[SYS ALERT] Exam Paused at all centers.")} className="py-2.5 bg-amber/10 border border-amber/30 text-amber hover:bg-amber hover:text-black rounded text-[10px] font-bold uppercase tracking-wider transition-all">Pause Exam</button>
                  <button onClick={() => addLog("cyan", "[SYS ALERT] Time extended by 15 minutes.")} className="py-2.5 bg-blue/10 border border-blue/30 text-blue hover:bg-blue hover:text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all">Extend Time (+15m)</button>
                  <button onClick={() => addLog("red", "[SYS ALERT] Abort command dispatched to all systems.")} className="py-2.5 bg-red/10 border border-red/30 text-red hover:bg-red hover:text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all">Full Abort</button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: CENTER DOWNLOAD DASHBOARD */}
          {activeTab === 'download' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              
              {role === 'Center' ? (
                // Center Operator dashboard view
                <div className="space-y-6">
                  <div className="pb-3 border-b border-borderCls flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-white">Edge Decryption Console</h3>
                      <p className="text-[9px] text-gray-400 font-mono">Node ID: IN-MH-402 | Status: STANDBY</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${metrics.papersDownloaded > 0 ? 'bg-green/10 text-green border border-green/30' : 'bg-amber/10 text-amber border border-amber/30'}`}>
                      {metrics.papersDownloaded > 0 ? 'DOWNLOADED & SECURED' : 'AWAITING DECRYPT TOKEN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-bg border border-borderCls rounded-lg p-5 flex flex-col justify-between space-y-4">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        To download and compile the booklet, decrypt the pre-loaded bank using the RSA handshake key signature.
                      </p>
                      
                      <button 
                        onClick={() => {
                          setMetrics(prev => ({ ...prev, papersDownloaded: 1 }));
                          addLog("green", "Center operator decrypted the pre-loaded bank successfully.");
                          handleDownloadPDF("DEFAULT_CENTER_SET");
                        }}
                        disabled={metrics.papersDownloaded > 0}
                        className="w-full py-3 bg-blue hover:bg-blue/90 disabled:bg-bg3 disabled:border disabled:border-borderCls text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-4 h-4" />
                        {metrics.papersDownloaded > 0 ? '✓ Decrypted & Downloaded' : 'Decrypt & Download'}
                      </button>
                    </div>

                    {/* Candidate Booklet Generator Card */}
                    {metrics.papersDownloaded > 0 && (
                      <div className="bg-bg border border-borderCls rounded-lg p-5 mt-4 space-y-4 col-span-2">
                        <h4 className="text-xs font-bold text-white font-mono uppercase">Watermarked Booklet Download</h4>
                        <p className="text-[11px] text-gray-400">
                          Compile and download candidate-specific shuffled booklet with evolutionary DWT-SVD watermarks.
                        </p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="centerCandidateRoll"
                            placeholder="Candidate Roll (e.g. ROLL#2024001)"
                            className="bg-bg border border-borderCls rounded p-2 text-xs text-white outline-none flex-1"
                          />
                          <button 
                            onClick={() => {
                              const rollInput = document.getElementById("centerCandidateRoll");
                              const roll = rollInput?.value || "ROLL#2024001";
                              handleDownloadPDF(roll);
                            }}
                            className="px-4 py-2 bg-green hover:bg-green/90 text-black rounded text-xs font-bold uppercase"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Printer queue simulator */}
                    <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-4">
                      <h4 className="text-xs font-bold text-white font-mono">Offline Printing Queue</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-mono text-gray-400">
                          <span>Printer Status:</span>
                          <span>{metrics.papersDownloaded > 0 ? 'READY' : 'LOCKED'}</span>
                        </div>
                        <button 
                          disabled={metrics.papersDownloaded === 0}
                          className="w-full py-2 bg-green hover:bg-green/90 disabled:bg-bg3 text-black rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Spool Spindle Print (250 Copies)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // SuperAdmin view: Grid of all centers
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-white">NTA Centers Download Matrix (5,000 Nodes)</h3>
                    <span className="text-xs font-mono text-blue font-bold">{metrics.papersDownloaded} / 5,000 Downloaded</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {centers.map(c => (
                      <div key={c.id} className="bg-bg border border-borderCls p-3 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-white block truncate">{c.name}</span>
                          <span className="text-[8px] font-mono text-gray-500 block uppercase mt-0.5">{c.city} ({c.count} studs)</span>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-borderCls/30">
                          <span className="text-[8px] font-mono text-gray-400">{c.ping}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase ${c.status === 'LOCKED' ? 'bg-amber/10 text-amber' : 'bg-green/10 text-green'}`}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 9: LIVE PROCTORING */}
          {activeTab === 'proctoring' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-borderCls flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold uppercase text-white">Live Proctoring Dashboard</h2>
                  <p className="text-[10px] text-gray-400">Review real-time video streams, MediaPipe landmark gaze checks, and auto-flagged warnings.</p>
                </div>
                <span className="text-xs font-mono text-red font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red animate-ping" /> {proctorAlerts.length} AI Alerts
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Feeds grid */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  {[
                    { roll: "ROLL#2024001", status: "Nominal", color: "border-green" },
                    { roll: "ROLL#2024105", status: "Looking Away", color: "border-amber" }
                  ].map((cand, idx) => (
                    <div key={idx} className={`bg-bg border ${cand.color} rounded-lg p-3 space-y-3 relative overflow-hidden h-[180px] flex flex-col justify-between`}>
                      <span className="text-[9px] font-mono bg-panel border border-borderCls px-2 py-0.5 rounded text-white w-fit z-10">{cand.roll}</span>
                      
                      <div className="absolute inset-0 flex items-center justify-center text-borderCls/40 z-0">
                        <Users className="w-16 h-16" />
                      </div>

                      <div className="flex justify-between items-center z-10 pt-2 border-t border-borderCls/30">
                        <span className="text-[8px] font-mono text-gray-400 uppercase">{cand.status}</span>
                        <button onClick={() => addLog("red", `Proctor manually barred Candidate ${cand.roll}`)} className="text-[8px] font-mono text-red uppercase font-bold hover:underline">Bar Candidate</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI warnings feed */}
                <div className="bg-bg border border-borderCls rounded-xl p-4 flex flex-col justify-between h-[372px]">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-white pb-2 border-b border-borderCls">AI Auto-Proctor Signals</h3>
                    <div className="space-y-3 mt-3 max-h-[260px] overflow-y-auto pr-1">
                      {proctorAlerts.map(a => (
                        <div key={a.id} className="text-[10px] font-mono border-b border-borderCls/40 pb-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white font-bold">{a.candidate}</span>
                            <span className={`text-[8px] font-mono px-1 rounded uppercase ${a.severity === 'CRITICAL' ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'}`}>{a.severity}</span>
                          </div>
                          <p className="text-gray-400 leading-tight">{a.msg}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-2 bg-blue/15 border border-blue/30 text-blue rounded text-[10px] font-bold uppercase">Broadcast Message to All</button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 10: PAPER PREVIEW VIEWER */}
          {activeTab === 'preview' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-borderCls flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold uppercase text-white">Secure Read-Only Paper Viewer</h2>
                  <p className="text-[10px] text-gray-400">Examines active booklet text. Encrypted and hardened against copying, printing, and screenshots.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <Lock className="w-4 h-4 text-green" /> READ-ONLY SHIELD ENGAGED
                </div>
              </div>

              {/* Hardened Paper Viewer Container */}
              <div 
                className="bg-white text-black p-6 rounded-lg border border-gray-300 shadow-2xl relative overflow-hidden select-none secure-watermark"
                onContextMenu={(e) => { e.preventDefault(); alert("Right-click is disabled in secure viewer."); }}
              >
                
                {/* Diagonal Watermarks */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none text-xs font-mono font-bold flex flex-wrap gap-6 rotate-12 uppercase">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i}>OMNISHIELD CONTROL PREVIEW</span>
                  ))}
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="text-center border-b border-gray-300 pb-3">
                    <h3 className="font-bold text-sm tracking-wider text-blue-900">NATIONAL TESTING AGENCY (NTA)</h3>
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">NEET UG 2026 - CONFIDENTIAL EXAM BOOKLET</p>
                  </div>

                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-2 text-xs text-black">
                      <div className="font-bold flex gap-1.5">
                        <span>Q{idx + 1}.</span>
                        <span>{q.text}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-4 text-gray-600 font-mono text-[10px]">
                        <span>A. Option Alpha</span>
                        <span>B. Option Beta</span>
                        <span>C. Option Gamma</span>
                        <span>D. Option Delta</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* TAB 11: FORENSICS & AUDIT */}
          {activeTab === 'forensics' && (
            <div className="space-y-6">
              
              {/* Roll trace lookup */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls">
                  <h3 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-blue" />
                    Forensic Roll Tracer
                  </h3>
                </div>

                <div className="flex gap-3">
                  <input 
                    value={forensicRoll}
                    onChange={(e) => setForensicRoll(e.target.value)}
                    placeholder="Enter Candidate Roll Number (e.g. ROLL#2024001)" 
                    className="flex-1 bg-bg border border-borderCls rounded p-2.5 text-xs text-white outline-none" 
                  />
                  <button onClick={handleForensicLookup} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase">Trace Booklet</button>
                </div>

                {forensicResult && (
                  <div className="bg-bg border border-borderCls rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block uppercase font-mono text-[9px]">Candidate:</span>
                      <span className="text-white font-medium block mt-0.5">{forensicResult.roll}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase font-mono text-[9px]">Allocated Center:</span>
                      <span className="text-white font-medium block mt-0.5">{forensicResult.center}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase font-mono text-[9px]">DWT-SVD Watermark:</span>
                      <span className="text-green font-mono block mt-0.5">{forensicResult.watermark}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block uppercase font-mono text-[9px]">Check Hash Match:</span>
                      <span className="text-blue font-mono block mt-0.5">{forensicResult.hash}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Immutable audit logs */}
              <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-borderCls">
                  <h3 className="text-xs font-bold uppercase text-white">PostgreSQL Append-Only Audit Ledger</h3>
                </div>

                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-borderCls/60 text-gray-500 font-mono text-[10px]">
                        <th className="pb-2">EVENT TYPE</th>
                        <th className="pb-2">ACTOR ROLE</th>
                        <th className="pb-2">HASH VALUE</th>
                        <th className="pb-2">TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { event: "PAPER_SEALED", role: "ExamBoard Admin", hash: "a8f3d1c...", ts: "17:01:02" },
                        { event: "EXAM_CONFIG_CREATED", role: "SuperAdmin", hash: "f9b2d7e...", ts: "16:45:12" },
                        { event: "CENTER_KEY_REGISTERED", role: "Center Operator", hash: "c8f9b2d...", ts: "16:40:05" }
                      ].map((log, idx) => (
                        <tr key={idx} className="border-b border-borderCls/30">
                          <td className="py-2.5 font-bold text-white">{log.event}</td>
                          <td className="py-2.5 text-gray-400">{log.role}</td>
                          <td className="py-2.5 font-mono text-blue">{log.hash}</td>
                          <td className="py-2.5 text-gray-500">{log.ts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 12: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recharts example */}
                <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-3">
                  <h3 className="text-xs font-bold text-white font-mono">Question Approval Timeline</h3>
                  <div className="w-full h-[200px]">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: '12:00', val: 15 },
                          { name: '13:00', val: 45 },
                          { name: '14:00', val: 95 },
                          { name: '15:00', val: 120 },
                          { name: '16:00', val: 240 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#162030" />
                          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 9 }} />
                          <YAxis stroke="#6b7280" style={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#080d14', border: '1px solid #162030' }} />
                          <Area type="monotone" dataKey="val" stroke="#2eb8ff" fill="rgba(46,184,255,0.1)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-mono">LOADING CHARTS...</div>
                    )}
                  </div>
                </div>

                {/* Threat signal stats */}
                <div className="bg-bg border border-borderCls rounded-lg p-4 space-y-3">
                  <h3 className="text-xs font-bold text-white font-mono">OSINT Threat Volumetric History</h3>
                  <div className="w-full h-[200px]">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Telegram', val: 840 },
                          { name: 'Dark Web', val: 240 },
                          { name: 'Twitter', val: 150 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#162030" />
                          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 9 }} />
                          <YAxis stroke="#6b7280" style={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#080d14', border: '1px solid #162030' }} />
                          <Bar dataKey="val" fill="#ffcc44" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-mono">LOADING CHARTS...</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 13: AI ASSISTANT */}
          {activeTab === 'assistant' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 flex flex-col justify-between h-[500px]">
              
              <div>
                <div className="pb-3 border-b border-borderCls flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue" />
                    Claude AI Coordinator
                  </h3>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Context Active</span>
                </div>

                <div className="space-y-4 mt-4 max-h-[340px] overflow-y-auto pr-1">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-sm ${m.sender === 'user' ? 'bg-blue text-white' : 'bg-bg border border-borderCls text-gray-300'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-borderCls/30">
                <input 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="Ask Claude about active threats or centers status..." 
                  className="flex-1 bg-bg border border-borderCls rounded p-2.5 text-xs text-white outline-none" 
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <button onClick={sendChatMessage} className="px-4 py-2 bg-blue hover:bg-blue/90 text-white rounded text-xs font-semibold uppercase">Send</button>
              </div>

            </div>
          )}

          {/* TAB 14: GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-panel border border-borderCls rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-borderCls">
                <h2 className="text-sm font-bold uppercase text-white">Global Platform Settings</h2>
                <p className="text-[10px] text-gray-400">Configure notification gateway APIs, SMTP relay parameters, and duplicate similarity parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white font-mono uppercase">OSINT & Vector Params</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">Cosine Similarity Limit</label>
                      <input type="number" step="0.05" value={config.sim_threshold} onChange={(e) => setConfig({...config, sim_threshold: Number(e.target.value)})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">Dual-Auth Timeout (s)</label>
                      <input type="number" value={config.scan_interval} onChange={(e) => setConfig({...config, scan_interval: Number(e.target.value)})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white font-mono uppercase">SMTP & Twilio APIs</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">SMTP Server IP</label>
                      <input value={config.email_smtp} onChange={(e) => setConfig({...config, email_smtp: e.target.value})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">SMS Sender ID</label>
                      <input value={config.sms_sender} onChange={(e) => setConfig({...config, sms_sender: e.target.value})} className="w-full bg-bg border border-borderCls rounded p-2 text-xs text-white" />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
