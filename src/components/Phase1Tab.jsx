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

  const [activeSubTab, setActiveSubTab] = useState('rag'); // 'rag' | 'ocr'

  // OCR/Direct Paper Uploader States
  const [ocrActiveTab, setOcrActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState([]);
  const [ocrStatusText, setOcrStatusText] = useState('');
  
  const [ocrStagedQuestions, setOcrStagedQuestions] = useState([]);
  const [ocrSelectedQuestion, setOcrSelectedQuestion] = useState(null);
  
  const [ocrExamName, setOcrExamName] = useState('NEET UG Entrance 2026');
  const [ocrExamTypeId, setOcrExamTypeId] = useState(1);
  const [ocrYear, setOcrYear] = useState(2026);
  const [ocrShift, setOcrShift] = useState('Morning');
  const [ocrSubject, setOcrSubject] = useState('Biology');
  const [ocrLanguage, setOcrLanguage] = useState('English');
  const [ocrSourceType, setOcrSourceType] = useState('Previous Year');
  const [ocrPurpose, setOcrPurpose] = useState('Import to Bank');
  
  const [ocrWizardStep, setOcrWizardStep] = useState(1); // 1 = Upload, 2 = Process, 3 = Review
  const [ocrPaperId, setOcrPaperId] = useState(null);

  const fetchOcrStaged = async (paperId) => {
    try {
      const res = await fetch(`http://localhost:8001/api/questions/staged-questions/${paperId}`);
      if (res.ok) {
        const data = await res.json();
        setOcrStagedQuestions(data);
        if (data.length > 0) {
          setOcrSelectedQuestion(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching staged questions:", err);
    }
  };

  const handleOcrSubmit = async (e) => {
    e.preventDefault();
    if (ocrActiveTab === 'upload' && !ocrFile) {
      alert("Please select a file to upload.");
      return;
    }
    if (ocrActiveTab === 'paste' && !ocrText.trim()) {
      alert("Please paste the question sheet content.");
      return;
    }

    setOcrLoading(true);
    setOcrWizardStep(2);
    setOcrProgress(10);
    setOcrStatusText("Preparing file upload...");
    setOcrLog([{ time: new Date().toLocaleTimeString().slice(0, 8), msg: "Initializing upload..." }]);

    const formData = new FormData();
    formData.append('exam_type_id', String(ocrExamTypeId));
    formData.append('year', String(ocrYear));
    formData.append('shift', ocrShift);
    formData.append('source_type', ocrSourceType);
    formData.append('language', ocrLanguage);
    formData.append('upload_purpose', ocrPurpose);

    if (ocrActiveTab === 'upload' && ocrFile) {
      formData.append('file', ocrFile);
    } else {
      const blob = new Blob([ocrText], { type: 'text/plain' });
      formData.append('file', new File([blob], 'pasted_questions.txt'));
    }

    try {
      // Simulate progress updates for a smoother visual experience before fetching
      const interval = setInterval(() => {
        setOcrProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 400);

      // Perform fetch request to backend
      const res = await fetch('http://localhost:8001/api/questions/import', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'test_csrf_token'
        },
        body: formData
      });
      
      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload and OCR parsing failed.");
      }

      const data = await res.json();
      setOcrPaperId(data.paper_id);
      setOcrProgress(100);
      setOcrStatusText("OCR extraction complete!");
      setOcrLog(prev => [...prev, { time: new Date().toLocaleTimeString().slice(0, 8), msg: `Success: Extracted ${data.extracted_count} questions.` }]);
      
      // Move to review step
      setTimeout(async () => {
        await fetchOcrStaged(data.paper_id);
        setOcrWizardStep(3);
        setOcrLoading(false);
      }, 1000);

    } catch (err) {
      setOcrLoading(false);
      setOcrWizardStep(1);
      alert(err.message);
    }
  };

  const saveOcrQuestionInline = async (updatedQ) => {
    try {
      const textMap = JSON.parse(updatedQ.text_json);
      const optsMap = JSON.parse(updatedQ.options_json);

      await fetch(`http://localhost:8001/api/questions/staged-questions/${updatedQ.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test_csrf_token'
        },
        body: JSON.stringify({
          text: textMap.en || textMap,
          options: optsMap.en || optsMap,
          correct_answer: updatedQ.correct_answer,
          q_type: updatedQ.q_type || 'MCQ_single'
        })
      });

      setOcrStagedQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    } catch (err) {
      console.error("Error saving staged question edit:", err);
    }
  };

  const handleOcrReviewAction = async (id, action) => {
    try {
      const res = await fetch(`http://localhost:8001/api/questions/staged-questions/${id}/review?action=${action}`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'test_csrf_token'
        }
      });
      if (res.ok) {
        setOcrStagedQuestions(prev => prev.map(q => q.id === id ? { ...q, review_status: action } : q));
        if (ocrSelectedQuestion?.id === id) {
          setOcrSelectedQuestion(prev => ({ ...prev, review_status: action }));
        }
        addSystemLog(`[OCR REVIEW] Staged Question #${id} review status updated to: ${action}`);
      }
    } catch (err) {
      console.error("Error reviewing staged question:", err);
    }
  };

  const handleOcrBulkApprove = async () => {
    if (!ocrPaperId) return;
    try {
      const res = await fetch(`http://localhost:8001/api/questions/uploaded-papers/${ocrPaperId}/bulk-approve`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'test_csrf_token'
        }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Bulk approved ${data.approved_count} questions with >= 90% confidence.`);
        await fetchOcrStaged(ocrPaperId);
      }
    } catch (err) {
      console.error("Error bulk approving questions:", err);
    }
  };

  const handleOcrDeploy = async () => {
    if (!ocrPaperId) return;
    try {
      const res = await fetch(`http://localhost:8001/api/questions/uploaded-papers/${ocrPaperId}/import-trigger`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'test_csrf_token'
        }
      });
      if (res.ok) {
        alert("Paper import task queued successfully! Staged questions are being integrated into the main bank.");
        setOcrWizardStep(1);
        setOcrFile(null);
        setOcrText('');
        setOcrPaperId(null);
        setOcrStagedQuestions([]);
        setOcrSelectedQuestion(null);
        addSystemLog("[OCR IMPORT] Paper imported. Integrating staged questions into question bank.");
      }
    } catch (err) {
      console.error("Error deploying staged questions:", err);
    }
  };
  
  // State for manual question entry form
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualSubject, setManualSubject] = useState('Biology');
  const [manualBloom, setManualBloom] = useState('Bloom L3 — Apply');
  const [manualOptionA, setManualOptionA] = useState('');
  const [manualOptionB, setManualOptionB] = useState('');
  const [manualOptionC, setManualOptionC] = useState('');
  const [manualOptionD, setManualOptionD] = useState('');
  const [manualCorrect, setManualCorrect] = useState('A');

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualQuestion.trim() || !manualOptionA.trim() || !manualOptionB.trim() || !manualOptionC.trim() || !manualOptionD.trim()) {
      alert("Please fill in the question text and all four options.");
      return;
    }

    const newQ = {
      text: manualQuestion,
      subject: manualSubject,
      bloom: manualBloom,
      similarity: "Sim: 0.00 (Manual)",
      options: [
        { text: `A. ${manualOptionA}`, correct: manualCorrect === 'A' },
        { text: `B. ${manualOptionB}`, correct: manualCorrect === 'B' },
        { text: `C. ${manualOptionC}`, correct: manualCorrect === 'C' },
        { text: `D. ${manualOptionD}`, correct: manualCorrect === 'D' }
      ]
    };

    setTotalQuestions(prev => prev + 1);
    setRecentQuestions(prev => [
      {
        id: `${manualSubject.substring(0, 4).toUpperCase()}-2026-${Math.floor(Math.random() * 900 + 100)}`,
        text: newQ.text,
        subject: newQ.subject,
        bloom: newQ.bloom,
        similarity: newQ.similarity,
        timestamp: new Date().toTimeString().slice(0, 8),
        options: newQ.options
      },
      ...prev
    ]);

    // Update Bloom's taxonomy bars dynamically
    setDifficultyData(prev => {
      const shortName = manualBloom.split(' — ')[1] || 'Apply';
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
        if (item.name.toLowerCase() === manualSubject.toLowerCase()) {
          return { ...item, value: Math.min(item.value + 1, 100) };
        }
        return item;
      });
    });

    addSystemLog(`[MANUAL ADD] Operator registered new question to the bank [${manualSubject} - ${manualBloom}]`);

    // Reset inputs
    setManualQuestion('');
    setManualOptionA('');
    setManualOptionB('');
    setManualOptionC('');
    setManualOptionD('');
    setManualCorrect('A');

    alert("Question added to bank successfully!");
  };

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
          setRecentQuestions(prev => [
            {
              id: `${newQ.subject.substring(0, 4).toUpperCase()}-2026-${Math.floor(Math.random() * 900 + 100)}`,
              text: newQ.text,
              subject: newQ.subject,
              bloom: newQ.bloom,
              similarity: newQ.similarity,
              timestamp: new Date().toTimeString().slice(0, 8),
              options: newQ.options
            },
            ...prev
          ]);

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
      {/* Left Column: Pipeline & Approved Question / OCR Direct Uploader */}
      <div className="flex flex-col gap-3">
        {/* Sub-tab Navigation */}
        <div className="flex gap-2 p-1 bg-bg2 border border-border rounded-xl">
          <button 
            type="button"
            onClick={() => setActiveSubTab('rag')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider font-display uppercase transition-all ${activeSubTab === 'rag' ? 'bg-blue text-white shadow-lg' : 'text-text2 hover:text-white hover:bg-bg3'}`}
          >
            🤖 AI RAG Generator
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('ocr')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider font-display uppercase transition-all ${activeSubTab === 'ocr' ? 'bg-blue text-white shadow-lg' : 'text-text2 hover:text-white hover:bg-bg3'}`}
          >
            📸 OCR Direct Uploader
          </button>
        </div>

        {activeSubTab === 'rag' ? (
          <>
            {/* Pipeline Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="dot" style={{ backgroundColor: 'var(--blue)', animation: 'pulse-glow 1.5s infinite' }} />
                  Live Generation Pipeline
                </div>
                <button 
                  type="button"
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

            {/* Manual Question Insertion Console */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="dot" style={{ backgroundColor: 'var(--blue)' }} />
                  Manual Question Registration Console
                </div>
              </div>
              <div className="panel-body">
                <form onSubmit={handleManualAdd} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Subject</label>
                      <select 
                        value={manualSubject} 
                        onChange={(e) => setManualSubject(e.target.value)}
                        className="inp"
                      >
                        <option value="Biology">Biology</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Physics">Physics</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Bloom's Level</label>
                      <select 
                        value={manualBloom} 
                        onChange={(e) => setManualBloom(e.target.value)}
                        className="inp"
                      >
                        <option value="Bloom L1 — Remember">Bloom L1 — Remember</option>
                        <option value="Bloom L2 — Understand">Bloom L2 — Understand</option>
                        <option value="Bloom L3 — Apply">Bloom L3 — Apply</option>
                        <option value="Bloom L4 — Analyse">Bloom L4 — Analyse</option>
                        <option value="Bloom L5 — Evaluate">Bloom L5 — Evaluate</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Correct Option</label>
                      <select 
                        value={manualCorrect} 
                        onChange={(e) => setManualCorrect(e.target.value)}
                        className="inp"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-text3 uppercase block">Question Text</label>
                    <textarea 
                      value={manualQuestion} 
                      onChange={(e) => setManualQuestion(e.target.value)}
                      placeholder="Type question content here..." 
                      className="inp min-h-[50px] resize-y"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Option A</label>
                      <input 
                        type="text" 
                        value={manualOptionA} 
                        onChange={(e) => setManualOptionA(e.target.value)}
                        placeholder="Enter choice A" 
                        className="inp"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Option B</label>
                      <input 
                        type="text" 
                        value={manualOptionB} 
                        onChange={(e) => setManualOptionB(e.target.value)}
                        placeholder="Enter choice B" 
                        className="inp"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Option C</label>
                      <input 
                        type="text" 
                        value={manualOptionC} 
                        onChange={(e) => setManualOptionC(e.target.value)}
                        placeholder="Enter choice C" 
                        className="inp"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-text3 uppercase block">Option D</label>
                      <input 
                        type="text" 
                        value={manualOptionD} 
                        onChange={(e) => setManualOptionD(e.target.value)}
                        placeholder="Enter choice D" 
                        className="inp"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-blue hover:bg-blue/90 text-white font-semibold text-xs tracking-wider rounded-lg transition-all uppercase mt-2 shadow-lg"
                  >
                    Register & Encrypt Question
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* OCR wizard uploader view */}
            {ocrWizardStep === 1 && (
              <div className="panel space-y-4">
                <div className="panel-header">
                  <div className="panel-title">📸 OCR Paper Upload Configuration</div>
                </div>
                <div className="panel-body">
                  <form onSubmit={handleOcrSubmit} className="space-y-4">
                    {/* Metadata inputs */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[9px] font-mono text-text3 uppercase block">Paper Title</label>
                        <input 
                          type="text" 
                          value={ocrExamName} 
                          onChange={e => setOcrExamName(e.target.value)} 
                          className="inp" 
                          required 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-text3 uppercase block">Year</label>
                        <input 
                          type="number" 
                          value={ocrYear} 
                          onChange={e => setOcrYear(Number(e.target.value))} 
                          className="inp" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-text3 uppercase block">Shift</label>
                        <select value={ocrShift} onChange={e => setOcrShift(e.target.value)} className="inp">
                          <option>Morning</option>
                          <option>Afternoon</option>
                          <option>Evening</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-text3 uppercase block">Main Subject</label>
                        <select value={ocrSubject} onChange={e => setOcrSubject(e.target.value)} className="inp">
                          <option>Biology</option>
                          <option>Chemistry</option>
                          <option>Physics</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-text3 uppercase block">Language</label>
                        <select value={ocrLanguage} onChange={e => setOcrLanguage(e.target.value)} className="inp">
                          <option>English</option>
                          <option>Hindi</option>
                          <option>Bilingual</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-border pb-2 mt-2">
                      <button 
                        type="button"
                        onClick={() => setOcrActiveTab('upload')} 
                        className={`text-xs font-bold uppercase tracking-wider ${ocrActiveTab === 'upload' ? 'text-white border-b-2 border-blue pb-1' : 'text-text2'}`}
                      >
                        Upload Booklet
                      </button>
                      <button 
                        type="button"
                        onClick={() => setOcrActiveTab('paste')} 
                        className={`text-xs font-bold uppercase tracking-wider ${ocrActiveTab === 'paste' ? 'text-white border-b-2 border-blue pb-1' : 'text-text2'}`}
                      >
                        Paste Sheet Text
                      </button>
                    </div>

                    {ocrActiveTab === 'upload' ? (
                      <div className="border-2 border-dashed border-border hover:border-blue/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative bg-bg3/30">
                        <input 
                          type="file" 
                          onChange={e => setOcrFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept=".pdf,.docx,.csv,.txt"
                        />
                        <span className="text-2xl mb-1">📁</span>
                        <span className="text-xs text-white font-medium">
                          {ocrFile ? `Selected: ${ocrFile.name}` : "Drag & Drop question paper here or click"}
                        </span>
                        <span className="text-[9px] text-text3 mt-1">Accepts PDF, DOCX, CSV, TXT files</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-text3 uppercase block">Paste Question Sheet Content</label>
                        <textarea 
                          value={ocrText}
                          onChange={e => setOcrText(e.target.value)}
                          placeholder="e.g. 1. Ribosomes are responsible for...? (A) Translation (B) Transcription..." 
                          className="inp min-h-[100px] font-mono text-[10px]"
                        />
                      </div>
                    )}

                    <button 
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-blue to-green-400 hover:from-blue/90 hover:to-green-400/90 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg"
                    >
                      🚀 Start AI OCR Parser
                    </button>
                  </form>
                </div>
              </div>
            )}

            {ocrWizardStep === 2 && (
              <div className="panel text-center p-8 space-y-6">
                <div className="w-12 h-12 rounded-full border-2 border-blue border-t-transparent animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Question OCR Pipeline Active</h3>
                  <p className="text-[10px] text-text2">{ocrStatusText}</p>
                </div>
                <div className="w-full space-y-1">
                  <div className="w-full h-1.5 bg-bg3 border border-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue to-green-400 transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-text3 font-mono">{ocrProgress}% complete</span>
                </div>
                <div className="bg-bg3 border border-border rounded-xl p-3 text-[9px] font-mono text-left text-text3 max-h-28 overflow-y-auto space-y-1">
                  {ocrLog.map((log, i) => (
                    <div key={i}>
                      <span className="text-text2">[{log.time}]</span> {log.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ocrWizardStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px]">
                {/* Left side: List of staged questions */}
                <div className="bg-bg2 border border-border rounded-xl p-3 flex flex-col overflow-hidden max-h-[500px]">
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-2">
                    <span className="text-[10px] font-mono font-bold text-white uppercase">Staged OCR Questions</span>
                    <button 
                      type="button"
                      onClick={handleOcrBulkApprove}
                      className="px-2 py-0.5 rounded bg-green/10 border border-green/30 text-green text-[9px] font-semibold uppercase hover:bg-green/20"
                    >
                      Bulk Approve
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans">
                    {ocrStagedQuestions.map(q => {
                      const conf = Math.round(q.confidence_score * 100);
                      const isSel = ocrSelectedQuestion?.id === q.id;
                      const text = JSON.parse(q.text_json).en || q.text_json;

                      return (
                        <div 
                          key={q.id}
                          onClick={() => setOcrSelectedQuestion(q)}
                          className={`p-2 border rounded-lg cursor-pointer transition-all ${isSel ? 'bg-blue/5 border-blue' : 'bg-bg3 border-border hover:border-blue/30'}`}
                        >
                          <div className="flex justify-between items-center text-[8px] font-mono mb-1">
                            <span className="text-blue font-bold">Q#{q.q_number}</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold ${conf >= 90 ? 'bg-green/10 text-green' : 'bg-amber/10 text-amber'}`}>{conf}% conf</span>
                            <span className={`px-1 py-0.5 rounded font-bold ${q.review_status === 'APPROVED' ? 'bg-green/10 text-green' : q.review_status === 'SKIPPED' ? 'bg-red/10 text-red' : 'bg-bg3 text-text3'}`}>{q.review_status}</span>
                          </div>
                          <p className="text-[10px] text-white line-clamp-1">{text}</p>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    type="button"
                    onClick={handleOcrDeploy}
                    className="w-full py-1.5 bg-green hover:bg-green/90 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all mt-2"
                  >
                    Deploy to Bank
                  </button>
                </div>

                {/* Right side: Editor */}
                <div className="bg-bg2 border border-border rounded-xl p-3 flex flex-col overflow-hidden justify-between max-h-[500px]">
                  {ocrSelectedQuestion ? (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-[10px] font-mono font-bold text-white">Interactive Editor</span>
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => handleOcrReviewAction(ocrSelectedQuestion.id, 'APPROVED')} 
                            className="px-2 py-0.5 bg-green hover:bg-green/90 rounded text-black text-[9px] font-bold uppercase"
                          >
                            Approve
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOcrReviewAction(ocrSelectedQuestion.id, 'SKIPPED')} 
                            className="px-2 py-0.5 bg-red/10 border border-red/30 rounded text-red text-[9px] font-bold uppercase"
                          >
                            Skip
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-text3 uppercase block">Question Text</label>
                        <textarea 
                          value={JSON.parse(ocrSelectedQuestion.text_json).en || ocrSelectedQuestion.text_json}
                          onChange={e => {
                            const updated = { ...ocrSelectedQuestion, text_json: JSON.stringify({ en: e.target.value }) };
                            setOcrSelectedQuestion(updated);
                            saveOcrQuestionInline(updated);
                          }}
                          className="inp min-h-[50px] text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-text3 uppercase block">Options</label>
                        {Object.entries(JSON.parse(ocrSelectedQuestion.options_json).en || JSON.parse(ocrSelectedQuestion.options_json)).map(([k, v]) => (
                          <div key={k} className="flex gap-1.5 items-center">
                            <span className="font-mono text-[10px] w-3 text-center font-bold text-blue">{k}</span>
                            <input 
                              type="text" 
                              value={v}
                              onChange={e => {
                                const opts = JSON.parse(ocrSelectedQuestion.options_json);
                                const enOpts = opts.en || opts;
                                enOpts[k] = e.target.value;
                                const updated = { ...ocrSelectedQuestion, options_json: JSON.stringify(opts) };
                                setOcrSelectedQuestion(updated);
                                saveOcrQuestionInline(updated);
                              }}
                              className="inp text-[10px] py-1"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-text3 uppercase block">Correct Answer</label>
                        <input 
                          type="text" 
                          value={ocrSelectedQuestion.correct_answer}
                          onChange={e => {
                            const updated = { ...ocrSelectedQuestion, correct_answer: e.target.value };
                            setOcrSelectedQuestion(updated);
                            saveOcrQuestionInline(updated);
                          }}
                          className="inp font-mono font-bold text-[10px] py-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-text3 text-[10px]">
                      Select question from catalog to edit
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
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
