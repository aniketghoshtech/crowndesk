import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { X, UserCog, Edit2, AlertCircle } from 'lucide-react';

interface AdminEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => Promise<void>;
  editingEmployee?: User | null;
  defaultRole?: string;
  isSuperAdmin?: boolean;
}

export const AdminEmployeeModal: React.FC<AdminEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEmployee,
  defaultRole = 'DESIGNER_EMPLOYEE',
  isSuperAdmin = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: defaultRole,
    specialization: 'Exocad & 3Shape Certified CAD Designer',
    initialPassword: 'Designer@123',
    isActive: true
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Esc কি প্রেস করলে মোডাল ক্লোজ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        name: editingEmployee.name || '',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        role: editingEmployee.role || defaultRole,
        specialization: editingEmployee.specialization || 'Exocad & 3Shape Certified CAD Designer',
        initialPassword: '',
        isActive: editingEmployee.isActive !== false
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: defaultRole,
        specialization: defaultRole === 'DESIGNER_EMPLOYEE'
          ? 'Exocad & 3Shape Certified CAD Designer'
          : 'CrownDesk Operations & Quality Control',
        initialPassword: 'Designer@123',
        isActive: true
      });
    }
    setError('');
  }, [isOpen, editingEmployee, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    try {
      setSaving(true);

      // ব্যাকএন্ডের জন্য password এবং clean email নিশ্চিত করে পাঠানো হচ্ছে
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.initialPassword || 'Designer@123',
        initialPassword: formData.initialPassword || 'Designer@123'
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save staff:', err);
      setError(err.message || err.error || 'Failed to save staff account. Please check the email or connection.');
    } finally {
      setSaving(false);
    }
  };

  const isDesigner = formData.role === 'DESIGNER_EMPLOYEE';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              {editingEmployee ? <Edit2 className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {editingEmployee
                  ? `Edit Account: ${editingEmployee.name}`
                  : isDesigner
                  ? 'Add CAD Design Specialist'
                  : 'Create Staff & Operations Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingEmployee
                  ? 'Update roles, technical specializations, and access status'
                  : 'Grant operational, CAD dispatch, or administrative system access'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vikram Sharma"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Work Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. vikram.cad@crowndesk.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">System Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value="DESIGNER_EMPLOYEE">CAD Designer (Technical CAD Specialist)</option>
                <option value="ADMIN">Admin (Operations & Case Dispatch)</option>
                <option value="QC_INSPECTOR">QC Inspector (Quality Verification)</option>
                <option value="STAFF">Staff Operator (Support & Tracking)</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin (Full System Authority)</option>}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 90583 22251"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">CAD Specialization / Skillset</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={e => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Full Arch Implants, Exocad Certified, Anatomic Crowns & Bridges"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          {!editingEmployee && (
            <div>
              <label className="block text-slate-300 font-bold mb-1">Initial Password *</label>
              <input
                type="text"
                required
                value={formData.initialPassword}
                onChange={e => setFormData({ ...formData, initialPassword: e.target.value })}
                placeholder="e.g. Designer@123"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          )}

          {editingEmployee && (
            <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="empIsActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="empIsActive" className="text-slate-200 font-medium cursor-pointer">
                Account Active (Can receive case assignments & access portal)
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingEmployee ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};