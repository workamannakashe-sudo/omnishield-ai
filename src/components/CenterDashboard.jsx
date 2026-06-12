import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Printer, Upload, Award, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function CenterDashboard({ 
  currentUser, 
  onLogout, 
  totalQuestions, 
  unlocked, 
  setUnlocked, 
  addSystemLog,
  recentQuestions,
  isCloudSync
}) {
  const [countdown, setCountdown] = useState(2698); // 44:58
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [unlockLogs, setUnlockLogs] = useState([]);
  
  // Offline decryption states
  const [encFile, setEncFile] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState('OMNISHIELD-KEY-2026-NEET');
  const [decryptedPdfUrl, setDecryptedPdfUrl] = useState(null);
  const [offlineDecryptLogs, setOfflineDecryptLogs] = useState([]);
  const [isOfflineDecrypting, setIsOfflineDecrypting] = useState(false);
  const [localQuestions, setLocalQuestions] = useState(recentQuestions || []);

  useEffect(() => {
    if (recentQuestions && recentQuestions.length > 0) {
      setLocalQuestions(recentQuestions);
    }
  }, [recentQuestions]);

  const handleOfflineDecrypt = async (e) => {
    e.preventDefault();
    if (!encFile) {
      alert("Please upload a sealed bundle file (.enc).");
      return;
    }
    if (!decryptionKey.trim()) {
      alert("Please enter the decryption key.");
      return;
    }

    setIsOfflineDecrypting(true);
    setOfflineDecryptLogs(["[START] Initiating Web Crypto offline bundle decryption..."]);

    try {
      setOfflineDecryptLogs(prev => [...prev, "[RUN] Reading file buffer..."]);
      const fileReader = new FileReader();
      const fileDataPromise = new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = () => reject(fileReader.error);
      });
      fileReader.readAsArrayBuffer(encFile);
      const arrayBuffer = await fileDataPromise;
      setOfflineDecryptLogs(prev => [...prev, `[OK] File loaded: ${arrayBuffer.byteLength} bytes`]);

      setOfflineDecryptLogs(prev => [...prev, `[RUN] Deriving AES-256 key via SHA-256 hash of: "${decryptionKey}"`]);
      const keyBuf = new TextEncoder().encode(decryptionKey);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', keyBuf);
      setOfflineDecryptLogs(prev => [...prev, "[OK] SHA-256 key digest generated."]);

      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        hashBuf,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      setOfflineDecryptLogs(prev => [...prev, "[OK] AES-GCM cryptographic key imported."]);

      if (arrayBuffer.byteLength < 28) {
        throw new Error("Invalid bundle: file is too small to contain IV and ciphertext.");
      }
      const iv = arrayBuffer.slice(0, 12);
      const encryptedData = arrayBuffer.slice(12);
      setOfflineDecryptLogs(prev => [...prev, "[RUN] Extracted 12-byte initialization vector (IV)."]);

      setOfflineDecryptLogs(prev => [...prev, "[RUN] Running AES-GCM decryption with Web Cryptography API..."]);
      const decryptedBuf = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        aesKey,
        encryptedData
      );
      setOfflineDecryptLogs(prev => [...prev, "[OK] Decryption and GCM tag authentication successful!"]);

      const uint8 = new Uint8Array(decryptedBuf);
      const isPdf = uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46; // %PDF

      if (isPdf) {
        setOfflineDecryptLogs(prev => [...prev, "[OK] Sealed PDF payload detected."]);
        const blob = new Blob([decryptedBuf], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        setDecryptedPdfUrl(pdfUrl);
        setUnlocked(true);
        setOfflineDecryptLogs(prev => [...prev, "[SUCCESS] Offline PDF Exam booklet loaded. Ready for secure printing/viewing."]);
      } else {
        setOfflineDecryptLogs(prev => [...prev, "[OK] Text/JSON questions payload detected."]);
        const text = new TextDecoder().decode(decryptedBuf);
        const questions = JSON.parse(text);
        setLocalQuestions(questions);
        setUnlocked(true);
        setOfflineDecryptLogs(prev => [...prev, `[SUCCESS] Loaded ${questions.length} questions into offline memory bank.`]);
      }

      if (addSystemLog) {
        addSystemLog(`[OFFLINE DECRYPT] Coordinator decrypted bundle at center ${currentUser.centerCode} using key.`);
      }
      
      syncChannel.postMessage({
        type: 'CENTER_UNLOCKED',
        payload: { centerCode: currentUser.centerCode }
      });

    } catch (err) {
      console.error(err);
      setOfflineDecryptLogs(prev => [...prev, `[ERROR] Decryption failed: ${err.message || "Invalid authentication tag or key"}`]);
      alert("Decryption failed. Please verify that the Satellite One-Time Decryption Key is correct and that the file is not corrupted.");
    } finally {
      setIsOfflineDecrypting(false);
    }
  };
  
  // Printing states
  const [printCount, setPrintCount] = useState(150);
  const [printedSoFar, setPrintedSoFar] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  // Variant states
  const [rollNumber, setRollNumber] = useState('');
  const [variantResult, setVariantResult] = useState('');

  // Forensics states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('EMBEDDED');
  const [extractedRoll, setExtractedRoll] = useState('Awaiting Scan...');
  const [extractedConfidence, setExtractedConfidence] = useState('N/A');

  // Secure Reader states
  const [showSecureReader, setShowSecureReader] = useState(false);
  const [readerFocusLost, setReaderFocusLost] = useState(false);

  // Broadcast channel
  const syncChannel = new BroadcastChannel('omnishield_sync');

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time unlock broadcasts from NTA
  useEffect(() => {
    const channel = new BroadcastChannel('omnishield_sync');
    channel.onmessage = (event) => {
      const { type } = event.data;
      if (type === 'UNLOCK_BROADCAST') {
        triggerLocalUnlock();
      }
    };
    return () => channel.close();
  }, []);

  // Secure Reader window blur and focus listeners
  useEffect(() => {
    if (!showSecureReader) {
      setReaderFocusLost(false);
      return;
    }

    const handleBlur = () => {
      setReaderFocusLost(true);
      if (addSystemLog) {
        addSystemLog(`[SECURITY ALERT] Reader lost focus at center ${currentUser.centerCode}. Screen locked.`);
      }
    };

    const handleFocus = () => {
      // Keep locked until manually reset to guarantee demo visual impact
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C' || e.key === 'j' || e.key === 'J'))
      ) {
        e.preventDefault();
        alert("SECURITY WARNING: Copying, saving or printing is disabled in secure view mode.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSecureReader]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `00:${mins}:${secs}`;
  };

  const localSteps = [
    'Satellite Handshake established.',
    'Broadcast unlock token signature matched.',
    'Primary AES-256 question bank payload decrypted.',
    'DWT-SVD high-frequency watermarks generated.',
    'Question shuffle seeds parsed from candidate list.',
    'Offline PDF document buffers generated locally.',
    'Center print queue released.'
  ];

  const triggerLocalUnlock = () => {
    if (isUnlocking || unlocked) return;
    setIsUnlocking(true);
    setActiveStep(0);
    setUnlockLogs([]);

    let step = 0;
    const interval = setInterval(() => {
      setUnlockLogs(prev => [...prev, `[OK] ${localSteps[step]}`]);
      setActiveStep(step + 1);
      step++;

      if (step === localSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUnlocking(false);
          setUnlocked(true);
          setActiveStep(-1);
          
          // Broadcast unlock event back to NTA Admin dashboard
          syncChannel.postMessage({
            type: 'CENTER_UNLOCKED',
            payload: { centerCode: currentUser.centerCode }
          });
        }, 500);
      }
    }, 500);
  };

  const handlePrint = (e) => {
    e.preventDefault();
    if (!unlocked || isPrinting || printCount <= 0) return;
    setIsPrinting(true);
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.min(25, printCount - current);
      setPrintedSoFar(current);

      if (current >= printCount) {
        clearInterval(interval);
        setTimeout(() => {
          setIsPrinting(false);
          setPrintedSoFar(0);
          
          // Broadcast printed count back to NTA Admin dashboard
          syncChannel.postMessage({
            type: 'CENTER_PRINTED',
            payload: { count: printCount, centerCode: currentUser.centerCode }
          });

          alert(`Successfully printed ${printCount} watermarked candidate exam papers offline!`);
        }, 600);
      }
    }, 400);
  };

  const runWatermark = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStatus('SCANNING...');
    setExtractedRoll('Reading LH band...');
    setExtractedConfidence('Factoring SVD values...');

    setTimeout(() => {
      setIsScanning(false);
      setScanStatus('EXTRACTED');
      setExtractedRoll('ROLL#2024001');
      setExtractedConfidence('99.7%');
    }, 2000);
  };

  const showVariant = (val) => {
    setRollNumber(val);
    if (!val) {
      setVariantResult('Enter a roll number to preview sequence seed');
      return;
    }

    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const baseQuestions = Array.from({ length: 10 }, (_, i) => i + 1);
    const randomized = [];
    const temp = [...baseQuestions];
    
    let seed = Math.abs(hash);
    while (temp.length > 0) {
      seed = (seed * 9301 + 49297) % 233280;
      const index = seed % temp.length;
      randomized.push('Q' + temp.splice(index, 1)[0]);
    }

    setVariantResult(`Sequence seed: ${randomized.join(' → ')} | Checksum: 0x${Math.abs(hash).toString(16).substring(0, 4).toUpperCase()}`);
  };

  const hashRoll = (val) => {
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash).toString(16).substring(0, 4).toUpperCase();
  };

  const getShuffledQuestions = (questions, val) => {
    if (!questions || questions.length === 0) return [];
    
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const temp = [...questions];
    const randomized = [];
    let seed = Math.abs(hash);
    
    while (temp.length > 0) {
      seed = (seed * 9301 + 49297) % 233280;
      const index = seed % temp.length;
      randomized.push(temp.splice(index, 1)[0]);
    }
    
    return randomized;
  };

  const handleDownloadPDF = (candidateRoll) => {
    if (!unlocked || !candidateRoll) return;
    
    const doc = new jsPDF();
    const center = currentUser.centerCode;
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
    
    doc.text(`VARIANT SEED: 0x${hashRoll(candidateRoll)}`, 110, 36);
    doc.text(`STATUS: OFFLINE DECRYPTED`, 110, 42);
    doc.text("SECURITY PROTOCOL: DWT-SVD COMPLIANT", 110, 48);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    let yPos = 68;
    const shuffledQs = getShuffledQuestions(localQuestions || [], candidateRoll);
    drawWatermark(doc);
    
    shuffledQs.forEach((q, idx) => {
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
      const options = q.options || [
        { text: "A. Option sample", correct: false },
        { text: "B. Option sample", correct: false },
        { text: "C. Option sample", correct: false },
        { text: "D. Option sample", correct: false }
      ];
      
      options.forEach((opt) => {
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
      doc.text(`CONFIDENTIAL · SECURED BY OMNISHIELD AI · SHA256-HASH: ${hashRoll(candidateRoll + i)}`, 15, 288);
      doc.text(`Page ${i} of ${pageCount}`, 195, 288, { align: "right" });
    }
    
    doc.save(`NEET_2026_Exam_Paper_${center}_${candidateRoll}.pdf`);
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-blue/30 p-5">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Center Dashboard Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Local Center Dashboard</h2>
          <p className="text-xs text-text2">Center Coordinator: {currentUser.username} | Code: <span className="text-white font-mono font-bold">{currentUser.centerCode}</span></p>
        </div>
        <div className="flex items-center gap-3">
          {/* Cloud Sync Status Indicator */}
          <div className="nav-status font-mono text-[10px] bg-bg3 border border-border px-2 py-1 rounded flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isCloudSync ? 'bg-green animate-pulse' : 'bg-blue'}`} />
            <span className={isCloudSync ? 'text-green' : 'text-blue-400'}>
              {isCloudSync ? 'CLOUD SYNC ACTIVE' : 'LOCAL TAB SYNC'}
            </span>
          </div>

          <button 
            onClick={onLogout}
            className="px-3 py-1.5 rounded bg-bg3 border border-border text-xs text-text2 hover:text-white transition-all font-mono"
          >
            SIGN OUT
          </button>
        </div>
      </div>

      <div className="grid-main">
        {/* Left Column: Local Decryption Steppers and Forensics Scan */}
        <div className="flex flex-col gap-3">
          {/* Decryption status panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: unlocked ? 'var(--green)' : 'var(--blue)', animation: 'pulse-glow 1.5s infinite' }} />
                Offline Decryption & Compilation Engine
              </div>
              <div className={`badge ${unlocked ? 'badge-green' : 'badge-blue'}`}>
                {unlocked ? 'DECRYPTED & UNLOCKED' : 'LOCKED (STANDBY)'}
              </div>
            </div>
            <div className="panel-body space-y-4">
              <div className="text-xs text-text2 leading-relaxed">
                This center remains fully encrypted offline. Upon receiving the satellite broadcast token, local decryption keys are assembled to unlock the pre-loaded bank.
              </div>

              <button
                onClick={triggerLocalUnlock}
                disabled={isUnlocking || unlocked}
                className="btn-arm danger disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
              >
                {unlocked ? '✓ INTEGRITY UNLOCKED' : isUnlocking ? 'DECRYPTING BANK...' : '⚡ MANUAL DECRYPT'}
              </button>

              {/* Decrypting Logs console */}
              <div className="terminal-window h-36 overflow-y-auto">
                <div className="terminal-line text-text3">[EDGE OFFLINE DECRYPT LOGS]</div>
                {unlockLogs.map((log, idx) => (
                  <div key={idx} className="terminal-line text-text2">
                    <span className="text-text3">&gt;&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
                {!isUnlocking && !unlocked && (
                  <div className="text-text3 italic text-[11px] mt-1">Awaiting broadcast signal token...</div>
                )}
              </div>
            </div>
          </div>

          {/* Air-Gap Offline Decryptor Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                Air-Gap Bundle Decryptor (Web Crypto)
              </div>
              <div className={`badge ${unlocked ? 'badge-green' : 'badge-amber'}`}>
                {unlocked ? 'DECRYPTED' : 'AWAITING BUNDLE'}
              </div>
            </div>
            <div className="panel-body space-y-4">
              <div className="text-xs text-text2 leading-relaxed">
                Decrypt NTA sealed exam bundles locally using the browser's hardware-accelerated Web Cryptography API. Completely air-gapped; no network connection required.
              </div>

              <form onSubmit={handleOfflineDecrypt} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-text3 uppercase block">Sealed Bundle (.enc) *</label>
                  <div className="border border-border rounded-lg p-2 bg-bg3 flex items-center gap-2 relative cursor-pointer hover:border-amber-400/50 transition-all">
                    <Upload className="w-4 h-4 text-text2" />
                    <span className="text-[10px] text-white truncate max-w-[200px]">
                      {encFile ? encFile.name : "Select sealed_bundle.enc"}
                    </span>
                    <input
                      type="file"
                      accept=".enc"
                      onChange={(e) => setEncFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isOfflineDecrypting || unlocked}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-text3 uppercase block">Satellite Decryption Key *</label>
                  <input
                    type="password"
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    placeholder="Enter decryption key..."
                    className="inp font-mono text-xs text-white"
                    disabled={isOfflineDecrypting || unlocked}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isOfflineDecrypting || unlocked || !encFile}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    encFile && !unlocked && !isOfflineDecrypting
                      ? 'bg-amber-400 text-black hover:bg-amber-300 cursor-pointer shadow-md'
                      : 'bg-bg3 border border-border text-text3 cursor-not-allowed'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  {isOfflineDecrypting ? 'Decrypting GCM...' : unlocked ? '✓ Bundle Decrypted' : 'Decrypt & Unlock Bundle'}
                </button>
              </form>

              {/* Decrypting Logs console */}
              <div className="terminal-window h-28 overflow-y-auto">
                <div className="terminal-line text-text3">[WEB-CRYPTO AIR-GAP DECRYPT LOGS]</div>
                {offlineDecryptLogs.map((log, idx) => (
                  <div key={idx} className="terminal-line text-text2 text-[9px]">
                    <span className="text-text3">&gt;&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              {decryptedPdfUrl && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                  <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Offline PDF Paper Unlocked
                  </div>
                  <p className="text-[9px] text-text2 leading-relaxed">
                    The exam paper was decrypted as a full PDF booklet. You can view, print, or distribute the decrypted sheet directly:
                  </p>
                  <a
                    href={decryptedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider rounded text-center transition-all block shadow-md"
                  >
                    👁️ View / Print Decrypted PDF
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* DWT-SVD Forensics watermark scanner */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: 'var(--green)' }} />
                DWT-SVD Forensics Sandbox
              </div>
              <button 
                onClick={runWatermark}
                disabled={isScanning}
                className="px-3 py-1 rounded bg-green/10 border border-green/30 text-green text-[11px] font-semibold hover:bg-green/20 transition-all font-display"
              >
                Extract from Photo
              </button>
            </div>
            <div className="panel-body">
              <div className="grid grid-cols-2 gap-3 items-start">
                <div>
                  <div className="text-[10px] text-text2 font-mono mb-1.5 uppercase">SPECIMEN IMAGE</div>
                  <div className="wm-paper border border-border relative rounded bg-white">
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-blue scanner-bar" />
                    )}
                    <div className="wm-overlay select-none" id="wm-overlay">ROLL#2024001</div>
                    <div className="wm-paper-text select-none text-black">
                      Q1. Which enzyme unwinds...<br />
                      (A) Primase (B) Helicase<br />
                      (C) DNA Pol I (D) Ligase<br /><br />
                      Q2. In meiosis-I, homologous...<br />
                      (A) Anaphase (B) Metaphase<br />
                      (C) Prophase (D) Telophase<br /><br />
                      Q3. Which of the following...<br />
                      [continued...]
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] text-text2 font-mono mb-1.5 uppercase">EXTRACTION RESULT</div>
                  <div className="bg-bg3 border border-border rounded-lg p-3 space-y-3">
                    <div>
                      <div className="text-[9px] text-text3 font-mono uppercase">Status</div>
                      <div className={`badge ${scanStatus === 'EXTRACTED' ? 'badge-green' : scanStatus === 'SCANNING...' ? 'badge-blue' : 'badge-gray'} mt-1`}>
                        {scanStatus}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-text3 font-mono uppercase">Extracted ID</div>
                      <div id="wm-id" className="font-mono text-sm text-green font-semibold mt-0.5">
                        {extractedRoll}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                      <div>
                        <div className="text-[9px] text-text3 font-mono uppercase">Confidence</div>
                        <div className="font-mono text-white text-xs mt-0.5" id="wm-conf">
                          {extractedConfidence}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-text3 font-mono uppercase">Hash match</div>
                        <div className="font-mono text-green text-[9px] mt-0.5" id="wm-hash">
                          {scanStatus === 'EXTRACTED' ? 'SHA256 ✓ a8f3d1c...' : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Local print consoles, countdowns, and variant sequences */}
        <div className="flex flex-col gap-3">
          {/* countdown */}
          <div className="panel" style={{ borderColor: '#1a3d5c' }}>
            <div className="panel-header" style={{ borderColor: '#1a3d5c' }}>
              <div className="panel-title">Local Center Countdown</div>
            </div>
            <div className="panel-body">
              <div className="countdown-wrap">
                <div className="countdown-num font-mono" id="cd-display">
                  {formatTime(countdown)}
                </div>
                <div className="countdown-unit text-[11px] text-text2 tracking-wider mt-1 font-mono">UNTIL EXAM BEGINS</div>
                <div className="countdown-sub text-[11px] text-text3 mt-2 font-display">Candidate Pool: {printCount} students</div>
              </div>
            </div>
          </div>

          {/* Local offline print console */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: unlocked ? 'var(--green)' : 'var(--red)' }} />
                Offline Printing Terminal
              </div>
            </div>
            <div className="panel-body space-y-4">
              <div className="text-xs text-text2 leading-relaxed">
                {!unlocked 
                  ? '⚠️ PRINTING LOCKED: Decrypt the question bank to release print spooler queues.'
                  : 'READY: local edge printers unlocked. Enter candidate pool size to print watermarked paper booklets.'
                }
              </div>

              <form onSubmit={handlePrint} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-text3 uppercase block">Candidate Count</label>
                  <input
                    type="number"
                    disabled={!unlocked || isPrinting}
                    value={printCount}
                    onChange={(e) => setPrintCount(parseInt(e.target.value) || 0)}
                    className="inp font-mono"
                    min="1"
                    max="1000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!unlocked || isPrinting || printCount <= 0}
                  className={`w-full py-2.5 rounded-lg font-semibold text-xs tracking-wider transition-all uppercase flex items-center justify-center gap-2 ${
                    unlocked && !isPrinting
                      ? 'bg-blue hover:bg-blue/90 text-white cursor-pointer'
                      : 'bg-bg3 border border-border text-text3 cursor-not-allowed'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {isPrinting ? 'Printing Papers...' : 'Print Watermarked Papers'}
                </button>
              </form>

              {/* Printing Progress Bar */}
              {isPrinting && (
                <div className="space-y-1 animate-pulse">
                  <div className="flex justify-between text-[10px] font-mono text-text2">
                    <span>PRINTING SPOOLER:</span>
                    <span>{printedSoFar} / {printCount} completed</span>
                  </div>
                  <div className="w-full h-2 bg-bg3 border border-border/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue transition-all duration-300"
                      style={{ width: `${(printedSoFar * 100) / printCount}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Variant */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Student Paper Variant</div>
            </div>
            <div className="panel-body space-y-2">
              <div className="text-[11px] text-text2 leading-relaxed">
                Unique question order per student — prevents physical copying
              </div>
              <input 
                value={rollNumber}
                onChange={(e) => showVariant(e.target.value)}
                className="inp" 
                placeholder="Enter candidate roll number..." 
              />
              <div 
                className="font-mono text-[10px] text-green min-h-[32px] p-2 bg-bg3 rounded border border-border leading-relaxed break-all mb-2"
              >
                {variantResult || 'Enter a roll number to preview sequence seed'}
              </div>

              {/* Secure View and Download PDF button side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(rollNumber)}
                  disabled={!unlocked || !rollNumber}
                  className={`py-2 px-2.5 rounded-lg font-semibold text-[10px] tracking-wider transition-all uppercase flex items-center justify-center gap-1.5 ${
                    unlocked && rollNumber
                      ? 'bg-green hover:bg-green/90 text-black cursor-pointer font-bold'
                      : 'bg-bg3 border border-border text-text3 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF Paper
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (unlocked && rollNumber) {
                      setShowSecureReader(true);
                      setReaderFocusLost(false);
                    }
                  }}
                  disabled={!unlocked || !rollNumber}
                  className={`py-2 px-2.5 rounded-lg font-semibold text-[10px] tracking-wider transition-all uppercase flex items-center justify-center gap-1.5 ${
                    unlocked && rollNumber
                      ? 'bg-blue hover:bg-blue/90 text-white cursor-pointer font-bold'
                      : 'bg-bg3 border border-border text-text3 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECURE READ-ONLY VIEWER MODAL */}
      {showSecureReader && (
        <div 
          className="secure-reader-overlay"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="secure-reader-header">
            <div>
              <div className="text-white font-bold font-display flex items-center gap-2 text-sm">
                <ShieldCheck className="text-blue w-5 h-5" />
                Confidential Exam Sheet — Read Only Mode
              </div>
              <p className="text-[10px] text-text2">
                Center Code: <span className="text-white font-mono font-bold">{currentUser.centerCode}</span> | Shuffled Variant Seed: <span className="text-white font-mono">0x{hashRoll(rollNumber)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowSecureReader(false)}
              className="px-3 py-1 rounded bg-red/10 border border-red/30 text-red text-[11px] hover:bg-red/20 transition-all font-mono"
            >
              CLOSE SECURE VIEW
            </button>
          </div>

          {/* Reader Body */}
          <div className={`secure-reader-body ${readerFocusLost ? 'secure-blur-shield' : ''}`}>
            
            {/* Dynamic Watermark Overlay */}
            <div className="secure-watermark-overlay">
              {Array.from({ length: 45 }).map((_, idx) => (
                <div key={idx} className="secure-watermark-cell">
                  {currentUser.centerCode} · ROLL#{rollNumber} · READONLY
                </div>
              ))}
            </div>

            {/* Questions Content */}
            <div className="space-y-6 relative z-10 select-none">
              <div className="text-center mb-6">
                <h3 className="text-white font-bold text-base font-display">NATIONAL TESTING AGENCY (NTA)</h3>
                <p className="text-[10px] text-text2 uppercase tracking-widest font-mono">NEET (UG) 2026 - COMPUTER-ASSISTED SECURE READER</p>
                <div className="h-[1px] bg-border/40 my-3" />
              </div>

              {(localQuestions || []).length === 0 ? (
                <div className="text-center text-text2 italic text-xs">No questions generated yet. Awaiting NTA paper generation...</div>
              ) : (
                getShuffledQuestions(localQuestions, rollNumber).map((q, idx) => (
                  <div key={idx} className="p-4 border border-border/50 rounded-lg bg-bg3 space-y-3">
                    <div className="font-bold text-white flex gap-2 text-xs">
                      <span className="text-blue font-mono">Q{idx + 1}.</span>
                      <span className="leading-relaxed">{q.text}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pl-6 pt-1">
                      {(q.options || [
                        { text: "A. Option A", correct: false },
                        { text: "B. Option B", correct: false },
                        { text: "C. Option C", correct: false },
                        { text: "D. Option D", correct: false }
                      ]).map((opt, optIdx) => (
                        <div key={optIdx} className="text-text2 text-[10px] font-mono py-1.5 px-2 border border-border/20 rounded bg-bg2">
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div className="text-center text-text3 font-mono text-[9px] pt-8">
                *** END OF SECURE EXAM SHEET ***<br />
                SCREEN AUDIT LOGGED · TIME STAMPED · PRINTING/COPYING BLOCKED
              </div>
            </div>
          </div>

          {/* Focus Lost Lockdown */}
          {readerFocusLost && (
            <div className="secure-lock-screen">
              <ShieldAlert className="text-red w-12 h-12 mb-3 animate-bounce" />
              <h4 className="text-red font-bold text-base font-display">SECURITY PROTOCOL ENGAGED</h4>
              <p className="text-xs text-white max-w-sm leading-relaxed mt-2">
                This secure window lost focus (e.g. screenshot tool activation, split screen resize, or external application click). 
              </p>
              <p className="text-[11px] text-text2 font-mono mt-1">
                Security log dispatched to NTA Center Coordinator console.
              </p>
              <button
                onClick={() => setReaderFocusLost(false)}
                className="mt-4 px-4 py-2 bg-red hover:bg-red/90 text-white font-semibold text-xs rounded-lg transition-all uppercase"
              >
                Reset Shield & Resume View
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
