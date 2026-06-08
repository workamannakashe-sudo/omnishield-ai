import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Printer, Upload, Award, FileText } from 'lucide-react';

export default function CenterDashboard({ 
  currentUser, 
  onLogout, 
  totalQuestions, 
  unlocked, 
  setUnlocked, 
  addSystemLog 
}) {
  const [countdown, setCountdown] = useState(2698); // 44:58
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [unlockLogs, setUnlockLogs] = useState([]);
  
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

  return (
    <div className="space-y-6">
      {/* Center Dashboard Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Local Center Dashboard</h2>
          <p className="text-xs text-text2">Center Coordinator: {currentUser.username} | Code: <span className="text-white font-mono font-bold">{currentUser.centerCode}</span></p>
        </div>
        <div className="flex items-center gap-3">
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
                className="font-mono text-[10px] text-green min-h-[32px] p-2 bg-bg3 rounded border border-border leading-relaxed break-all"
              >
                {variantResult || 'Enter a roll number to preview sequence seed'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
