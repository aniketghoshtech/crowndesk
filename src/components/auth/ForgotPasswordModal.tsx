import React, { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.requestForgotPasswordOtp(email);
      if (res.simulatedOtp) {
        setSimulatedOtpNotice(res.simulatedOtp);
      }
      setStep('VERIFY');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.verifyOtpAndResetPassword({ email, otp, newPassword, confirmPassword });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
          <KeyRound className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-bold text-slate-100">Reset Account Password</h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          {step === 'REQUEST'
            ? 'Enter your registered doctor or lab email address to receive an instant verification OTP.'
            : 'Enter the 6-digit OTP code sent to your email along with your new password.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {simulatedOtpNotice && step === 'VERIFY' && (
          <div className="mb-4 p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 flex items-center justify-between">
            <span>Demo OTP Code:</span>
            <span className="font-mono font-black text-sm bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400">
              {simulatedOtpNotice}
            </span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center text-emerald-400 font-bold flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10" />
            <span>Password successfully reset! You can now log in.</span>
          </div>
        ) : step === 'REQUEST' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="doctor@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending OTP...' : 'Send Reset Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                placeholder="123456"
                className="w-full font-mono text-center tracking-widest text-base font-bold bg-slate-950 border border-slate-700 rounded-xl py-2 text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Min 6 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Updating Password...' : 'Verify & Set Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
