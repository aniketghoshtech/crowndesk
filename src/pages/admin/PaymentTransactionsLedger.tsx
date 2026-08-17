import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PaymentRecord } from '../../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  Check,
  X,
  RotateCcw,
  Building,
  QrCode,
  FileText,
  DollarSign,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const PaymentTransactionsLedger: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Modals / Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; paymentId: string; reason: string }>({
    open: false,
    paymentId: '',
    reason: 'UTR transaction number not found in bank ledger.'
  });
  const [refundModal, setRefundModal] = useState<{ open: boolean; paymentId: string; reason: string }>({
    open: false,
    paymentId: '',
    reason: 'Customer requested case cancellation.'
  });
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPayments();
  }, [statusFilter, gatewayFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setActionMsg(null);
      const res = await api.getAdminPayments({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        gateway: gatewayFilter !== 'ALL' ? gatewayFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      setPayments(res.payments || []);
      setTotalRevenue(res.totalRevenue || 0);
      setPendingCount(res.pendingCount || 0);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to load payments' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  const handleApprove = async (paymentId: string) => {
    try {
      setActionLoading(true);
      setActionMsg(null);
      await api.approveAdminPayment(paymentId);
      setActionMsg({ type: 'success', text: 'Payment verified & approved! Case STL files unlocked and invoice issued.' });
      loadPayments();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to approve payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.paymentId) return;
    try {
      setActionLoading(true);
      setActionMsg(null);
      await api.rejectAdminPayment(rejectModal.paymentId, rejectModal.reason);
      setRejectModal({ open: false, paymentId: '', reason: '' });
      setActionMsg({ type: 'success', text: 'Payment rejected. Customer notified to re-submit.' });
      loadPayments();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to reject payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundConfirm = async () => {
    if (!refundModal.paymentId) return;
    try {
      setActionLoading(true);
      setActionMsg(null);
      await api.refundAdminPayment(refundModal.paymentId, refundModal.reason);
      setRefundModal({ open: false, paymentId: '', reason: '' });
      setActionMsg({ type: 'success', text: 'Payment refunded successfully.' });
      loadPayments();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to refund payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getGatewayIcon = (gateway: string) => {
    switch (gateway) {
      case 'RAZORPAY':
        return <span className="w-6 h-6 rounded bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">R</span>;
      case 'STRIPE':
        return <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">S</span>;
      case 'UPI_MANUAL':
        return <QrCode className="w-5 h-5 text-emerald-600" />;
      case 'BANK_TRANSFER':
        return <Building className="w-5 h-5 text-amber-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            PAID / SUCCESS
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1" />
            NEEDS VERIFICATION
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <X className="w-3.5 h-3.5 mr-1" />
            FAILED / REJECTED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            REFUNDED
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6" id="admin-payments-ledger">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{(totalRevenue ?? 0).toLocaleString('en-IN')}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">100% Real-time reconciliation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Awaiting Admin Verification</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingCount}</p>
          <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Manual Bank / UPI Transfers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settlement Gateway Security</span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 mt-2">Zero-Storage Compliant</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Razorpay • Stripe • Direct UPI • NEFT</span>
        </div>
      </div>

      {/* Action Message Banner */}
      {actionMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center space-x-2 ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID, Txn/UTR, Doctor name, or Invoice..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PENDING_VERIFICATION">Needs Verification</option>
              <option value="SUCCESS">Success / Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed / Rejected</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Gateway Filter */}
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">All Gateways</option>
              <option value="RAZORPAY">Razorpay (Cards/UPI)</option>
              <option value="STRIPE">Stripe International</option>
              <option value="UPI_MANUAL">Direct UPI Transfer</option>
              <option value="BANK_TRANSFER">Bank NEFT/RTGS/IMPS</option>
            </select>

            <button
              onClick={loadPayments}
              className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Transaction / Case</th>
                <th className="py-3.5 px-4">Doctor / Clinic</th>
                <th className="py-3.5 px-4">Gateway & Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                    <span>Loading payment transactions ledger...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment records found matching your filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.caseId}</div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                        <span>Ref: {p.transactionId || p.id}</span>
                      </div>
                      {p.invoiceId && (
                        <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {p.invoiceId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{p.customerName}</div>
                      <div className="text-xs text-slate-500">{p.customerClinic || 'Dental Clinic'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        {getGatewayIcon(p.gateway)}
                        <div>
                          <div className="font-medium text-slate-800 text-xs">{p.gateway}</div>
                          <div className="text-[11px] text-slate-500">{p.paymentMethod || 'Online'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {p.currency === 'USD' ? '$' : '₹'}{(p.amount ?? 0).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status)}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Payment Details & Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* If Pending Verification: Show Approve and Reject */}
                        {p.status === 'PENDING_VERIFICATION' && (
                          <>
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                              title="Approve Bank/UPI Transfer and unlock files"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, paymentId: p.id, reason: 'Transaction reference not found in bank ledger.' })}
                              disabled={actionLoading}
                              className="px-2 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
                              title="Reject invalid payment proof"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* If Success: Allow Refund */}
                        {p.status === 'SUCCESS' && (
                          <button
                            onClick={() => setRefundModal({ open: true, paymentId: p.id, reason: 'Customer requested case cancellation.' })}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Issue Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Payment Transaction Details</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedPayment.id}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Case ID</span>
                <span className="font-bold text-slate-900">{selectedPayment.caseId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-medium text-slate-900">{selectedPayment.customerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-black text-slate-900 text-base">
                  {selectedPayment.currency === 'USD' ? '$' : '₹'}{selectedPayment.amount}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gateway Provider</span>
                <span className="font-semibold text-slate-800">{selectedPayment.gateway}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction / UTR Ref</span>
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedPayment.transactionId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Status</span>
                {getStatusBadge(selectedPayment.status)}
              </div>
              {selectedPayment.invoiceId && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Official Tax Invoice</span>
                  <span className="font-mono text-teal-700 font-semibold">{selectedPayment.invoiceId}</span>
                </div>
              )}
              {selectedPayment.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <strong>Notes:</strong> {selectedPayment.notes}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Reject Payment Proof</h3>
            <p className="text-xs text-slate-500">Provide the reason for rejection. The customer will be notified to re-submit.</p>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectModal({ open: false, paymentId: '', reason: '' })}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Issue Payment Refund</h3>
            <p className="text-xs text-slate-500">This will mark the payment as refunded and lock download permissions on the associated case.</p>
            <textarea
              rows={3}
              value={refundModal.reason}
              onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRefundModal({ open: false, paymentId: '', reason: '' })}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundConfirm}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
