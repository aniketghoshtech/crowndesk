import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/brand/Logo';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building,
  ArrowRight,
  UserCheck,
  Boxes,
  AlertCircle
} from 'lucide-react';

interface AuthPageProps {
  onNavigate: (view: string, data?: any) => void;
  initialMode?: 'login' | 'register';
  defaultRole?: 'DOCTOR' | 'DESIGNER';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onNavigate,
  initialMode = 'login',
  defaultRole = 'DOCTOR'
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'DESIGNER'>(defaultRole);
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (defaultRole === 'DESIGNER') {
      setActiveTab('DESIGNER');
      setIsLogin(true);
    }
  }, [defaultRole]);

  // ডাইনামিক রোল ভিত্তিক ড্যাশবোর্ড রিডাইরেকশন
  const handleRedirectByRole = (userObj: any) => {
    const role = userObj?.role || userObj?.user?.role;
    if (role === 'DESIGNER_EMPLOYEE') {
      onNavigate('designer-dashboard');
    } else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('customer-dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const loggedUser = await login(email.trim(), password);
        handleRedirectByRole(loggedUser);
      } else {
        const newUser = await register({
          email: email.trim(),
          password,
          name,
          clinicName,
          phone
        });
        handleRedirectByRole(newUser);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const googleUser = await loginWithGoogle();
      handleRedirectByRole(googleUser);
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDesignerPortal = activeTab === 'DESIGNER';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 relative bg-slate-950">
      {/* Background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] rounded-full pointer-events-none ${isDesignerPortal ? 'bg-amber-600/10' : 'bg-cyan-600/10'}`} />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-slate-100">
        <div className="text-center mb-6">
          <div className="inline-block cursor-pointer" onClick={() => onNavigate('landing')}>
            <Logo size="md" theme="dark" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-4">
            {isDesignerPortal
              ? 'CAD Designer & Staff Workbench'
              : isLogin
              ? 'Doctor & Dental Lab Portal'
              : 'Create Doctor / Lab Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isDesignerPortal
              ? 'Access assigned CAD design cases, Exocad/3Shape files & quality control'
              : isLogin
              ? 'Access active 3D CAD cases, milling STLs, and clinical chat'
              : 'Sign up to receive 2 FREE Dental CAD units on your first order'}
          </p>
        </div>

        {/* 1. Portal Switcher: Doctor vs Designer */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('DOCTOR');
              setError('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              !isDesignerPortal
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Doctor / Clinic</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('DESIGNER');
              setIsLogin(true); // Designers only sign in
              setError('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              isDesignerPortal
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>CAD Designer</span>
          </button>
        </div>

        {/* 2. Doctor Mode: Sign In vs Register */}
        {!isDesignerPortal && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                isLogin ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                !isLogin ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register (New Clinic)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-in for Doctors */}
        {!isDesignerPortal && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-3 mb-4 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                or with email
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {!isLogin && !isDesignerPortal && (
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isDesignerPortal ? 'Designer Work Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={isDesignerPortal ? 'designer.cad@crowndesk.com' : 'doctor@example.com'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              {isLogin && !isDesignerPortal && (
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className={`w-full py-3 font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 mt-3 text-white ${
              isDesignerPortal
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25'
            }`}
          >
            <span>
              {loading
                ? 'Authenticating...'
                : isDesignerPortal
                ? 'Access CAD Workbench'
                : isLogin
                ? 'Access CAD Dashboard'
                : 'Create Free Account'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {forgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setForgotPasswordOpen(false)} />
      )}
    </div>
  );
};