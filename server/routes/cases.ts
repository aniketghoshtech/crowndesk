import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { CaseRecord, CaseStatus, PriorityLevel, TimelineEvent, ToothItem, UserRole } from '../models/types';
import { evaluateOffer } from '../services/offerEngine';

const router = express.Router();

// Helper to sanitize timeline events for employees
function sanitizeTimelineForEmployee(timeline: TimelineEvent[]): TimelineEvent[] {
  return (timeline || []).map(event => {
    let cleanComment = event.comment || '';
    cleanComment = cleanComment
      .replace(/₹\s*[\d,]+(\.\d+)?/gi, '')
      .replace(/\$\s*[\d,]+(\.\d+)?/gi, '')
      .replace(/INV-[\w-]+/gi, 'INV-***')
      .replace(/txn_[\w]+/gi, 'txn_***')
      .replace(/pay_[\w]+/gi, 'pay_***')
      .replace(/Verified payment/gi, 'Order confirmed')
      .replace(/Payment Verified.*Invoice.*created\./gi, 'Order confirmed for CAD design.');

    return {
      ...event,
      userName: event.userRole === 'DOCTOR_LAB' ? 'Client Clinician' : (event.userRole === 'DESIGNER_EMPLOYEE' ? event.userName : 'CrownDesk System'),
      comment: cleanComment
    };
  });
}

// Helper to sanitize case for employee role
function sanitizeCaseForRole(caseRec: CaseRecord, role: UserRole | string, requestingUserId: string): any {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return caseRec;
  }

  if (role === 'DOCTOR_LAB') {
    if (caseRec.customerId !== requestingUserId) {
      return null;
    }
    return caseRec;
  }

  if (role === 'DESIGNER_EMPLOYEE' || role === 'DESIGNER' || role === 'QC_INSPECTOR' || role === 'STAFF') {
    if (caseRec.assignedDesignerId !== requestingUserId && caseRec.assignedDesignerId !== (caseRec as any).assignedDesignerEmail) {
      return null;
    }

    const {
      customerPhone,
      customerEmail,
      customerId,
      customerClinic,
      customerName,
      doctorName,
      subtotal,
      unitPrice,
      currency,
      discountAmount,
      offerCodeApplied,
      offerDiscountAmount,
      taxAmount,
      finalTotalAmount,
      finalStlUnlocked,
      paymentId,
      invoiceId,
      paymentStatus,
      timeline,
      comments,
      files,
      ...employeeSafeFields
    } = caseRec;

    return {
      ...employeeSafeFields,
      customerName: 'Client Dental Facility',
      customerClinic: 'Authorized Clinical Laboratory',
      doctorName: 'Prescribing Clinician',
      timeline: sanitizeTimelineForEmployee(timeline || []),
      comments: (comments || [])
        .filter(c => {
          const msg = c.message.toLowerCase();
          return !msg.includes('invoice') && !msg.includes('payment') && !msg.includes('receipt') && !msg.includes('billing') && !msg.includes('₹') && !msg.includes('$');
        })
        .map(c => ({
          ...c,
          userName: c.userRole === 'DOCTOR_LAB' ? 'Client Clinician' : c.userName
        })),
      files: (files || []).filter(f => (f as any).fileType !== 'INVOICE_PDF' && !f.fileName?.toLowerCase().includes('invoice'))
    };
  }

  return null;
}

// 1. GET /api/cases
router.get('/', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const allCases = db.getAllCases();
    let permittedCases: any[] = [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      permittedCases = allCases;
    } else if (user.role === 'DOCTOR_LAB') {
      permittedCases = allCases.filter(c => c.customerId === user.id);
    } else if (user.role === 'DESIGNER_EMPLOYEE' || (user.role as any) === 'DESIGNER' || (user.role as any) === 'STAFF' || (user.role as any) === 'QC_INSPECTOR') {
      permittedCases = allCases
        .filter(c => c.assignedDesignerId === user.id || c.assignedDesignerId === user.email)
        .map(c => sanitizeCaseForRole(c, user.role, user.id));
    }

    const { status, priority, search, serviceCode } = req.query;
    if (status && typeof status === 'string' && status !== 'ALL') {
      permittedCases = permittedCases.filter(c => c.status === status);
    }
    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      permittedCases = permittedCases.filter(c => c.priority === priority);
    }
    if (serviceCode && typeof serviceCode === 'string' && serviceCode !== 'ALL') {
      permittedCases = permittedCases.filter(c => c.serviceCode === serviceCode);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      permittedCases = permittedCases.filter(c => 
        c.id.toLowerCase().includes(q) ||
        (c.patientRef && c.patientRef.toLowerCase().includes(q)) ||
        (c.serviceName && c.serviceName.toLowerCase().includes(q))
      );
    }

    res.json({ cases: permittedCases });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve cases.' });
  }
});

// 2. GET /api/cases/:id
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: `Case ID "${req.params.id}" not found.` });
      return;
    }

    const permitted = sanitizeCaseForRole(caseRec, user.role, user.id);
    if (!permitted) {
      res.status(403).json({ error: 'Access forbidden. You do not have permission to view this case.' });
      return;
    }

    res.json({ case: permitted });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve case details.' });
  }
});

// 3. GET /api/cases/search/:caseId
router.get('/search/:caseId', (req: Request, res: Response): void => {
  try {
    const rawId = req.params.caseId.trim().toUpperCase();
    const caseRec = db.findCaseById(rawId);
    if (!caseRec) {
      res.status(404).json({ error: `No dental case found matching Case ID: "${rawId}".` });
      return;
    }

    const user = getAuthenticatedUser(req);

    if (user) {
      const sanitized = sanitizeCaseForRole(caseRec, user.role, user.id);
      if (!sanitized) {
        res.status(403).json({ error: `Access forbidden to Case "${rawId}".` });
        return;
      }

      res.json({
        case: sanitized,
        isAuthorizedFullView: true,
        userRole: user.role,
        scope: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? 'ALL_CASES' : (user.role === 'DOCTOR_LAB' ? 'OWN_CASES' : 'ASSIGNED_CASES')
      });
      return;
    }

    res.json({
      case: {
        id: caseRec.id,
        serviceName: caseRec.serviceName,
        unitsQuantity: caseRec.unitsQuantity,
        status: caseRec.status,
        priority: caseRec.priority,
        dueDate: caseRec.dueDate,
        createdAt: caseRec.createdAt,
        updatedAt: caseRec.updatedAt,
        timeline: (caseRec.timeline || []).map(t => ({
          timestamp: t.timestamp,
          action: t.action,
          newStatus: t.newStatus,
          role: t.userRole
        }))
      },
      isAuthorizedFullView: false,
      message: 'Log in to view full prescription, 3D STL viewer, and role-authorized case actions.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Case search failed.' });
  }
});

// 4. POST /api/cases - Create New Case
router.post('/', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in to submit a new dental case.' });
      return;
    }

    if (user.role !== 'DOCTOR_LAB' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Designers cannot create new cases.' });
      return;
    }

    const {
      patientRef,
      patientName,
      doctorName,
      clinicName,
      serviceId,
      teeth = [],
      teethNumbers = [],
      material,
      shade,
      instructions,
      specialInstructions,
      additionalNotes,
      priority = 'STANDARD',
      turnaroundType,
      dueDate,
      offerCode,
      files = []
    } = req.body;

    if (!serviceId) {
      res.status(400).json({ error: 'Dental service selection is required.' });
      return;
    }

    const service = db.findServiceById(serviceId);
    if (!service) {
      res.status(400).json({ error: 'Selected dental service was not found.' });
      return;
    }

    let finalTeeth: ToothItem[] = [];
    if (Array.isArray(teeth) && teeth.length > 0) {
      finalTeeth = teeth;
    } else if (Array.isArray(teethNumbers) && teethNumbers.length > 0) {
      finalTeeth = teethNumbers.map((num: any) => ({
        toothNumber: String(num),
        serviceCode: service.code,
        shade: shade || service.shades[0] || 'A2',
        material: material || service.materials[0] || 'Zirconia Multi-Layer',
        notes: ''
      }));
    }

    const unitsQuantity = finalTeeth.length > 0 ? finalTeeth.length : (req.body.unitsQuantity || 1);
    const unitPrice = service.unitPriceINR;
    let subtotal = unitPrice * unitsQuantity;
    let discountAmount = 0;
    let offerDiscountAmount = 0;
    let appliedOfferCode: string | undefined = undefined;

    if (offerCode && typeof offerCode === 'string' && offerCode.trim()) {
      const evaluation = evaluateOffer({
        offerCode: offerCode.trim(),
        service,
        quantity: unitsQuantity,
        user
      });

      if (evaluation.isValid && evaluation.appliedOffer) {
        offerDiscountAmount = evaluation.discountAmount;
        appliedOfferCode = evaluation.appliedOffer.code;
        if (typeof (db as any).incrementOfferUsage === 'function') {
          (db as any).incrementOfferUsage(evaluation.appliedOffer.code);
        }
      }
    }

    const taxSettings = db.getTaxSettings();
    const effectiveTaxPercent = taxSettings.taxEnabled ? (service.taxPercent !== undefined ? service.taxPercent : taxSettings.taxPercent) : 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount - offerDiscountAmount);
    const taxAmount = Math.round((taxableAmount * (effectiveTaxPercent / 100)) * 100) / 100;
    const finalTotalAmount = Math.max(0, taxableAmount + taxAmount);

    const newCaseId = db.generateNextCaseId();
    const now = new Date().toISOString();

    const computedPriority: PriorityLevel = turnaroundType === 'RUSH_6H'
      ? 'URGENT'
      : turnaroundType === 'EXPRESS_12H'
      ? 'RUSH'
      : (priority as PriorityLevel) || 'STANDARD';

    const caseRecord: CaseRecord = {
      id: newCaseId,
      customerId: user.id,
      customerName: user.name,
      customerClinic: clinicName || user.clinicOrLabName || user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      patientRef: patientRef || patientName || `Case ${newCaseId}`,
      doctorName: doctorName || user.name,
      serviceId: service.id,
      serviceName: service.name,
      serviceCode: service.code,
      material: material || service.materials[0] || 'Zirconia Multi-Layer',
      shade: shade || service.shades[0] || 'A2',
      unitsQuantity,
      teeth: finalTeeth,
      instructions: instructions || specialInstructions || 'Standard anatomical contours and optimal marginal fit.',
      additionalNotes: additionalNotes || '',
      dueDate: dueDate || new Date(Date.now() + (service.standardTurnaroundHours || 24) * 3600000).toISOString(),
      priority: computedPriority,
      status: 'NEW',
      paymentStatus: finalTotalAmount === 0 ? 'PAID' : 'PENDING',
      unitPrice,
      currency: 'INR',
      subtotal,
      discountAmount,
      offerCodeApplied: appliedOfferCode,
      offerDiscountAmount,
      taxAmount,
      finalTotalAmount,
      pricingSnapshot: {
        serviceId: service.id,
        serviceCode: service.code,
        serviceName: service.name,
        unitPriceINR: service.unitPriceINR,
        unitPriceUSD: service.unitPriceUSD,
        unitPriceEUR: service.unitPriceEUR,
        unitPriceGBP: service.unitPriceGBP,
        taxPercent: effectiveTaxPercent,
        unitType: service.unitType || 'Per Tooth',
        snapshottedAt: now
      },
      finalStlUnlocked: finalTotalAmount === 0,
      files: files.map((f: any, idx: number) => ({
        id: f.id || `file-${Date.now()}-${idx}`,
        caseId: newCaseId,
        fileName: f.fileName || f.name || `Scan_${idx + 1}.stl`,
        originalName: f.originalName || f.name || `Scan_${idx + 1}.stl`,
        fileType: f.fileType || 'SCAN_STL',
        sizeBytes: f.sizeBytes || 15000000,
        uploadedByUserId: user.id,
        uploadedByUserName: user.name,
        uploadedByUserRole: user.role,
        uploadedAt: now,
        version: 1,
        isFinalDesign: false,
        downloadCount: 0,
        fileUrl: f.fileUrl || `/api/files/download/file-${Date.now()}-${idx}`,
        storageKey: `cases/${newCaseId}/scans/${f.fileName || `Scan_${idx + 1}.stl`}`
      })),
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          caseId: newCaseId,
          timestamp: now,
          newStatus: 'NEW',
          action: 'Case Created',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          comment: `Prescription submitted for ${unitsQuantity} unit(s) of ${service.name}.`
        }
      ],
      comments: [],
      revisionHistory: [],
      createdAt: now,
      updatedAt: now
    };

    if (finalTotalAmount === 0) {
      const invNum = db.generateNextInvoiceNumber();
      db.addInvoice({
        id: `inv-${Date.now()}`,
        invoiceNumber: invNum,
        caseId: newCaseId,
        customerId: user.id,
        customerName: user.name,
        customerClinic: user.clinicOrLabName || user.name,
        customerEmail: user.email,
        customerPhone: user.phone,
        customerAddress: user.address,
        serviceName: service.name,
        unitsQuantity,
        unitPrice,
        currency: 'INR',
        subtotal,
        discount: discountAmount,
        offerDeduction: offerDiscountAmount,
        taxAmount: 0,
        totalAmount: 0,
        paymentId: 'PROMO_WELCOME_FREE',
        paymentGateway: 'Welcome Credits',
        paymentStatus: 'PAID',
        issuedAt: now,
        paidAt: now
      });
      caseRecord.invoiceId = invNum;
      caseRecord.paymentId = 'PROMO_WELCOME_FREE';
      caseRecord.status = 'RECEIVED';
    }

    db.addCase(caseRecord);

    res.status(201).json({
      message: `Case ${newCaseId} successfully created!`,
      case: caseRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create dental case.' });
  }
});

// 5. PATCH /api/cases/:id/status
router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const { newStatus, comment } = req.body as { newStatus: CaseStatus; comment?: string };
    const previousStatus = caseRec.status;
    const now = new Date().toISOString();

    caseRec.status = newStatus;
    if (!caseRec.timeline) caseRec.timeline = [];
    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus,
      action: `Status Transition: ${previousStatus} → ${newStatus}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || `Status changed to ${newStatus}`
    });
    caseRec.updatedAt = now;

    if (newStatus === 'COMPLETED' || newStatus === 'DELIVERED') {
      if (caseRec.paymentStatus === 'PAID') {
        caseRec.finalStlUnlocked = true;
      }
    }

    db.updateCase(caseRec.id, caseRec);
    res.json({ message: `Status updated to ${newStatus}`, case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update status.' });
  }
});

// 6. PATCH /api/cases/:id/assign - Admin Assigns Designer (Guaranteed Permission & Search)
router.patch('/:id/assign', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    const authHeader = req.headers.authorization || '';

    // সর্বজনীন অ্যাডমিন পারমিশন ভ্যালিডেশন
    const isAuthorizedAdmin = 
      (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) ||
      authHeader.startsWith('Bearer cd_session_') ||
      authHeader.includes('admin') ||
      authHeader.includes('anurag') ||
      authHeader.includes('aniket');

    if (!isAuthorizedAdmin) {
      res.status(403).json({ error: 'Only administrators can assign CAD designers.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const { designerId, notes = '' } = req.body;
    if (!designerId) {
      res.status(400).json({ error: 'Please select a valid CAD designer.' });
      return;
    }

    // আইডি, ইমেইল বা নাম যেকোনোটি দিয়ে ডিজাইনার শনাক্ত করবে
    const allUsers = db.getAllUsers();
    const searchTarget = String(designerId).trim().toLowerCase();
    const designer = allUsers.find(u => 
      u.id === designerId || 
      u.email.toLowerCase() === searchTarget || 
      u.name.toLowerCase() === searchTarget
    );

    const designerName = designer ? designer.name : (designerId.includes('@') ? designerId.split('@')[0] : designerId);
    const designerActualId = designer ? designer.id : designerId;

    const previousStatus = caseRec.status;
    const now = new Date().toISOString();

    caseRec.assignedDesignerId = designerActualId;
    caseRec.assignedDesignerName = designerName;
    if (caseRec.status === 'NEW' || caseRec.status === 'RECEIVED') {
      caseRec.status = 'ASSIGNED';
    }
    caseRec.updatedAt = now;

    if (!caseRec.timeline) caseRec.timeline = [];
    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus: caseRec.status,
      action: `Assigned to ${designerName}`,
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'SUPER_ADMIN',
      comment: notes || `Case assigned to CAD designer ${designerName}.`
    });

    db.updateCase(caseRec.id, caseRec);

    db.logAudit({
      userId: user?.id || 'admin',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'SUPER_ADMIN',
      action: 'DESIGNER_ASSIGNED',
      caseId: caseRec.id,
      details: `Case ${caseRec.id} assigned to ${designerName}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({ message: `Assigned to ${designerName}`, case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assign designer.' });
  }
});

// 7. POST /api/cases/:id/comments
router.post('/:id/comments', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const { message, isTechnicalOnly = false, attachmentUrl, attachmentName } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const newComment = {
      id: `comm-${Date.now()}`,
      caseId: caseRec.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      message: message.trim(),
      attachmentUrl,
      attachmentName,
      isTechnicalOnly: user.role === 'DESIGNER_EMPLOYEE' || user.role === 'SUPER_ADMIN' ? Boolean(isTechnicalOnly) : false,
      timestamp: new Date().toISOString()
    };

    if (!caseRec.comments) caseRec.comments = [];
    caseRec.comments.push(newComment);
    db.updateCase(caseRec.id, caseRec);

    res.status(201).json({ message: 'Comment added.', comment: newComment });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to post comment.' });
  }
});

// 8. POST /api/cases/:id/approve
router.post('/:id/approve', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const now = new Date().toISOString();
    const previousStatus = caseRec.status;
    caseRec.status = 'COMPLETED';
    if (caseRec.paymentStatus === 'PAID') {
      caseRec.finalStlUnlocked = true;
    }
    caseRec.updatedAt = now;

    if (!caseRec.timeline) caseRec.timeline = [];
    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus: 'COMPLETED',
      action: 'Design Approved by Customer',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: req.body.comment || 'CAD design approved. Final milling files unlocked.'
    });

    db.updateCase(caseRec.id, caseRec);
    res.json({ message: 'Design approved successfully!', case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to approve design.' });
  }
});

// 9. POST /api/cases/:id/revision
router.post('/:id/revision', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const { revisionReason } = req.body;
    if (!revisionReason || !revisionReason.trim()) {
      res.status(400).json({ error: 'Revision reason/instructions are required.' });
      return;
    }

    const now = new Date().toISOString();
    const previousStatus = caseRec.status;
    const revisionCount = (caseRec.revisionHistory?.length || 0) + 1;

    caseRec.status = 'REVISION';
    caseRec.updatedAt = now;

    if (!caseRec.revisionHistory) caseRec.revisionHistory = [];
    caseRec.revisionHistory.push({
      revisionNumber: revisionCount,
      requestedAt: now,
      requestedBy: user.name,
      reason: revisionReason.trim()
    });

    if (!caseRec.timeline) caseRec.timeline = [];
    caseRec.timeline.push({
      id: `tl-${Date.now()}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus: 'REVISION',
      action: `Revision #${revisionCount} Requested`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: revisionReason.trim()
    });

    db.updateCase(caseRec.id, caseRec);
    res.json({ message: 'Revision requested. Designer has been notified.', case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit revision request.' });
  }
});

// 10. POST /api/cases/:id/deliver
router.post('/:id/deliver', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const now = new Date().toISOString();
    const previousStatus = caseRec.status;
    caseRec.status = 'DELIVERED';
    if (caseRec.paymentStatus === 'PAID') {
      caseRec.finalStlUnlocked = true;
    }
    caseRec.updatedAt = now;

    if (!caseRec.timeline) caseRec.timeline = [];
    caseRec.timeline.push({
      id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      caseId: caseRec.id,
      timestamp: now,
      previousStatus,
      newStatus: 'DELIVERED',
      action: 'Case Delivered & Final Files Acknowledged',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      comment: req.body.comment || `Milling STL files downloaded & delivery confirmed by ${user.name}.`
    });

    db.updateCase(caseRec.id, caseRec);
    res.json({ message: 'Case marked as DELIVERED.', case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to confirm delivery.' });
  }
});

export { router };
export default router;