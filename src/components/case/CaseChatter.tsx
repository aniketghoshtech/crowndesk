import React, { useState, useEffect, useMemo } from 'react';
import { CaseComment, User } from '../../types';
import { Send, MessageSquare, ShieldAlert, Paperclip, CheckCheck, Clock, User as UserIcon, Lock, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface CaseChatterProps {
  caseId: string;
  comments?: CaseComment[];
  currentUser?: User | null;
  onCommentAdded?: () => void;
  defaultPublic?: boolean;
}

// Smart Deduplication Helper: Drops identical duplicate comments
const deduplicateComments = (list: CaseComment[]): CaseComment[] => {
  const unique: CaseComment[] = [];

  for (const item of list) {
    if (!item) continue;
    const msg = (item.message || (item as any).comment || (item as any).text || '').trim().toLowerCase();
    const user = (item.userName || (item as any).author || '').trim().toLowerCase();
    const time = new Date(item.timestamp || (item as any).createdAt || Date.now()).getTime();

    // Check if duplicate exists in unique array
    const isDuplicate = unique.some(existing => {
      // 1. Direct ID match
      if (item.id && existing.id && item.id === existing.id) return true;

      // 2. Same Message + Same User + Sent within 60 seconds
      const existingMsg = (existing.message || (existing as any).comment || (existing as any).text || '').trim().toLowerCase();
      const existingUser = (existing.userName || (existing as any).author || '').trim().toLowerCase();
      const existingTime = new Date(existing.timestamp || (existing as any).createdAt || Date.now()).getTime();

      const sameContent = existingMsg === msg && msg.length > 0;
      const sameSender = existingUser === user;
      const withinTimeWindow = Math.abs(time - existingTime) < 60000; // 60 seconds window

      return sameContent && sameSender && withinTimeWindow;
    });

    if (!isDuplicate) {
      unique.push(item);
    }
  }

  return unique;
};

export const CaseChatter: React.FC<CaseChatterProps> = ({
  caseId,
  comments = [],
  currentUser,
  onCommentAdded,
  defaultPublic = true
}) => {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [isTechnicalOnly, setIsTechnicalOnly] = useState(false);
  const [filterTech, setFilterTech] = useState<'ALL' | 'PUBLIC_ONLY' | 'TECH_ONLY'>('ALL');
  const [submitting, setSubmitting] = useState(false);

  const chatterStorageKey = `crowndesk_case_chatter_${caseId}`;
  const [cachedComments, setCachedComments] = useState<CaseComment[]>([]);

  // Load and merge comments with automatic deduplication
  useEffect(() => {
    let combinedList: CaseComment[] = [...comments];

    const saved = localStorage.getItem(chatterStorageKey);
    if (saved) {
      try {
        const localList: CaseComment[] = JSON.parse(saved);
        if (Array.isArray(localList)) {
          combinedList = [...combinedList, ...localList];
        }
      } catch (e) {}
    }

    // Filter out duplicates
    const cleaned = deduplicateComments(combinedList);
    setCachedComments(cleaned);
    localStorage.setItem(chatterStorageKey, JSON.stringify(cleaned));
  }, [caseId, comments]);

  const canPostTechnical = 
    currentUser?.role === 'SUPER_ADMIN' || 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'DESIGNER_EMPLOYEE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    const trimmedMsg = message.trim();
    const tempId = `temp-${Date.now()}`;
    const newCommentObj: CaseComment = {
      id: tempId,
      caseId: caseId,
      userId: currentUser?.id || 'usr-temp',
      userName: currentUser?.name || 'Staff',
      userRole: currentUser?.role || 'DESIGNER_EMPLOYEE',
      message: trimmedMsg,
      timestamp: new Date().toISOString(),
      isTechnicalOnly: isTechnicalOnly
    };

    try {
      setSubmitting(true);

      // Add optimistic comment and deduplicate immediately
      const updated = deduplicateComments([...cachedComments, newCommentObj]);
      setCachedComments(updated);
      localStorage.setItem(chatterStorageKey, JSON.stringify(updated));

      // Post to backend API
      try {
        await api.postCaseComment(caseId, trimmedMsg, isTechnicalOnly);
      } catch (apiErr) {
        console.warn('API post warning (persisted locally):', apiErr);
      }

      setMessage('');
      setIsTechnicalOnly(false);
      toast.success('Message sent.');
      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post message');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter comments for Doctor vs Internal view
  const filteredComments = useMemo(() => {
    const isDoctor = 
      currentUser?.role === 'DOCTOR_LAB' || 
      currentUser?.role === 'CUSTOMER' || 
      (currentUser?.name || '').toLowerCase().includes('dr');

    return cachedComments.filter(c => {
      // Hide internal notes from Doctor
      if (isDoctor && c.isTechnicalOnly === true) {
        return false;
      }
      if (filterTech === 'PUBLIC_ONLY') return !c.isTechnicalOnly;
      if (filterTech === 'TECH_ONLY') return c.isTechnicalOnly;
      return true;
    });
  }, [cachedComments, currentUser, filterTech]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Case Discussion & CAD Notes</span>
          </h3>
          <p className="text-xs text-slate-400">Direct communication between Doctor/Lab and CAD Designer</p>
        </div>

        {/* Filter for Admin / Designer */}
        {canPostTechnical && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterTech('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                filterTech === 'ALL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({filteredComments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTech('PUBLIC_ONLY')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                filterTech === 'PUBLIC_ONLY' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setFilterTech('TECH_ONLY')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                filterTech === 'TECH_ONLY' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Internal Notes
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
        {filteredComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="font-semibold text-slate-400">No messages yet for this case.</p>
            <p className="text-[11px] text-slate-500 mt-1">Start a conversation or leave clinical preparation notes below.</p>
          </div>
        ) : (
          filteredComments.map((c, idx) => {
            const isMe = c.userId === currentUser?.id || (currentUser?.name && c.userName === currentUser?.name);
            const isDoctor = (c.userRole || '').includes('DOCTOR') || (c.userName || '').toLowerCase().includes('dr');
            const messageText = c.message || (c as any).comment || (c as any).text || '';

            return (
              <div
                key={c.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">{c.userName || (isDoctor ? 'Doctor' : 'CAD Designer')}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isDoctor
                        ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/40'
                        : (c.userRole || '').includes('DESIGNER')
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-700/40'
                        : 'bg-purple-900/60 text-purple-300 border border-purple-700/40'
                    }`}
                  >
                    {c.userRole ? c.userRole.replace('_', ' ') : isDoctor ? 'DOCTOR' : 'DESIGNER'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words shadow-md ${
                    c.isTechnicalOnly
                      ? 'bg-amber-950/60 border border-amber-800/80 text-amber-100'
                      : isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {c.isTechnicalOnly && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Internal CAD Note (Hidden from Doctor)</span>
                    </div>
                  )}
                  <p>{messageText}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800 shrink-0">
        {canPostTechnical && (
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTechnicalOnly}
                onChange={e => setIsTechnicalOnly(e.target.checked)}
                className="rounded border-amber-500 bg-slate-900 text-amber-600 focus:ring-amber-500"
              />
              <span>Mark as Internal CAD Note (Invisible to Doctor/Lab)</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={
              isTechnicalOnly
                ? 'Type internal note for designer/QC team...'
                : 'Type message or clinical instruction...'
            }
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!message.trim() || submitting}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition transform active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseChatter;