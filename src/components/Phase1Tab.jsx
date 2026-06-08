import React, { useState } from 'react';

export default function Phase1Tab({
  totalQuestions,
  setTotalQuestions,
  difficultyData,
  setDifficultyData,
  subjectData,
  setSubjectData,
  recentQuestions,
  setRecentQuestions,
  addSystemLog
}) {
  const [pipelineRunning, setPipelineRunning] = useState(false);
  
  // Pipeline steps states
  const [stepsStates, setStepsStates] = useState([
    { status: 'done', label: 'READY', badgeCls: 'badge-green', detail: '200 seed questions · Biology Ch.12' },
    { status: '', label: 'IDLE', badgeCls: 'badge-gray', detail: 'Awaiting launch...' },
    { status: '', label: 'IDLE', badgeCls: 'badge-gray', detail: 'Awaiting launch...' },
    { status: '', label: 'IDLE', badgeCls: 'badge-gray', detail: 'Awaiting launch...' },
    { status: '', label: 'IDLE', badgeCls: 'badge-gray', detail: 'Awaiting launch...' },
    { status: '', label: 'IDLE', badgeCls: 'badge-gray', detail: 'Awaiting launch...' }
  ]);

  const [activeQuestion, setActiveQuestion] = useState({
    text: "Which enzyme is responsible for unwinding the DNA double helix during replication, and what mechanism does it use to relieve torsional stress ahead of the replication fork?",
    subject: "Biology",
    bloom: "Bloom L3 — Apply",
    similarity: "Sim: 0.71",
    options: [
      { text: "A. Primase — nucleotide addition", correct: false },
      { text: "B. Helicase + Topoisomerase II", correct: true },
      { text: "C. DNA Polymerase I", correct: false },
      { text: "D. Ligase — strand joining", correct: false }
    ]
  });

  const questionPool = [
    {
      text: "Which of the following organic compounds will exhibit optical activity under standard polarimeter test?",
      subject: "Chemistry",
      bloom: "Bloom L4 — Analyse",
      similarity: "Sim: 0.11",
      options: [
        { text: "A. Meso-tartaric acid", correct: false },
        { text: "B. d-Tartaric acid", correct: true },
        { text: "C. Racemic lactic acid", correct: false },
        { text: "D. Adipic acid", correct: false }
      ]
    },
    {
      text: "Analyze the electrostatic force of attraction between two point charges separated by a dielectric medium of constant K=4.",
      subject: "Physics",
      bloom: "Bloom L3 — Apply",
      similarity: "Sim: 0.14",
      options: [
        { text: "A. F/2", correct: false },
        { text: "B. F/4", correct: true },
        { text: "C. 4F", correct: false },
        { text: "D. F/16", correct: false }
      ]
    },
    {
      text: "Determine the rate-limiting enzyme in the glycogenolysis pathway in mammalian liver tissues.",
      subject: "Biology",
      bloom: "Bloom L1 — Remember",
      similarity: "Sim: 0.09",
      options: [
        { text: "A. Glycogen synthase", correct: false },
        { text: "B. Phosphorylase kinase", correct: false },
        { text: "C. Glycogen phosphorylase", correct: true },
        { text: "D. Phosphoglucomutase", correct: false }
      ]
    }
  ];

  const runPipeline = () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    addSystemLog('Phase 1 Pipeline: Activating Secure RAG Question Generator.');

    // Select random question
    const newQ = questionPool[Math.floor(Math.random() * questionPool.length)];

    const stepsInfo = [
      { name: 'Agent A — Drafting question', detail: `Generating Q#${totalQuestions + 1}...` },
      { name: 'Similarity filter — Vector DB check', detail: 'ChromaDB · cosine threshold 0.85' },
      { name: 'Agent B — Factual validation', detail: 'Claude Sonnet · textbook grounding' },
      { name: 'Bloom\'s tagger — Difficulty assigned', detail: 'L1–L6 classification' },
      { name: 'Encrypted Bank — Question locked', detail: 'AES-256-GCM · audit trail saved' }
    ];

    const badges = ['GENERATING...', 'CHECKING...', 'VALIDATING...', 'TAGGING...', 'LOCKING...'];
    const results = ['GENERATED', 'PASSED', 'VALIDATED', newQ.bloom.split(' — ')[0], 'LOCKED'];
    const badgeClasses = ['badge-blue', 'badge-blue', 'badge-blue', 'badge-blue', 'badge-green'];
    const stepClasses = ['running', 'running', 'running', 'running', 'done'];

    // Reset step 1 to 5 to idle
    setStepsStates(prev => {
      const copy = [...prev];
      for (let i = 1; i <= 5; i++) {
        copy[i] = { status: '', label: 'IDLE', badgeCls: 'badge-gray', detail: 'Awaiting launch...' };
      }
      return copy;
    });

    stepsInfo.forEach((info, i) => {
      const stepIdx = i + 1;
      
      // Enter processing state
      setTimeout(() => {
        setStepsStates(prev => {
          const copy = [...prev];
          copy[stepIdx] = {
            status: 'running',
            label: badges[i],
            badgeCls: 'badge-blue',
            detail: info.detail
          };
          return copy;
        });
      }, i * 900);

      // Enter finished state
      setTimeout(() => {
        setStepsStates(prev => {
          const copy = [...prev];
          copy[stepIdx] = {
            status: stepClasses[i],
            label: results[i],
            badgeCls: badgeClasses[i],
            detail: info.detail
          };
          return copy;
        });

        if (stepIdx === 1) {
          addSystemLog(`Agent A drafted question code Q#${totalQuestions + 1}.`);
        } else if (stepIdx === 2) {
          addSystemLog(`Similarity Scan: Check passed. Score: ${newQ.similarity.split(': ')[1]} (Threshold < 0.85).`);
        } else if (stepIdx === 4) {
          // Bloom's tagger
          addSystemLog(`Bloom's Taxonomy: Assigned category ${newQ.bloom}.`);
        }

        if (stepIdx === 5) {
          setPipelineRunning(false);
          setTotalQuestions(prev => prev + 1);
          setActiveQuestion(newQ);

          // Update Bloom's taxonomy bars dynamically
          setDifficultyData(prev => {
            const shortName = newQ.bloom.split(' — ')[1]; // e.g. "Apply", "Analyse", "Remember"
            return prev.map(item => {
              if (item.name.toLowerCase().includes(shortName.toLowerCase())) {
                return { ...item, value: Math.min(item.value + 1, 100) };
              }
              return item;
            });
          });

          // Update subject coverage bars dynamically
          setSubjectData(prev => {
            return prev.map(item => {
              if (item.name.toLowerCase() === newQ.subject.toLowerCase()) {
                return { ...item, value: Math.min(item.value + 1, 100) };
              }
              return item;
            });
          });

          addSystemLog(`Agent-B validated Q#${totalQuestions + 1} — APPROVED [${newQ.bloom}]`);
        }
      }, i * 900 + 600);
    });
  };

  return (
    <div className="grid-main">
      {/* Left Column: Pipeline & Approved Question */}
      <div className="flex flex-col gap-3">
        {/* Pipeline Panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--blue)', animation: 'pulse-glow 1.5s infinite' }} />
              Live Generation Pipeline
            </div>
            <button 
              onClick={runPipeline}
              disabled={pipelineRunning}
              className="px-3 py-1 rounded bg-blue/10 border border-blue/30 text-blue text-[11px] font-semibold hover:bg-blue/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pipelineRunning ? 'GENERATING...' : 'Generate Next'}
            </button>
          </div>
          <div className="panel-body">
            <div className="pipeline">
              {/* Step 1: NCERT Source (Always Done) */}
              <div className={`p-step ${stepsStates[0].status}`}>
                <div className="p-icon" style={{ backgroundColor: 'rgba(0,229,160,0.1)' }}>📚</div>
                <div className="p-info">
                  <div className="p-name text-white font-medium">NCERT Corpus — Source loaded</div>
                  <div className="p-detail text-text2 text-[10px]">{stepsStates[0].detail}</div>
                </div>
                <div className={`badge ${stepsStates[0].badgeCls}`}>{stepsStates[0].label}</div>
              </div>

              {/* Step 2: Agent A Drafting */}
              <div className={`p-step ${stepsStates[1].status}`}>
                <div className="p-icon" style={{ backgroundColor: 'rgba(56,182,255,0.1)' }}>🤖</div>
                <div className="p-info">
                  <div className="p-name text-white font-medium">Agent A — Drafting question</div>
                  <div className="p-detail text-text2 text-[10px]">{stepsStates[1].detail}</div>
                </div>
                <div className={`badge ${stepsStates[1].badgeCls}`}>{stepsStates[1].label}</div>
              </div>

              {/* Step 3: Similarity Check */}
              <div className={`p-step ${stepsStates[2].status}`}>
                <div className="p-icon" style={{ backgroundColor: 'rgba(255,184,48,0.1)' }}>🔍</div>
                <div className="p-info">
                  <div className="p-name text-white font-medium">Similarity filter — Vector DB check</div>
                  <div className="p-detail text-text2 text-[10px]">{stepsStates[2].detail}</div>
                </div>
                <div className={`badge ${stepsStates[2].badgeCls}`}>{stepsStates[2].label}</div>
              </div>

              {/* Step 4: Agent B validation */}
              <div className={`p-step ${stepsStates[3].status}`}>
                <div className="p-icon" style={{ backgroundColor: 'rgba(0,229,160,0.1)' }}>✅</div>
                <div className="p-info">
                  <div className="p-name text-white font-medium">Agent B — Factual validation</div>
                  <div className="p-detail text-text2 text-[10px]">{stepsStates[3].detail}</div>
                </div>
                <div className={`badge ${stepsStates[3].badgeCls}`}>{stepsStates[3].label}</div>
              </div>

              {/* Step 5: Bloom's tagging */}
              <div className={`p-step ${stepsStates[4].status}`}>
                <div className="p-icon" style={{ backgroundColor: 'rgba(56,182,255,0.1)' }}>🏷️</div>
                <div className="p-info">
                  <div className="p-name text-white font-medium">Bloom's tagger — Difficulty assigned</div>
                  <div className="p-detail text-text2 text-[10px]">{stepsStates[4].detail}</div>
                </div>
                <div className={`badge ${stepsStates[4].badgeCls}`}>{stepsStates[4].label}</div>
              </div>

              {/* Step 6: Encrypted Lock */}
              <div className={`p-step ${stepsStates[5].status}`}>
                <div className="p-icon" style={{ backgroundColor: 'rgba(0,229,160,0.1)' }}>🔒</div>
                <div className="p-info">
                  <div className="p-name text-white font-medium">Encrypted Bank — Question locked</div>
                  <div className="p-detail text-text2 text-[10px]">{stepsStates[5].detail}</div>
                </div>
                <div className={`badge ${stepsStates[5].badgeCls}`}>{stepsStates[5].label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Approved Question */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="dot" style={{ backgroundColor: 'var(--green)' }} />
              Latest Approved Question
            </div>
          </div>
          <div className="panel-body">
            <div className="q-card">
              <div className="q-meta">
                <span className="badge badge-blue">{activeQuestion.subject}</span>
                <span className="badge badge-amber">{activeQuestion.bloom}</span>
                <span className="badge badge-green">{activeQuestion.similarity}</span>
              </div>
              <div className="q-text text-white leading-relaxed my-3 font-medium">{activeQuestion.text}</div>
              <div className="q-opts">
                {activeQuestion.options.map((opt, i) => (
                  <div key={i} className={`q-opt ${opt.correct ? 'correct' : ''}`}>
                    {opt.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Statistics */}
      <div className="flex flex-col gap-3">
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="stat green">
            <div className="stat-label">APPROVED</div>
            <div className="stat-value text-base font-bold">{totalQuestions}</div>
          </div>
          <div className="stat red">
            <div className="stat-label">DISCARDED</div>
            <div className="stat-value text-base font-bold">614</div>
          </div>
          <div className="stat amber">
            <div className="stat-label">FLAGGED</div>
            <div className="stat-value text-base font-bold">23</div>
          </div>
          <div className="stat blue">
            <div className="stat-label">PASS RATE</div>
            <div className="stat-value text-base font-bold">88%</div>
          </div>
        </div>

        {/* Bloom's Distribution */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Bloom's Distribution</div>
          </div>
          <div className="panel-body space-y-3">
            {difficultyData.map((item, idx) => {
              let fillCls = 'bg-text2';
              if (item.name.includes('L2')) fillCls = 'bg-blue';
              if (item.name.includes('L3')) fillCls = 'bg-green';
              if (item.name.includes('L4')) fillCls = 'bg-amber';
              if (item.name.includes('L5')) fillCls = 'bg-red';
              
              return (
                <div key={idx} className="prog-wrap">
                  <div className="prog-label">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="prog-track">
                    <div className={`prog-fill ${fillCls}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Coverage */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Subject Coverage</div>
          </div>
          <div className="panel-body space-y-3">
            {subjectData.map((item, idx) => {
              let fillCls = 'bg-green';
              if (item.name === 'Chemistry') fillCls = 'bg-blue';
              if (item.name === 'Physics') fillCls = 'bg-amber';

              return (
                <div key={idx} className="prog-wrap">
                  <div className="prog-label">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="prog-track">
                    <div className={`prog-fill ${fillCls}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
