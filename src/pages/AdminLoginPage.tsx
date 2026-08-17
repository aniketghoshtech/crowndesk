import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Logo } from '../components/brand/Logo';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  Sparkles,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminLoginPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { adminLogin } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'FORGOT_PASSWORD' | 'VERIFY_RESET'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('anuragnishad895@gmail.com');
  const [password, setPassword] = useState('anurag@133');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Forgot password & OTP reset state
  const [resetEmail, setResetEmail] = useState('anuragnishad895@gmail.com');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [demoOtpHitted, setDemoOtpHitted] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await adminLogin(email, password);
      if (res.forcePasswordChange) {
        setInfoMessage('Initial temporary credentials detected. Please define your new secure password in the dialog.');
      }
      onNavigate('admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'Staff Administrative Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await api.requestForgotPasswordOtp(resetEmail);
      setInfoMessage(res.message || '6-digit OTP dispatched to administrative email address.');
      if (res.demoOtpHint) {
        setDemoOtpHitted(res.demoOtpHint);
        setOtpCode(res.demoOtpHint);
      }
      setMode('VERIFY_RESET');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Set New Password
  const handleVerifyResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters with upper, lower, and number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.verifyOtpAndResetPassword({
        email: resetEmail,
        otp: otpCode.trim(),
        newPassword,
        confirmPassword
      });
      setInfoMessage(res.message || 'Password successfully reset. You may now log in.');
      setEmail(resetEmail);
      setPassword(newPassword);
      setMode('LOGIN');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP or update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-slate-100">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" variant="horizontal" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3 h-3" />
            Route: /admin
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {mode === 'LOGIN' && 'Super Admin & Operations Portal'}
            {mode === 'FORGOT_PASSWORD' && 'Admin Password Recovery'}
            {mode === 'VERIFY_RESET' && 'Verify OTP & Set Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN' && 'Restricted access for Master Administrators & Operations Staff'}
            {mode === 'FORGOT_PASSWORD' && 'Enter your registered administrator email to receive a 6-digit OTP'}
            {mode === 'VERIFY_RESET' && 'Enter the 6-digit OTP code and choose your new secure password'}
          </p>
        </div>

        {/* Notifications & Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* VIEW 1: Standard Admin Login */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="anuragnishad895@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setError('');
                    setInfoMessage('');
                    setMode('FORGOT_PASSWORD');
                  }}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating Admin...' : 'Secure Admin Login'}</span>
              <UserCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* VIEW 2: Forgot Password - Request 6-digit OTP */}
        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  placeholder="anuragnishad895@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfoMessage('');
                  setMode('LOGIN');
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Dispatching OTP...' : 'Send 6-Digit OTP'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: Verify OTP & Set New Password */}
        {mode === 'VERIFY_RESET' && (
          <form onSubmit={handleVerifyResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                6-Digit Security OTP (Expires in 10 mins)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="895262"
                  className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-purple-300 focus:outline-none focus:border-purple-400 transition"
                />
              </div>
              {demoOtpHitted && (
                <p className="text-[10px] text-cyan-400 mt-1 text-center">
                  Verified Sandbox OTP: <span className="font-mono font-bold text-cyan-200">{demoOtpHitted}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Secure Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 8 chars"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('FORGOT_PASSWORD')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Updating Password...' : 'Save & Log In'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resend Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleRequestOtp}
                className="text-[11px] text-purple-400 hover:text-purple-300 transition disabled:text-slate-500"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Did not receive OTP? Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Quick Credentials Preset Helper for Verification */}
        <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-400 text-center font-medium">
            Master Super Admin Credentials:
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Super Admin Email:</span>
              <span className="font-mono text-purple-300 font-bold">anuragnishad895@gmail.com</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Initial Password:</span>
              <span className="font-mono text-amber-300 font-bold">anurag@133</span>
            </div>
            <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800/80">
              *First login triggers mandatory password change to enforce security.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

