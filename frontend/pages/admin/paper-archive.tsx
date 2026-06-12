import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Shield, FileText, Search, Filter, Layers, Download, Play, 
  Trash2, Eye, Calendar, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Plus, X, Upload
} from 'lucide-react';

export default function PaperArchive() {
  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  
  // Lists
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExam, setFilterExam] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // PDF Paper Direct Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pdfPaperFile, setPdfPaperFile] = useState<File | null>(null);
  const [pdfPaperName, setPdfPaperName] = useState('');
  const [pdfExamName, setPdfExamName] = useState('NEET UG 2026');
  const [pdfExamDate, setPdfExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [pdfShift, setPdfShift] = useState('Morning');
  const [pdfSetCode, setPdfSetCode] = useState('A');
  const [pdfExamTypeId, setPdfExamTypeId] = useState(1);
  const [pdfDuration, setPdfDuration] = useState(180);
  const [pdfSecurityLevel, setPdfSecurityLevel] = useState('HIGH');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadResult, setPdfUploadResult] = useState<any>(null);
  const [pdfDragging, setPdfDragging] = useState(false);

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 1. Initial Authentication Check
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedRole = localStorage.getItem('user_role');

    if (savedToken && (savedRole === 'SuperAdmin' || savedRole === 'ExamBoard')) {
      setToken(savedToken);
      setRole(savedRole);
      setAuthorized(true);
      fetchUploadedPapers(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      if (data.role !== 'SuperAdmin' && data.role !== 'ExamBoard') {
        throw new Error('Unauthorized role: administrator level privileges required.');
      }

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      setToken(data.access_token);
      setRole(data.role);
      setAuthorized(true);
      fetchUploadedPapers(data.access_token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePdfPaperUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfPaperFile) { alert('Please select a PDF file.'); return; }
    if (!pdfPaperName.trim()) { alert('Please enter a paper name.'); return; }
    if (!pdfExamName.trim()) { alert('Please enter an exam name.'); return; }
    if (!pdfExamDate.trim()) { alert('Please enter the exam date.'); return; }

    setPdfUploading(true);
    setPdfUploadResult(null);

    const formData = new FormData();
    formData.append('paper_name', pdfPaperName);
    formData.append('exam_name', pdfExamName);
    formData.append('exam_date', pdfExamDate);
    formData.append('shift', pdfShift);
    formData.append('set_code', pdfSetCode);
    formData.append('exam_type_id', String(pdfExamTypeId));
    formData.append('duration', String(pdfDuration));
    formData.append('security_level', pdfSecurityLevel);
    formData.append('file', pdfPaperFile);

    try {
      const res = await fetch('http://localhost:8001/api/papers/upload-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setPdfUploadResult(data);
      alert('Paper uploaded and sealed successfully!');
      fetchUploadedPapers(token);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setPdfUploading(false);
    }
  };

  const fetchUploadedPapers = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8001/api/questions/uploaded-papers', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      
      setPapers(data.length ? data : [
        { id: 1, original_filename: "NEET_Biology_2023.pdf", file_type: "pdf", year: 2023, shift: "Morning", status: "IMPORTED", total_extracted: 180, total_imported: 162, total_skipped: 18, uploaded_by: "board_admin", created_at: "2026-06-08T12:00:00" },
        { id: 2, original_filename: "JEE_Physics_2024.docx", file_type: "docx", year: 2024, shift: "Afternoon", status: "STAGED", total_extracted: 90, total_imported: 0, total_skipped: 0, uploaded_by: "board_admin", created_at: "2026-06-09T14:30:00" },
        { id: 3, original_filename: "UPSC_Prelims_2022.pdf", file_type: "pdf", year: 2022, shift: "Morning", status: "IMPORTED", total_extracted: 100, total_imported: 92, total_skipped: 8, uploaded_by: "superadmin", created_at: "2026-06-05T09:00:00" }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter implementation
  const filteredPapers = papers.filter(p => {
    const matchesSearch = p.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = filterExam === 'ALL' || p.original_filename.toLowerCase().includes(filterExam.toLowerCase());
    const matchesYear = filterYear === 'ALL' || String(p.year) === filterYear;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesExam && matchesYear && matchesStatus;
  });

  // Timeline view mock gaps
  const timelineGaps = [
    { exam: "NEET UG", year: 2025, status: "AVAILABLE", file: "NEET_UG_2025.pdf" },
    { exam: "NEET UG", year: 2024, status: "AVAILABLE", file: "NEET_UG_2024.docx" },
    { exam: "NEET UG", year: 2023, status: "AVAILABLE", file: "NEET_Biology_2023.pdf" },
    { exam: "NEET UG", year: 2022, status: "MISSING", error: "NEET 2022 paper missing" },
    { exam: "UPSC CSE", year: 2024, status: "AVAILABLE", file: "UPSC_GS1_2024.pdf" },
    { exam: "UPSC CSE", year: 2023, status: "MISSING", error: "UPSC 2023 paper missing" },
    { exam: "UPSC CSE", year: 2022, status: "AVAILABLE", file: "UPSC_Prelims_2022.pdf" },
  ];

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#05080d] text-white flex flex-col justify-center items-center font-display relative overflow-hidden">
        <Head>
          <title>OmniShield AI — Admin Authentication</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Space+Mono&display=swap" rel="stylesheet" />
        </Head>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(46,184,255,0.05),transparent)] pointer-events-none" />
        <div className="w-full max-w-md bg-[#080d14] border border-[#162030] rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#2eb8ff]/10 rounded-2xl border border-[#2eb8ff]/30 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-[#2eb8ff]" />
            </div>
            <h1 className="text-xl font-bold tracking-wide text-white">Paper Archive Access</h1>
            <p className="text-xs text-gray-400 font-mono tracking-wider uppercase mt-1">Universal Registry Vault</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 uppercase">Username</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="e.g. board_admin" 
                className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-sm text-white outline-none focus:border-[#2eb8ff]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 uppercase">Secure Password</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••••••" 
                className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-sm text-white outline-none focus:border-[#2eb8ff]"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red/10 border border-red/30 rounded-xl text-xs text-[#ff3b5c] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#2eb8ff] hover:bg-[#2eb8ff]/90 disabled:bg-[#2eb8ff]/40 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              {isLoggingIn ? 'Verifying...' : 'Unlock Vault'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080d] text-gray-200 font-display pb-12 relative">
      <Head>
        <title>OmniShield AI — Paper Archive</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Space+Mono&display=swap" rel="stylesheet" />
      </Head>

      <header className="border-b border-[#162030] bg-[#080d14]/80 backdrop-blur px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2eb8ff]/10 rounded border border-[#2eb8ff]/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#2eb8ff]" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-wider text-white font-mono">OmniShield Paper Archive</h1>
            <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">Secure National Repository</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPdfPaperFile(null);
              setPdfPaperName('');
              setPdfUploadResult(null);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 bg-[#ffcc44] hover:bg-[#ffcc44]/90 text-black font-bold rounded-xl text-xs uppercase transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Upload Sealed PDF Paper
          </button>
          <button 
            onClick={() => setShowTimeline(!showTimeline)}
            className="px-4 py-2 bg-[#162030] hover:bg-[#162030]/80 border border-[#162030] text-white font-bold rounded-xl text-xs uppercase transition-all"
          >
            {showTimeline ? 'View Grid Library' : 'View Chronological Timeline'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">

        {!showTimeline ? (
          // GRID LIBRARY VIEW
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-[#080d14] border border-[#162030] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Search by Title</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search documents..." 
                    className="w-full bg-[#05080d] border border-[#162030] rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Exam Category</label>
                <select value={filterExam} onChange={e => setFilterExam(e.target.value)} className="w-full bg-[#05080d] border border-[#162030] rounded-lg p-2 text-xs text-white outline-none">
                  <option value="ALL">All Categories</option>
                  <option value="NEET">NEET</option>
                  <option value="JEE">JEE</option>
                  <option value="UPSC">UPSC</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Year</label>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full bg-[#05080d] border border-[#162030] rounded-lg p-2 text-xs text-white outline-none">
                  <option value="ALL">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-[#05080d] border border-[#162030] rounded-lg p-2 text-xs text-white outline-none">
                  <option value="ALL">All Statuses</option>
                  <option value="IMPORTED">IMPORTED</option>
                  <option value="STAGED">STAGED</option>
                  <option value="PROCESSING">PROCESSING</option>
                </select>
              </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPapers.map(p => (
                <div key={p.id} className="bg-[#080d14] border border-[#162030] rounded-2xl p-5 flex flex-col justify-between hover:border-[#2eb8ff]/40 transition-all cursor-pointer">
                  <div className="space-y-3">
                    <div className="w-full h-32 bg-[#05080d] border border-[#162030] rounded-xl flex items-center justify-center text-gray-500">
                      <FileText className="w-10 h-10 text-[#2eb8ff]/40" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#2eb8ff] uppercase">{p.shift} Shift | Year {p.year}</span>
                      <h4 className="text-sm font-bold text-white mt-1 truncate">{p.original_filename}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">Uploaded by: {p.uploaded_by}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#162030]/60">
                    <span className="text-[10px] font-mono text-gray-400">{p.total_imported} / {p.total_extracted} imported</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${
                      p.status === 'IMPORTED' ? 'bg-[#00f0a0]/10 text-[#00f0a0] border border-[#00f0a0]/30' :
                      p.status === 'STAGED' ? 'bg-[#ffcc44]/10 text-[#ffcc44] border border-[#ffcc44]/30' :
                      'bg-red/10 text-red border border-red/30'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          // CHRONOLOGICAL TIMELINE GAPS VIEW
          <div className="bg-[#080d14] border border-[#162030] rounded-2xl p-6 space-y-6">
            <div className="pb-3 border-b border-[#162030]">
              <h3 className="text-xs font-bold uppercase text-white font-mono flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2eb8ff]" /> Chronological Paper Gaps Audit
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Identifies missing historic booklets in national databases.</p>
            </div>

            <div className="space-y-4">
              {timelineGaps.map((g, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    g.status === 'MISSING' ? 'bg-[#ff3b5c]/5 border-[#ff3b5c]/30' : 'bg-[#05080d] border-[#162030]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${g.status === 'MISSING' ? 'bg-[#ff3b5c]/15 text-[#ff3b5c]' : 'bg-[#00f0a0]/10 text-[#00f0a0]'}`}>
                      {g.status === 'MISSING' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{g.exam} — Year {g.year}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {g.status === 'AVAILABLE' ? `File registered: ${g.file}` : `System gap: ${g.error}`}
                      </p>
                    </div>
                  </div>

                  {g.status === 'MISSING' ? (
                    <button className="px-3 py-1 bg-[#ff3b5c] hover:bg-[#ff3b5c]/90 text-white rounded text-[10px] uppercase font-bold transition-all">
                      Upload Missing Set
                    </button>
                  ) : (
                    <button className="px-3 py-1 bg-[#162030] hover:bg-[#162030]/80 text-gray-400 hover:text-white rounded text-[10px] uppercase font-bold transition-all flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download Booklet
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#080d14] border border-[#162030] w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-[#162030] hover:bg-[#ff3b5c]/20 hover:text-[#ff3b5c] text-gray-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-[#162030] pb-3">
              <div className="w-8 h-8 bg-[#ffcc44]/10 rounded border border-[#ffcc44]/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#ffcc44]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">🔐 Direct PDF Sealed Paper Configuration</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Seals a complete exam booklet PDF directly with AES-256-GCM.</p>
              </div>
            </div>

            <form onSubmit={handlePdfPaperUpload} className="space-y-4">
              {/* Drag-drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setPdfDragging(true); }}
                onDragLeave={() => setPdfDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setPdfDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped && dropped.name.toLowerCase().endsWith('.pdf')) {
                    setPdfPaperFile(dropped);
                  } else {
                    alert('Only PDF files are accepted here.');
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative ${
                  pdfDragging ? 'border-[#ffcc44] bg-[#ffcc44]/5' : 'border-[#162030] hover:border-[#ffcc44]/50 bg-[#05080d]/50'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfPaperFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {pdfPaperFile ? (
                  <>
                    <span className="text-3xl mb-2">📄</span>
                    <span className="text-xs text-[#ffcc44] font-bold">{pdfPaperFile.name}</span>
                    <span className="text-[10px] text-gray-400 mt-1">{(pdfPaperFile.size / 1024).toFixed(1)} KB — Click or drag to replace</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-2">📥</span>
                    <span className="text-xs text-white font-medium">Drag & Drop complete exam PDF here</span>
                    <span className="text-[10px] text-gray-400 mt-1">Or click to browse — PDF files only</span>
                    <span className="text-[10px] text-[#ffcc44]/75 mt-1 font-semibold">This will be sealed as the final question paper</span>
                  </>
                )}
              </div>

              {/* Metadata fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Paper Name *</label>
                  <input
                    type="text"
                    value={pdfPaperName}
                    onChange={(e) => setPdfPaperName(e.target.value)}
                    placeholder="e.g. NEET UG 2026 — Morning Set A"
                    className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Exam Name *</label>
                  <input
                    type="text"
                    value={pdfExamName}
                    onChange={(e) => setPdfExamName(e.target.value)}
                    placeholder="NEET UG 2026"
                    className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Exam Date *</label>
                  <input
                    type="date"
                    value={pdfExamDate}
                    onChange={(e) => setPdfExamDate(e.target.value)}
                    className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Shift</label>
                  <select value={pdfShift} onChange={(e) => setPdfShift(e.target.value)} className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]">
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Set Code</label>
                  <select value={pdfSetCode} onChange={(e) => setPdfSetCode(e.target.value)} className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]">
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Duration (min)</label>
                  <input
                    type="number"
                    value={pdfDuration}
                    onChange={(e) => setPdfDuration(Number(e.target.value))}
                    className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]"
                    min={30} max={360}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase block font-semibold">Security Level</label>
                  <select value={pdfSecurityLevel} onChange={(e) => setPdfSecurityLevel(e.target.value)} className="w-full bg-[#05080d] border border-[#162030] rounded-xl p-3 text-white outline-none focus:border-[#ffcc44]">
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                    <option>CRITICAL</option>
                  </select>
                </div>
              </div>

              {/* Result banner */}
              {pdfUploadResult && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 space-y-3">
                  <p className="text-xs font-bold text-green-400 uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Paper Sealed Successfully
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
                    <div>Paper ID: <span className="text-white">#{pdfUploadResult.paper_id}</span></div>
                    <div>Exam ID: <span className="text-white">#{pdfUploadResult.exam_id}</span></div>
                    <div>Set Code: <span className="text-white">{pdfUploadResult.set_code}</span></div>
                    <div>Size: <span className="text-white">{(pdfUploadResult.file_size_bytes / 1024).toFixed(1)} KB</span></div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono break-all bg-[#05080d] p-2 border border-[#162030] rounded-lg font-semibold">SHA-256: {pdfUploadResult.paper_hash}</p>
                  
                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={`http://localhost:8001/api/papers/${pdfUploadResult.paper_id}/download-bundle?key=OMNISHIELD-KEY-2026-NEET`}
                      download
                      className="w-full py-3 bg-[#ffcc44] hover:bg-[#ffcc44]/90 text-black font-bold rounded-xl text-xs uppercase tracking-widest text-center transition-all shadow-md block"
                    >
                      📥 Download Sealed Encrypted Bundle
                    </a>
                  </div>
                </div>
              )}

              {!pdfUploadResult && (
                <button
                  type="submit"
                  disabled={pdfUploading || !pdfPaperFile}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {pdfUploading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading & Sealing...</>
                  ) : (
                    <>🔐 Upload & Seal PDF Paper</>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
