import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CaseRecord, CaseStatus } from '../../types';
import { CaseTimelineView } from '../../components/case/CaseTimelineView';
import { Dental3DViewer } from '../../components/3d/Dental3DViewer';
import { CaseFilesList } from '../../components/case/CaseFilesList';
import { CaseChatter } from '../../components/case/CaseChatter';
import {
  Boxes,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  UploadCloud,
  Layers,
  ChevronRight,
  Power
} from 'lucide-react';

interface DesignerDashboardProps {
  initialCaseId?: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenAiChat?: (caseContext?: any) => void;
}

export const DesignerDashboard: React.FC<DesignerDashboardProps> = ({ initialCaseId, onNavigate, onOpenAiChat }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Duty Status (On Duty Online / Off Duty Offline)
  const [isOnDuty, setIsOnDuty] = useState(user?.isActive !== false);
  const [dutyLoading, setDutyLoading] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getCases();
      const list = res.cases || [];
      setCases(list);
      if (list.length > 0) {
        if (initialCaseId) {
          const matched = list.find(c => c.id === initialCaseId);
          setSelectedCase(matched || list[0]);
        } else if (!selectedCase) {
          setSelectedCase(list[0]);
        } else {
          const current = list.find(c => c.id === selectedCase.id);
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

  const handleToggleDuty = async () => {
    try {
      setDutyLoading(true);
      const res = await api.toggleDutyStatus(!isOnDuty);
      setIsOnDuty(res.isActive);
      if (res.isActive) {
        toast.success('You are now ON DUTY (Online) & ready for new CAD cases.');
      } else {
        toast.info('You are now OFF DUTY (Offline). Great work today!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update duty status');
    } finally {
      setDutyLoading(false);
    }
  };

  const handleRefreshSingleCase = async () => {
    if (!selectedCase) return;
    try {
      const res = await api.getCaseById(selectedCase.id);
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (newStatus: CaseStatus) => {
    if (!selectedCase || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      const res = await api.updateCaseStatus(
        selectedCase.id,
        newStatus,
        `Status updated by CAD Technician ${user?.name}`
      );
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
      toast.success(`Case status transitioned to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (statusFilter === 'MY_CASES') return c.assignedDesignerId === user?.id;
    if (statusFilter === 'IN_DESIGN') return c.status === 'IN_DESIGN';
    if (statusFilter === 'QC') return c.status === 'QC';
    if (statusFilter === 'APPROVAL') return c.status === 'APPROVAL';
    if (statusFilter === 'REVISION') return c.status === 'REVISION';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Duty Switch & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
              CAD Designer Workbench
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-amber-300 font-semibold">{user?.name}</span> (Dental CAD Specialist • Exocad / 3Shape)
          </p>
        </div>

        {/* Duty Toggle Button & Filter Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Duty Status Switch */}
          <button
            type="button"
            onClick={handleToggleDuty}
            disabled={dutyLoading}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition shadow-sm ${
              isOnDuty
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title="Click to toggle between On Duty (Online) and Off Duty (Offline)"
          >
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{dutyLoading ? 'Updating...' : isOnDuty ? '🟢 ON DUTY (Online)' : '⚪ OFF DUTY (Offline)'}</span>
          </button>

          {/* Quick status tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Cases' },
              { id: 'MY_CASES', label: 'My Assigned' },
              { id: 'IN_DESIGN', label: 'In Design' },
              { id: 'QC', label: 'QC' },
              { id: 'APPROVAL', label: 'Approval' },
              { id: 'REVISION', label: 'Revision' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Assigned Cases List */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[800px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500">Loading cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 p-4">
              No cases matching your workbench filter.
            </div>
          ) : (
            filteredCases.map(c => {
              const isSelected = selectedCase?.id === c.id;
              const isMyCase = c.assignedDesignerId === user?.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                    isSelected
                      ? 'bg-slate-800/95 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-amber-400">{c.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.status === 'COMPLETED' || c.status === 'DELIVERED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="font-bold text-slate-100 text-sm">
                    {c.patientName} <span className="text-xs font-normal text-slate-400">({c.clinicName || 'Clinic'})</span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>{c.serviceName}</span>
                    <span className="font-mono text-cyan-300">
                      Teeth: {c.teethNumbers?.join(', ') || c.unitsQuantity}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400">
                      {c.turnaroundType} ({c.estimatedHours}h)
                    </span>
                    <span className="text-amber-300 font-semibold">
                      {isMyCase ? '★ Assigned to Me' : c.assignedDesignerName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Active Case CAD Studio */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCase ? (
            <>
              {/* Studio Toolbar & Status Progression */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-black text-slate-100">
                        {selectedCase.id}
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-lg border border-amber-500/30 font-bold">
                        {selectedCase.serviceName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Patient: <span className="text-slate-200 font-semibold">{selectedCase.patientName}</span> • Material: <span className="text-slate-200 font-semibold">{selectedCase.material}</span> ({selectedCase.shade})
                    </p>
                  </div>

                  {/* Status Progression Controls for Designer */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold mr-1">Workflow Step:</span>
                    <button
                      onClick={() => handleUpdateStatus('IN_DESIGN')}
                      disabled={updatingStatus || selectedCase.status === 'IN_DESIGN'}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      In Design
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('QC')}
                      disabled={updatingStatus || selectedCase.status === 'QC'}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      Submit to QC
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('APPROVAL')}
                      disabled={updatingStatus || selectedCase.status === 'APPROVAL'}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for Doctor Approval</span>
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <CaseTimelineView
                    currentStatus={selectedCase.status}
                    timeline={selectedCase.timeline || selectedCase.timelineHistory || []}
                  />
                </div>

                {/* Technical Prescription Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">FDI Teeth</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {selectedCase.teethNumbers?.join(', ') || 'Arch'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Occlusal Clearance</span>
                    <span className="font-semibold text-slate-200">{selectedCase.occlusalClearance || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Proximal Contact</span>
                    <span className="font-semibold text-slate-200">{selectedCase.contactTightness || 'Normal'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Doctor Notes</span>
                    <span className="text-slate-300 italic truncate block">
                      {selectedCase.instructions || selectedCase.specialInstructions || 'Standard anatomy requested'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3D CAD Mesh Viewer */}
              <Dental3DViewer
                caseId={selectedCase.id}
                serviceType={selectedCase.serviceName}
                isUnlocked={true}
                className="h-[380px]"
              />

              {/* File Vault (Scans & Final Production STLs) */}
              <CaseFilesList
                caseId={selectedCase.id}
                files={selectedCase.files || []}
                isFinalUnlocked={true}
                paymentStatus={selectedCase.paymentStatus}
                currentUser={user}
                onFileUploaded={handleRefreshSingleCase}
              />

              {/* Real-time Case Chatter & Technical Internal Notes */}
              <CaseChatter
                caseId={selectedCase.id}
                comments={selectedCase.comments || []}
                currentUser={user}
                onCommentAdded={handleRefreshSingleCase}
              />
            </>
          ) : (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
              Select a case on the left to start CAD design and upload production STLs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};