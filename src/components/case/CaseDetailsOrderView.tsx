import React, { useState } from 'react';
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
  FolderArchive
} from 'lucide-react';

interface CaseDetailsOrderViewProps {
  caseData: CaseRecord;
  currentUser: User;
  onFileUpload: (files: FileList) => Promise<void>;
  onDownloadFile: (file: CaseFile) => void;
  onRequestReDesign: (reason: string) => void;
  onSendMessage: (text: string) => void;
}

export const CaseDetailsOrderView: React.FC<CaseDetailsOrderViewProps> = ({
  caseData,
  currentUser,
  onFileUpload,
  onDownloadFile,
  onRequestReDesign,
  onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'FILES'>('DETAILS');
  const [chatMessage, setChatMessage] = useState('');
  const [showReDesignModal, setShowReDesignModal] = useState(false);
  const [reDesignReason, setReDesignReason] = useState('');
  const [uploading, setUploading] = useState(false);

  // Filter files by category
  const initialScanFiles = (caseData.files || []).filter(f => f.fileType === 'SCAN_STL' || f.fileName.includes('Scan'));
  const stlOutputFiles = (caseData.files || []).filter(f => f.fileType === 'FINAL_STL' || f.fileName.endsWith('.stl'));
  const finalZipFiles = (caseData.files || []).filter(f => f.fileName.endsWith('.zip') || f.fileType === 'ATTACHMENT');

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
    onSendMessage(chatMessage);
    setChatMessage('');
  };

  return (
    <div className="bg-[#111827] text-slate-100 min-h-screen p-4 sm:p-6 font-sans">
      {/* Top Order Information Bar */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
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
              className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
            <span className="font-bold text-slate-100">{caseData.assignedDesignerName || 'Lab Queue'}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Payment</span>
            <span className={`font-bold ${caseData.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {caseData.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Files & Specs, Right Messaging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Case Specs & Categorized File Hub */}
        <div className="lg:col-span-8 space-y-6">
          {/* Case Parameters Card */}
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
                    <td className="p-3 font-bold">{caseData.unitsQuantity}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Instructions box */}
            {caseData.instructions && (
              <div className="mt-4 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold block mb-1">Clinical Instructions:</span>
                <p className="text-slate-300 italic">{caseData.instructions}</p>
              </div>
            )}
          </div>

          {/* Categorized File Hub (Upload / Download Center) */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-cyan-400" />
                <span>Files & CAD Downloads Hub</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{(caseData.files || []).length} Files Available</span>
            </div>

            {/* 1. Initial Scans Category */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>1. Intraoral Initial Scans (.stl / .ply / .zip)</span>
                <span className="text-[10px] text-cyan-400">Doctor Uploaded</span>
              </div>
              <div className="space-y-2">
                {initialScanFiles.length > 0 ? (
                  initialScanFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs hover:border-slate-700 transition">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span className="font-semibold text-slate-200 block">{file.originalName || file.fileName}</span>
                          <span className="text-[10px] text-slate-500">{(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {file.fileType}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDownloadFile(file)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 text-center">
                    No initial scan files uploaded yet.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Individual STL Output Files (CAD Output) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>2. Individual CAD Restorations & STL Dies</span>
                <span className="text-[10px] text-emerald-400">Ready for Milling</span>
              </div>
              <div className="space-y-2">
                {stlOutputFiles.length > 0 ? (
                  stlOutputFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-emerald-500/20 text-xs hover:border-emerald-500/40 transition">
                      <div className="flex items-center gap-3">
                        <Box className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-semibold text-slate-200 block">{file.originalName || file.fileName}</span>
                          <span className="text-[10px] text-slate-500">{(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB • Milling STL</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download STL</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 text-center">
                    Designer is finalizing CAD restorations. STL files will appear here once QC approved.
                  </div>
                )}
              </div>
            </div>

            {/* 3. Final Production Package (.zip) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>3. Complete Case Package (.ZIP Archive)</span>
                <span className="text-[10px] text-purple-400">All-in-One</span>
              </div>
              {finalZipFiles.length > 0 ? (
                finalZipFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-purple-950/20 rounded-xl border border-purple-500/30 text-xs">
                    <div className="flex items-center gap-3">
                      <FolderArchive className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="font-bold text-purple-200 block">{file.originalName || file.fileName}</span>
                        <span className="text-[10px] text-slate-400">Complete Archive Package</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDownloadFile(file)}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Full Package (.zip)</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 text-center">
                  Full ZIP archive package will be ready upon case completion.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Case Messaging & Quality Control Notes */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[600px]">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Case Messaging & QC Chatter</span>
            </h3>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {(caseData.comments || []).length > 0 ? (
                caseData.comments.map((comm) => (
                  <div key={comm.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-400">{comm.userName}</span>
                      <span className="text-slate-500">{new Date(comm.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{comm.message}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                  <MessageSquare className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                  <p className="text-xs">No case messages yet. Type below to chat directly with your assigned CAD designer.</p>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type message to designer..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};