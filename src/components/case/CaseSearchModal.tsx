import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CaseRecord } from '../../types';
import {
  Search,
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  User,
  Layers,
  Sparkles,
  CreditCard,
  Lock,
  Boxes,
  LayoutDashboard,
  Shield
} from 'lucide-react';

interface CaseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, data?: any) => void;
}

export const CaseSearchModal: React.FC<CaseSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { user, isDoctor, isDesigner, isAdmin } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearchScope(null);

    try {
      const res = await api.searchCase(cleanId);
      setResult(res.case);
      setSearchScope(res.scope || (isAdmin ? 'ALL_CASES' : isDoctor ? 'OWN_CASES' : 'ASSIGNED_CASES'));
    } catch (err: any) {
      setError(err.message || 'Unable to locate case with this Case ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = () => {
    if (!result) return;
    onClose();
    if (isDoctor) {
      onNavigate('customer-dashboard', { selectedCaseId: result.id });
    } else if (isDesigner) {
      onNavigate('designer-dashboard', { selectedCaseId: result.id });
    } else if (isAdmin) {
      onNavigate('admin-dashboard', { selectedCaseId: result.id, targetTab: 'CASES' });
    } else {
      onNavigate('tracker', { searchId: result.id });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>Authenticated Case Search</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin && (
                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin Scope: Searching All System Cases
                  </span>
                )}
                {isDoctor && (
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    <LayoutDashboard className="w-3 h-3" /> Doctor Scope: Searching Your Cases Only
                  </span>
                )}
                {isDesigner && (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Boxes className="w-3 h-3" /> Technician Scope: Searching Assigned Cases Only
                  </span>
                )}
                {!user && (
                  <span className="text-slate-400">
                    Public Tracking Mode (Status Milestones)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-slate-950 border border-slate-700/90 rounded-2xl p-1.5 focus-within:border-cyan-500 transition shadow-inner">
              <div className="pl-3.5 pr-2 text-cyan-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                placeholder="Enter permanent Case ID (e.g. CD-2026-00001)..."
                className="w-full bg-transparent text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none py-2 px-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !searchId.trim()}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
              >
                <span>{loading ? 'Searching...' : 'Locate'}</span>
              </button>
            </div>
          </form>

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
            <span className="text-slate-500 text-[11px]">Quick Samples:</span>
            {['CD-2026-00001', 'CD-2026-00002', 'CD-2026-00003'].map(sample => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSearchId(sample);
                  api.searchCase(sample).then(res => {
                    setResult(res.case);
                    setError(null);
                  }).catch(err => {
                    setError(err.message);
                    setResult(null);
                  });
                }}
                className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700/60 transition"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Security & Access Denied Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-300 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-200">Search Access Restricted</div>
                  <p className="leading-relaxed text-slate-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-cyan-300">
                      {result.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      {result.serviceCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-semibold">
                    {result.serviceName}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    result.status === 'COMPLETED' || result.status === 'DELIVERED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : result.status === 'IN_DESIGN'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {result.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Case Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Restoration & Units</div>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {result.restorationType || 'Crown'} • {result.unitsQuantity} Unit(s)
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Teeth (FDI)</div>
                  <div className="text-cyan-400 font-mono font-bold mt-0.5">
                    {result.teethNumbers?.join(', ') || 'Arch Restoration'}
                  </div>
                </div>

                {/* Show Patient/Clinic only if permitted (Doctor/Admin) */}
                {(isAdmin || isDoctor) && (
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Patient Reference</div>
                    <div className="text-slate-200 font-semibold mt-0.5 truncate">
                      {result.patientName || result.patientRef || 'Clinical Case'}
                    </div>
                  </div>
                )}

                {/* Show Turnaround */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Turnaround</div>
                  <div className="text-slate-200 font-semibold mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{result.turnaroundType || 'Standard'} ({result.estimatedHours || 24}h)</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenCase}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  {isDoctor && <span>Open in Doctor CAD Portal</span>}
                  {isDesigner && <span>Open in CAD Workbench</span>}
                  {isAdmin && <span>Manage in Admin Console</span>}
                  {!user && <span>View Public Timeline Tracker</span>}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
