import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CaseRecord, CaseFile, InvoiceRecord } from '../../types';
import { CaseTimelineView } from '../../components/case/CaseTimelineView';
import { Dental3DViewer } from '../../components/3d/Dental3DViewer';
import { CaseFilesList } from '../../components/case/CaseFilesList';
import { CaseChatter } from '../../components/case/CaseChatter';
import { UpiPaymentModal } from '../../components/payment/UpiPaymentModal';
import { InvoiceModal } from '../../components/payment/InvoiceModal';
import {
  PlusCircle,
  Search,
  Filter,
  CreditCard,
  QrCode,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  Sparkles,
  Layers
} from 'lucide-react';

interface CustomerDashboardProps {
  initialCaseId?: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenAiChat?: (caseContext?: any) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  initialCaseId,
  onNavigate,
  onOpenAiChat
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceRecord | null>(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getCases();
      setCases(res.cases || []);

      if (res.cases && res.cases.length > 0) {
        if (initialCaseId) {
          const matched = res.cases.find(c => c.id === initialCaseId);
          setSelectedCase(matched || res.cases[0]);
        } else if (!selectedCase) {
          setSelectedCase(res.cases[0]);
        } else {
          // Keep current selection refreshed
          const current = res.cases.find(c => c.id === selectedCase.id);
          if (current) setSelectedCase(current);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleRefreshSingleCase = async () => {
    if (!selectedCase) return;
    try {
      const res = await api.getCaseById(selectedCase.id);
      setSelectedCase(res.case);
      // Also update in list
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenInvoice = async (caseId: string) => {
    try {
      const res = await api.getInvoices(caseId);
      if (res.invoices && res.invoices.length > 0) {
        setCurrentInvoice(res.invoices[0]);
        setInvoiceModalOpen(true);
      } else {
        toast.info('Invoice is generated upon case payment completion.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not fetch invoice');
    }
  };

  const handleApproveCase = async () => {
    if (!selectedCase) return;
    try {
      setActionLoading(true);
      const res = await api.approveCase(selectedCase.id, 'Doctor approved CAD anatomy design.');
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
      toast.success('Design successfully approved! Status moved to COMPLETED.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !revisionReason.trim()) return;
    try {
      setActionLoading(true);
      const res = await api.requestRevision(selectedCase.id, revisionReason.trim());
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
      setRevisionModalOpen(false);
      setRevisionReason('');
      toast.success('Revision request sent to the CAD technician. Status moved to REVISION.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedCase) return;
    try {
      setActionLoading(true);
      const res = await api.deliverCase(selectedCase.id, 'Client acknowledged final file download.');
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
      toast.success('Case marked as DELIVERED.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.patientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.serviceName.toLowerCase().includes(searchFilter.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'ACTIVE') return matchesSearch && c.status !== 'COMPLETED';
    if (statusFilter === 'DELIVERED') return matchesSearch && c.status === 'COMPLETED';
    if (statusFilter === 'UNPAID') return matchesSearch && c.paymentStatus !== 'PAID';
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
            <span>Doctor & Dental Lab Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <span className="text-cyan-300 font-semibold">{user?.name}</span> ({user?.clinicName || 'Clinic'})
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-case')}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New STL Case</span>
        </button>
      </div>

      {/* Main Grid: Left Cases List, Right Selected Case Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cases List */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search & Filter bar */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2.5 shadow-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search patient, ID, service..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
              {['ALL', 'ACTIVE', 'DELIVERED', 'UNPAID'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-1 rounded-lg transition ${
                    statusFilter === tab ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Cases Scrollable Column */}
          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-500">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 p-4">
                <p>No dental cases found matching filter.</p>
                <button
                  onClick={() => onNavigate('new-case')}
                  className="mt-3 text-cyan-400 font-bold hover:underline"
                >
                  Submit your first case →
                </button>
              </div>
            ) : (
              filteredCases.map(c => {
                const isSelected = selectedCase?.id === c.id;
                const isPaid = c.paymentStatus === 'PAID';

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-cyan-400">{c.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          c.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : c.status === 'IN_DESIGN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="font-bold text-slate-100 text-sm">{c.patientName}</div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>{c.serviceName}</span>
                      <span className="font-semibold text-slate-300">
                        {c.teethNumbers?.length || c.unitsQuantity} Units
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPaid ? '₹' + c.finalTotalAmount + ' (PAID)' : '₹' + c.finalTotalAmount + ' (UNPAID)'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Case Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCase ? (
            <>
              {/* Top Case Action Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-black text-slate-100">
                        {selectedCase.id}
                      </span>
                      <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                        {selectedCase.serviceCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Patient: <span className="text-slate-200 font-semibold">{selectedCase.patientName}</span> • FDI Teeth: <span className="font-mono text-cyan-400 font-bold">{selectedCase.teethNumbers?.join(', ') || 'Arch'}</span>
                    </div>
                  </div>

                  {/* Payment & Invoice Buttons */}
                  <div className="flex items-center gap-2">
                    {onOpenAiChat && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenAiChat({
                            caseId: selectedCase.id,
                            serviceCode: selectedCase.serviceCode,
                            serviceName: selectedCase.serviceName,
                            status: selectedCase.status,
                            teeth: selectedCase.teethNumbers,
                            notes: selectedCase.clinicalNotes,
                            patient: selectedCase.patientName
                          })
                        }
                        className="px-3.5 py-2 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        title="Analyze case margins, materials, and clinical parameters with crowndesk bot"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>crowndesk bot</span>
                      </button>
                    )}

                    {selectedCase.paymentStatus !== 'PAID' ? (
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition transform active:scale-95 animate-pulse"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Pay ₹{selectedCase.finalTotalAmount} via UPI & Unlock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenInvoice(selectedCase.id)}
                        className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Tax Invoice</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Action Bar for APPROVAL / REVISION / COMPLETED / DELIVERED */}
                {selectedCase.status === 'APPROVAL' && (
                  <div className="bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-cyan-500/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <h4 className="text-sm font-bold text-cyan-200">Doctor 3D CAD Review & Approval Stage</h4>
                      </div>
                      <p className="text-xs text-slate-300 max-w-xl">
                        The CAD technician has completed the design. Inspect the 3D model below. Approve the design to finalize production or request modifications.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRevisionModalOpen(true)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Request Revision</span>
                      </button>

                      <button
                        onClick={handleApproveCase}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoading ? 'Processing...' : 'Approve CAD Design'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedCase.status === 'REVISION' && (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Case is currently with the CAD team for requested design adjustments.</span>
                    </div>
                    <span className="font-mono text-[11px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      REVISION IN PROGRESS
                    </span>
                  </div>
                )}

                {selectedCase.status === 'COMPLETED' && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>CAD restoration design approved! Final milling CAM files are unlocked.</span>
                    </div>
                    <button
                      onClick={handleConfirmDelivery}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Confirm Delivery Receipt</span>
                    </button>
                  </div>
                )}

                {/* Workflow Progress Timeline */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Live Design & Quality Verification Tracker</span>
                  </h3>
                  <CaseTimelineView
                    currentStatus={selectedCase.status}
                    timeline={selectedCase.timeline || selectedCase.timelineHistory || []}
                  />
                </div>

                {/* Specifications Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Material</span>
                    <span className="font-semibold text-slate-200">{selectedCase.material}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Shade</span>
                    <span className="font-mono font-bold text-cyan-400">{selectedCase.shade}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Occlusion Gap</span>
                    <span className="font-semibold text-slate-200">{selectedCase.occlusalClearance}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Designer</span>
                    <span className="font-semibold text-slate-200">
                      {selectedCase.assignedDesignerName || 'Auto-Routing...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3D WebGL Viewer Component */}
              <div className="relative">
                <Dental3DViewer
                  caseId={selectedCase.id}
                  serviceType={selectedCase.serviceName}
                  isUnlocked={selectedCase.isFinalUnlocked || selectedCase.paymentStatus === 'PAID'}
                  className="h-[380px]"
                />
              </div>

              {/* Files Vault & Chatter */}
              <div className="grid grid-cols-1 gap-6">
                {/* Files Component */}
                <CaseFilesList
                  caseId={selectedCase.id}
                  files={selectedCase.files || []}
                  isFinalUnlocked={selectedCase.isFinalUnlocked}
                  paymentStatus={selectedCase.paymentStatus}
                  currentUser={user}
                  onFileUploaded={handleRefreshSingleCase}
                  onUnlockPaymentClick={() => setPaymentModalOpen(true)}
                />

                {/* Chatter Discussion Thread */}
                <CaseChatter
                  caseId={selectedCase.id}
                  comments={selectedCase.comments || []}
                  currentUser={user}
                  onCommentAdded={handleRefreshSingleCase}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
              Select a case from the list on the left to inspect 3D files and chatter.
            </div>
          )}
        </div>
      </div>

      {/* UPI Payment Modal */}
      {paymentModalOpen && selectedCase && (
        <UpiPaymentModal
          caseRecord={selectedCase}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={updatedCase => {
            setSelectedCase(updatedCase);
            setCases(prev => prev.map(c => (c.id === updatedCase.id ? updatedCase : c)));
            setPaymentModalOpen(false);
          }}
        />
      )}

      {/* Invoice Modal */}
      {invoiceModalOpen && currentInvoice && (
        <InvoiceModal
          invoice={currentInvoice}
          onClose={() => setInvoiceModalOpen(false)}
        />
      )}

      {/* Revision Request Modal */}
      {revisionModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-rose-400 font-bold">{selectedCase.id}</span>
                <h3 className="text-base font-bold text-slate-100">Request CAD Design Revision</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Please provide specific anatomical or marginal modification instructions.</p>
              </div>
              <button
                onClick={() => {
                  setRevisionModalOpen(false);
                  setRevisionReason('');
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Revision Reason & Clinical Instructions <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionReason}
                  onChange={e => setRevisionReason(e.target.value)}
                  placeholder="e.g. Please reduce mesial contact tightness by 20µm and deepen occlusal anatomy fissures..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span>This note will be logged permanently in the case workflow timeline and dispatched to the assigned CAD designer immediately.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRevisionModalOpen(false);
                    setRevisionReason('');
                  }}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !revisionReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shadow transition"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Revision to Designer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
