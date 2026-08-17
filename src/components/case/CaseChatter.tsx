import React, { useState } from 'react';
import { CaseComment, User } from '../../types';
import { Send, MessageSquare, ShieldAlert, Paperclip, CheckCheck, Clock } from 'lucide-react';
import { api } from '../../services/api';

interface CaseChatterProps {
  caseId: string;
  comments: CaseComment[];
  currentUser: User | null;
  onCommentAdded: () => void;
}

export const CaseChatter: React.FC<CaseChatterProps> = ({
  caseId,
  comments,
  currentUser,
  onCommentAdded
}) => {
  const [message, setMessage] = useState('');
  const [isTechnicalOnly, setIsTechnicalOnly] = useState(false);
  const [filterTech, setFilterTech] = useState<'ALL' | 'PUBLIC_ONLY' | 'TECH_ONLY'>('ALL');
  const [submitting, setSubmitting] = useState(false);

  const canPostTechnical = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'DESIGNER_EMPLOYEE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api.postCaseComment(caseId, message.trim(), isTechnicalOnly);
      setMessage('');
      setIsTechnicalOnly(false);
      onCommentAdded();
    } catch (err: any) {
      alert(err.message || 'Failed to post message');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComments = comments.filter(c => {
    // If user is DOCTOR_LAB, they never see technical-only internal notes
    if (currentUser?.role === 'DOCTOR_LAB' && c.isTechnicalOnly) {
      return false;
    }
    if (filterTech === 'PUBLIC_ONLY') return !c.isTechnicalOnly;
    if (filterTech === 'TECH_ONLY') return c.isTechnicalOnly;
    return true;
  });

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
              onClick={() => setFilterTech('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                filterTech === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({comments.length})
            </button>
            <button
              onClick={() => setFilterTech('PUBLIC_ONLY')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                filterTech === 'PUBLIC_ONLY' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setFilterTech('TECH_ONLY')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                filterTech === 'TECH_ONLY' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
            <p>No messages yet for this case.</p>
            <p className="text-[11px] text-slate-400 mt-1">Start a conversation or leave preparation notes below.</p>
          </div>
        ) : (
          filteredComments.map((c, idx) => {
            const isMe = c.userId === currentUser?.id;
            return (
              <div
                key={c.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">{c.userName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      c.userRole === 'DOCTOR_LAB'
                        ? 'bg-cyan-900/60 text-cyan-300'
                        : c.userRole === 'DESIGNER_EMPLOYEE'
                        ? 'bg-amber-900/60 text-amber-300'
                        : 'bg-purple-900/60 text-purple-300'
                    }`}
                  >
                    {c.userRole.replace('_', ' ')}
                  </span>
                  <span>
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <p>{c.message}</p>
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
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!message.trim() || submitting}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition transform active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
