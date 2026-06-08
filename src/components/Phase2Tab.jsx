import React from 'react';

export default function Phase2Tab({
  threatLevel,
  setThreatLevel,
  threatCount,
  setThreatCount,
  threatSignals,
  setThreatSignals,
  backupPaperArmed,
  setBackupPaperArmed,
  backupStep1,
  setBackupStep1,
  backupStep2,
  setBackupStep2,
  addSystemLog
}) {

  // Simulate threat injection
  const handleSimulateThreat = () => {
    if (threatLevel === 'Condition Red') return;

    setThreatLevel('Condition Red');
    setThreatCount(prev => prev + 1);
    addSystemLog('OSINT: signal from Telegram @leak_channel_2026 — similarity 92% — CRITICAL');

    const leakSignal = {
      timestamp: new Date().toLocaleTimeString(),
      source: 'Telegram @leak_channel_2026',
      snippet: 'CHEM-2026-X8 & PHYS-2026-B1 leaked answer key sheets and full pdf...',
      similarity: '92%',
      status: 'CRITICAL',
      alert: true
    };
    setThreatSignals(prev => [leakSignal, ...prev]);
  };

  // Switch backup paper state
  const handleTriggerBackup = () => {
    if (!backupStep1 || !backupStep2) {
      alert("Verification pending: Both Director & NTA Chair credentials must be checked first!");
      return;
    }
    
    setBackupPaperArmed(true);
    setThreatLevel('Condition Green');
    addSystemLog('SYSTEM: Backup paper protocol deployed. Switched exam registry to PAPER-B-2026.');
    
    // Clear and reset
    setThreatSignals(prev => prev.map(sig => {
      if (sig.status === 'CRITICAL') {
        return { ...sig, status: 'DIVERTED', alert: false };
      }
      return sig;
    }));
    setBackupStep1(false);
    setBackupStep2(false);
  };

  return (
    <div className="grid-main">
      {/* Left Column: Risk Meter and Threat Table */}
      <div className="flex flex-col gap-3">
        {/* Threat Level */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--amber)', animation: 'pulse-glow 2s infinite' }} />
              Current Threat Level
            </div>
            <div className={`badge ${threatLevel === 'Condition Red' ? 'badge-red' : 'badge-amber'}`}>
              {threatLevel === 'Condition Red' ? 'CRITICAL' : 'ELEVATED'}
            </div>
          </div>
          <div className="panel-body">
            <div className="flex justify-between text-[10px] text-text2 mb-1 font-mono">
              <span>MINIMAL</span>
              <span>LOW</span>
              <span>ELEVATED</span>
              <span>HIGH</span>
              <span>CRITICAL</span>
            </div>
            <div className="risk-meter">
              <div 
                className="risk-needle" 
                id="risk-needle" 
                style={{ left: threatLevel === 'Condition Red' ? '92%' : '55%', transition: 'left 1s ease' }} 
              />
            </div>
            <div className="text-center mt-3 font-mono text-[11px] text-amber">
              {threatLevel === 'Condition Red' 
                ? '4 signals detected — 2 confirmed fake — 1 CRITICAL LEAK ACTIVE'
                : `${threatCount} signals detected — 2 confirmed fake — 1 under analysis`
              }
            </div>
          </div>
        </div>

        {/* Threat Table Feed */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--amber)' }} />
              Threat Intelligence Feed
            </div>
            <button 
              onClick={handleSimulateThreat}
              disabled={threatLevel === 'Condition Red' || backupPaperArmed}
              className="px-3 py-1 rounded bg-amber/10 border border-amber/30 text-amber text-[11px] font-semibold hover:bg-amber/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Simulate Signal
            </button>
          </div>
          <div className="panel-body p-0">
            <table className="threat-table">
              <thead>
                <tr>
                  <th>SOURCE</th>
                  <th>CONTENT SNIPPET</th>
                  <th>SIMILARITY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {threatSignals.map((sig, idx) => {
                  let badgeCls = 'badge-gray';
                  if (sig.status === 'FAKE' || sig.status === 'DIVERTED') badgeCls = 'badge-green';
                  if (sig.status === 'ANALYSING') badgeCls = 'badge-amber';
                  if (sig.status === 'CRITICAL') badgeCls = 'badge-red';

                  let barColor = 'var(--green)';
                  if (parseInt(sig.similarity) > 70) barColor = 'var(--red)';
                  else if (parseInt(sig.similarity) > 30) barColor = 'var(--amber)';

                  return (
                    <tr key={idx} className={sig.alert ? 'bg-red/5 border-l-2 border-l-red animate-pulse' : ''}>
                      <td>
                        <div className="font-semibold text-white text-[11px]">{sig.source}</div>
                        <div className="text-text3 text-[9px] font-mono mt-0.5">{sig.timestamp}</div>
                      </td>
                      <td className="text-text2 text-[10px] max-w-sm truncate">{sig.snippet}</td>
                      <td className="flex items-center gap-1.5 pt-3">
                        <div className="similarity-bar">
                          <div className="similarity-fill" style={{ width: sig.similarity, backgroundColor: barColor }} />
                        </div>
                        <span className="font-mono text-text2 text-[10px]">{sig.similarity}</span>
                      </td>
                      <td>
                        <div className={`badge ${badgeCls}`}>{sig.status}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Backup protocol and stats */}
      <div className="flex flex-col gap-3">
        {/* Backup Protocol */}
        <div className="panel" style={{ borderColor: threatLevel === 'Condition Red' ? 'var(--red)' : '#3d2a00' }}>
          <div className="panel-header" style={{ borderColor: threatLevel === 'Condition Red' ? 'var(--red)' : '#3d2a00' }}>
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--amber)' }} />
              Backup Paper Protocol
            </div>
            <div className={`badge ${backupPaperArmed ? 'badge-green' : 'badge-amber'}`}>
              {backupPaperArmed ? 'DEPLOYED' : 'ARMED'}
            </div>
          </div>
          <div className="panel-body">
            <div className="text-[11px] text-text2 leading-relaxed mb-3">
              Triggers if verified leak similarity exceeds 72%. Requires dual-authority approval within 90 seconds.
            </div>
            
            <div className="flex gap-1.5 mb-3">
              {/* Director checkbox auth */}
              <div className="flex-1 bg-bg3 border border-border rounded-lg p-2.5 text-center flex flex-col items-center justify-between">
                <span className="text-[9px] font-mono text-text3 tracking-wider uppercase block">DIRECTOR</span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="chk1"
                    disabled={threatLevel !== 'Condition Red' || backupPaperArmed}
                    checked={backupStep1}
                    onChange={(e) => setBackupStep1(e.target.checked)}
                    className="w-3.5 h-3.5 bg-bg border-border text-blue focus:ring-blue cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label htmlFor="chk1" className="text-[10px] text-text2 font-mono cursor-pointer select-none">
                    {backupStep1 ? 'Approved' : 'Standby'}
                  </label>
                </div>
              </div>

              {/* NTA Chair checkbox auth */}
              <div className="flex-1 bg-bg3 border border-border rounded-lg p-2.5 text-center flex flex-col items-center justify-between">
                <span className="text-[9px] font-mono text-text3 tracking-wider uppercase block">NTA CHAIR</span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="chk2"
                    disabled={threatLevel !== 'Condition Red' || backupPaperArmed}
                    checked={backupStep2}
                    onChange={(e) => setBackupStep2(e.target.checked)}
                    className="w-3.5 h-3.5 bg-bg border-border text-blue focus:ring-blue cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label htmlFor="chk2" className="text-[10px] text-text2 font-mono cursor-pointer select-none">
                    {backupStep2 ? 'Approved' : 'Standby'}
                  </label>
                </div>
              </div>
            </div>

            <button 
              onClick={handleTriggerBackup}
              disabled={!backupStep1 || !backupStep2 || backupPaperArmed}
              className={`btn-arm ${backupPaperArmed ? 'green' : 'amber-btn'} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {backupPaperArmed ? '⚡ BACKUP SET ACTIVE' : '⚡ TRIGGER BACKUP PAPER'}
            </button>
            
            <div className="text-[9px] text-text3 text-center mt-2 font-mono">
              Backup set: PAPER-B-2026 · SHA256: a8f3d1c...
            </div>
          </div>
        </div>

        {/* Scout stats */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Scout Agent Stats</div>
          </div>
          <div className="panel-body divide-y divide-border/30">
            <div className="agent-row py-1.5 flex justify-between">
              <span className="text-text2">Telegram groups monitored</span>
              <span className="font-mono text-white">1,247</span>
            </div>
            <div className="agent-row py-1.5 flex justify-between">
              <span className="text-text2">Signals processed</span>
              <span className="font-mono text-white">847</span>
            </div>
            <div className="agent-row py-1.5 flex justify-between">
              <span className="text-text2">Confirmed fake</span>
              <span className="font-mono text-green font-semibold">844</span>
            </div>
            <div className="agent-row py-1.5 flex justify-between">
              <span className="text-text2">Under analysis</span>
              <span className="font-mono text-amber font-semibold">{threatLevel === 'Condition Red' ? 0 : 1}</span>
            </div>
            <div className="agent-row py-1.5 flex justify-between">
              <span className="text-text2">Real leaks detected</span>
              <span className="font-mono text-red font-semibold">{threatLevel === 'Condition Red' ? 1 : 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
