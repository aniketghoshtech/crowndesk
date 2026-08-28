import React, { useState, useEffect } from 'react';
import { CaseRecord, CaseFile, User } from '../../types';
import { 
  FileText, 
  Download, 
  UploadCloud, 
  RefreshCw, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Box, 
  Eye, 
  Send,
  AlertCircle,
  HelpCircle,
  FolderArchive,
  RotateCcw,
  Sparkles,
  Check,
  User as UserIcon,
  ShieldCheck,
  X
} from 'lucide-react';

interface CaseDetailsOrderViewProps {
  caseData: CaseRecord;
  currentUser?: User;
  onFileUpload: (files: FileList) => Promise<void>;
  onDownloadFile: (file: CaseFile) => void;
  onRequestReDesign: (reason: string) => void;
  onSendMessage: (text: string) => void;
  onApproveDesign?: () => void;
}

export const CaseDetailsOrderView: React.FC<CaseDetailsOrderViewProps> = ({
  caseData,
  currentUser,
  onFileUpload,
  onDownloadFile,
  onRequestReDesign,
  onSendMessage,
  onApproveDesign
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [showReDesignModal, setShowReDesignModal] = useState(false);
  const [reDesignReason, setReDesignReason] = useState('');
  const [uploading, setUploading] = useState(false);

  // Persistent Comments State (Never disappears on refresh)
  const [localComments, setLocalComments] = useState<any[]>([]);

  const storageKey = `crowndesk_chat_history_${caseData.id}`;

  // Load and merge comments from Props + LocalStorage cache
  useEffect(() => {
    let initialList = caseData.comments || [];
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map();
          initialList.forEach(c => map.set(c.id || c.timestamp, c));
          parsed.forEach(c => map.set(c.id || c.timestamp, c));
          initialList = Array.from(map.values());
        }
      } catch (e) {}
    }
    setLocalComments(initialList);
  }, [caseData.id, caseData.comments]);

  // Quick preset clinical tags for discussion
  const quickChatTags = [
    'Please verify occlusal clearance',
    'Tighten interproximal contact point',
    'Check gingival margin adaptation',
    'Shade confirmed A2',
    'Scans inspected & aligned'
  ];

  // Filter files by category
  const initialScanFiles = (caseData.files || []).filter(
    f => f.fileType === 'SCAN_STL' || f.fileName.includes('Scan') || f.fileName.endsWith('.ply')
  );
  const stlOutputFiles = (caseData.files || []).filter(
    f => f.fileType === 'FINAL_STL' || f.fileName.endsWith('.stl')
  );
  const finalZipFiles = (caseData.files || []).filter(
    f => f.fileName.endsWith('.zip') || f.fileType === 'ATTACHMENT'
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      await onFileUpload(e.target.files);
      setUploading(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newComment = {
      id: `msg-${Date.now()}`,
      userName: currentUser?.name || 'Doctor',
      userRole: currentUser?.role || 'DOCTOR_LAB',
      message: chatMessage.trim(),
      comment: chatMessage.trim(),
      timestamp: new Date().toISOString(),
      isPublic: true
    };

    // 1. Instant local update
    const updated = [...localComments, newComment];
    setLocalComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // 2. Call Parent Callback
    onSendMessage(chatMessage.trim());
    setChatMessage('');
  };

  const handleConfirmReDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reDesignReason.trim()) return;
    onRequestReDesign(reDesignReason.trim());
    setShowReDesignModal(false);
    setReDesignReason('');
  };

  return (
    <div className="bg-[#111827] text-slate-100 min-h-screen p-4 sm:p-6 font-sans space-y-6">
      {/* Top Order Information Bar */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-4 mb-4">
          <div>
            <span className="text-xs text-cyan-400 font-mono tracking-wider uppercase font-bold">CrownDesk Case Portal</span>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3 mt-0.5">
              <span>Order No: #{caseData.id}</span>
              <span className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-bold">
                {caseData.status}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowReDesignModal(true)}
              className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request Re-Design</span>
            </button>
            <label className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20 transition">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Scan(s)'}</span>
              <input type="file" multiple onChange={handleFileInput} className="hidden" />
            </label>
          </div>
        </div>

        {/* Order Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Patient Ref</span>
            <span className="font-bold text-slate-100">{caseData.patientRef || caseData.patientName || 'N/A'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Doctor / Clinic</span>
            <span className="font-bold text-slate-100">{caseData.doctorName || caseData.customerClinic || 'Crown Lab'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Received On</span>
            <span className="font-bold text-slate-100">{new Date(caseData.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Due Date</span>
            <span className="font-bold text-cyan-300">{new Date(caseData.dueDate || Date.now()).toLocaleDateString()}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Assigned Designer</span>
            <span className="font-bold text-slate-100">{caseData.assignedDesignerName || 'CAD Specialist'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Payment Status</span>
            <span className={`font-bold ${caseData.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {caseData.paymentStatus || 'PAID'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CASE DISCUSSION & CAD NOTES (UPAR SHIFT KIYA GAYA FORMAT) */}
      {/* ========================================================================= */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Case Discussion & CAD Notes</h3>
              <p className="text-xs text-slate-400">Direct live communication between Doctor/Lab and CAD Designer</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Live Chat Active ({localComments.length})
          </span>
        </div>

        {/* Quick Click-to-Chat Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Quick Presets:
          </span>
          {quickChatTags.map((tag, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setChatMessage(prev => prev ? `${prev}. ${tag}` : tag)}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 rounded-lg px-2.5 py-1 transition"
            >
              + {tag}
            </button>
          ))}
        </div>

        {/* Message Feed Container */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 max-h-[350px] overflow-y-auto space-y-3">
          {localComments.length > 0 ? (
            localComments.map((comm, idx) => {
              const isDoctor = (comm.userRole || '').includes('DOCTOR') || (comm.userName || '').toLowerCase().includes('dr');
              const messageBody = comm.message || comm.comment || comm.text || '';

              return (
                <div 
                  key={comm.id || idx} 
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isDoctor 
                      ? 'bg-cyan-950/20 border-cyan-500/30 ml-4 sm:ml-8' 
                      : 'bg-slate-900/90 border-slate-800 mr-4 sm:mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className={`w-3.5 h-3.5 ${isDoctor ? 'text-cyan-400' : 'text-amber-400'}`} />
                      <span className={`font-bold ${isDoctor ? 'text-cyan-300' : 'text-amber-300'}`}>
                        {comm.userName || (isDoctor ? 'Doctor' : 'CAD Designer')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-800 text-slate-400">
                        {comm.userRole || (isDoctor ? 'DOCTOR' : 'DESIGNER')}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[10px] font-mono">
                      {comm.timestamp ? new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans">{messageBody}</p>
                </div>
              );
            })
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 opacity-40" />
              <p className="text-xs">No discussion notes yet. Type below to communicate directly with the laboratory.</p>
            </div>
          )}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type message to CAD Designer / Laboratory..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!chatMessage.trim()}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOCTOR REVIEW & CLINICAL ACTIONS (DISCUSSION KE NICHE) */}
      {/* ========================================================================= */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Doctor Review & Clinical Actions
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Current Stage: {caseData.status}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-200">Clinical Verification & Sign-off</h4>
            <p className="text-[11px] text-slate-400">
              Review 3D restorations. If modifications are required, request a re-design with clinical instructions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowReDesignModal(true)}
              className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request Re-Design / Revision</span>
            </button>

            {onApproveDesign && (caseData.status === 'APPROVAL' || caseData.status === 'QC') && (
              <button
                type="button"
                onClick={onApproveDesign}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve 3D CAD Design</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters & File Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Case Specs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>Case Restoration Parameters</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/80 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Service</th>
                    <th className="p-3">Tooth Position</th>
                    <th className="p-3">Material</th>
                    <th className="p-3">Shade</th>
                    <th className="p-3">Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-cyan-300">{caseData.serviceName}</td>
                    <td className="p-3 font-mono font-bold">{caseData.teethNumbers?.join(', ') || 'N/A'}</td>
                    <td className="p-3">{caseData.material || 'Multilayer Zirconia'}</td>
                    <td className="p-3 font-mono font-bold text-emerald-300">{caseData.shade || 'A2'}</td>
                    <td className="p-3 font-bold">{caseData.unitsQuantity || 1}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {caseData.instructions && (
              <div className="mt-4 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold block mb-1">Clinical Instructions:</span>
                <p className="text-slate-300 italic">{caseData.instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Categorized File Hub */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-cyan-400" />
                <span>Files & CAD Hub</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{(caseData.files || []).length} Files</span>
            </div>

            {/* 1. Initial Scans Category */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>1. Scans (.stl / .ply)</span>
                <span className="text-[10px] text-cyan-400">Doctor Uploaded</span>
              </div>
              <div className="space-y-1.5">
                {initialScanFiles.length > 0 ? (
                  initialScanFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-slate-200 truncate">{file.originalName || file.fileName}</span>
                      </div>
                      <button
                        onClick={() => onDownloadFile(file)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs transition"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500 text-center">
                    No initial scans uploaded yet.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Output STL Files */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>2. CAD Restorations (STLs)</span>
                <span className="text-[10px] text-emerald-400">Production Ready</span>
              </div>
              <div className="space-y-1.5">
                {stlOutputFiles.length > 0 ? (
                  stlOutputFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2.5 bg-slate-900/90 rounded-xl border border-emerald-500/20 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Box className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-slate-200 truncate">{file.originalName || file.fileName}</span>
                      </div>
                      <button
                        onClick={() => onDownloadFile(file)}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition"
                        title="Download STL"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500 text-center">
                    Restorations in design. STLs appear after QC.
                  </div>
                )}
              </div>
            </div>

            {/* 3. ZIP Package */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>3. Complete Case (.ZIP)</span>
                <span className="text-[10px] text-purple-400">Full Archive</span>
              </div>
              {finalZipFiles.length > 0 ? (
                finalZipFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-purple-950/20 rounded-xl border border-purple-500/30 text-xs">
                    <span className="font-bold text-purple-200 truncate">{file.originalName || file.fileName}</span>
                    <button
                      onClick={() => onDownloadFile(file)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>ZIP</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-2.5 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500 text-center">
                  ZIP ready upon completion.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Re-Design Modal */}
      {showReDesignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Request Case Re-Design</span>
              </h3>
              <button onClick={() => setShowReDesignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReDesign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specify Modification Reason & Clinical Notes <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reDesignReason}
                  onChange={(e) => setReDesignReason(e.target.value)}
                  placeholder="e.g. Please reduce occlusal height by 0.3mm and loosen mesial contact point..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReDesignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition"
                >
                  Submit Re-Design Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetailsOrderView;