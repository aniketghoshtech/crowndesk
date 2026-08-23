import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { PaymentRecord, InvoiceRecord } from '../models/types';

export const paymentsRouter = express.Router();
export const invoicesRouter = express.Router();

// ==========================================
// Invoices Router (Handles /api/invoices and /api/payments/invoices)
// ==========================================

function handleGetInvoices(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot access financial invoices.' });
      return;
    }

    const allInvoices = db.getAllInvoices();
    let permittedInvoices = allInvoices;

    if (user.role === 'DOCTOR_LAB') {
      // STRICT CUSTOMER ISOLATION: Customer A can NEVER see Customer B's invoices
      permittedInvoices = allInvoices.filter(i => i.customerId === user.id);
    }

    const caseId = req.query.caseId as string | undefined;
    if (caseId) {
      permittedInvoices = permittedInvoices.filter(i => i.caseId === caseId);
    }

    res.json({ invoices: permittedInvoices });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
}

function handleGetInvoiceById(req: Request, res: Response): void {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot access financial invoices.' });
      return;
    }

    const invoice = db.findInvoiceById(req.params.id);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found.' });
      return;
    }

    if (user.role === 'DOCTOR_LAB' && invoice.customerId !== user.id) {
      res.status(403).json({ error: 'Access forbidden. You cannot access invoices of other customers.' });
      return;
    }

    res.json({ invoice });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoice.' });
  }
}

invoicesRouter.get('/', handleGetInvoices);
invoicesRouter.get('/:id', handleGetInvoiceById);

// ==========================================
// Payments Router (Handles /api/payments)
// ==========================================

// 1. GET /api/payments/public-config or /api/payments/upi/config - Public / Customer UPI Payment Info
function handleGetUpiConfig(req: Request, res: Response): void {
  try {
    const raw = db.getRawPaymentSettings();
    const upi = raw.providers.upi || {
      id: 'gw-upi',
      provider: 'UPI',
      name: 'CrownDesk UPI Payment',
      enabled: true,
      businessName: 'CrownDesk Dental Technologies',
      upiId: '9058322251@kotakbank',
      upiDisplayName: 'CrownDesk Digital Dental Lab (Anurag Nishad)',
      upiQrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=9058322251@kotakbank&pn=CrownDesk%20Dental%20CAD&cu=INR',
      currency: 'INR',
      upiInstructions: 'Scan with Google Pay, PhonePe, Paytm, BHIM, Cred, or Amazon Pay. Enter the 12-digit UPI UTR / Reference ID and upload payment screenshot for reconciliation.',
      verificationMode: 'MANUAL_ADMIN'
    };

    res.json({
      providers: {
        upi: {
          id: upi.id,
          provider: 'UPI',
          name: upi.name,
          enabled: upi.enabled,
          businessName: upi.businessName || 'CrownDesk Dental Technologies',
          upiId: upi.upiId || '9058322251@kotakbank',
          upiDisplayName: upi.upiDisplayName || 'CrownDesk Digital Dental Lab (Anurag Nishad)',
          upiQrImageUrl: upi.upiQrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upi.upiId || '9058322251@kotakbank')}&pn=CrownDesk%20Dental%20CAD&cu=INR`,
          currency: upi.currency || 'INR',
          upiInstructions: upi.upiInstructions || 'Scan with any UPI app (GPay, PhonePe, Paytm, BHIM). Enter the 12-digit UPI Reference ID (UTR) and submit.',
          verificationMode: upi.verificationMode || 'MANUAL_ADMIN'
        }
      },
      settlement: {
        businessName: raw.settlement?.businessName || 'CrownDesk Dental CAD Lab & Technologies',
        businessEmail: raw.settlement?.businessEmail || 'supportcrwundesk@gmail.com',
        businessPhone: raw.settlement?.businessPhone || '+91 9058322251',
        country: raw.settlement?.country || 'India',
        settlementCurrency: raw.settlement?.settlementCurrency || 'INR'
      },
      policy: raw.policy || {
        paymentTiming: 'BEFORE_FINAL_DOWNLOAD',
        defaultCurrency: 'INR',
        enableGST: true,
        gstRatePercent: 18
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payment configuration.' });
  }
}

paymentsRouter.get('/public-config', handleGetUpiConfig);
paymentsRouter.get('/upi/config', handleGetUpiConfig);
paymentsRouter.get('/config', handleGetUpiConfig);

// 2. POST /api/payments/upi/submit - Submit UPI Payment (UTR & Screenshot Proof)
paymentsRouter.post('/upi/submit', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in to submit payment.' });
      return;
    }

    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot submit or process payments.' });
      return;
    }

    const {
      caseId,
      upiTransactionId,
      transactionId,
      paymentScreenshot,
      proofUrl,
      notes = ''
    } = req.body;

    const utr = (upiTransactionId || transactionId || '').trim();

    if (!caseId) {
      res.status(400).json({ error: 'Case ID is required.' });
      return;
    }

    if (!utr) {
      res.status(400).json({ error: 'UPI Reference ID (UTR / Transaction ID) is required.' });
      return;
    }

    const caseRec = db.findCaseById(caseId);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    if (caseRec.customerId !== user.id && user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Unauthorized to submit payment for this case.' });
      return;
    }

    const now = new Date().toISOString();
    const paymentId = `pay_upi_${Date.now()}`;
    const invoiceNum = caseRec.invoiceId || db.generateNextInvoiceNumber();
    const screenshot = paymentScreenshot || proofUrl || '';

    // Check payment verification mode from settings
    const settings = db.getRawPaymentSettings();
    const isInstant = settings.providers?.upi?.verificationMode === 'INSTANT_PREVIEW' || caseRec.finalTotalAmount === 0;

    const initialStatus: 'UNDER_REVIEW' | 'PAID' = isInstant ? 'PAID' : 'UNDER_REVIEW';

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      caseId: caseRec.id,
      case_id: caseRec.id,
      customerId: caseRec.customerId,
      customer_id: caseRec.customerId,
      customerName: caseRec.customerName,
      customer_name: caseRec.customerName,
      customerClinic: caseRec.customerClinic,
      serviceName: caseRec.serviceName,
      service_name: caseRec.serviceName,
      amount: caseRec.finalTotalAmount,
      currency: caseRec.currency || 'INR',
      paymentMethod: 'UPI',
      payment_method: 'UPI',
      upiTransactionId: utr,
      upi_transaction_id: utr,
      transactionId: utr,
      paymentScreenshot: screenshot || undefined,
      payment_screenshot: screenshot || undefined,
      paymentProofUrl: screenshot || undefined,
      status: initialStatus,
      invoiceId: invoiceNum,
      notes: notes || undefined,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now
    };

    if (isInstant) {
      paymentRecord.verifiedBy = 'Auto-Reconciliation Engine';
      paymentRecord.verifiedAt = now;
    }

    db.addPayment(paymentRecord);

    // Update Case record
    const previousStatus = caseRec.status;
    caseRec.paymentStatus = initialStatus;
    caseRec.paymentId = paymentId;
    caseRec.invoiceId = invoiceNum;
    if (isInstant) {
      caseRec.finalStlUnlocked = true;
      if (caseRec.status === 'NEW') {
        caseRec.status = 'RECEIVED';
      }
    }
    caseRec.updatedAt = now;

    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus: caseRec.status,
      action: isInstant ? 'UPI Payment Verified Instantly' : 'UPI Payment Submitted for Verification',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: isInstant
        ? `UPI payment of ₹${caseRec.finalTotalAmount} (UTR: ${utr}) auto-verified. Invoice ${invoiceNum} generated.`
        : `Customer submitted UPI payment of ₹${caseRec.finalTotalAmount} (UTR: ${utr}). Under review by CrownDesk admin.`
    });

    db.updateCase(caseRec.id, caseRec);

    // If instant verified, generate invoice
    if (isInstant) {
      const invoiceRecord: InvoiceRecord = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invoiceNum,
        caseId: caseRec.id,
        customerId: caseRec.customerId,
        customerName: caseRec.customerName,
        customerClinic: caseRec.customerClinic,
        customerEmail: caseRec.customerEmail || user.email,
        customerPhone: caseRec.customerPhone || user.phone || '+91 9058322251',
        customerAddress: user.address || 'Medical Facility',
        serviceName: caseRec.serviceName,
        unitsQuantity: caseRec.unitsQuantity,
        unitPrice: caseRec.unitPrice,
        currency: caseRec.currency || 'INR',
        subtotal: caseRec.subtotal,
        discount: caseRec.discountAmount,
        offerDeduction: caseRec.offerDiscountAmount,
        taxAmount: caseRec.taxAmount,
        totalAmount: caseRec.finalTotalAmount,
        paymentId: paymentRecord.id,
        paymentGateway: 'CrownDesk UPI Payment (Verified)',
        paymentStatus: 'PAID',
        issuedAt: now,
        paidAt: now
      };
      db.addInvoice(invoiceRecord);
    }

    // Security & Compliance Audit Log
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPI_PAYMENT_SUBMITTED',
      caseId: caseRec.id,
      targetId: paymentId,
      details: `Customer submitted UPI payment of ₹${caseRec.finalTotalAmount} (UTR: ${utr}). Status: ${initialStatus}.`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    // Notify Super Admin
    const superAdmin = db.getAllUsers().find(u => u.role === 'SUPER_ADMIN');
    if (superAdmin) {
      db.createNotification({
        userId: superAdmin.id,
        title: `UPI Payment Received: ${caseRec.id}`,
        message: `${user.name} submitted UPI payment ₹${caseRec.finalTotalAmount} (UTR: ${utr}). Please verify in Payments Ledger.`,
        link: `/admin`,
        type: 'INFO'
      });
    }

    res.status(201).json({
      message: isInstant
        ? 'UPI payment verified successfully! Invoice generated and final files unlocked.'
        : 'UPI payment submitted successfully. CrownDesk administration will review and confirm within minutes.',
      payment: paymentRecord,
      case: caseRec,
      invoiceNumber: invoiceNum
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit UPI payment.' });
  }
});

// Backward-compatible aliases for submission
paymentsRouter.post('/manual-proof', (req: Request, res: Response, next: any): void => {
  (paymentsRouter as any).handle({ ...req, url: '/upi/submit' }, res, next);
});

paymentsRouter.post('/verify', (req: Request, res: Response, next: any): void => {
  (paymentsRouter as any).handle({ ...req, url: '/upi/submit' }, res, next);
});

// 3. GET /api/payments/invoices and /api/payments/invoices/:id
paymentsRouter.get('/invoices', handleGetInvoices);
paymentsRouter.get('/invoices/:id', handleGetInvoiceById);

// 4. GET /api/payments - List Payments with Strict Customer & Employee Isolation
paymentsRouter.get('/', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // STRICT EMPLOYEE PROTECTION: Employees CANNOT see payments or financial data
    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot access financial records or payment histories.' });
      return;
    }

    const allPayments = db.getAllPayments();
    let permittedPayments = allPayments;

    if (user.role === 'DOCTOR_LAB') {
      permittedPayments = allPayments.filter(p => p.customerId === user.id);
    }

    const caseId = req.query.caseId as string | undefined;
    if (caseId) {
      permittedPayments = permittedPayments.filter(p => p.caseId === caseId);
    }

    res.json({ payments: permittedPayments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// 5. GET /api/payments/case/:caseId - Payment for a Specific Case
paymentsRouter.get('/case/:caseId', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot access payment records.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.caseId);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    if (user.role === 'DOCTOR_LAB' && caseRec.customerId !== user.id) {
      res.status(403).json({ error: 'Access forbidden.' });
      return;
    }

    const payments = db.getAllPayments().filter(p => p.caseId === caseRec.id);
    const latestPayment = payments[payments.length - 1] || null;

    res.json({ payment: latestPayment, payments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch case payment.' });
  }
});

// 6. GET /api/payments/:id - Single Payment Record
paymentsRouter.get('/:id', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot access payment records.' });
      return;
    }

    const payment = db.findPaymentById(req.params.id);
    if (!payment) {
      res.status(404).json({ error: 'Payment record not found.' });
      return;
    }

    if (user.role === 'DOCTOR_LAB' && payment.customerId !== user.id) {
      res.status(403).json({ error: 'Access forbidden. You cannot access payment records of other customers.' });
      return;
    }

    res.json({ payment });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payment record.' });
  }
});

export default paymentsRouter;
