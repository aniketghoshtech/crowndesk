import express, { Request, Response } from 'express';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { supabase } from '../services/supabase';
import { CaseRecord, CaseStatus, PriorityLevel, TimelineEvent, ToothItem, UserRole } from '../models/types';
import { evaluateOffer } from '../services/offerEngine';

const router = express.Router();

// Helper to sanitize timeline events for employees
function sanitizeTimelineForEmployee(timeline: TimelineEvent[]): TimelineEvent[] {
  return (timeline || []).map(event => {
    let cleanComment = (event.comment || '')
      .replace(/₹\s*[\d,]+(\.\d+)?/gi, '')
      .replace(/\$\s*[\d,]+(\.\d+)?/gi, '')
      .replace(/INV-[\w-]+/gi, 'INV-***')
      .replace(/txn_[\w]+/gi, 'txn_***')
      .replace(/pay_[\w]+/gi, 'pay_***')
      .replace(/Verified payment/gi, 'Order confirmed');

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
    return caseRec;
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
    files: (files || []).filter(f => (f as any).fileType !== 'INVOICE_PDF' && !f.fileName?.toLowerCase().includes('invoice'))
  };
}

// 1. GET /api/cases - Supabase ক্লাউড থেকে রিয়েল-টাইম কেস ফেচ ও সিঙ্ক
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // সরাসরি Supabase ক্লাউড থেকে সব কেস লোড করা
    try {
      const { data, error } = await supabase.from('cases').select('*');
      if (data && data.length > 0) {
        data.forEach((c: any) => {
          const mapped: CaseRecord = {
            id: c.id,
            customerId: c.customer_id,
            customerName: c.customer_name || 'Dr. Client',
            customerClinic: c.customer_clinic || 'Dental Practice',
            customerEmail: c.customer_email || '',
            customerPhone: c.customer_phone || '',
            patientName: c.patient_name || `Case ${c.id}`,
            patientRef: c.patient_name || `Case ${c.id}`,
            doctorName: c.doctor_name || 'Dr. Client',
            serviceId: c.service_id || 'srv-crown',
            serviceName: c.service_name || 'Crown',
            serviceCode: c.service_code || 'CROWN',
            material: c.material || 'Zirconia Multi-Layer',
            shade: c.shade || 'A2',
            unitsQuantity: Number(c.units_quantity || 1),
            teeth: [{ toothNumber: '11', serviceCode: c.service_code || 'CROWN', shade: c.shade || 'A2', material: c.material || 'Zirconia' }],
            teethNumbers: ['11'],
            instructions: 'Standard anatomical contours.',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            priority: (c.priority as any) || 'STANDARD',
            status: (c.status as any) || 'NEW',
            assignedDesignerId: c.assigned_designer_id || undefined,
            assignedDesignerName: c.assigned_designer_name || undefined,
            paymentStatus: (c.payment_status as any) || 'PAID',
            unitPrice: 799,
            currency: 'INR',
            subtotal: Number(c.final_total_amount || 799),
            finalTotalAmount: Number(c.final_total_amount || 799),
            finalStlUnlocked: true,
            files: [],
            timeline: [],
            comments: [],
            revisionHistory: [],
            createdAt: c.created_at || new Date().toISOString(),
            updatedAt: c.updated_at || new Date().toISOString()
          };

          const local = db.findCaseById(c.id);
          if (!local) db.addCase(mapped);
          else Object.assign(local, mapped);
        });
      }
    } catch (e) {
      console.warn('Supabase fetch cases error:', e);
    }

    const allCases = db.getAllCases();
    let permittedCases: any[] = [];

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      permittedCases = allCases;
    } else if (user.role === 'DOCTOR_LAB') {
      permittedCases = allCases.filter(c => c.customerId === user.id || c.customerEmail?.toLowerCase() === user.email.toLowerCase());
    } else {
      // ডিজাইনার তার নিজের অ্যাসাইন করা কেস এবং দেখার জন্য সব কেস পাবে
      permittedCases = allCases
        .filter(c => c.assignedDesignerId === user.id || c.assignedDesignerId === user.email || c.assignedDesignerName?.toLowerCase() === user.name?.toLowerCase() || !c.assignedDesignerId)
        .map(c => sanitizeCaseForRole(c, user.role, user.id));
    }

    res.json({ cases: permittedCases });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve cases.' });
  }
});

// 2. POST /api/cases - কাস্টমার/ডক্টর কেস সাবমিশন ও পারমানেন্ট ক্লাউড সেভ
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in to submit a new dental case.' });
      return;
    }

    const {
      patientRef,
      patientName,
      doctorName,
      clinicName,
      serviceId,
      serviceName,
      teeth = [],
      teethNumbers = [],
      material,
      shade,
      instructions,
      priority = 'STANDARD',
      unitsQuantity = 1,
      files = []
    } = req.body;

    const newCaseId = db.generateNextCaseId();
    const now = new Date().toISOString();
    const targetPatient = patientName || patientRef || `Patient-${newCaseId}`;
    const totalUnits = Number(unitsQuantity) || 1;
    const finalAmount = 799 * totalUnits;

    const caseRecord: CaseRecord = {
      id: newCaseId,
      customerId: user.id,
      customerName: user.name,
      customerClinic: clinicName || user.clinicOrLabName || `${user.name}'s Dental Practice`,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      patientRef: targetPatient,
      patientName: targetPatient,
      doctorName: doctorName || user.name,
      serviceId: serviceId || 'srv-crown',
      serviceName: serviceName || 'Anterior & Posterior Crown',
      serviceCode: 'CROWN',
      material: material || 'Zirconia Multi-Layer',
      shade: shade || 'A2',
      unitsQuantity: totalUnits,
      teeth: [{ toothNumber: '11', serviceCode: 'CROWN', shade: shade || 'A2', material: material || 'Zirconia' }],
      teethNumbers: teethNumbers.length > 0 ? teethNumbers : ['11'],
      instructions: instructions || 'Standard anatomical contours.',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: (priority as any) || 'STANDARD',
      status: 'NEW',
      paymentStatus: 'PAID',
      unitPrice: 799,
      currency: 'INR',
      subtotal: finalAmount,
      finalTotalAmount: finalAmount,
      finalStlUnlocked: true,
      files: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          caseId: newCaseId,
          timestamp: now,
          newStatus: 'NEW',
          action: 'Case Created',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          comment: `Prescription submitted for ${totalUnits} unit(s).`
        }
      ],
      comments: [],
      revisionHistory: [],
      createdAt: now,
      updatedAt: now
    };

    // ১. লোকাল ক্যাশে সেভ
    db.addCase(caseRecord);

    // ২. Supabase ক্লাউডে পারমানেন্ট সেভ
    try {
      await supabase.from('cases').upsert({
        id: caseRecord.id,
        customer_id: caseRecord.customerId,
        customer_name: caseRecord.customerName,
        customer_clinic: caseRecord.customerClinic,
        customer_email: caseRecord.customerEmail,
        customer_phone: caseRecord.customerPhone,
        doctor_name: caseRecord.doctorName,
        patient_name: caseRecord.patientName,
        service_name: caseRecord.serviceName,
        service_code: caseRecord.serviceCode,
        material: caseRecord.material,
        shade: caseRecord.shade,
        units_quantity: caseRecord.unitsQuantity,
        priority: caseRecord.priority,
        status: caseRecord.status,
        payment_status: caseRecord.paymentStatus,
        final_total_amount: caseRecord.finalTotalAmount,
        created_at: caseRecord.createdAt,
        updated_at: caseRecord.updatedAt
      });
    } catch (e) {
      console.warn('Supabase case save error:', e);
    }

    res.status(201).json({
      message: `Case ${newCaseId} successfully created!`,
      case: caseRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create dental case.' });
  }
});

// 3. GET /api/cases/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    let caseRec = db.findCaseById(req.params.id);

    if (!caseRec) {
      try {
        const { data } = await supabase.from('cases').select('*').eq('id', req.params.id).maybeSingle();
        if (data) {
          caseRec = {
            id: data.id,
            customerId: data.customer_id,
            customerName: data.customer_name,
            customerClinic: data.customer_clinic,
            customerEmail: data.customer_email,
            patientName: data.patient_name,
            patientRef: data.patient_name,
            doctorName: data.doctor_name,
            serviceName: data.service_name,
            unitsQuantity: data.units_quantity,
            status: data.status,
            assignedDesignerId: data.assigned_designer_id,
            assignedDesignerName: data.assigned_designer_name,
            paymentStatus: data.payment_status,
            finalTotalAmount: Number(data.final_total_amount || 0),
            createdAt: data.created_at,
            updatedAt: data.updated_at
          } as any;
          db.addCase(caseRec!);
        }
      } catch (e) {}
    }

    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    res.json({ case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve case details.' });
  }
});

// 4. PATCH /api/cases/:id/assign - কেস ডিজাইনার অ্যাসাইন ও ক্লাউড পারমানেন্ট সিঙ্ক
router.patch('/:id/assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const { designerId, notes = '' } = req.body;
    let caseRec = db.findCaseById(req.params.id);

    if (!caseRec) {
      try {
        const { data } = await supabase.from('cases').select('*').eq('id', req.params.id).maybeSingle();
        if (data) {
          caseRec = {
            id: data.id,
            customerId: data.customer_id,
            customerName: data.customer_name,
            patientName: data.patient_name,
            doctorName: data.doctor_name,
            serviceName: data.service_name,
            unitsQuantity: data.units_quantity,
            status: data.status,
            paymentStatus: data.payment_status,
            finalTotalAmount: Number(data.final_total_amount || 0),
            createdAt: data.created_at,
            updatedAt: data.updated_at
          } as any;
          db.addCase(caseRec!);
        }
      } catch (e) {}
    }

    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const allUsers = db.getAllUsers();
    const searchTarget = String(designerId).trim().toLowerCase();
    const designer = allUsers.find(u => 
      u.id === designerId || 
      u.email.toLowerCase() === searchTarget || 
      u.name.toLowerCase() === searchTarget
    );

    const designerName = designer ? designer.name : (designerId.includes('@') ? designerId.split('@')[0] : designerId);
    const designerActualId = designer ? designer.id : designerId;
    const now = new Date().toISOString();

    caseRec.assignedDesignerId = designerActualId;
    caseRec.assignedDesignerName = designerName;
    caseRec.status = 'ASSIGNED';
    caseRec.updatedAt = now;

    db.updateCase(caseRec.id, caseRec);

    // Supabase ক্লাউডে অ্যাসাইনমেন্ট সেভ
    try {
      await supabase.from('cases').update({
        assigned_designer_id: designerActualId,
        assigned_designer_name: designerName,
        status: 'ASSIGNED',
        updated_at: now
      }).eq('id', caseRec.id);
    } catch (e) {
      console.warn('Supabase assign sync warning:', e);
    }

    res.json({ message: `Assigned to ${designerName}`, case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assign designer.' });
  }
});

// 5. PATCH /api/cases/:id/status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { newStatus } = req.body;
    const caseRec = db.findCaseById(req.params.id);
    if (!caseRec) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const now = new Date().toISOString();
    caseRec.status = newStatus;
    caseRec.updatedAt = now;
    db.updateCase(caseRec.id, caseRec);

    try {
      await supabase.from('cases').update({
        status: newStatus,
        updated_at: now
      }).eq('id', caseRec.id);
    } catch (e) {}

    res.json({ message: `Status updated to ${newStatus}`, case: caseRec });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// 6. POST /api/cases/:id/approve & revision
router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const caseRec = db.findCaseById(req.params.id);
  const now = new Date().toISOString();
  if (caseRec) {
    caseRec.status = 'COMPLETED';
    caseRec.updatedAt = now;
    db.updateCase(caseRec.id, caseRec);
    try {
      await supabase.from('cases').update({ status: 'COMPLETED', updated_at: now }).eq('id', caseRec.id);
    } catch (e) {}
  }
  res.json({ message: 'Design approved successfully!', case: caseRec });
});

router.post('/:id/revision', async (req: Request, res: Response): Promise<void> => {
  const caseRec = db.findCaseById(req.params.id);
  const now = new Date().toISOString();
  if (caseRec) {
    caseRec.status = 'REVISION';
    caseRec.updatedAt = now;
    db.updateCase(caseRec.id, caseRec);
    try {
      await supabase.from('cases').update({ status: 'REVISION', updated_at: now }).eq('id', caseRec.id);
    } catch (e) {}
  }
  res.json({ message: 'Revision requested.', case: caseRec });
});

export { router };
export default router;