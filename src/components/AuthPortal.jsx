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

  // Seed default users in localStorage if empty
  useEffect(() => {
    const existingUsers = localStorage.getItem('omnishield_users');
    if (!existingUsers) {
      const defaultUsers = [
        { username: 'admin', password: 'admin123', role: 'nta' },
        { username: 'center402', password: 'center123', role: 'center', centerCode: 'IN-MH-402' }
      ];
      localStorage.setItem('omnishield_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleSubmit = (e) => {
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

    const users = JSON.parse(localStorage.getItem('omnishield_users') || '[]');

    if (isRegister) {
      // Handle registration
      const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
      if (userExists) {
        setErrorMsg('Username already registered.');
        return;
      }

      const newUser = {
        username,
        password,
        role,
        centerCode: role === 'center' ? centerCode.toUpperCase() : undefined
      };

      users.push(newUser);
      localStorage.setItem('omnishield_users', JSON.stringify(users));
      setSuccessMsg('Registration successful! You can now log in.');
      setIsRegister(false);
      setPassword('');
    } else {
      // Handle login
      const foundUser = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password &&
        u.role === role
      );

      if (!foundUser) {
        setErrorMsg('Invalid username, password, or role.');
        return;
      }

      // Check center code match if center coordinator
      if (role === 'center' && foundUser.centerCode !== centerCode.toUpperCase()) {
        setErrorMsg('Invalid Center Code for this user.');
        return;
      }

      // Login success
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
          <h2 className="text-lg font-bold text-white tracking-wider font-display">OMNISHIELD AI PORTAL</h2>
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
          <label className="text-[10px] font-mono text-text3 uppercase tracking-wider block">Access Role</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('nta')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                role === 'nta'
                  ? 'bg-blue/15 border-blue text-blue'
                  : 'bg-bg3 border-border text-text2 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              NTA Operator
            </button>
            <button
              type="button"
              onClick={() => setRole('center')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                role === 'center'
                  ? 'bg-blue/15 border-blue text-blue'
                  : 'bg-bg3 border-border text-text2 hover:text-white'
              }`}
            >
              <Server className="w-4 h-4" />
              Local Center
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
                placeholder={role === 'nta' ? 'admin' : 'center402'}
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
              <label className="text-[10px] font-mono text-text3 uppercase block">Center Code</label>
              <input
                type="text"
                value={centerCode}
                onChange={(e) => setCenterCode(e.target.value)}
                placeholder="IN-MH-402"
                className="inp"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue hover:bg-blue/90 text-white font-semibold text-xs tracking-wider rounded-lg transition-all uppercase mt-2 shadow-lg"
          >
            {isRegister ? 'Register Account' : 'Sign In Gateway'}
          </button>
        </form>

        <div className="text-[9px] font-mono text-text3 text-center">
          Default seed: admin/admin123 (NTA) | center402/center123 (Center Code: IN-MH-402)
        </div>
      </div>
    </div>
  );
}
