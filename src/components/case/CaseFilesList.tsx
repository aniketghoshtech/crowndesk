import React, { useState } from 'react';
import { CaseFile, User } from '../../types';
import { Download, Lock, FileCode, CheckCircle2, UploadCloud, AlertCircle, File, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface CaseFilesListProps {
  caseId: string;
  files: CaseFile[];
  isFinalUnlocked: boolean;
  paymentStatus?: string;
  currentUser: User | null;
  onFileUploaded: () => void;
  onUnlockPaymentClick?: () => void;
  onPreview3D?: (file: CaseFile) => void;
}

export const CaseFilesList: React.FC<CaseFilesListProps> = ({
  caseId,
  files,
  isFinalUnlocked,
  paymentStatus,
  currentUser,
  onFileUploaded,
  onUnlockPaymentClick,
  onPreview3D
}) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'SCAN_STL' | 'WORKING_FILE' | 'FINAL_STL' | 'PDF'>('SCAN_STL');
  const [isFinalDesign, setIsFinalDesign] = useState(false);

  const isEmployeeOrAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'DESIGNER_EMPLOYEE';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);
      formData.append('fileType', isFinalDesign ? 'FINAL_STL' : selectedFileType);
      formData.append('isFinalDesign', String(isFinalDesign));

      await api.uploadFile(formData);
      toast.success('File uploaded to vault successfully.');
      onFileUploaded();
    } catch (err: any) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (file: CaseFile) => {
    // If it's a final STL and user is DOCTOR_LAB and not paid
    if ((file.isFinalDesign || file.fileType === 'FINAL_STL') && currentUser?.role === 'DOCTOR_LAB' && !isFinalUnlocked && paymentStatus !== 'PAID') {
      if (onUnlockPaymentClick) {
        onUnlockPaymentClick();
      } else {
        toast.warning('Please complete payment to unlock and download final CAD STL files.');
      }
      return;
    }

    const token = localStorage.getItem('crowndesk_token');
    const downloadUrl = `/api/files/download/${file.id}`;
    
    // Trigger download with auth token in URL or direct anchor
    fetch(downloadUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(json => { throw new Error(json.error || 'Download failed'); });
        }
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`Downloaded ${file.originalName}`);
      })
      .catch(err => {
        toast.error(err.message || 'Download failed');
      });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Case Files & 3D CAD Vault</span>
          </h3>
          <p className="text-xs text-slate-400">Intraoral Scans, Work-in-Progress & Production STLs</p>
        </div>

        {/* Upload Button */}
        <label className={`px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadCloud className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept=".stl,.ply,.obj,.zip,.rar,.pdf,.png,.jpg,.jpeg"
          />
        </label>
      </div>

      {/* Upload Type Config for Designer/Admin */}
      {isEmployeeOrAdmin && (
        <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Next Upload Type:</span>
            <select
              value={selectedFileType}
              onChange={e => setSelectedFileType(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="SCAN_STL">Scan (STL/PLY/OBJ)</option>
              <option value="WORKING_FILE">Working CAD Project</option>
              <option value="FINAL_STL">Final Production Milling STL</option>
              <option value="PDF">Clinical Report / PDF</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-cyan-300 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFinalDesign}
              onChange={e => setIsFinalDesign(e.target.checked)}
              className="rounded border-cyan-500 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Tag as Final Production Design (Triggers QC & Delivery)</span>
          </label>
        </div>
      )}

      {/* Files List */}
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
            <File className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No files uploaded yet for this case.</p>
          </div>
        ) : (
          files.map(f => {
            const isFinal = f.isFinalDesign || f.fileType === 'FINAL_STL';
            const isLocked = isFinal && currentUser?.role === 'DOCTOR_LAB' && !isFinalUnlocked && paymentStatus !== 'PAID';

            return (
              <div
                key={f.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                  isFinal
                    ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isFinal
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <FileCode className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                        {f.originalName}
                      </span>
                      {isFinal && (
                        <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-cyan-500/30 shrink-0">
                          FINAL STL
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{(f.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>By {f.uploadedByUserName}</span>
                      <span>•</span>
                      <span>{new Date(f.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {onPreview3D && (f.fileType === 'SCAN_STL' || f.fileType === 'FINAL_STL' || f.originalName.endsWith('.stl')) && (
                    <button
                      onClick={() => onPreview3D(f)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Inspect 3D CAD Mesh in Viewer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3D View</span>
                    </button>
                  )}

                  {isLocked ? (
                    <button
                      onClick={onUnlockPaymentClick}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 animate-pulse transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Pay to Unlock</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(f)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 hover:border-cyan-500"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
