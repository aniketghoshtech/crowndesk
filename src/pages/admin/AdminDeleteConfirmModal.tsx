import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface AdminDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  type: 'CASE' | 'CUSTOMER' | 'EMPLOYEE' | 'DESIGNER';
  id: string;
  name: string;
  loading?: boolean;
}

export const AdminDeleteConfirmModal: React.FC<AdminDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  id,
  name,
  loading = false
}) => {
  if (!isOpen) return null;

  const typeLabels = {
    CASE: { title: 'Delete CAD Case', entity: 'Case Prescription', warning: 'Deleting this case will permanently remove its design history, 3D attachments, and status tracking.' },
    CUSTOMER: { title: 'Delete Customer Account', entity: 'Doctor / Laboratory', warning: 'Deleting this customer account will remove their portal login and practice records.' },
    EMPLOYEE: { title: 'Delete Employee Account', entity: 'Staff Account', warning: 'Deleting this staff account will revoke their administrative and operational portal access.' },
    DESIGNER: { title: 'Delete CAD Designer', entity: 'Design Specialist', warning: 'Deleting this designer account will unassign them from future orders and revoke design workbench access.' }
  };

  const meta = typeLabels[type] || typeLabels.CASE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{meta.title}</h3>
              <p className="text-xs text-slate-400">{meta.entity} Removal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Are you sure you want to permanently delete{' '}
            <strong className="text-white font-bold">{name}</strong>{' '}
            <span className="font-mono text-purple-300">({id})</span>?
          </p>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Warning
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200/90">{meta.warning}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting...' : 'Confirm Deletion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
