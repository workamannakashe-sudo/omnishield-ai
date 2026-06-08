import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';

export default function Phase3Tab({
  unlocked,
  setUnlocked,
  unlockLogs,
  setUnlockLogs,
  addSystemLog
}) {
  const [countdown, setCountdown] = useState(2698); // Starts at 00:44:58
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [currentStep, setCurrentStep] = useState(2); // Step 3 is active initially (index 2)
  const [rollNumber, setRollNumber] = useState('');
  const [variantResult, setVariantResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('EMBEDDED');
  const [extractedRoll, setExtractedRoll] = useState('Awaiting Scan...');
  const [extractedConfidence, setExtractedConfidence] = useState('N/A');

  // Countdown clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `00:${mins}:${secs}`;
  };

  // 7 Unlock steps
  const steps = [
    { title: 'Encrypted bank pre-loaded on all edge servers', time: 'T-24h', status: 'done', icon: '✅' },
    { title: 'Backup paper armed and verified', time: 'T-2h', status: 'done', icon: '✅' },
    { title: 'Central NTA server broadcasting unlock token', time: 'NOW', status: 'active', icon: '📡' },
    { title: 'Edge servers receive token · decrypt local bank', time: 'T-44m', status: 'pending', icon: '🔓' },
    { title: 'DWT-SVD watermark applied per student', time: 'T-43m', status: 'pending', icon: '🌊' },
    { title: 'Physical paper generated offline', time: 'T-42m', status: 'pending', icon: '📄' },
    { title: 'Exam begins — zero static paper ever existed', time: '09:00', status: 'pending', icon: '🚀' }
  ];

  const [stepsStates, setStepsStates] = useState(steps);

  const runUnlockSequence = () => {
    if (isUnlocking || unlocked) return;
    setIsUnlocking(true);
    addSystemLog('Phase 3: Initializing Edge Node decrypt payload sequence.');

    let step = 2; // Start from Step 3 (index 2)
    const interval = setInterval(() => {
      step++;
      
      // Update step status in list
      setStepsStates(prev => {
        const copy = [...prev];
        // Mark previous step as done
        copy[step - 1] = { ...copy[step - 1], status: 'done', icon: '✅' };
        if (step < 7) {
          copy[step] = { ...copy[step], status: 'active', icon: '📡' };
        }
        return copy;
      });

      if (step === 3) {
        addSystemLog('Edge Decryption: Decrypted central question bank package successfully.');
      } else if (step === 4) {
        addSystemLog('Watermarking: High-frequency sub-band watermarks injected via DWT.');
      } else if (step === 5) {
        addSystemLog('Edge Printer: Compiling offline document layouts.');
      }

      if (step === 7) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUnlocking(false);
          setUnlocked(true);
          addSystemLog('SUCCESS: Edge server printing core ready. 5,000 nodes decrypted.');
        }, 500);
      }
    }, 900);
  };

  // Run watermark scan simulation
  const runWatermark = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStatus('SCANNING...');
    setExtractedRoll('Parsing DWT bands...');
    setExtractedConfidence('Scanning SVD values...');
    addSystemLog('FORENSICS: Extracting student roll number watermark from printed sheet.');

    setTimeout(() => {
      setIsScanning(false);
      setScanStatus('EXTRACTED');
      setExtractedRoll('ROLL#2024001');
      setExtractedConfidence('99.7%');
      addSystemLog('FORENSICS MATCH: Successfully extracted student ID ROLL#2024001.');
    }, 2000);
  };

  // Generate roll layout variant seed
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
    <div className="grid-main">
      {/* Left Column: Unlock protocol and DWT scan */}
      <div className="flex flex-col gap-3">
        {/* Unlock Steps */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--blue)', animation: 'pulse-glow 1.5s infinite' }} />
              Exam Day Unlock Protocol
            </div>
            <button 
              onClick={runUnlockSequence}
              disabled={isUnlocking || unlocked}
              className="px-3 py-1 rounded bg-blue/10 border border-blue/30 text-blue text-[11px] font-semibold hover:bg-blue/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unlocked ? 'DECRYPTED' : isUnlocking ? 'DECRYPTING...' : 'Receive Unlock Token'}
            </button>
          </div>
          <div className="panel-body">
            <div className="unlock-steps">
              {stepsStates.map((step, idx) => {
                let stepClass = 'pending';
                if (step.status === 'done') stepClass = 'done';
                if (step.status === 'active') stepClass = 'active';

                return (
                  <div key={idx} className={`unlock-step ${stepClass}`}>
                    <div className="step-icon">{step.icon}</div>
                    <div className="step-text text-white leading-relaxed">{step.title}</div>
                    <div className="step-time text-text2 font-mono">{step.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Watermark Demo */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--green)' }} />
              DWT-SVD Watermark Demo
            </div>
            <button 
              onClick={runWatermark}
              disabled={isScanning}
              className="px-3 py-1 rounded bg-green/10 border border-green/30 text-green text-[11px] font-semibold hover:bg-green/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Extract from Photo
            </button>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <div className="text-[10px] text-text2 font-mono mb-1.5 uppercase">PRINTED PAPER</div>
                <div className="wm-paper border border-border relative rounded bg-white">
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-blue scanner-bar" />
                  )}
                  <div className="wm-overlay select-none" id="wm-overlay">ROLL#2024001</div>
                  <div className="wm-paper-text select-none">
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

      {/* Right Column: Countdowns, fallback and roll sequence */}
      <div className="flex flex-col gap-3">
        {/* Countdown */}
        <div className="panel" style={{ borderColor: '#1a3d5c' }}>
          <div className="panel-header" style={{ borderColor: '#1a3d5c' }}>
            <div className="panel-title">Exam Countdown</div>
          </div>
          <div className="panel-body">
            <div className="countdown-wrap">
              <div className="countdown-num font-mono" id="cd-display">
                {formatTime(countdown)}
              </div>
              <div className="countdown-unit text-[11px] text-text2 tracking-wider mt-1 font-mono">UNTIL EXAM BEGINS</div>
              <div className="countdown-sub text-[11px] text-text3 mt-2 font-display">NEET 2026 · Paper A · 180 Questions</div>
            </div>
            
            <div className="h-[1px] bg-border my-3" />
            
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-bg3 border border-border p-2 rounded">
                <div className="text-[9px] text-text3 font-mono mb-0.5">CENTERS UNLOCKED</div>
                <div className="text-white font-mono font-semibold">
                  {unlocked ? '5,000 / 5,000' : '0 / 5,000'}
                </div>
              </div>
              <div className="bg-bg3 border border-border p-2 rounded">
                <div className="text-[9px] text-text3 font-mono mb-0.5">PAPERS PRINTED</div>
                <div className="text-white font-mono font-semibold">
                  {unlocked ? '2.4M / 2.4M' : '0 / 2.4M'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fallback status */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Unlock Channel Status</div>
          </div>
          <div className="panel-body space-y-1.5">
            <div className="agent-row py-1 border-b border-border/30 flex justify-between">
              <span className="text-white">🛰️ ISRO Satellite (Primary)</span>
              <div className="badge badge-green">ONLINE</div>
            </div>
            <div className="agent-row py-1 border-b border-border/30 flex justify-between">
              <span className="text-white">📱 SMS Broadcast (Fallback 1)</span>
              <div className="badge badge-green">READY</div>
            </div>
            <div className="agent-row py-1 border-b border-border/30 flex justify-between">
              <span className="text-white">🌐 Internet API (Fallback 2)</span>
              <div className="badge badge-green">READY</div>
            </div>
            <div className="agent-row py-1 flex justify-between">
              <span className="text-white">💾 Pre-loaded token (Failsafe)</span>
              <div className="badge badge-amber">ARMED</div>
            </div>
          </div>
        </div>

        {/* Student variant */}
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
              id="roll-inp" 
              placeholder="Enter roll number..." 
            />
            <div 
              id="variant-out" 
              className="font-mono text-[10px] text-green min-h-[32px] p-2 bg-bg3 rounded border border-border leading-relaxed break-all"
            >
              {variantResult || 'Enter a roll number to preview sequence seed'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
