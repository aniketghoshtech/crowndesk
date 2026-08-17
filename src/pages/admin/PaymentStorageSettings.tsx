import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FullPaymentSettings, StorageConfig } from '../../types';
import {
  CreditCard,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  Zap,
  Building,
  QrCode,
  DollarSign,
  FileCheck,
  Server,
  Cloud,
  ArrowRight,
  Info
} from 'lucide-react';

export const PaymentStorageSettings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'PAYMENTS' | 'STORAGE' | 'SETTLEMENT_POLICIES'>('PAYMENTS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Show/hide secrets in UI
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showStorageSecret, setShowStorageSecret] = useState(false);

  // Form State
  const [paymentSettings, setPaymentSettings] = useState<FullPaymentSettings | null>(null);
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [payRes, storRes] = await Promise.all([
        api.getAdminPaymentSettings(),
        api.getAdminStorageSettings()
      ]);
      setPaymentSettings(payRes.paymentSettings);
      setStorageConfig(storRes.storageConfig);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSavePaymentSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!paymentSettings) return;
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await api.updateAdminPaymentSettings(paymentSettings);
      setPaymentSettings(res.paymentSettings);
      setSaveSuccessMsg('Payment gateway & policy settings saved securely.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save payment settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStorageSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storageConfig) return;
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await api.updateAdminStorageSettings(storageConfig);
      setStorageConfig(res.storageConfig);
      setSaveSuccessMsg('Cloud storage settings updated successfully.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save storage settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPaymentConnection = async (provider: 'RAZORPAY' | 'STRIPE' | 'UPI_MANUAL' | 'BANK_TRANSFER') => {
    try {
      setTestingProvider(provider);
      setTestResult(null);
      const res = await api.testAdminPaymentConnection(provider);
      setTestResult({
        provider,
        success: res.success,
        message: res.message
      });
      if (res.paymentSettings) {
        setPaymentSettings(res.paymentSettings);
      }
    } catch (err: any) {
      setTestResult({
        provider,
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleTestStorageConnection = async () => {
    try {
      setTestingProvider('STORAGE');
      setTestResult(null);
      const res = await api.testAdminStorageConnection();
      setTestResult({
        provider: 'STORAGE',
        success: res.success,
        message: res.message
      });
      if (res.storageConfig) {
        setStorageConfig(res.storageConfig);
      }
    } catch (err: any) {
      setTestResult({
        provider: 'STORAGE',
        success: false,
        message: err.message || 'Storage connection test failed.'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading || !paymentSettings || !storageConfig) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex items-center space-x-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
          <span className="font-medium text-base">Loading secure configuration modules...</span>
        </div>
      </div>
    );
  }

  const { razorpay, stripe, upi, bankTransfer } = paymentSettings.providers;

  return (
    <div className="space-y-6" id="admin-payment-storage-settings">
      {/* Header & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Super Admin Only
              </span>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Zero-Card-Storage Compliant
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Payment & Cloud Storage Configuration</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure payment gateways (Razorpay, Stripe, UPI, Bank Transfer) and private medical CAD storage without editing code.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadSettings}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Reload
            </button>
          </div>
        </div>

        {/* Security Rule Alert Banner */}
        <div className="mt-5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <strong>Security Guardrail Active:</strong> CrownDesk never stores or exposes card numbers, CVVs, UPI PINs, or bank passwords. All secret keys are masked with <code className="bg-blue-100 px-1 py-0.5 rounded">••••</code> in responses and stored only server-side. STL/CAD scan files are kept in private signed buckets.
          </div>
        </div>

        {/* Success / Error Messages */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-200 mt-6 gap-6">
          <button
            onClick={() => setActiveSubTab('PAYMENTS')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              activeSubTab === 'PAYMENTS'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Gateways (4)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('STORAGE')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              activeSubTab === 'STORAGE'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Cloud & Medical CAD Storage</span>
          </button>
          <button
            onClick={() => setActiveSubTab('SETTLEMENT_POLICIES')}
            className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
              activeSubTab === 'SETTLEMENT_POLICIES'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Settlement & Billing Policies</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PAYMENT GATEWAYS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="space-y-6">
          {/* A. RAZORPAY GATEWAY */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-700 text-lg">
                  R
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Razorpay Payment Gateway</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      razorpay.mode === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {razorpay.mode} MODE
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      razorpay.connectionStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {razorpay.connectionStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Supports UPI, Indian Debit/Credit Cards, NetBanking, and Wallets in INR.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={razorpay.enabled}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        razorpay: { ...razorpay, enabled: e.target.checked }
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span className="text-sm font-semibold text-slate-700">
                  {razorpay.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Environment Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Environment Mode</label>
                <select
                  value={razorpay.mode}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      razorpay: { ...razorpay, mode: e.target.value as any }
                    }
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="TEST">Test / Sandbox Mode (rzp_test_...)</option>
                  <option value="LIVE">Production Live Mode (rzp_live_...)</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Gateway Currency</label>
                <select
                  value={razorpay.currency}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      razorpay: { ...razorpay, currency: e.target.value }
                    }
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="INR">INR (Indian Rupee - ₹)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                  <option value="EUR">EUR (Euro - €)</option>
                </select>
              </div>

              {/* Razorpay Key ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razorpay Key ID (Public API Key)
                </label>
                <input
                  type="text"
                  value={razorpay.publicKey || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      razorpay: { ...razorpay, publicKey: e.target.value }
                    }
                  })}
                  placeholder="rzp_test_..."
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Razorpay Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                    Razorpay Key Secret (Server-Only)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center"
                  >
                    {showRazorpaySecret ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {showRazorpaySecret ? 'Hide' : 'Reveal/Edit'}
                  </button>
                </div>
                <input
                  type={showRazorpaySecret ? 'text' : 'password'}
                  value={razorpay.secretKey || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      razorpay: { ...razorpay, secretKey: e.target.value }
                    }
                  })}
                  placeholder="Enter secret key to update"
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook Signature Secret
                </label>
                <input
                  type="password"
                  value={razorpay.webhookSecret || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      razorpay: { ...razorpay, webhookSecret: e.target.value }
                    }
                  })}
                  placeholder="whsec_..."
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Webhook Endpoint URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook Listener Endpoint (Copy to Razorpay Dashboard)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={razorpay.webhookUrl || 'https://crowndesk.com/api/payments/webhook/razorpay'}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(razorpay.webhookUrl || 'https://crowndesk.com/api/payments/webhook/razorpay', 'rzp_wh')}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Copy Webhook URL"
                  >
                    {copiedKey === 'rzp_wh' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Test & Status Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Last checked: {razorpay.lastConnectionCheck ? new Date(razorpay.lastConnectionCheck).toLocaleString() : 'Never'}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleTestPaymentConnection('RAZORPAY')}
                  disabled={testingProvider === 'RAZORPAY'}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
                >
                  {testingProvider === 'RAZORPAY' ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-teal-600" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  )}
                  Test Razorpay Connection
                </button>
              </div>
            </div>

            {testResult && testResult.provider === 'RAZORPAY' && (
              <div className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* B. STRIPE GATEWAY */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-lg">
                  S
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Stripe International Payments</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      stripe.mode === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {stripe.mode} MODE
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      stripe.connectionStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {stripe.connectionStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Global credit/debit cards (Visa, MasterCard, Amex, Apple Pay) in USD, EUR, GBP.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stripe.enabled}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        stripe: { ...stripe, enabled: e.target.checked }
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span className="text-sm font-semibold text-slate-700">
                  {stripe.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Environment Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Environment Mode</label>
                <select
                  value={stripe.mode}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      stripe: { ...stripe, mode: e.target.value as any }
                    }
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="TEST">Stripe Test Mode (pk_test_...)</option>
                  <option value="LIVE">Stripe Production Live (pk_live_...)</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Currency</label>
                <select
                  value={stripe.currency}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      stripe: { ...stripe, currency: e.target.value }
                    }
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="USD">USD (US Dollar - $)</option>
                  <option value="EUR">EUR (Euro - €)</option>
                  <option value="GBP">GBP (British Pound - £)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                </select>
              </div>

              {/* Stripe Publishable Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stripe Publishable Key (pk_...)
                </label>
                <input
                  type="text"
                  value={stripe.publicKey || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      stripe: { ...stripe, publicKey: e.target.value }
                    }
                  })}
                  placeholder="pk_test_..."
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Stripe Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                    Stripe Secret Key (sk_...)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center"
                  >
                    {showStripeSecret ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {showStripeSecret ? 'Hide' : 'Reveal/Edit'}
                  </button>
                </div>
                <input
                  type={showStripeSecret ? 'text' : 'password'}
                  value={stripe.secretKey || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      stripe: { ...stripe, secretKey: e.target.value }
                    }
                  })}
                  placeholder="sk_test_..."
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Stripe Webhook Secret */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stripe Webhook Signing Secret (whsec_...)
                </label>
                <input
                  type="password"
                  value={stripe.webhookSecret || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      stripe: { ...stripe, webhookSecret: e.target.value }
                    }
                  })}
                  placeholder="whsec_..."
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Webhook Endpoint */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stripe Webhook Endpoint URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={stripe.webhookUrl || 'https://crowndesk.com/api/payments/webhook/stripe'}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(stripe.webhookUrl || 'https://crowndesk.com/api/payments/webhook/stripe', 'stripe_wh')}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    {copiedKey === 'stripe_wh' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Last checked: {stripe.lastConnectionCheck ? new Date(stripe.lastConnectionCheck).toLocaleString() : 'Never'}
              </div>
              <button
                type="button"
                onClick={() => handleTestPaymentConnection('STRIPE')}
                disabled={testingProvider === 'STRIPE'}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
              >
                {testingProvider === 'STRIPE' ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-teal-600" />
                ) : (
                  <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                )}
                Test Stripe Connection
              </button>
            </div>

            {testResult && testResult.provider === 'STRIPE' && (
              <div className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* C. DIRECT UPI & QR TRANSFER */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Direct UPI & Dynamic QR Transfer</h3>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">
                      ZERO-FEE DIRECT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm, BHIM instant transfer with manual UTR & screenshot verification.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={upi.enabled}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        upi: { ...upi, enabled: e.target.checked }
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span className="text-sm font-semibold text-slate-700">
                  {upi.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merchant UPI VPA Handle (e.g. 9058322251@paytm / crowndesk@sbi)
                  </label>
                  <input
                    type="text"
                    value={upi.upiId || ''}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        upi: {
                          ...upi,
                          upiId: e.target.value,
                          upiQrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=${encodeURIComponent(e.target.value)}&pn=${encodeURIComponent(upi.upiDisplayName || 'CrownDesk Dental CAD')}&cu=INR`
                        }
                      }
                    })}
                    placeholder="9058322251@paytm"
                    className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI Business Display Name
                  </label>
                  <input
                    type="text"
                    value={upi.upiDisplayName || ''}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        upi: { ...upi, upiDisplayName: e.target.value }
                      }
                    })}
                    placeholder="CrownDesk Digital Dental Lab (Anurag Nishad)"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Instructions for UPI
                  </label>
                  <textarea
                    rows={2}
                    value={upi.upiInstructions || ''}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        upi: { ...upi, upiInstructions: e.target.value }
                      }
                    })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic QR Code Live Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-700 mb-2">Live QR Preview</span>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                  <img
                    src={upi.upiQrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=9058322251@paytm&pn=CrownDesk&cu=INR`}
                    alt="CrownDesk UPI QR Code"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-600 mt-2 font-semibold">{upi.upiId || '9058322251@paytm'}</span>
                <span className="text-[10px] text-slate-400">Generated dynamically from VPA</span>
              </div>
            </div>
          </div>

          {/* D. BANK TRANSFER (NEFT/RTGS/IMPS) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Direct Bank Account Transfer (NEFT / RTGS / IMPS)</h3>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                      COMMERCIAL ACCOUNT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Corporate dental clinic & lab bulk transfers. Account numbers are masked for public security.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankTransfer.enabled}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      providers: {
                        ...paymentSettings.providers,
                        bankTransfer: { ...bankTransfer, enabled: e.target.checked }
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span className="text-sm font-semibold text-slate-700">
                  {bankTransfer.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Legal Name</label>
                <input
                  type="text"
                  value={bankTransfer.bankAccountHolder || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      bankTransfer: { ...bankTransfer, bankAccountHolder: e.target.value }
                    }
                  })}
                  placeholder="CrownDesk Dental Technologies (Anurag Nishad)"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankTransfer.bankName || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      bankTransfer: { ...bankTransfer, bankName: e.target.value }
                    }
                  })}
                  placeholder="State Bank of India (SBI)"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                <select
                  value={bankTransfer.bankAccountType || 'Current Commercial Account'}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      bankTransfer: { ...bankTransfer, bankAccountType: e.target.value }
                    }
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Current Commercial Account">Current Commercial Account</option>
                  <option value="Savings Account">Savings Account</option>
                  <option value="Escrow Virtual Account">Escrow Virtual Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account Number (Enter to Update)
                </label>
                <input
                  type="text"
                  value={bankTransfer.bankAccountNumber || bankTransfer.bankAccountNumberMasked || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      bankTransfer: { ...bankTransfer, bankAccountNumber: e.target.value }
                    }
                  })}
                  placeholder="389201948201"
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC / Routing Code</label>
                <input
                  type="text"
                  value={bankTransfer.bankIfsc || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      bankTransfer: { ...bankTransfer, bankIfsc: e.target.value.toUpperCase() }
                    }
                  })}
                  placeholder="SBIN0001234"
                  className="w-full text-sm font-mono uppercase border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Deposit Instructions</label>
                <input
                  type="text"
                  value={bankTransfer.bankInstructions || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    providers: {
                      ...paymentSettings.providers,
                      bankTransfer: { ...bankTransfer, bankInstructions: e.target.value }
                    }
                  })}
                  placeholder="Mention Case ID in transfer remarks"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Master Save Button for Payment Gateways */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSavePaymentSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Payment Gateways</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CLOUD & MEDICAL CAD STORAGE TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'STORAGE' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">Private Medical CAD Storage Provider</h3>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 rounded">
                      SIGNED URL ENCRYPTED
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      storageConfig.connectionStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {storageConfig.connectionStatus || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Stores dental scan STLs, OBJ, PLY, DICOM (DCM), ZIPs, and photos in strict private buckets. Never generates public links.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestStorageConnection}
                disabled={testingProvider === 'STORAGE'}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center self-start sm:self-auto"
              >
                {testingProvider === 'STORAGE' ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-teal-600" />
                ) : (
                  <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                )}
                Test Bucket Permissions
              </button>
            </div>

            {testResult && testResult.provider === 'STORAGE' && (
              <div className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Storage Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Provider Architecture</label>
                <select
                  value={storageConfig.provider}
                  onChange={(e) => setStorageConfig({
                    ...storageConfig,
                    provider: e.target.value as any
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="LOCAL_SECURE_VAULT">Local Secure Server Vault (Zero External Dependency)</option>
                  <option value="AWS_S3">Amazon Web Services S3 (Private Bucket)</option>
                  <option value="CLOUDFLARE_R2">Cloudflare R2 (S3 Compatible - Zero Egress Fees)</option>
                  <option value="SUPABASE">Supabase Storage (PostgreSQL & S3 Storage)</option>
                  <option value="GCS_PRIVATE">Google Cloud Storage (GCS Private Vault)</option>
                  <option value="S3_COMPATIBLE">Custom S3-Compatible Storage (MinIO / DigitalOcean Spaces)</option>
                </select>
              </div>

              {/* Bucket / Container Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bucket / Vault Container Name</label>
                <input
                  type="text"
                  value={storageConfig.bucketName || ''}
                  onChange={(e) => setStorageConfig({
                    ...storageConfig,
                    bucketName: e.target.value
                  })}
                  placeholder="crowndesk-private-cases-vault"
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cloud Region</label>
                <input
                  type="text"
                  value={storageConfig.region || ''}
                  onChange={(e) => setStorageConfig({
                    ...storageConfig,
                    region: e.target.value
                  })}
                  placeholder="asia-south1 (Mumbai) / ap-south-1"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Endpoint (for R2 / S3 Compatible) */}
              {(storageConfig.provider === 'CLOUDFLARE_R2' || storageConfig.provider === 'S3_COMPATIBLE') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom S3 / R2 API Endpoint</label>
                  <input
                    type="text"
                    value={storageConfig.endpoint || ''}
                    onChange={(e) => setStorageConfig({
                      ...storageConfig,
                      endpoint: e.target.value
                    })}
                    placeholder="https://<accountid>.r2.cloudflarestorage.com"
                    className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Supabase Config Fields */}
              {storageConfig.provider === 'SUPABASE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Supabase Project URL</label>
                    <input
                      type="text"
                      value={storageConfig.supabaseUrl || ''}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig,
                        supabaseUrl: e.target.value
                      })}
                      placeholder="https://xyzproject.supabase.co"
                      className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Supabase Service Role Secret</label>
                    <input
                      type="password"
                      value={storageConfig.supabaseServiceKey || ''}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig,
                        supabaseServiceKey: e.target.value
                      })}
                      placeholder="eyJhbGciOi..."
                      className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* AWS / R2 / S3 Keys */}
              {(storageConfig.provider === 'AWS_S3' || storageConfig.provider === 'CLOUDFLARE_R2' || storageConfig.provider === 'S3_COMPATIBLE') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Access Key ID</label>
                    <input
                      type="text"
                      value={storageConfig.accessKey || ''}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig,
                        accessKey: e.target.value
                      })}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <Lock className="w-3 h-3 mr-1 text-slate-400" />
                        Secret Access Key
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowStorageSecret(!showStorageSecret)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        {showStorageSecret ? 'Hide' : 'Reveal/Edit'}
                      </button>
                    </div>
                    <input
                      type={showStorageSecret ? 'text' : 'password'}
                      value={storageConfig.secretKey || ''}
                      onChange={(e) => setStorageConfig({
                        ...storageConfig,
                        secretKey: e.target.value
                      })}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Max File Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Upload File Size (MB)</label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={storageConfig.maxFileSizeMB}
                  onChange={(e) => setStorageConfig({
                    ...storageConfig,
                    maxFileSizeMB: Number(e.target.value) || 250
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Data Retention */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Case File Retention Period (Days)</label>
                <input
                  type="number"
                  min={30}
                  max={3650}
                  value={storageConfig.retentionDays}
                  onChange={(e) => setStorageConfig({
                    ...storageConfig,
                    retentionDays: Number(e.target.value) || 365
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Allowed File Extensions */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Allowed Medical File Extensions</label>
              <div className="flex flex-wrap gap-2">
                {['.stl', '.ply', '.obj', '.zip', '.dcm', '.jpg', '.jpeg', '.png', '.pdf'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Master Save Button for Storage */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveStorageSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Storage Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SETTLEMENT & BILLING POLICIES TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'SETTLEMENT_POLICIES' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Lab Legal & Settlement Entity</h3>
                <p className="text-xs text-slate-500">Business registration information printed on official tax invoices & payment summaries.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Business / Lab Name</label>
                <input
                  type="text"
                  value={paymentSettings.settlement.businessName || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    settlement: { ...paymentSettings.settlement, businessName: e.target.value }
                  })}
                  placeholder="CrownDesk Dental CAD Lab & Technologies"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Settlement Email</label>
                <input
                  type="email"
                  value={paymentSettings.settlement.businessEmail || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    settlement: { ...paymentSettings.settlement, businessEmail: e.target.value }
                  })}
                  placeholder="anuragnishad895@gmail.com"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support / Contact Phone</label>
                <input
                  type="text"
                  value={paymentSettings.settlement.businessPhone || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    settlement: { ...paymentSettings.settlement, businessPhone: e.target.value }
                  })}
                  placeholder="+91 9058322251"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Provider & Cycle</label>
                <input
                  type="text"
                  value={paymentSettings.settlement.settlementProvider || ''}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    settlement: { ...paymentSettings.settlement, settlementProvider: e.target.value }
                  })}
                  placeholder="Razorpay Auto-Settlement (T+1 to Primary Account)"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Policies & Gate Lock Timing */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Enforcement Timing & Taxes</h3>
                <p className="text-xs text-slate-500">Determine when doctors/clinics are required to pay before retrieving designs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CAD Download Paywall Enforcement
                </label>
                <select
                  value={paymentSettings.policy.paymentTiming}
                  onChange={(e) => setPaymentSettings({
                    ...paymentSettings,
                    policy: { ...paymentSettings.policy, paymentTiming: e.target.value as any }
                  })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="BEFORE_FINAL_DOWNLOAD">Before Final STL Download (Recommended - Zero Unpaid Leakage)</option>
                  <option value="BEFORE_DESIGN_START">Upfront Payment at Case Submission</option>
                  <option value="POST_DELIVERY_CREDIT">Post-Delivery Monthly Credit (Labs with Trust Agreements)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  When "Before Final STL Download" is selected, doctors can view 3D watermarked previews, but cannot download production STLs until payment is confirmed.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Tax & Compliance Configuration
                    </label>
                    <p className="text-[11px] text-slate-500">Configure global tax rate, custom tax designation, and billing enablement.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.policy.enableGST ?? paymentSettings.policy.taxEnabled ?? true}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        policy: {
                          ...paymentSettings.policy,
                          enableGST: e.target.checked,
                          taxEnabled: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax Designation / Name
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.policy.taxName || 'GST (Goods & Services Tax)'}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        policy: {
                          ...paymentSettings.policy,
                          taxName: e.target.value
                        }
                      })}
                      placeholder="e.g. GST (Goods & Services Tax)"
                      className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax Rate Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={paymentSettings.policy.gstRatePercent ?? paymentSettings.policy.taxPercent ?? 18}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPaymentSettings({
                            ...paymentSettings,
                            policy: {
                              ...paymentSettings.policy,
                              gstRatePercent: val,
                              taxPercent: val
                            }
                          });
                        }}
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Live Preview Calculation */}
                <div className="mt-3 bg-white border border-slate-200 rounded p-2.5 flex items-center justify-between text-xs">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Status: </span>
                    {(paymentSettings.policy.enableGST ?? paymentSettings.policy.taxEnabled ?? true) ? (
                      <span className="inline-flex items-center text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {paymentSettings.policy.taxName || 'GST'} @ {paymentSettings.policy.gstRatePercent ?? paymentSettings.policy.taxPercent ?? 18}% Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Tax Disabled (0% applied)
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    Sample ₹1,000 subtotal → <span className="text-slate-900 font-bold">
                      ₹{((paymentSettings.policy.enableGST ?? paymentSettings.policy.taxEnabled ?? true) 
                        ? 1000 + (1000 * ((paymentSettings.policy.gstRatePercent ?? paymentSettings.policy.taxPercent ?? 18) / 100)) 
                        : 1000).toLocaleString()}
                    </span> total
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSavePaymentSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Settlement & Policies</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
