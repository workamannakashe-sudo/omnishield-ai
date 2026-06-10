import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Shield, FileText, Search, Filter, Layers, Download, Play, 
  Trash2, Eye, Calendar, ArrowLeft, RefreshCw, AlertCircle, CheckCircle
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

        <button 
          onClick={() => setShowTimeline(!showTimeline)}
          className="px-4 py-2 bg-[#162030] hover:bg-[#162030]/80 border border-[#162030] text-white font-bold rounded-xl text-xs uppercase transition-all"
        >
          {showTimeline ? 'View Grid Library' : 'View Chronological Timeline'}
        </button>
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
    </div>
  );
}
