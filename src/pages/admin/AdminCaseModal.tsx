import React, { useState, useEffect } from 'react';
import { CaseRecord, ServicePricing, User } from '../../types';
import { X, FolderPlus, Edit2, AlertCircle } from 'lucide-react';

interface AdminCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: any) => Promise<void>;
  editingCase?: CaseRecord | null;
  services: ServicePricing[];
  customers: any[];
  designers: User[];
}

export const AdminCaseModal: React.FC<AdminCaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCase,
  services,
  customers,
  designers
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    patientName: '',
    doctorName: '',
    customerClinic: '',
    serviceId: '',
    serviceName: '',
    unitsQuantity: 1,
    teethNumbers: '11',
    shade: 'A2',
    material: 'Zirconia Multi-Layer (3D Pro)',
    instructions: '',
    priority: 'STANDARD' as 'STANDARD' | 'URGENT' | 'RUSH',
    dueDate: '',
    assignedDesignerId: '',
    status: 'NEW',
    paymentStatus: 'PAID',
    finalTotalAmount: 0
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCase) {
      setFormData({
        customerId: editingCase.customerId || '',
        patientName: editingCase.patientName || '',
        doctorName: editingCase.doctorName || '',
        customerClinic: editingCase.customerClinic || '',
        serviceId: editingCase.serviceId || '',
        serviceName: editingCase.serviceName || '',
        unitsQuantity: editingCase.unitsQuantity || 1,
        teethNumbers: Array.isArray(editingCase.teethNumbers) ? editingCase.teethNumbers.join(', ') : '11',
        shade: editingCase.shade || 'A2',
        material: editingCase.material || 'Zirconia Multi-Layer (3D Pro)',
        instructions: editingCase.instructions || '',
        priority: (editingCase.priority as any) || 'STANDARD',
        dueDate: editingCase.dueDate ? new Date(editingCase.dueDate).toISOString().split('T')[0] : '',
        assignedDesignerId: editingCase.assignedDesignerId || '',
        status: editingCase.status || 'NEW',
        paymentStatus: editingCase.paymentStatus || 'PAID',
        finalTotalAmount: editingCase.finalTotalAmount || 0
      });
    } else {
      const defaultService = services[0];
      setFormData({
        customerId: customers[0]?.id || '',
        patientName: '',
        doctorName: customers[0]?.name || 'Dr. Client',
        customerClinic: customers[0]?.clinicOrLabName || 'Dental Practice',
        serviceId: defaultService?.id || 'srv-crown',
        serviceName: defaultService?.name || 'Crown',
        unitsQuantity: 1,
        teethNumbers: '11',
        shade: 'A2',
        material: defaultService?.materials?.[0] || 'Zirconia Multi-Layer (3D Pro)',
        instructions: 'Standard anatomical contours and precision contacts.',
        priority: 'STANDARD',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        assignedDesignerId: '',
        status: 'NEW',
        paymentStatus: 'PAID',
        finalTotalAmount: defaultService?.unitPriceINR || 799
      });
    }
    setError('');
  }, [isOpen, editingCase, services, customers]);

  if (!isOpen) return null;

  const handleCustomerChange = (custId: string) => {
    const cust = customers.find(c => c.id === custId);
    setFormData(prev => ({
      ...prev,
      customerId: custId,
      doctorName: cust ? cust.name : prev.doctorName,
      customerClinic: cust ? (cust.clinicOrLabName || cust.name) : prev.customerClinic
    }));
  };

  const handleServiceChange = (srvId: string) => {
    const srv = services.find(s => s.id === srvId);
    setFormData(prev => ({
      ...prev,
      serviceId: srvId,
      serviceName: srv ? srv.name : prev.serviceName,
      material: srv?.materials?.[0] || prev.material,
      finalTotalAmount: srv ? srv.unitPriceINR * Number(prev.unitsQuantity) : prev.finalTotalAmount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!formData.serviceName.trim()) {
      setError('Service name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const teethArr = formData.teethNumbers
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        ...formData,
        unitsQuantity: Number(formData.unitsQuantity) || 1,
        teethNumbers: teethArr.length > 0 ? teethArr : ['11']
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              {editingCase ? <Edit2 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {editingCase ? `Edit CAD Case: ${editingCase.id}` : 'Create New CAD Prescription'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingCase ? 'Modify prescription specifications, status or technician' : 'Directly dispatch clinical work for any registered or new client'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
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
          {/* Customer / Doctor Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Select Customer / Practice</label>
              <select
                value={formData.customerId}
                onChange={e => handleCustomerChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="">-- Choose Client or Custom --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.clinicOrLabName || 'Clinic'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Doctor / Practice Name *</label>
              <input
                type="text"
                required
                value={formData.doctorName}
                onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Patient Name / Ref *</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. Ananya Patel (Ref #440)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Clinic / Facility Name</label>
              <input
                type="text"
                value={formData.customerClinic}
                onChange={e => setFormData({ ...formData, customerClinic: e.target.value })}
                placeholder="e.g. Apollo Dental Center"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Service & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">CAD Service *</label>
              <select
                value={formData.serviceId}
                onChange={e => handleServiceChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (₹{s.unitPriceINR})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Units Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.unitsQuantity}
                onChange={e => setFormData({ ...formData, unitsQuantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Teeth # (FDI)</label>
              <input
                type="text"
                value={formData.teethNumbers}
                onChange={e => setFormData({ ...formData, teethNumbers: e.target.value })}
                placeholder="e.g. 11, 12, 21"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Shade & Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Shade / Color</label>
              <input
                type="text"
                value={formData.shade}
                onChange={e => setFormData({ ...formData, shade: e.target.value })}
                placeholder="e.g. A2, A3, BL1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Material Specification</label>
              <input
                type="text"
                value={formData.material}
                onChange={e => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g. Zirconia Multi-Layer (3D Pro), IPS e.max"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Priority, Due Date & Designer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="STANDARD">STANDARD (24-48h)</option>
                <option value="URGENT">URGENT (12-24h)</option>
                <option value="RUSH">RUSH / STAT (6-12h)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Assign CAD Designer</label>
              <select
                value={formData.assignedDesignerId}
                onChange={e => setFormData({ ...formData, assignedDesignerId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="">-- Unassigned (Auto Queue) --</option>
                {designers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization?.split('&')[0] || 'CAD Specialist'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Payment (If editing) */}
          {editingCase && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Workflow Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="NEW">NEW</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_DESIGN">IN_DESIGN</option>
                  <option value="QC">QC</option>
                  <option value="APPROVAL">APPROVAL</option>
                  <option value="REVISION">REVISION</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Payment Status</label>
                <select
                  value={formData.paymentStatus}
                  onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Clinical Instructions & Notes</label>
            <textarea
              rows={2}
              value={formData.instructions}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="e.g. 50µm cement spacer, heavy buccal contour, anatomical lingual cingulum..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Action Buttons */}
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
              {saving ? 'Saving...' : editingCase ? 'Update Case' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
