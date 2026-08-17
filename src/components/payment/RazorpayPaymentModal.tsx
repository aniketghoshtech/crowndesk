import React, { useState } from 'react';
import { CaseRecord } from '../../types';
import { X, CheckCircle2, ShieldCheck, CreditCard, Smartphone, Building, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface RazorpayPaymentModalProps {
  caseRecord: CaseRecord;
  onClose: () => void;
  onPaymentSuccess: (updatedCase: CaseRecord) => void;
}

export const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  caseRecord,
  onClose,
  onPaymentSuccess
}) => {
  const [gateway, setGateway] = useState<'RAZORPAY' | 'STRIPE'>('RAZORPAY');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayNow = async () => {
    try {
      setProcessing(true);
      // 1. Create order on backend
      const orderData = await api.createPaymentOrder(caseRecord.id, gateway);

      // Simulate instantaneous Razorpay / Stripe checkout workflow
      setTimeout(async () => {
        try {
          const verifyRes = await api.verifyPayment({
            caseId: caseRecord.id,
            gateway,
            transactionId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            paymentMethod: `${gateway} - ${paymentMethod}`
          });
          setProcessing(false);
          setSuccess(true);
          setTimeout(() => {
            onPaymentSuccess(verifyRes.case);
          }, 1400);
        } catch (err: any) {
          setProcessing(false);
          alert(err.message || 'Payment verification failed');
        }
      }, 1200);
    } catch (err: any) {
      setProcessing(false);
      alert(err.message || 'Payment initiation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Payment Successful!</h3>
            <p className="text-sm text-slate-300 mt-2">
              Official Tax Invoice generated & Final 3D STL files are now unlocked for milling.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">CrownDesk CAD Checkout</h3>
                <p className="text-xs text-slate-400">Case ID: {caseRecord.id} • {caseRecord.serviceName}</p>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Unit Price ({caseRecord.unitsQuantity} units @ ₹{caseRecord.unitPrice})</span>
                <span>₹{caseRecord.subtotal}</span>
              </div>

              {Number(caseRecord.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Standard Discount</span>
                  <span>- ₹{caseRecord.discountAmount}</span>
                </div>
              )}

              {Number(caseRecord.offerDiscountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Promo Offer ({caseRecord.offerCodeApplied})</span>
                  <span>- ₹{caseRecord.offerDiscountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Tax & Compliance</span>
                <span>₹{caseRecord.taxAmount}</span>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-bold text-cyan-400">
                <span>Total Amount Payable</span>
                <span>₹{caseRecord.finalTotalAmount}</span>
              </div>
            </div>

            {/* Payment Gateway Options */}
            <div className="space-y-3 mb-6">
              <div className="text-xs font-semibold text-slate-300">Select Gateway:</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGateway('RAZORPAY')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                    gateway === 'RAZORPAY'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold ring-1 ring-cyan-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold">Razorpay (India)</span>
                  <span className="text-[10px] text-slate-400">UPI, Cards, NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGateway('STRIPE')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                    gateway === 'STRIPE'
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold ring-1 ring-blue-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold">Stripe / Global</span>
                  <span className="text-[10px] text-slate-400">International Visa/Mastercard</span>
                </button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-Bit Encrypted Healthcare PCI-DSS Compliant Gateway. Instant STL Unlock.</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayNow}
              disabled={processing}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {processing ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Pay ₹{caseRecord.finalTotalAmount} & Unlock STL</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
