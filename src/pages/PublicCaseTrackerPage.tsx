import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CaseRecord } from '../types';
import { CaseTimelineView } from '../components/case/CaseTimelineView';
import { Dental3DViewer } from '../components/3d/Dental3DViewer';
import { Search, ShieldAlert, CheckCircle2, Clock, FileCode, User, Lock, ArrowRight, Shield, Boxes, LayoutDashboard, Sparkles, Bot } from 'lucide-react';

interface PublicCaseTrackerPageProps {
  initialSearchId?: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenAiChat?: (caseContext?: any) => void;
}

export const PublicCaseTrackerPage: React.FC<PublicCaseTrackerPageProps> = ({
  initialSearchId,
  onNavigate,
  onOpenAiChat
}) => {
  const { user, isDoctor, isDesigner, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchId || '');
  const [loading, setLoading] = useState(false);
  const [searchedCase, setSearchedCase] = useState<CaseRecord | null>(null);
  const [isAuthorizedFullView, setIsAuthorizedFullView] = useState(false);
  const [error, setError] = useState('');

  const executeSearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setError('');
    setSearchedCase(null);

    try {
      const res = await api.searchCase(term.trim());
      setSearchedCase(res.case);
      setIsAuthorizedFullView(!!res.isAuthorizedFullView);
    } catch (err: any) {
      setError(err.message || 'Case record not found. Please verify the Case ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearchId) {
      setSearchTerm(initialSearchId);
      executeSearch(initialSearchId);
    }
  }, [initialSearchId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchTerm);
  };

  const handleNavigateToPortal = () => {
    if (!searchedCase) return;
    if (isDoctor) {
      onNavigate('customer-dashboard', { selectedCaseId: searchedCase.id });
    } else if (isDesigner) {
      onNavigate('designer-dashboard', { selectedCaseId: searchedCase.id });
    } else if (isAdmin) {
      onNavigate('admin-dashboard', { selectedCaseId: searchedCase.id });
    } else {
      onNavigate('auth');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header & Search Bar */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
          Track Your Dental CAD Case
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your CrownDesk Case ID (e.g. <span className="text-cyan-400 font-mono">CD-2026-00001</span>) to inspect live clinical design status, designer milestones, and estimated delivery.
        </p>

        <form onSubmit={handleFormSubmit} className="pt-3">
          <div className="flex gap-2 bg-slate-900 border border-slate-700 p-1.5 rounded-2xl shadow-2xl focus-within:border-cyan-500 transition">
            <div className="flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Enter Case ID or Patient Reference..."
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <span>{loading ? 'Locating...' : 'Search'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto bg-rose-500/15 border border-rose-500/30 p-4 rounded-2xl text-xs text-rose-300 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Case Details View */}
      {searchedCase && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in">
          {/* Top Bar Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                  {searchedCase.id}
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 font-mono text-xs px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                  {searchedCase.serviceCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Patient: <span className="text-slate-200 font-semibold">{searchedCase.patientName}</span> ({searchedCase.patientGender || 'Clinical Record'})
                {searchedCase.clinicName && ` • Clinic: ${searchedCase.clinicName}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onOpenAiChat && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAiChat({
                      caseId: searchedCase.id,
                      serviceCode: searchedCase.serviceCode,
                      status: searchedCase.status,
                      notes: searchedCase.clinicalNotes,
                      restorationType: searchedCase.serviceCode
                    })
                  }
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask Gemini About Case</span>
                </button>
              )}

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Status</div>
                <div className="text-sm font-bold text-cyan-400">{searchedCase.status.replace('_', ' ')}</div>
              </div>

              <div className="text-right pl-4 border-l border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Payment</div>
                <div className={`text-sm font-bold ${searchedCase.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {searchedCase.paymentStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>CAD Production Workflow Timeline</span>
            </h3>
            <CaseTimelineView
              currentStatus={searchedCase.status}
              history={searchedCase.timelineHistory || []}
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Clinical & Tooth Details */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800">
                Clinical Prescription
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400">Service:</span>
                <span className="font-semibold text-slate-200">{searchedCase.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teeth (FDI):</span>
                <span className="font-mono font-bold text-cyan-400">
                  {searchedCase.teethNumbers?.join(', ') || 'General Arch'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Restoration Type:</span>
                <span className="text-slate-200">{searchedCase.restorationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Material / Shade:</span>
                <span className="text-slate-200">{searchedCase.material} ({searchedCase.shade})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Turnaround:</span>
                <span className="text-slate-200">{searchedCase.turnaroundType} ({searchedCase.estimatedHours} hrs)</span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800">
                Billing & STL Authorization
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity / Units:</span>
                <span className="font-semibold text-slate-200">{searchedCase.unitsQuantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Bill Amount:</span>
                <span className="font-bold text-cyan-400 text-sm">₹{searchedCase.finalTotalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Milling STL Download:</span>
                <span className={`font-bold ${searchedCase.isFinalUnlocked || searchedCase.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {searchedCase.isFinalUnlocked || searchedCase.paymentStatus === 'PAID' ? 'Unlocked for CAM' : 'Requires Payment'}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNavigateToPortal}
                  className="w-full py-2 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  {isDoctor && <span>Open in Doctor Portal</span>}
                  {isDesigner && <span>Open in CAD Workbench</span>}
                  {isAdmin && <span>Manage in Admin Console</span>}
                  {!user && <span>Login for Full Prescription & STL</span>}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3D Preview Widget */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <Dental3DViewer
                caseId={searchedCase.id}
                serviceType={searchedCase.serviceName}
                isUnlocked={searchedCase.isFinalUnlocked}
                className="h-44"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
