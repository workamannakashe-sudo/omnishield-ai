import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, Server } from 'lucide-react';

export default function AuthPortal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('nta'); // 'nta' | 'center'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [centerCode, setCenterCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Seed default users in localStorage if empty (for offline fallback)
  useEffect(() => {
    const existingUsers = localStorage.getItem('omnishield_users');
    if (!existingUsers) {
      const defaultUsers = [
        { username: 'admin', password: 'admin123', role: 'nta' },
        { username: 'board_admin', password: 'board123', role: 'nta' },
        { username: 'center402', password: 'center123', role: 'center', centerCode: 'IN-MH-402' },
        { username: 'operator_delhi', password: 'center123', role: 'center', centerCode: 'IN-DL-021' }
      ];
      localStorage.setItem('omnishield_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (role === 'center' && !centerCode) {
      setErrorMsg('Center Code is required for Center Coordinators.');
      return;
    }

    try {
      // Hit real backend login endpoint
      const res = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid username or password.');
      }
      
      const dbRole = data.role;
      if (role === 'nta' && (dbRole !== 'SuperAdmin' && dbRole !== 'ExamBoard')) {
        throw new Error('Access denied: User is not an NTA administrator.');
      }
      if (role === 'center' && dbRole !== 'Center') {
        throw new Error('Access denied: User is not a center operator.');
      }

      localStorage.setItem('omnishield_token', data.access_token);
      
      onLoginSuccess({
        username: data.username,
        role: role,
        centerCode: role === 'center' ? centerCode.toUpperCase() : undefined,
        centerId: data.center_id
      });
      
    } catch (err) {
      console.warn("Backend authentication failed or offline. Falling back to local storage.", err);
      // Fallback local storage auth
      const users = JSON.parse(localStorage.getItem('omnishield_users') || '[]');
      const foundUser = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password &&
        u.role === role
      );

      if (!foundUser) {
        setErrorMsg(err.message || 'Invalid username, password, or role.');
        return;
      }

      if (role === 'center' && foundUser.centerCode !== centerCode.toUpperCase()) {
        setErrorMsg('Invalid Center Code for this user.');
        return;
      }

      onLoginSuccess({
        username: foundUser.username,
        role: foundUser.role,
        centerCode: foundUser.centerCode
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,45,61,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,45,61,0.1)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-bg2 border border-border rounded-xl p-6 shadow-2xl space-y-6 relative z-10">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue/10 rounded-full flex items-center justify-center mx-auto border border-blue/20">
            <Shield className="w-6 h-6 text-blue fill-blue/5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wider font-display text-gradient">OMNISHIELD AI PORTAL</h2>
          <p className="text-[10px] text-text2 font-mono tracking-widest uppercase">Secure Authentication Gateway</p>
        </div>

        {/* Tab Selection: Login vs Register */}
        <div className="toggle-group">
          <button 
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
            className={`toggle-btn ${!isRegister ? 'active' : ''}`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
            className={`toggle-btn ${isRegister ? 'active' : ''}`}
          >
            Register
          </button>
        </div>

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-text3 uppercase tracking-wider block">Access Portal</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setRole('nta');
                if (username === 'operator_delhi' || username === 'center402') setUsername('board_admin');
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                role === 'nta'
                  ? 'bg-blue/15 border-blue text-blue shadow-lg shadow-blue/5'
                  : 'bg-bg3 border-border text-text2 hover:text-white hover:bg-bg3/80'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>NTA Administration</span>
              <span className="text-[8px] text-text3 font-normal font-mono">Central Command</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('center');
                if (username === 'board_admin' || username === 'admin') setUsername('operator_delhi');
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                role === 'center'
                  ? 'bg-blue/15 border-blue text-blue shadow-lg shadow-blue/5'
                  : 'bg-bg3 border-border text-text2 hover:text-white hover:bg-bg3/80'
              }`}
            >
              <Server className="w-5 h-5" />
              <span>Center Terminal</span>
              <span className="text-[8px] text-text3 font-normal font-mono">Local Offline Node</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="bg-red/10 border border-red/20 text-red text-xs p-2.5 rounded-lg font-mono text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green/10 border border-green/20 text-green text-xs p-2.5 rounded-lg font-mono text-center">
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-text3 uppercase block">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-text3">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'nta' ? 'board_admin' : 'operator_delhi'}
                className="inp pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-text3 uppercase block">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-text3">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="inp pl-9"
                required
              />
            </div>
          </div>

          {/* Center Code (Conditional) */}
          {role === 'center' && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-[10px] font-mono text-text3 uppercase block">Center Code / Operator ID</label>
              <input
                type="text"
                value={centerCode}
                onChange={(e) => setCenterCode(e.target.value)}
                placeholder="e.g. IN-DL-021 or IN-MH-402"
                className="inp font-mono"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue hover:bg-blue/90 text-white font-semibold text-xs tracking-wider rounded-lg transition-all uppercase mt-2 shadow-lg hover:shadow-blue/20"
          >
            {isRegister ? 'Register Account' : `Sign In to ${role === 'nta' ? 'Admin Central' : 'Center Terminal'}`}
          </button>
        </form>

        <div className="bg-bg3/60 border border-border/50 rounded-lg p-3 space-y-2 text-[9px] font-mono text-text3">
          <div className="text-white font-bold text-center border-b border-border/40 pb-1 mb-1">DATABASE SIGN-IN CREDENTIALS</div>
          {role === 'nta' ? (
            <div>
              <span className="text-blue">NTA Username:</span> <span className="text-white">board_admin</span><br />
              <span className="text-blue">NTA Password:</span> <span className="text-white">board123</span> <span className="text-text2">(or admin123)</span>
            </div>
          ) : (
            <div>
              <span className="text-green">Center Username:</span> <span className="text-white">operator_delhi</span><br />
              <span className="text-green">Center Password:</span> <span className="text-white">center123</span><br />
              <span className="text-green">Center Code:</span> <span className="text-white">IN-DL-021</span> <span className="text-text2">(or center402 / center123 / IN-MH-402)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
