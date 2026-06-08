import React, { useState, useEffect } from 'react';

export default function OverviewTab({ threatLevel, totalQuestions, threatCount, systemLogs }) {
  const [countdownStr, setCountdownStr] = useState('00:45:28');

  // Exam Countdown Ticker
  useEffect(() => {
    let seconds = 45 * 60 - 28;
    const interval = setInterval(() => {
      if (seconds < 0) {
        clearInterval(interval);
        return;
      }
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setCountdownStr(`00:${m}:${s}`);
      seconds--;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* 4 Stat Cards */}
      <div className="grid-4">
        <div className="stat green">
          <div className="stat-label">QUESTIONS APPROVED</div>
          <div className="stat-value">{totalQuestions.toLocaleString()}</div>
          <div className="stat-sub">↑ 128 last hour</div>
        </div>
        <div className="stat blue">
          <div className="stat-label">EDGE SERVERS READY</div>
          <div className="stat-value">5,000</div>
          <div className="stat-sub">100% encrypted</div>
        </div>
        <div className="stat amber">
          <div className="stat-label">THREAT SIGNALS</div>
          <div className="stat-value">{threatCount}</div>
          <div className="stat-sub">2 verified fake</div>
        </div>
        <div className="stat">
          <div className="stat-label">EXAM STARTS IN</div>
          <div className="stat-value font-mono" style={{ color: '#fff' }}>{countdownStr}</div>
          <div className="stat-sub">NEET 2026 — Paper A</div>
        </div>
      </div>

      <div className="grid-main">
        {/* Left Column: Health and Log */}
        <div className="flex flex-col gap-3">
          {/* System Health */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: 'var(--green)' }} />
                System Health
              </div>
              <div className="badge badge-green">ALL CLEAR</div>
            </div>
            <div className="panel-body">
              <div className="prog-wrap">
                <div className="prog-label">
                  <span>Question Bank Coverage</span>
                  <span>97.4%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: '97.4%', backgroundColor: 'var(--green)' }} />
                </div>
              </div>
              <div className="prog-wrap">
                <div className="prog-label">
                  <span>Edge Server Sync</span>
                  <span>100%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: '100%', backgroundColor: 'var(--green)' }} />
                </div>
              </div>
              <div className="prog-wrap">
                <div className="prog-label">
                  <span>Threat Monitor Uptime</span>
                  <span>99.8%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: '99.8%', backgroundColor: 'var(--blue)' }} />
                </div>
              </div>
              <div className="prog-wrap">
                <div className="prog-label">
                  <span>Backup Paper Readiness</span>
                  <span>100%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: '100%', backgroundColor: 'var(--amber)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Live Log */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: 'var(--blue)', animation: 'pulse-glow 1.5s infinite' }} />
                Live System Log
              </div>
              <div className="badge badge-gray font-mono">STREAMING</div>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px' }}>
              <div className="log h-[160px] overflow-y-auto pr-1">
                {systemLogs.map((log, index) => {
                  const timestamp = log.substring(1, 9);
                  const content = log.substring(11);
                  
                  let logClass = 'muted';
                  if (content.includes('APPROVED') || content.includes('verified') || content.includes('heartbeat — OK') || content.includes('PASSED') || content.includes('PASS')) {
                    logClass = 'ok';
                  } else if (content.includes('detected') || content.includes('discarded') || content.includes('WARNING') || content.includes('Red')) {
                    logClass = 'warn';
                  } else if (content.includes('ISRO-SAT3') || content.includes('connected') || content.includes('broadcast')) {
                    logClass = 'info';
                  }

                  return (
                    <div key={index} className="log-line">
                      <span className="log-ts font-mono">{timestamp}</span>
                      <span className={`log-msg ${logClass} font-mono`}>{content}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Server Network Map and Agent summary */}
        <div className="flex flex-col gap-3">
          {/* Edge Server Network Map */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: 'var(--blue)' }} />
                Edge Server Network
              </div>
              <div className="badge badge-blue">5,000 ONLINE</div>
            </div>
            <div className="panel-body">
              <div className="map-wrap border border-border">
                <div className="map-grid" />
                {/* Cities representation mapping India approximate topology */}
                <div className="map-dot" style={{ left: '48%', top: '30%', backgroundColor: 'var(--green)', color: 'var(--green)' }} />
                <div className="map-label" style={{ left: '48%', top: '30%' }}>Delhi</div>
                
                <div className="map-dot" style={{ left: '42%', top: '55%', backgroundColor: 'var(--green)', color: 'var(--green)', animationDelay: '0.5s' }} />
                <div className="map-label" style={{ left: '42%', top: '55%' }}>Mumbai</div>
                
                <div className="map-dot" style={{ left: '46%', top: '75%', backgroundColor: 'var(--green)', color: 'var(--green)', animationDelay: '1s' }} />
                <div className="map-label" style={{ left: '46%', top: '75%' }}>Bangalore</div>
                
                <div className="map-dot" style={{ left: '68%', top: '48%', backgroundColor: 'var(--green)', color: 'var(--green)', animationDelay: '1.5s' }} />
                <div className="map-label" style={{ left: '68%', top: '48%' }}>Kolkata</div>
                
                <div className="map-dot" style={{ left: '38%', top: '40%', backgroundColor: 'var(--amber)', color: 'var(--amber)', animationDelay: '0.8s' }} />
                <div className="map-label" style={{ left: '38%', top: '40%' }}>Jaipur</div>
                
                <div className="map-dot" style={{ left: '54%', top: '36%', backgroundColor: 'var(--green)', color: 'var(--green)', animationDelay: '1.2s' }} />
                <div className="map-label" style={{ left: '54%', top: '36%' }}>Lucknow</div>
              </div>
              <div className="flex gap-2.5 mt-2 text-[10px] text-text2 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                  Synced
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* Agent summary */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className="dot" style={{ backgroundColor: 'var(--green)' }} />
                Agent Status
              </div>
            </div>
            <div className="panel-body space-y-1">
              <div className="agent-row py-1 border-b border-border/40">
                <div>
                  <div className="agent-name text-white font-medium">Agent A — Generator</div>
                  <div className="agent-stat text-text2 text-[10px]">GPT-4o backend · {totalQuestions} drafts</div>
                </div>
                <div className="badge badge-green">ACTIVE</div>
              </div>
              <div className="agent-row py-1 border-b border-border/40">
                <div>
                  <div className="agent-name text-white font-medium">Agent B — Validator</div>
                  <div className="agent-stat text-text2 text-[10px]">Claude Sonnet · {totalQuestions} reviews</div>
                </div>
                <div className="badge badge-green">ACTIVE</div>
              </div>
              <div className="agent-row py-1 border-b border-border/40">
                <div>
                  <div className="agent-name text-white font-medium">Scout Agent</div>
                  <div className="agent-stat text-text2 text-[10px]">Telegram · 847 signals scanned</div>
                </div>
                <div className="badge badge-amber">WATCHING</div>
              </div>
              <div className="agent-row py-1">
                <div>
                  <div className="agent-name text-white font-medium">Verification Agent</div>
                  <div className="agent-stat text-text2 text-[10px]">2 real leaks confirmed fake</div>
                </div>
                <div className="badge badge-blue">STANDBY</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
