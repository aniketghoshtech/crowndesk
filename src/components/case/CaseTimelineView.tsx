import React, { useState } from 'react';
import { TimelineEvent, CaseStatus } from '../../types';
import { api } from '../../services/api';
import {
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Send,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface CaseTimelineViewProps {
  timeline?: TimelineEvent[];
  history?: TimelineEvent[];
  currentStatus: CaseStatus;
  caseId?: string;
  onStatusUpdated?: () => void;
  onAddComment?: (comment: string, actionType?: 'REVISION' | 'COMMENT' | 'APPROVE') => Promise<void> | void;
  allowDoctorCorrection?: boolean;
}

export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({
  timeline,
  history,
  currentStatus,
  caseId,
  onStatusUpdated,
  onAddComment,
  allowDoctorCorrection = true
}) => {
  const events = timeline || history || [];

  // Doctor correction & comment form state
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const quickCorrectionTags = [
    'Reduce occlusal height (0.2mm - 0.3mm)',
    'Loosen mesial / distal proximal contact',
    'Tighten interproximal contact point',
    'Refine gingival margin line fit',
    'Anatomy cusp too sharp, soften ridges',
    'Increase minimal wall thickness (0.8mm+)'
  ];

  const handleAddTag = (tag: string) => {
    setCommentText(prev => prev ? `${prev}. ${tag}` : tag);
  };

  const handleAction = async (actionType: 'REVISION' | 'COMMENT' | 'APPROVE') => {
    if (actionType !== 'APPROVE' && !commentText.trim()) {
      setErrorMsg('Please enter your correction instructions or comment.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      if (onAddComment) {
        await onAddComment(commentText.trim(), actionType);
        setSuccessMsg(
          actionType === 'REVISION'
            ? 'Correction request submitted! Case moved to REVISION.'
            : actionType === 'APPROVE'
            ? '3D Design approved successfully!'
            : 'Comment added to case timeline.'
        );
      } else if (caseId) {
        if (actionType === 'REVISION') {
          await api.updateCaseStatus(
            caseId,
            'REVISION' as CaseStatus,
            `[Doctor Correction Request]: ${commentText.trim()}`
          );
          setSuccessMsg('Correction request sent to CAD Designer! Status changed to REVISION.');
        } else if (actionType === 'APPROVE') {
          await api.updateCaseStatus(
            caseId,
            'COMPLETED' as CaseStatus,
            commentText.trim() ? `[Doctor Approved]: ${commentText.trim()}` : 'Doctor approved final 3D design.'
          );
          setSuccessMsg('3D CAD design approved successfully!');
        } else {
          await api.addCaseComment(caseId, commentText.trim());
          setSuccessMsg('Clinical note added to timeline.');
        }
      } else {
        setSuccessMsg('Feedback noted.');
      }

      setCommentText('');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
    }
  };

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
      {/* Header */}
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
            {currentStatus ? currentStatus.replace('_', ' ') : 'NEW'}
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

      {/* ========================================================================= */}
      {/* DOCTOR CLINICAL REVIEW & CORRECTION BOX */}
      {/* ========================================================================= */}
      {allowDoctorCorrection && (
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Doctor Review & Clinical Correction Notes
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Actionable CAD Feedback
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Quick Presets (Click to add):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickCorrectionTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 rounded-lg px-2.5 py-1 transition"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Describe clinical modifications for the CAD Designer (e.g. Please reduce occlusal height by 0.3mm and loosen mesial contact contour)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
          />

          {/* Notification Banners */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAction('COMMENT')}
              disabled={submitting || !commentText.trim()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Comment Only</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('REVISION')}
              disabled={submitting || !commentText.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request Correction (Send to REVISION)</span>
            </button>

            {(currentStatus === 'APPROVAL' || currentStatus === 'QC') && (
              <button
                type="button"
                onClick={() => handleAction('APPROVE')}
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve 3D Design</span>
              </button>
            )}
          </div>
        </div>
      )}

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
                      <span>Transitioned by: <span className="font-semibold text-slate-200">{event.userName || 'System'}</span></span>
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

export default CaseTimelineView;