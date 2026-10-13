import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const { login }    = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from?.pathname || null;

  const [form,    setForm]    = useState({ username: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) { addToast('Fill in all fields', 'warning'); return; }
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      addToast(`Welcome back, ${user.username}!`, 'success');
      // Route based on role
      if (user.role === 'Admin')   navigate(from || '/admin/dashboard', { replace: true });
      else if (user.role === 'Driver') navigate(from || '/driver',     { replace: true });
      else                         navigate(from || '/student',        { replace: true });
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col bg-indigo-700 relative overflow-hidden flex-shrink-0">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>
        </div>
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">UniTrack</span>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">
              University Bus<br/>Tracking System
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed mb-8 max-w-sm">
              Manage your entire university transport fleet — buses, drivers, routes and real-time tracking — from one professional dashboard.
            </p>
            <div className="space-y-3">
              {['Fleet management & bus tracking','Driver & student management','Route builder with stop sequencing','Assignment & scheduling system'].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-indigo-100">
                  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <p className="text-indigo-300 text-xs">© 2025 UniTrack. University Transport Management.</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">UniTrack</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e=>set('username',e.target.value)} autoComplete="username"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter your username" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e=>set('password',e.target.value)} autoComplete="current-password"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-11"
                  placeholder="Enter your password" />
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-6">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Signing in…</>
                : <><LogIn className="w-4 h-4"/> Sign In</>
              }
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            New to UniTrack?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
