import React, { useState, useEffect } from 'react';

export default function Phase3Tab({
  unlocked,
  setUnlocked,
  unlockLogs,
  setUnlockLogs,
  addSystemLog,
  unlockedCenters,
  papersPrinted
}) {
  const [countdown, setCountdown] = useState(2698); // Starts at 00:44:58
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [currentStep, setCurrentStep] = useState(2); // Step 3 is active initially

  // Broadcast channel
  const syncChannel = new BroadcastChannel('omnishield_sync');

  // Countdown timer
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

  const handleTriggerBroadcast = () => {
    if (isUnlocking || unlocked) return;
    setIsUnlocking(true);
    setCurrentStep(2);
    setUnlockLogs([]);
    addSystemLog('NTA Core: Triggering satellite token unlock broadcast.');

    // Broadcast the unlock token to all listening center tabs in real-time
    syncChannel.postMessage({ type: 'UNLOCK_BROADCAST' });

    let step = 2; // Start from Step 3
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      
      // Update step status in NTA list
      setStepsStates(prev => {
        const copy = [...prev];
        copy[step - 1] = { ...copy[step - 1], status: 'done', icon: '✅' };
        if (step < 7) {
          copy[step] = { ...copy[step], status: 'active', icon: '📡' };
        }
        return copy;
      });

      if (step === 3) {
        setUnlockLogs(prev => [...prev, 'Satellite Signal: Broadcasting 32-byte decrypt token...']);
      } else if (step === 4) {
        setUnlockLogs(prev => [...prev, 'GSM Cell-Broadcast: Relaying fallback channels...']);
      } else if (step === 6) {
        setUnlockLogs(prev => [...prev, 'Broadcast Sync: Core unlocked. Monitoring print spoolers...']);
      }

      if (step === 7) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUnlocking(false);
          setUnlocked(true);
          setUnlockLogs(prev => [...prev, 'NTA Core Status: Central satellite broadcast completed.']);
          addSystemLog('SUCCESS: Unlock broadcast sent. Local edge centers decrypting.');
          setCurrentStep(-1);
        }, 500);
      }
    }, 900);
  };

  return (
    <div className="grid-main">
      {/* Left Column: Central Broadcast Console */}
      <div className="flex flex-col gap-3">
        {/* Central broadcast stepper */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: unlocked ? 'var(--green)' : 'var(--blue)', animation: 'pulse-glow 1.5s infinite' }} />
              NTA Unlock Broadcast Console
            </div>
            <button 
              onClick={handleTriggerBroadcast}
              disabled={isUnlocking || unlocked}
              className="px-3 py-1 rounded bg-blue/10 border border-blue/30 text-blue text-[11px] font-semibold hover:bg-blue/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unlocked ? 'BROADCAST COMPLETED' : isUnlocking ? 'BROADCASTING...' : 'Broadcast Unlock Token'}
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

        {/* Satellite Key Card */}
        <div className="panel border border-amber-500/20" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <div className="panel-header border-b border-amber-500/20">
            <div className="panel-title text-amber-400 font-display flex items-center gap-2">
              <span>🔑</span> Satellite Decryption Key (Emergency Offline)
            </div>
            <div className="badge badge-amber font-mono text-[9px]">
              EXAM DAY PASS
            </div>
          </div>
          <div className="panel-body space-y-3">
            <p className="text-xs text-text2 leading-relaxed">
              If an exam center is fully air-gapped or experiencing network failure, provide this key to the coordinator via telephone or satellite broadcast to unlock the offline bundle.
            </p>
            <div className="flex items-center justify-between bg-bg3 border border-border p-3 rounded-lg">
              <span className="text-[9px] text-text3 font-mono">BROADCAST_ID: NEET_2026</span>
              <span className="text-xs text-white font-mono font-bold select-all bg-bg2 px-2.5 py-1 rounded border border-border/60 tracking-wider">
                OMNISHIELD-KEY-2026-NEET
              </span>
            </div>
          </div>
        </div>

        {/* Sync logs terminal */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--blue)' }} />
              Central Link Broadcast Terminal
            </div>
          </div>
          <div className="panel-body">
            <div className="terminal-window h-36 overflow-y-auto">
              <div className="terminal-line text-text3">[CENTRAL SATELLITE BROADCAST CHANNEL ISRO-SAT3]</div>
              {unlockLogs.map((log, i) => (
                <div key={i} className="terminal-line text-text2 font-mono">
                  <span className="text-text3">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {!isUnlocking && !unlocked && (
                <div className="text-text3 italic text-[11px] mt-1">Awaiting manual operator trigger to release token...</div>
              )}
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
            
            {/* Real-time synchronization numbers */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-bg3 border border-border p-2 rounded">
                <div className="text-[9px] text-text3 font-mono mb-0.5">CENTERS UNLOCKED</div>
                <div className="text-green font-mono font-bold">
                  {unlockedCenters.length} / 5,000
                </div>
              </div>
              <div className="bg-bg3 border border-border p-2 rounded">
                <div className="text-[9px] text-text3 font-mono mb-0.5">PAPERS PRINTED</div>
                <div className="text-blue font-mono font-bold">
                  {papersPrinted.toLocaleString()}
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

        {/* Live sync edge nodes */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Synchronized Edge Server Nodes</div>
          </div>
          <div className="panel-body space-y-2 max-h-48 overflow-y-auto font-mono text-[10px]">
            {unlockedCenters.length === 0 ? (
              <div className="text-text3 italic">No edge nodes synchronized yet. Awaiting satellite token unlock...</div>
            ) : (
              unlockedCenters.map((code, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/30 text-green">
                  <span className="font-semibold">{code}</span>
                  <span className="text-[9px] badge badge-green font-mono">UNLOCKED & SYNCED</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
