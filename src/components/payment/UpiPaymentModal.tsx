import React, { useState, useEffect } from 'react';
import { CaseRecord } from '../../types';
import {
  X,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
  Smartphone,
  FileCheck
} from 'lucide-react';
import { api } from '../../services/api';

interface UpiPaymentModalProps {
  caseRecord: CaseRecord;
  onClose: () => void;
  onPaymentSuccess: (updatedCase: CaseRecord) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  caseRecord,
  onClose,
  onPaymentSuccess
}) => {
  // Updated UPI ID to Kotak Mahindra Bank
  const [upiId, setUpiId] = useState('9058322251@kotakbank');
  const [businessName, setBusinessName] = useState('CrownDesk Dental Technologies');
  const [upiDisplayName, setUpiDisplayName] = useState('CrownDesk Digital Dental Lab (Anurag Nishad)');
  const [qrUrl, setQrUrl] = useState('');
  const [instructions, setInstructions] = useState('');

  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ message: string; isInstant: boolean }>({
    message: '',
    isInstant: false
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Decimal formatting helper
  const formatINR = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const finalAmount = formatINR(caseRecord.finalTotalAmount);

  // Fetch Public UPI Config
  useEffect(() => {
    async function loadUpiConfig() {
      try {
        const res = await api.getPublicPaymentConfig();
        if (res && res.providers && res.providers.upi) {
          const u = res.providers.upi;
          if (u.upiId) setUpiId(u.upiId);
          if (u.businessName) setBusinessName(u.businessName);
          if (u.upiDisplayName) setUpiDisplayName(u.upiDisplayName);
          if (u.upiInstructions) setInstructions(u.upiInstructions);

          const upiString = `upi://pay?pa=${encodeURIComponent(u.upiId || '9058322251@kotakbank')}&pn=${encodeURIComponent(u.businessName || 'CrownDesk')}&am=${finalAmount}&cu=INR&tn=Case-${caseRecord.id}`;
          const qr = u.upiQrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiString)}`;
          setQrUrl(qr);
        } else {
          const upiString = `upi://pay?pa=9058322251@kotakbank&pn=CrownDesk%20Dental&am=${finalAmount}&cu=INR&tn=Case-${caseRecord.id}`;
          setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiString)}`);
        }
      } catch (err) {
        const upiString = `upi://pay?pa=9058322251@kotakbank&pn=CrownDesk%20Dental&am=${finalAmount}&cu=INR&tn=Case-${caseRecord.id}`;
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiString)}`);
      }
    }
    loadUpiConfig();
  }, [caseRecord, finalAmount]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseRecord.id);
      formData.append('category', 'PAYMENT_PROOF');

      const res = await api.uploadFile(formData);
      if (res && res.file && res.file.url) {
        setScreenshotUrl(res.file.url);
      } else if (res && res.url) {
        setScreenshotUrl(res.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setScreenshotUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn('Direct upload fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScreenshotUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!utr.trim()) {
      setErrorMessage('Please enter the 12-digit UPI Reference Number / Transaction ID (UTR).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitUpiPayment({
        caseId: caseRecord.id,
        upiTransactionId: utr.trim(),
        paymentScreenshot: screenshotUrl,
        notes: notes.trim()
      });

      const isInstant = res.case?.paymentStatus === 'PAID';
      setSuccessData({
        message: res.message || 'Payment submitted successfully.',
        isInstant
      });
      setSuccess(true);

      setTimeout(() => {
        onPaymentSuccess(res.case || { ...caseRecord, paymentStatus: isInstant ? 'PAID' : 'UNDER_REVIEW' });
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit UPI payment proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const directUpiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${finalAmount}&cu=INR&tn=Case-${caseRecord.id}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 my-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              {successData.isInstant ? 'Payment Verified Instantly!' : 'UPI Payment Submitted!'}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              {successData.message}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs text-cyan-400 font-mono">
              <span>UTR: {utr}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">CrownDesk Direct UPI Payment</h3>
                <p className="text-xs text-slate-400">
                  Case ID: <span className="font-mono text-cyan-300">{caseRecord.id}</span> • {caseRecord.serviceName}
                </p>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Unit Price ({caseRecord.unitsQuantity} units @ ₹{formatINR(caseRecord.unitPrice)})</span>
                <span>₹{formatINR(caseRecord.subtotal)}</span>
              </div>

              {Number(caseRecord.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Volume Discount</span>
                  <span>- ₹{formatINR(caseRecord.discountAmount)}</span>
                </div>
              )}

              {Number(caseRecord.offerDiscountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Promotional Offer ({caseRecord.offerCodeApplied})</span>
                  <span>- ₹{formatINR(caseRecord.offerDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>GST (18% Dental CAD Services)</span>
                <span>₹{formatINR(caseRecord.taxAmount)}</span>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-cyan-400">
                <span>Total Amount Payable</span>
                <span>₹{finalAmount}</span>
              </div>
            </div>

            {/* UPI QR & Payee Info */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 items-center">
              {/* QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-inner">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="CrownDesk UPI QR Code"
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-wider">
                  Scan with any UPI App
                </span>
              </div>

              {/* UPI ID & Details */}
              <div className="sm:col-span-7 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Official Merchant UPI ID
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/40 px-3 py-1.5 rounded-lg">
                    <span className="font-mono font-bold text-cyan-300 text-sm flex-1 truncate">
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded text-[11px] font-medium flex items-center gap-1 transition shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <p><span className="text-slate-400">Payee:</span> <span className="font-semibold">{businessName}</span></p>
                  <p><span className="text-slate-400">Account Name:</span> {upiDisplayName}</p>
                </div>

                {/* Direct Pay link for mobile devices */}
                <a
                  href={directUpiLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open directly in UPI App (GPay / PhonePe / Paytm)</span>
                </a>
              </div>
            </div>

            {/* Reconciliation Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  12-Digit UPI Reference Number (UTR / Txn ID) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  placeholder="e.g. 423589123456 or PTMPAY4819..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Found in your UPI app payment receipt after successful transfer.
                </p>
              </div>

              {/* Upload Screenshot Proof */}
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Upload Payment Screenshot <span className="text-slate-400 font-normal">(Optional for faster audit)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3.5 py-2 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-300 flex items-center gap-2 transition">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>{uploadingFile ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {screenshotUrl ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                      <FileCheck className="w-4 h-4" />
                      Screenshot attached
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">JPG, PNG, or PDF receipt</span>
                  )}
                </div>
              </div>

              {/* Security Guard Notice */}
              <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Security Guarantee:</strong> CrownDesk will never ask for your UPI PIN, OTP, or passwords. Enter only the reference UTR number for reconciliation.
                </span>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Pay Later / Back</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting || !utr.trim()}
                  className="w-2/3 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Proof...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm Payment (₹{finalAmount})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
