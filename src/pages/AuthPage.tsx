import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/brand/Logo';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { Mail, Lock, User, Phone, Building, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        onNavigate('customer-dashboard');
      } else {
        await register({
          email,
          password,
          name,
          clinicName,
          phone
        });
        onNavigate('customer-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-slate-100">
        <div className="text-center mb-6">
          <div className="inline-block cursor-pointer" onClick={() => onNavigate('landing')}>
            <Logo size="md" theme="dark" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-4">
            {isLogin ? 'Doctor & Lab CAD Portal' : 'Create Doctor / Lab Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin
              ? 'Access your active 3D CAD cases, milling STLs, and clinical chat'
              : 'Sign up to receive 2 FREE Dental CAD design units on your first order'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              isLogin ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              !isLogin ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register (Doctor / Lab)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor / Contact Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Dr. Rajesh Sharma"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Clinic or Dental Lab Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={clinicName}
                    onChange={e => setClinicName(e.target.value)}
                    required
                    placeholder="Sharma Dental Clinic & Implant Centre"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile / WhatsApp Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="doctor@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Processing...' : isLogin ? 'Access CAD Dashboard' : 'Create Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Logins for Evaluators */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <div className="text-[11px] text-slate-400 mb-2">Quick Test Login (One-Click):</div>
          <button
            type="button"
            onClick={() => {
              setEmail('doctor.demo@crowndesk.in');
              setPassword('CrownPass123!');
            }}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-cyan-300 font-mono transition"
          >
            Fill Demo Doctor Credentials
          </button>
        </div>
      </div>

      {forgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setForgotPasswordOpen(false)} />
      )}
    </div>
  );
};
