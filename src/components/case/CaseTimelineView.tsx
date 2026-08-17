import React from 'react';
import { TimelineEvent, CaseStatus } from '../../types';
import { CheckCircle2, Clock, User, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CaseTimelineViewProps {
  timeline?: TimelineEvent[];
  history?: TimelineEvent[];
  currentStatus: CaseStatus;
}

export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({
  timeline,
  history,
  currentStatus
}) => {
  const events = timeline || history || [];

  const allStages: { key: CaseStatus; label: string; desc: string }[] = [
    { key: 'NEW', label: 'NEW', desc: 'Case Created' },
    { key: 'RECEIVED', label: 'RECEIVED', desc: 'Verified & Queued' },
    { key: 'ASSIGNED', label: 'ASSIGNED', desc: 'CAD Allocated' },
    { key: 'IN_DESIGN', label: 'IN DESIGN', desc: 'CAD Modeling' },
    { key: 'QC', label: 'QC', desc: 'Quality Check' },
    { key: 'APPROVAL', label: 'APPROVAL', desc: 'Doctor Review' },
    { key: 'REVISION', label: 'REVISION', desc: 'Modifications' },
    { key: 'COMPLETED', label: 'COMPLETED', desc: 'Design Signed Off' },
    { key: 'DELIVERED', label: 'DELIVERED', desc: 'Files Delivered' }
  ];

  const getStageStatus = (stageKey: CaseStatus) => {
    if (currentStatus === stageKey) return 'CURRENT';
    // If case is in REVISION and stage is REVISION, it's current.
    const orderMap: Record<CaseStatus, number> = {
      NEW: 0,
      RECEIVED: 1,
      ASSIGNED: 2,
      IN_DESIGN: 3,
      QC: 4,
      APPROVAL: 5,
      REVISION: 5.5,
      COMPLETED: 6,
      DELIVERED: 7
    };
    const currentOrder = orderMap[currentStatus] ?? 0;
    const stageOrder = orderMap[stageKey] ?? 0;

    if (stageKey === 'REVISION' && currentStatus !== 'REVISION') {
      const hasHadRevision = events.some(e => e.newStatus === 'REVISION');
      return hasHadRevision ? 'PASSED' : 'PENDING';
    }

    if (stageOrder < currentOrder) return 'PASSED';
    return 'PENDING';
  };

  const getStatusBadgeColor = (status?: CaseStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'RECEIVED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ASSIGNED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'IN_DESIGN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'QC':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'APPROVAL':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'REVISION':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'DELIVERED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'DESIGNER_EMPLOYEE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DOCTOR_LAB':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Case Workflow Lifecycle & Permanent History</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full audit log of transitions with previous status, new status, actor, timestamp, and comments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Current Status:</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${getStatusBadgeColor(currentStatus)}`}>
            {currentStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Visual Step Progress Bar with All 9 Stages */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {allStages.map((stage, idx) => {
          const state = getStageStatus(stage.key);
          const isCurrent = state === 'CURRENT';
          const isPassed = state === 'PASSED';

          return (
            <div
              key={stage.key}
              className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : isPassed
                  ? 'bg-slate-950/60 border-emerald-500/40'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all border ${
                  isCurrent
                    ? 'bg-cyan-500 border-white text-white shadow-md animate-pulse'
                    : isPassed
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isPassed && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-bold mt-1.5 leading-tight ${
                  isCurrent ? 'text-cyan-300 font-black' : isPassed ? 'text-slate-200' : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
              <span className="text-[9px] text-slate-400 truncate w-full block mt-0.5">
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Chronological History Records with 5-Tuple Logs */}
      <div className="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
        {events.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No transition history logged yet.</div>
        ) : (
          events.map((event, idx) => {
            const hasPrev = Boolean(event.previousStatus && event.previousStatus !== event.newStatus);

            return (
              <div key={event.id || idx} className="relative flex items-start gap-4 pl-1">
                <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 z-10 shrink-0 mt-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex-1 shadow-md space-y-2">
                  {/* Top Bar: Action & Status Transition Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{event.action || 'Status Transition'}</span>
                      
                      {/* Transition Flow Badge */}
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                        {hasPrev && (
                          <>
                            <span className={`px-2 py-0.5 rounded-md border ${getStatusBadgeColor(event.previousStatus)}`}>
                              {event.previousStatus}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          </>
                        )}
                        {event.newStatus && (
                          <span className={`px-2 py-0.5 rounded-md border ${getStatusBadgeColor(event.newStatus)}`}>
                            {event.newStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recently'}
                    </span>
                  </div>

                  {/* Comment */}
                  {event.comment && (
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed font-sans">
                      <span className="text-slate-400 font-semibold mr-1.5">Comment / Reason:</span>
                      <span>{event.comment}</span>
                    </div>
                  )}

                  {/* Actor Details: User Name + Role */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Transitioned by: <span className="font-semibold text-slate-200">{event.userName}</span></span>
                    </div>
                    {event.userRole && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${getRoleBadgeColor(event.userRole)}`}>
                        {event.userRole.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

