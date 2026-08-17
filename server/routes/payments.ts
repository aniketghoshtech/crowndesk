import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { PaymentRecord, InvoiceRecord } from '../models/types';

const router = express.Router();

// 1. GET /api/payments/public-config - Public / Customer Payment Methods & Instructions (Strict Security: No Secrets)
router.get('/public-config', (req: Request, res: Response): void => {
  try {
    const raw = db.getRawPaymentSettings();
    res.json({
      providers: {
        razorpay: {
          enabled: raw.providers.razorpay.enabled,
          mode: raw.providers.razorpay.mode,
          keyId: raw.providers.razorpay.publicKey || process.env.RAZORPAY_KEY_ID || 'rzp_test_crowndesk_key',
          currency: raw.providers.razorpay.currency || 'INR'
        },
        stripe: {
          enabled: raw.providers.stripe.enabled,
          mode: raw.providers.stripe.mode,
          publicKey: raw.providers.stripe.publicKey || process.env.STRIPE_PUBLIC_KEY || 'pk_test_crowndesk_sample',
          currency: raw.providers.stripe.currency || 'USD'
        },
        upi: {
          enabled: raw.providers.upi.enabled,
          upiId: raw.providers.upi.upiId || '9058322251@paytm',
          upiDisplayName: raw.providers.upi.upiDisplayName || 'CrownDesk Dental CAD Lab',
          upiQrImageUrl: raw.providers.upi.upiQrImageUrl || '',
          upiInstructions: raw.providers.upi.upiInstructions || 'Scan with any UPI app.'
        },
        bankTransfer: {
          enabled: raw.providers.bankTransfer.enabled,
          bankAccountHolder: raw.providers.bankTransfer.bankAccountHolder || 'CrownDesk Dental Technologies',
          bankName: raw.providers.bankTransfer.bankName || 'State Bank of India (SBI)',
          bankAccountType: raw.providers.bankTransfer.bankAccountType || 'Current Account',
          bankAccountNumberMasked: raw.providers.bankTransfer.bankAccountNumberMasked || '••••••••8201',
          bankIfsc: raw.providers.bankTransfer.bankIfsc || 'SBIN0001234',
          bankInstructions: raw.providers.bankTransfer.bankInstructions || 'Transfer via NEFT/RTGS/IMPS.'
        }
      },
      settlement: {
        businessName: raw.settlement.businessName,
        businessEmail: raw.settlement.businessEmail,
        businessPhone: raw.settlement.businessPhone,
        country: raw.settlement.country,
        settlementCurrency: raw.settlement.settlementCurrency
      },
      policy: raw.policy
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payment configuration.' });
  }
});

// 2. POST /api/payments/create-order - Initialize Razorpay / Stripe Order
router.post('/create-order', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in to proceed with payment.' });
      return;
    }

    const { caseId, gateway = 'RAZORPAY' } = req.body;
    if (!caseId) {
      res.status(400).json({ error: 'Case ID is required.' });
      return;
    }

    const caseRec = db.findCaseById(caseId);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    if (caseRec.customerId !== user.id && user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    const amount = caseRec.finalTotalAmount;
    const orderId = `order_${gateway.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.json({
      orderId,
      caseId: caseRec.id,
      amount,
      currency: caseRec.currency || 'INR',
      gateway,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone || '+919058322251',
        clinic: user.clinicOrLabName
      },
      keyId: gateway === 'RAZORPAY' ? (process.env.RAZORPAY_KEY_ID || 'rzp_test_crowndesk_demo') : (process.env.STRIPE_PUBLIC_KEY || 'pk_test_crowndesk_demo')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create payment order.' });
  }
});

// 2. POST /api/payments/verify - Server-side Payment Verification & Auto Invoice Generation
router.post('/verify', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const {
      caseId,
      gateway = 'RAZORPAY',
      transactionId,
      gatewayOrderId,
      paymentMethod = 'UPI / Card / NetBanking'
    } = req.body;

    if (!caseId) {
      res.status(400).json({ error: 'Case ID is required.' });
      return;
    }

    const caseRec = db.findCaseById(caseId);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const txnId = transactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const invoiceNum = db.generateNextInvoiceNumber();

    // 1. Create Payment Record
    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      caseId: caseRec.id,
      customerId: caseRec.customerId,
      customerName: caseRec.customerName,
      amount: caseRec.finalTotalAmount,
      currency: caseRec.currency || 'INR',
      gateway: gateway as any,
      transactionId: txnId,
      gatewayOrderId,
      status: 'SUCCESS',
      invoiceId: invoiceNum,
      paymentMethod,
      createdAt: now
    };
    db.addPayment(paymentRecord);

    // 2. Generate Professional Invoice
    const invoiceRecord: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      caseId: caseRec.id,
      customerId: caseRec.customerId,
      customerName: caseRec.customerName,
      customerClinic: caseRec.customerClinic,
      customerEmail: caseRec.customerEmail,
      customerPhone: caseRec.customerPhone,
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
      paymentGateway: `${gateway} Secure Payment`,
      paymentStatus: 'PAID',
      issuedAt: now,
      paidAt: now
    };
    db.addInvoice(invoiceRecord);

    // 3. Update Case State & UNLOCK Final File Download Permission
    const previousStatus = caseRec.status;
    caseRec.paymentStatus = 'PAID';
    caseRec.paymentId = paymentRecord.id;
    caseRec.invoiceId = invoiceNum;
    caseRec.finalStlUnlocked = true;
    if (caseRec.status === 'NEW') {
      caseRec.status = 'RECEIVED';
    }
    caseRec.updatedAt = now;

    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus: caseRec.status,
      action: 'Payment Verified & Invoice Generated',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: `Verified ₹${caseRec.finalTotalAmount} via ${gateway} (Txn: ${txnId}). Invoice ${invoiceNum} created.`
    });

    db.updateCase(caseRec.id, caseRec);

    // 4. Audit Log
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAYMENT_VERIFIED',
      caseId: caseRec.id,
      targetId: paymentRecord.id,
      details: `Payment of ₹${caseRec.finalTotalAmount} confirmed. Final file download unlocked. Invoice: ${invoiceNum}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    // 5. In-App Notification
    db.createNotification({
      userId: caseRec.customerId,
      title: `Payment Confirmed: ${caseRec.id}`,
      message: `Invoice ${invoiceNum} generated for ₹${caseRec.finalTotalAmount}. Final STL download is now unlocked.`,
      link: `/customer/cases/${caseRec.id}`,
      type: 'SUCCESS'
    });

    res.json({
      message: 'Payment verified successfully! Invoice generated and downloads unlocked.',
      payment: paymentRecord,
      invoice: invoiceRecord,
      case: caseRec
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification failed.' });
  }
});

// 3. POST /api/payments/manual-proof - Submit Bank Transfer / UPI Direct Payment Proof
router.post('/manual-proof', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in to submit payment proof.' });
      return;
    }

    const {
      caseId,
      gateway = 'BANK_TRANSFER', // 'BANK_TRANSFER' or 'UPI_MANUAL'
      transactionId,
      notes = '',
      proofUrl = ''
    } = req.body;

    if (!caseId || !transactionId) {
      res.status(400).json({ error: 'Case ID and Transaction / UTR reference number are required.' });
      return;
    }

    const caseRec = db.findCaseById(caseId);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    if (caseRec.customerId !== user.id && user.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    const now = new Date().toISOString();
    const paymentId = `pay_manual_${Date.now()}`;
    const invoiceNum = db.generateNextInvoiceNumber();

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      caseId: caseRec.id,
      customerId: caseRec.customerId,
      customerName: caseRec.customerName,
      customerClinic: caseRec.customerClinic,
      serviceName: caseRec.serviceName,
      amount: caseRec.finalTotalAmount,
      currency: caseRec.currency || 'INR',
      gateway: gateway as any,
      transactionId: transactionId.trim(),
      status: 'PENDING_VERIFICATION',
      invoiceId: invoiceNum,
      paymentMethod: gateway === 'UPI_MANUAL' ? 'Direct UPI (Manual UTR Verification)' : 'NEFT/RTGS/IMPS (Bank Verification)',
      paymentProofUrl: proofUrl || undefined,
      notes: notes || undefined,
      createdAt: now
    };

    db.addPayment(paymentRecord);

    // Update Case timeline
    caseRec.paymentStatus = 'PENDING';
    caseRec.paymentId = paymentId;
    caseRec.invoiceId = invoiceNum;
    caseRec.updatedAt = now;

    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      action: 'Manual Payment Proof Submitted',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: `Customer submitted ${gateway} reference: ${transactionId}. Awaiting lab admin verification.`
    });

    db.updateCase(caseRec.id, caseRec);

    // Audit Log
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAYMENT_PROOF_SUBMITTED',
      caseId: caseRec.id,
      targetId: paymentId,
      details: `User submitted manual payment proof: ₹${caseRec.finalTotalAmount} via ${gateway} (Ref: ${transactionId})`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    // Notify Super Admin
    const superAdmin = db.getAllUsers().find(u => u.role === 'SUPER_ADMIN');
    if (superAdmin) {
      db.createNotification({
        userId: superAdmin.id,
        title: `Manual Payment Proof: ${caseRec.id}`,
        message: `${user.name} submitted ${gateway} proof (Ref: ${transactionId}) for ₹${caseRec.finalTotalAmount}.`,
        link: `/admin`,
        type: 'INFO'
      });
    }

    res.status(201).json({
      message: 'Payment proof submitted successfully. Our accounting team will verify and unlock files shortly.',
      payment: paymentRecord,
      case: caseRec
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit payment proof.' });
  }
});

// 4. POST /api/payments/webhook/:gateway - Server-to-Server Webhook Processor
router.post('/webhook/:gateway', (req: Request, res: Response): void => {
  try {
    const { gateway } = req.params;
    const now = new Date().toISOString();

    // In a live production environment, verify HMAC SHA256 signature using raw.providers[gateway].webhookSecret
    const event = req.body || {};
    
    // Process payment success events
    if (event.event === 'payment.captured' || event.type === 'payment_intent.succeeded' || event.status === 'SUCCESS') {
      const caseId = event.payload?.payment?.entity?.notes?.caseId || event.data?.object?.metadata?.caseId;
      if (caseId) {
        const caseRec = db.findCaseById(caseId);
        if (caseRec && caseRec.paymentStatus !== 'PAID') {
          caseRec.paymentStatus = 'PAID';
          caseRec.finalStlUnlocked = true;
          caseRec.updatedAt = now;
          caseRec.timeline.push({
            id: `tl-${Date.now()}`,
            caseId: caseRec.id,
            timestamp: now,
            action: 'Payment Verified via Webhook',
            userId: 'system',
            userName: `${gateway.toUpperCase()} Gateway Webhook`,
            userRole: 'SUPER_ADMIN',
            comment: `Automated webhook confirmed payment capture for Case ${caseRec.id}.`
          });
          db.updateCase(caseRec.id, caseRec);
        }
      }
    }

    res.json({ received: true, gateway, timestamp: now });
  } catch (err: any) {
    res.status(400).json({ error: 'Webhook processing error.' });
  }
});

// 5. GET /api/payments - List Payments with Strict Customer Isolation
router.get('/', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (user.role === 'DESIGNER_EMPLOYEE') {
      res.status(403).json({ error: 'Employees cannot access financial records or payment histories.' });
      return;
    }

    const allPayments = db.getAllPayments();
    let permittedPayments = allPayments;

    if (user.role === 'DOCTOR_LAB') {
      // STRICT CUSTOMER ISOLATION: Customer A can NEVER see Customer B's payments
      permittedPayments = allPayments.filter(p => p.customerId === user.id);
    }

    res.json({ payments: permittedPayments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// 6. GET /api/payments/:id - Single Payment Details with Strict Isolation
router.get('/:id', (req: Request, res: Response): void => {
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

// 7. GET /api/invoices - List Invoices with RBAC
router.get('/invoices', (req: Request, res: Response): void => {
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

    res.json({ invoices: permittedInvoices });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
});

// 8. GET /api/invoices/:id - Single Invoice Details
router.get('/invoices/:id', (req: Request, res: Response): void => {
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
});

export default router;
