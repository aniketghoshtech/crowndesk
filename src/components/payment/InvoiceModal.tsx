import React from 'react';
import { InvoiceRecord } from '../../types';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '../brand/Logo';

interface InvoiceModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 print:m-0 print:p-0 print:shadow-none">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 print:hidden">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Official Tax Invoice
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <Logo theme="light" size="md" />
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              <p className="font-semibold">CrownDesk Dental CAD Technologies Pvt. Ltd.</p>
              <p>Specialized Dental CAD/CAM Design Services</p>
              <p>GSTIN: 07AAACC4451M1Z4 • SAC: 998319</p>
              <p>Email: billing@crowndesk.in • Phone: +91 90583 22251</p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">TAX INVOICE</h2>
            <p className="text-xs font-mono font-bold text-blue-600 mt-1">
              Invoice #{invoice.invoiceNumber}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: {new Date(invoice.issuedAt).toLocaleDateString()}
            </p>
            <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-2 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{invoice.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Bill To Info */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-6 text-xs border border-slate-100">
          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
              Billed To:
            </span>
            <p className="font-bold text-slate-900 text-sm">{invoice.customerClinic || invoice.customerName}</p>
            <p className="text-slate-600">Attn: {invoice.customerName}</p>
            <p className="text-slate-600">{invoice.customerEmail}</p>
            <p className="text-slate-600">{invoice.customerPhone || '+91 90583 22251'}</p>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
              Case & Payment Details:
            </span>
            <p className="text-slate-700"><span className="font-semibold">Case Reference:</span> {invoice.caseId}</p>
            <p className="text-slate-700"><span className="font-semibold">Gateway:</span> {invoice.paymentGateway}</p>
            <p className="text-slate-700"><span className="font-semibold">Payment ID:</span> {invoice.paymentId}</p>
            <p className="text-slate-700"><span className="font-semibold">Paid On:</span> {(invoice.paidAt || invoice.issuedAt) ? new Date(invoice.paidAt || invoice.issuedAt).toLocaleString() : 'N/A'}</p>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full text-xs mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-600">
              <th className="text-left py-2 font-bold uppercase text-[10px]">Description</th>
              <th className="text-center py-2 font-bold uppercase text-[10px]">SAC Code</th>
              <th className="text-center py-2 font-bold uppercase text-[10px]">Qty</th>
              <th className="text-right py-2 font-bold uppercase text-[10px]">Rate</th>
              <th className="text-right py-2 font-bold uppercase text-[10px]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-3">
                <p className="font-bold text-slate-900">{invoice.serviceName} CAD Design</p>
                <p className="text-[11px] text-slate-500">Precision 3D Dental CAD Modeling & STL Generation</p>
              </td>
              <td className="text-center py-3 font-mono text-slate-600">998319</td>
              <td className="text-center py-3 font-bold">{invoice.unitsQuantity}</td>
              <td className="text-right py-3">₹{invoice.unitPrice}</td>
              <td className="text-right py-3 font-bold">₹{invoice.subtotal}</td>
            </tr>
          </tbody>
        </table>

        {/* Financial Calculation */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal}</span>
            </div>
            {Number(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>- ₹{invoice.discount}</span>
              </div>
            )}
            {Number(invoice.offerDeduction || 0) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Promotional Discount:</span>
                <span>- ₹{invoice.offerDeduction}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (18% Dental Tech):</span>
              <span>₹{invoice.taxAmount}</span>
            </div>
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-900">
              <span>Total Paid:</span>
              <span>₹{invoice.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
          <p>Thank you for choosing CrownDesk! This is a computer-generated tax invoice and requires no physical signature.</p>
          <p className="mt-0.5">CrownDesk CAD Platform • support@crowndesk.in • Terms & Conditions apply.</p>
        </div>
      </div>
    </div>
  );
};
