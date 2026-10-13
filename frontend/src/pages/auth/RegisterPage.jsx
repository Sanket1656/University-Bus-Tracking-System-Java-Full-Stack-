import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Eye, EyeOff, UserPlus } from 'lucide-react';
import authApi from '../../api/authApi';
import { useToast } from '../../context/ToastContext';

const RegisterPage = () => {
  const { addToast } = useToast();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ username: '', password: '', confirmPassword: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) { addToast('Fill in all fields', 'warning'); return; }
    if (form.password !== form.confirmPassword)  { addToast('Passwords do not match', 'error');   return; }
    if (form.password.length < 6)                { addToast('Password must be at least 6 characters', 'warning'); return; }

    setLoading(true);
    try {
      await authApi.register({ username: form.username.trim(), password: form.password });
      addToast('Account created! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">UniTrack</span>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-bold text-gray-900">Create student account</h2>
          <p className="text-sm text-gray-500 mt-1">Join the university transport system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Username</label>
            <input type="text" value={form.username} onChange={e=>set('username',e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Choose a username" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-11"
                placeholder="Min 6 characters" />
              <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Repeat password" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Creating…</>
              : <><UserPlus className="w-4 h-4"/> Create Account</>
            }
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
