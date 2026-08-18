import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  CaseRecord,
  ServicePricing,
  Offer,
  PaymentRecord,
  InvoiceRecord,
  AppNotification,
  AuditLogEntry,
  GlobalSEOSettings,
  StorageConfig,
  SMTPConfig,
  FullPaymentSettings,
  TaxSettings,
  CaseStatus,
  CaseFile,
  TimelineEvent,
  CaseComment,
  PricingHistoryEntry
} from '../models/types';

const DB_FILE = path.join(process.cwd(), 'crowndesk_db.json');

export interface DatabaseSchema {
  users: User[];
  cases: CaseRecord[];
  services: ServicePricing[];
  offers: Offer[];
  pricingHistory: PricingHistoryEntry[];
  payments: PaymentRecord[];
  invoices: InvoiceRecord[];
  notifications: AppNotification[];
  auditLogs: AuditLogEntry[];
  seo: GlobalSEOSettings;
  paymentSettings: FullPaymentSettings;
  taxSettings: TaxSettings;
  storageConfig: StorageConfig;
  smtpConfig: SMTPConfig;
  otpStore: Record<string, { otp: string; expiresAt: number; attempts: number }>;
  caseCounter: number;
  invoiceCounter: number;
}

export function hashPassword(plainText: string): string {
  return crypto.createHash('sha256').update(plainText + 'CROWNDESK_PEPPER_2026').digest('hex');
}

// Initial Seed Data
const DEFAULT_INITIAL_ADMIN_EMAIL = process.env.CROWNDESK_ADMIN_EMAIL || 'anuragnishad895@gmail.com';
const DEFAULT_INITIAL_ADMIN_PASSWORD = process.env.CROWNDESK_INITIAL_ADMIN_PASSWORD || 'anurag@133';

function getDefaultSeed(): DatabaseSchema {
  const adminId = 'usr-admin-001';
  const doctorId = 'usr-doc-001';
  const designerId = 'usr-des-001';
  const now = new Date().toISOString();

  const services: ServicePricing[] = [
    {
      id: 'srv-crown',
      code: 'CROWN',
      name: 'Anterior & Posterior Crown',
      category: 'Crown',
      description: 'High-precision anatomic contour single crown with customized proximal contacts and marginal fit.',
      unitType: 'Per Tooth',
      currency: 'INR',
      unitPriceINR: 799,
      unitPriceUSD: 12.0,
      unitPriceEUR: 10.5,
      unitPriceGBP: 9.0,
      taxPercent: 18,
      discountPercent: 0,
      materials: ['Zirconia Multi-Layer (3D Pro)', 'Lithium Disilicate (E-Max)', 'Layered Zirconia', 'BioHPP PEEK', 'PMMA Temp'],
      shades: ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C1', 'D2', 'Bleach 1 (BL1)', 'Bleach 2 (BL2)'],
      standardTurnaroundHours: 12,
      active: true,
      featured: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'srv-bridge',
      code: 'BRIDGE',
      name: 'Multi-Unit Bridge (3 to 14 Units)',
      category: 'Bridge',
      description: 'Engineered multi-unit bridge design with balanced connector cross-sections and pontic contours.',
      unitType: 'Per Unit',
      currency: 'INR',
      unitPriceINR: 749,
      unitPriceUSD: 11.0,
      unitPriceEUR: 9.8,
      unitPriceGBP: 8.5,
      taxPercent: 18,
      discountPercent: 5,
      materials: ['High-Strength Zirconia', 'Monolithic Multilayer', 'PMMA Diagnostic', 'Cobalt-Chrome Frame'],
      shades: ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'Bleach BL1'],
      standardTurnaroundHours: 18,
      active: true,
      featured: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'srv-implant',
      code: 'IMPLANT',
      name: 'Custom Abutment & Screw-Retained Crown',
      category: 'Implant',
      description: 'Precision implant emergence profile design with titanium base alignment and screw access hole placement.',
      unitType: 'Per Implant',
      currency: 'INR',
      unitPriceINR: 1399,
      unitPriceUSD: 20.0,
      unitPriceEUR: 17.5,
      unitPriceGBP: 15.0,
      taxPercent: 18,
      discountPercent: 0,
      materials: ['Ti-Base Hybrid Abutment', 'Custom Titanium Anodized', 'Zirconia Direct-to-Fixture'],
      shades: ['A1', 'A2', 'A3', 'B1', 'Bleach BL1'],
      standardTurnaroundHours: 24,
      active: true,
      featured: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'srv-veneer',
      code: 'VENEER',
      name: 'Ultra-Thin Aesthetic Veneer & Lumineer',
      category: 'Veneer',
      description: 'Micro-thin facial aesthetic design (0.3mm - 0.5mm) with natural incisal translucency and surface texture.',
      unitType: 'Per Tooth',
      currency: 'INR',
      unitPriceINR: 949,
      unitPriceUSD: 14.0,
      unitPriceEUR: 12.5,
      unitPriceGBP: 11.0,
      taxPercent: 18,
      discountPercent: 0,
      materials: ['IPS e.max Press CAD', 'Feldspathic Glass Ceramic', 'Micro-Hybrid Composite'],
      shades: ['A1', 'B1', 'Bleach BL1', 'Bleach BL2', 'Bleach BL3', 'Bleach BL4'],
      standardTurnaroundHours: 16,
      active: true,
      featured: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'srv-inlay',
      code: 'INLAY_ONLAY',
      name: 'Inlay / Onlay / Overlay / Vonlay',
      category: 'Inlay / Onlay',
      description: 'Conservative biomimetic restoration preserving natural tooth structure with accurate internal fit.',
      unitType: 'Per Tooth',
      currency: 'INR',
      unitPriceINR: 649,
      unitPriceUSD: 9.5,
      unitPriceEUR: 8.5,
      unitPriceGBP: 7.5,
      taxPercent: 18,
      discountPercent: 0,
      materials: ['Lithium Disilicate', 'Hybrid Nano Ceramic (Cerasmart)', 'Zirconia Pre-Shaded'],
      shades: ['A1', 'A2', 'A3', 'B1'],
      standardTurnaroundHours: 12,
      active: true,
      featured: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'srv-fullarch',
      code: 'FULL_ARCH',
      name: 'All-on-X / Full Arch Hybrid Bar',
      category: 'Full Arch',
      description: 'Complete full arch reconstruction with verification jig alignment, gingival pink aesthetic CAD and screw retention.',
      unitType: 'Per Arch',
      currency: 'INR',
      unitPriceINR: 5499,
      unitPriceUSD: 75.0,
      unitPriceEUR: 68.0,
      unitPriceGBP: 59.0,
      taxPercent: 18,
      discountPercent: 0,
      materials: ['Titanium Bar + Zirconia Individual Crowns', 'Monolithic Full Arch Zirconia', 'PEEK Sub-structure'],
      shades: ['A1', 'A2', 'B1', 'BL1', 'BL2'],
      standardTurnaroundHours: 48,
      active: true,
      featured: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
    {
      id: 'srv-dsd',
      code: 'SMILE_DESIGN',
      name: 'Digital Smile Design (DSD) & Mockup',
      category: 'Smile Design',
      description: 'Facial aesthetic smile makeover with 2D-to-3D calibration, golden proportion analysis and 3D printable mockup STL.',
      unitType: 'Per Smile (6-10 Teeth)',
      currency: 'INR',
      unitPriceINR: 1199,
      unitPriceUSD: 17.0,
      unitPriceEUR: 15.5,
      unitPriceGBP: 13.5,
      taxPercent: 18,
      discountPercent: 0,
      materials: ['3D Printable Diagnostic Resin STL', 'Virtual PDF Presentation'],
      shades: ['Bleach Ideal', 'Natural A1'],
      standardTurnaroundHours: 24,
      active: true,
      featured: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z'
    },
  ];

  const offers: Offer[] = [
    {
      id: 'off-new-customer-3free',
      code: 'WELCOME3FREE',
      title: 'New Customer — First 3 Units FREE',
      description: 'Exclusive welcome offer for newly registered Dental Clinics & Labs! Get your first 3 CAD units 100% free.',
      offerType: 'FREE_UNITS',
      buyQuantityRequired: 1,
      freeUnitsCount: 3,
      eligibleServiceCodes: [], // all services
      isNewCustomerOnly: true,
      maxUsagePerCustomer: 1,
      active: true,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.999Z',
    },
    {
      id: 'off-molar-5plus2',
      code: 'MOLAR5PLUS2',
      title: '5 Molar + 2 Molar FREE',
      description: 'Order 5 or more posterior molar crown units in a single prescription and get 2 additional molar units designed completely FREE.',
      offerType: 'BUY_X_GET_Y',
      buyQuantityRequired: 5,
      freeUnitsCount: 2,
      eligibleServiceCodes: ['CROWN'],
      isNewCustomerOnly: false,
      maxUsagePerCustomer: 10,
      active: true,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.999Z',
    },
    {
      id: 'off-implant-discount',
      code: 'IMPLANT10',
      title: '10% Off All Custom Implant Abutments',
      description: 'Get an instant 10% discount on all single and multi-unit custom implant abutment designs.',
      offerType: 'PERCENTAGE',
      buyQuantityRequired: 1,
      percentageDiscount: 10,
      eligibleServiceCodes: ['IMPLANT'],
      isNewCustomerOnly: false,
      maxUsagePerCustomer: 10,
      active: true,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.999Z',
    }
  ];

  const users: User[] = [
    {
      id: adminId,
      name: 'Anurag Nishad (Super Admin)',
      email: DEFAULT_INITIAL_ADMIN_EMAIL,
      passwordHash: hashPassword(DEFAULT_INITIAL_ADMIN_PASSWORD),
      role: 'SUPER_ADMIN',
      phone: '+91 9058322251',
      clinicOrLabName: 'CrownDesk Headquarter Operations',
      address: '8A/GN/262, Lowyer Colony, Agra, India',
      country: 'India',
      isActive: true,
      isEmailVerified: true,
      forcePasswordChange: true, // Super Admin first login forces password change
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-admin-ops',
      name: 'CrownDesk Support Team',
      email: 'supportcrwundesk@gmail.com',
      passwordHash: hashPassword('Support@CrownDesk2026'),
      role: 'ADMIN',
      phone: '+91 9058322251',
      clinicOrLabName: 'CrownDesk Support & QC Division',
      address: '8A/GN/262, Lowyer Colony, Agra, India',
      country: 'India',
      isActive: true,
      isEmailVerified: true,
      forcePasswordChange: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: doctorId,
      name: 'Dr. Vivek Sharma, MDS (Prosthodontics)',
      email: 'dr.sharma@dentallab.com',
      passwordHash: hashPassword('Doctor@123'),
      role: 'DOCTOR_LAB',
      accountType: 'DENTAL_LAB',
      clinicOrLabName: 'Apex Dental Care & Digital Lab',
      phone: '+91 9876543210',
      country: 'India',
      address: 'Suite 402, Medical Enclave, New Delhi, India',
      isActive: true,
      isEmailVerified: true,
      forcePasswordChange: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: designerId,
      name: 'Arjun Verma (Lead CAD Specialist)',
      email: 'designer.cad@crowndesk.com',
      passwordHash: hashPassword('Designer@123'),
      role: 'DESIGNER_EMPLOYEE',
      phone: '+91 9123456780',
      clinicOrLabName: 'CrownDesk Digital Design Studio',
      specialization: 'Exocad & 3Shape Certified Senior CAD Designer',
      activeCaseCount: 1,
      country: 'India',
      isActive: true,
      isEmailVerified: true,
      forcePasswordChange: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-des-002',
      name: 'Priya Sundaram (Aesthetic Veneer Specialist)',
      email: 'priya.cad@crowndesk.com',
      passwordHash: hashPassword('Designer@123'),
      role: 'DESIGNER_EMPLOYEE',
      phone: '+91 9234567891',
      clinicOrLabName: 'CrownDesk Digital Design Studio',
      specialization: 'Aesthetic Veneers & Smile Makeover CAD Expert',
      activeCaseCount: 1,
      country: 'India',
      isActive: true,
      isEmailVerified: true,
      forcePasswordChange: false,
      createdAt: now,
      updatedAt: now,
    }
  ];

  // Cases
  const cases: CaseRecord[] = [
    {
      id: 'CD-2026-00001',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      customerClinic: 'Apex Dental Care & Digital Lab',
      customerEmail: 'dr.sharma@dentallab.com',
      customerPhone: '+91 9876543210',
      patientRef: 'Pt. Rajesh Kumar (#RK-104)',
      doctorName: 'Dr. Vivek Sharma',
      serviceId: 'srv-crown',
      serviceName: 'Anterior & Posterior Crown',
      serviceCode: 'CROWN',
      material: 'Zirconia Multi-Layer (3D Pro)',
      shade: 'A2',
      unitsQuantity: 2,
      teeth: [
        { toothNumber: '14', quadrant: 'UR', serviceCode: 'CROWN', shade: 'A2', material: 'Zirconia Multi-Layer', notes: 'Maintain tight distal contact' },
        { toothNumber: '15', quadrant: 'UR', serviceCode: 'CROWN', shade: 'A2', material: 'Zirconia Multi-Layer', notes: 'Check marginal clearance with opposing molar' }
      ],
      instructions: 'Please design anatomical full contour monolithic zirconia crowns with light occlusal contacts (20 microns relief) and anatomically natural embrasure forms.',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      priority: 'STANDARD',
      status: 'APPROVAL',
      assignedDesignerId: designerId,
      assignedDesignerName: 'Arjun Verma (Lead CAD Specialist)',
      paymentStatus: 'PAID',
      unitPrice: 799,
      currency: 'INR',
      subtotal: 1598,
      discountAmount: 0,
      offerCodeApplied: 'WELCOME3FREE',
      offerDiscountAmount: 1598, // Free units applied
      taxAmount: 0,
      finalTotalAmount: 0,
      paymentId: 'pay_cd_welcome_0001',
      invoiceId: 'CD-INV-2026-00001',
      finalStlUnlocked: true,
      files: [
        {
          id: 'file-001',
          caseId: 'CD-2026-00001',
          fileName: 'Upper_Scan_Prep_14_15.stl',
          originalName: 'Upper_Scan_Prep_14_15.stl',
          fileType: 'SCAN_STL',
          sizeBytes: 18450200,
          uploadedByUserId: doctorId,
          uploadedByUserName: 'Dr. Vivek Sharma',
          uploadedByUserRole: 'DOCTOR_LAB',
          uploadedAt: '2026-08-16T10:15:00Z',
          version: 1,
          isFinalDesign: false,
          downloadCount: 4,
          fileUrl: '/api/files/download/file-001',
          storageKey: 'cases/CD-2026-00001/scans/Upper_Scan_Prep_14_15.stl'
        },
        {
          id: 'file-002',
          caseId: 'CD-2026-00001',
          fileName: 'Lower_Opposing_Bite.stl',
          originalName: 'Lower_Opposing_Bite.stl',
          fileType: 'SCAN_STL',
          sizeBytes: 14200800,
          uploadedByUserId: doctorId,
          uploadedByUserName: 'Dr. Vivek Sharma',
          uploadedByUserRole: 'DOCTOR_LAB',
          uploadedAt: '2026-08-16T10:15:30Z',
          version: 1,
          isFinalDesign: false,
          downloadCount: 3,
          fileUrl: '/api/files/download/file-002',
          storageKey: 'cases/CD-2026-00001/scans/Lower_Opposing_Bite.stl'
        },
        {
          id: 'file-003',
          caseId: 'CD-2026-00001',
          fileName: 'CD-2026-00001_Final_CAD_Crown_14_15.stl',
          originalName: 'Final_Design_Crowns_14_15_v1.stl',
          fileType: 'FINAL_STL',
          sizeBytes: 24100500,
          uploadedByUserId: designerId,
          uploadedByUserName: 'Arjun Verma',
          uploadedByUserRole: 'DESIGNER_EMPLOYEE',
          uploadedAt: '2026-08-17T02:30:00Z',
          version: 1,
          isFinalDesign: true,
          downloadCount: 1,
          fileUrl: '/api/files/download/file-003',
          storageKey: 'cases/CD-2026-00001/final/CD-2026-00001_Final_CAD_Crown_14_15.stl'
        }
      ],
      timeline: [
        {
          id: 'tl-1',
          caseId: 'CD-2026-00001',
          timestamp: '2026-08-16T10:15:00Z',
          newStatus: 'NEW',
          action: 'Case Created',
          userId: doctorId,
          userName: 'Dr. Vivek Sharma',
          userRole: 'DOCTOR_LAB',
          comment: 'New prescription submitted with 2 upper posterior units.'
        },
        {
          id: 'tl-2',
          caseId: 'CD-2026-00001',
          timestamp: '2026-08-16T10:16:00Z',
          previousStatus: 'NEW',
          newStatus: 'RECEIVED',
          action: 'Scan & Payment Verified',
          userId: adminId,
          userName: 'CrownDesk System',
          userRole: 'SUPER_ADMIN',
          comment: 'Welcome Offer Applied (3 Free Units). Payment verified ₹0.00.'
        },
        {
          id: 'tl-3',
          caseId: 'CD-2026-00001',
          timestamp: '2026-08-16T11:00:00Z',
          previousStatus: 'RECEIVED',
          newStatus: 'ASSIGNED',
          action: 'Designer Assigned',
          userId: adminId,
          userName: 'Anurag Nishad (Super Admin)',
          userRole: 'SUPER_ADMIN',
          comment: 'Assigned to Senior CAD Specialist Arjun Verma.'
        },
        {
          id: 'tl-4',
          caseId: 'CD-2026-00001',
          timestamp: '2026-08-16T14:20:00Z',
          previousStatus: 'ASSIGNED',
          newStatus: 'IN_DESIGN',
          action: 'Design Started',
          userId: designerId,
          userName: 'Arjun Verma',
          userRole: 'DESIGNER_EMPLOYEE',
          comment: 'Scans aligned, margin lines inspected and verified.'
        },
        {
          id: 'tl-5',
          caseId: 'CD-2026-00001',
          timestamp: '2026-08-17T01:45:00Z',
          previousStatus: 'IN_DESIGN',
          newStatus: 'QC',
          action: 'Submitted for Quality Control',
          userId: designerId,
          userName: 'Arjun Verma',
          userRole: 'DESIGNER_EMPLOYEE',
          comment: 'Anatomy completed. Minimum thickness verified at 0.8mm.'
        },
        {
          id: 'tl-6',
          caseId: 'CD-2026-00001',
          timestamp: '2026-08-17T02:35:00Z',
          previousStatus: 'QC',
          newStatus: 'APPROVAL',
          action: 'QC Passed & Final Design Uploaded',
          userId: adminId,
          userName: 'CrownDesk QC Inspector',
          userRole: 'SUPER_ADMIN',
          comment: 'Ready for Doctor review and 3D approval.'
        }
      ],
      comments: [
        {
          id: 'comm-1',
          caseId: 'CD-2026-00001',
          userId: doctorId,
          userName: 'Dr. Vivek Sharma',
          userRole: 'DOCTOR_LAB',
          message: 'Patient has a slightly deep bite on tooth #15. Please ensure adequate occlusal clearance.',
          isTechnicalOnly: false,
          timestamp: '2026-08-16T10:18:00Z'
        },
        {
          id: 'comm-2',
          caseId: 'CD-2026-00001',
          userId: designerId,
          userName: 'Arjun Verma (Designer)',
          userRole: 'DESIGNER_EMPLOYEE',
          message: 'Noted Doctor! I have adjusted the dynamic occlusion with 0.15mm relief on the disto-buccal cusp of #15.',
          isTechnicalOnly: false,
          timestamp: '2026-08-17T02:32:00Z'
        }
      ],
      revisionHistory: [],
      createdAt: '2026-08-16T10:15:00Z',
      updatedAt: '2026-08-17T02:35:00Z'
    },
    {
      id: 'CD-2026-00002',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      customerClinic: 'Apex Dental Care & Digital Lab',
      customerEmail: 'dr.sharma@dentallab.com',
      customerPhone: '+91 9876543210',
      patientRef: 'Pt. Ananya Gupta (#AG-310)',
      doctorName: 'Dr. Vivek Sharma',
      serviceId: 'srv-veneer',
      serviceName: 'Ultra-Thin Aesthetic Veneer',
      serviceCode: 'VENEER',
      material: 'IPS e.max Press CAD',
      shade: 'Bleach BL1',
      unitsQuantity: 4,
      teeth: [
        { toothNumber: '12', quadrant: 'UR', serviceCode: 'VENEER', shade: 'BL1', material: 'IPS e.max' },
        { toothNumber: '11', quadrant: 'UR', serviceCode: 'VENEER', shade: 'BL1', material: 'IPS e.max' },
        { toothNumber: '21', quadrant: 'UL', serviceCode: 'VENEER', shade: 'BL1', material: 'IPS e.max' },
        { toothNumber: '22', quadrant: 'UL', serviceCode: 'VENEER', shade: 'BL1', material: 'IPS e.max' }
      ],
      instructions: 'Aesthetic smile line enhancement from 12 to 22. Round line angles and create delicate natural surface micro-texture.',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      priority: 'RUSH',
      status: 'IN_DESIGN',
      assignedDesignerId: 'usr-des-002',
      assignedDesignerName: 'Priya Sundaram (Aesthetic Veneer Specialist)',
      paymentStatus: 'PAID',
      unitPrice: 949,
      currency: 'INR',
      subtotal: 3796,
      discountAmount: 0,
      offerDiscountAmount: 0,
      taxAmount: 683.28,
      finalTotalAmount: 4479.28,
      paymentId: 'pay_rzp_veneer_88291',
      invoiceId: 'CD-INV-2026-00002',
      finalStlUnlocked: true,
      files: [
        {
          id: 'file-004',
          caseId: 'CD-2026-00002',
          fileName: 'Anterior_Prep_Veneers_12_22.stl',
          originalName: 'Anterior_Prep_Veneers_12_22.stl',
          fileType: 'SCAN_STL',
          sizeBytes: 21900100,
          uploadedByUserId: doctorId,
          uploadedByUserName: 'Dr. Vivek Sharma',
          uploadedByUserRole: 'DOCTOR_LAB',
          uploadedAt: '2026-08-16T15:00:00Z',
          version: 1,
          isFinalDesign: false,
          downloadCount: 2,
          fileUrl: '/api/files/download/file-004',
          storageKey: 'cases/CD-2026-00002/scans/Anterior_Prep_Veneers_12_22.stl'
        }
      ],
      timeline: [
        {
          id: 'tl-10',
          caseId: 'CD-2026-00002',
          timestamp: '2026-08-16T15:00:00Z',
          newStatus: 'NEW',
          action: 'Case Created & Paid',
          userId: doctorId,
          userName: 'Dr. Vivek Sharma',
          userRole: 'DOCTOR_LAB',
          comment: 'Veneer aesthetic case submitted with 4 anterior units.'
        },
        {
          id: 'tl-11',
          caseId: 'CD-2026-00002',
          timestamp: '2026-08-16T15:15:00Z',
          previousStatus: 'NEW',
          newStatus: 'RECEIVED',
          action: 'Payment Captured & Verified',
          userId: adminId,
          userName: 'CrownDesk Billing',
          userRole: 'SUPER_ADMIN',
          comment: 'UPI payment ₹4,479.28 confirmed (Ref: UPI905832225101). Invoice generated.'
        },
        {
          id: 'tl-12',
          caseId: 'CD-2026-00002',
          timestamp: '2026-08-16T16:00:00Z',
          previousStatus: 'RECEIVED',
          newStatus: 'ASSIGNED',
          action: 'Assigned to Aesthetic Specialist',
          userId: adminId,
          userName: 'Anurag Nishad (Super Admin)',
          userRole: 'SUPER_ADMIN',
          comment: 'Assigned to Priya Sundaram.'
        },
        {
          id: 'tl-13',
          caseId: 'CD-2026-00002',
          timestamp: '2026-08-17T03:00:00Z',
          previousStatus: 'ASSIGNED',
          newStatus: 'IN_DESIGN',
          action: 'CAD Smile Design in Progress',
          userId: 'usr-des-002',
          userName: 'Priya Sundaram',
          userRole: 'DESIGNER_EMPLOYEE',
          comment: 'Facial midline and incisal plane aligned.'
        }
      ],
      comments: [],
      revisionHistory: [],
      createdAt: '2026-08-16T15:00:00Z',
      updatedAt: '2026-08-17T03:00:00Z'
    },
    {
      id: 'CD-2026-00003',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      customerClinic: 'Apex Dental Care & Digital Lab',
      customerEmail: 'dr.sharma@dentallab.com',
      customerPhone: '+91 9876543210',
      patientRef: 'Pt. Sarah Jenkins (#SJ-09)',
      doctorName: 'Dr. Vivek Sharma',
      serviceId: 'srv-implant',
      serviceName: 'Custom Abutment & Screw-Retained Crown',
      serviceCode: 'IMPLANT',
      material: 'Ti-Base Hybrid Abutment',
      shade: 'A3',
      unitsQuantity: 1,
      teeth: [
        { toothNumber: '36', quadrant: 'LL', serviceCode: 'IMPLANT', shade: 'A3', material: 'Ti-Base Hybrid' }
      ],
      instructions: 'Custom emergence profile for Zimmer/Straumann compatible implant at #36 with screw channel angulation verification.',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      priority: 'STANDARD',
      status: 'RECEIVED',
      paymentStatus: 'PENDING',
      unitPrice: 1399,
      currency: 'INR',
      subtotal: 1399,
      discountAmount: 0,
      offerDiscountAmount: 0,
      taxAmount: 251.82,
      finalTotalAmount: 1650.82,
      finalStlUnlocked: false, // Locked until payment verified!
      files: [
        {
          id: 'file-005',
          caseId: 'CD-2026-00003',
          fileName: 'Implant_Scanbody_Lower_36.stl',
          originalName: 'Implant_Scanbody_Lower_36.stl',
          fileType: 'SCAN_STL',
          sizeBytes: 19800400,
          uploadedByUserId: doctorId,
          uploadedByUserName: 'Dr. Vivek Sharma',
          uploadedByUserRole: 'DOCTOR_LAB',
          uploadedAt: '2026-08-17T04:30:00Z',
          version: 1,
          isFinalDesign: false,
          downloadCount: 0,
          fileUrl: '/api/files/download/file-005',
          storageKey: 'cases/CD-2026-00003/scans/Implant_Scanbody_Lower_36.stl'
        }
      ],
      timeline: [
        {
          id: 'tl-20',
          caseId: 'CD-2026-00003',
          timestamp: '2026-08-17T04:30:00Z',
          newStatus: 'NEW',
          action: 'Case Created',
          userId: doctorId,
          userName: 'Dr. Vivek Sharma',
          userRole: 'DOCTOR_LAB',
          comment: 'New single implant prescription submitted. Payment pending.'
        },
        {
          id: 'tl-21',
          caseId: 'CD-2026-00003',
          timestamp: '2026-08-17T04:31:00Z',
          previousStatus: 'NEW',
          newStatus: 'RECEIVED',
          action: 'Scans Received & Verified in Lab Queue',
          userId: adminId,
          userName: 'CrownDesk System',
          userRole: 'SUPER_ADMIN',
          comment: 'Scanbody detected. Waiting for admin designer assignment.'
        }
      ],
      comments: [],
      revisionHistory: [],
      createdAt: '2026-08-17T04:30:00Z',
      updatedAt: '2026-08-17T04:31:00Z'
    }
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'pay_cd_welcome_0001',
      caseId: 'CD-2026-00001',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      amount: 0,
      currency: 'INR',
      paymentMethod: 'UPI',
      upiTransactionId: 'TXN_WELCOME_FREE_001',
      transactionId: 'TXN_WELCOME_FREE_001',
      status: 'PAID',
      invoiceId: 'CD-INV-2026-00001',
      verifiedBy: 'Anurag Nishad (Super Admin)',
      verifiedAt: '2026-08-16T10:16:00Z',
      createdAt: '2026-08-16T10:16:00Z'
    },
    {
      id: 'pay_upi_veneer_88291',
      caseId: 'CD-2026-00002',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      amount: 4479.28,
      currency: 'INR',
      paymentMethod: 'UPI',
      upiTransactionId: 'UPI905832225101',
      transactionId: 'UPI905832225101',
      status: 'PAID',
      invoiceId: 'CD-INV-2026-00002',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
      verifiedBy: 'Anurag Nishad (Super Admin)',
      verifiedAt: '2026-08-16T15:15:00Z',
      createdAt: '2026-08-16T15:15:00Z'
    }
  ];

  const invoices: InvoiceRecord[] = [
    {
      id: 'inv-001',
      invoiceNumber: 'CD-INV-2026-00001',
      caseId: 'CD-2026-00001',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      customerClinic: 'Apex Dental Care & Digital Lab',
      customerEmail: 'dr.sharma@dentallab.com',
      customerPhone: '+91 9876543210',
      customerAddress: 'Suite 402, Medical Enclave, New Delhi, India',
      serviceName: 'Anterior & Posterior Crown',
      unitsQuantity: 2,
      unitPrice: 799,
      currency: 'INR',
      subtotal: 1598,
      discount: 0,
      offerDeduction: 1598,
      taxAmount: 0,
      totalAmount: 0,
      paymentId: 'pay_cd_welcome_0001',
      paymentGateway: 'CrownDesk Welcome Credit (Verified)',
      paymentStatus: 'PAID',
      issuedAt: '2026-08-16T10:16:00Z',
      paidAt: '2026-08-16T10:16:00Z'
    },
    {
      id: 'inv-002',
      invoiceNumber: 'CD-INV-2026-00002',
      caseId: 'CD-2026-00002',
      customerId: doctorId,
      customerName: 'Dr. Vivek Sharma',
      customerClinic: 'Apex Dental Care & Digital Lab',
      customerEmail: 'dr.sharma@dentallab.com',
      customerPhone: '+91 9876543210',
      customerAddress: 'Suite 402, Medical Enclave, New Delhi, India',
      serviceName: 'Ultra-Thin Aesthetic Veneer',
      unitsQuantity: 4,
      unitPrice: 949,
      currency: 'INR',
      subtotal: 3796,
      discount: 0,
      offerDeduction: 0,
      taxAmount: 683.28,
      totalAmount: 4479.28,
      paymentId: 'pay_upi_veneer_88291',
      paymentGateway: 'CrownDesk UPI Payment (Verified)',
      paymentStatus: 'PAID',
      issuedAt: '2026-08-16T15:15:00Z',
      paidAt: '2026-08-16T15:15:00Z'
    }
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      userId: doctorId,
      title: 'Final Design Ready for Approval',
      message: 'Case CD-2026-00001 is ready for 3D inspection and approval.',
      link: '/customer/cases/CD-2026-00001',
      type: 'SUCCESS',
      read: false,
      createdAt: '2026-08-17T02:35:00Z'
    },
    {
      id: 'notif-2',
      userId: adminId,
      title: 'New Case CD-2026-00003 Received',
      message: 'Single unit implant case received from Dr. Vivek Sharma.',
      link: '/admin/cases/CD-2026-00003',
      type: 'INFO',
      read: false,
      createdAt: '2026-08-17T04:31:00Z'
    }
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-1',
      userId: adminId,
      userName: 'Anurag Nishad',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOTSTRAP_INITIALIZED',
      details: 'CrownDesk Dental CAD SaaS initialized with secure database schema & Odoo-compatible record rules.',
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
      timestamp: '2026-08-16T09:00:00Z'
    },
    {
      id: 'aud-2',
      userId: doctorId,
      userName: 'Dr. Vivek Sharma',
      userRole: 'DOCTOR_LAB',
      action: 'CASE_CREATED',
      caseId: 'CD-2026-00001',
      details: 'Prescription created for 2 crown units. Welcome offer applied.',
      ipAddress: '103.21.124.5',
      result: 'SUCCESS',
      timestamp: '2026-08-16T10:15:00Z'
    },
    {
      id: 'aud-3',
      userId: doctorId,
      userName: 'Dr. Vivek Sharma',
      userRole: 'DOCTOR_LAB',
      action: 'PAYMENT_VERIFIED',
      caseId: 'CD-2026-00002',
      details: 'UPI payment verified for ₹4,479.28. Case status moved to RECEIVED.',
      ipAddress: '103.21.124.5',
      result: 'SUCCESS',
      timestamp: '2026-08-16T15:15:00Z'
    }
  ];

  const seo: GlobalSEOSettings = {
    siteName: 'CrownDesk — Dental CAD Case Management Platform',
    defaultTitle: 'CrownDesk | Precision Dental CAD Case Management Platform',
    titleTemplate: '%s | CrownDesk Dental CAD',
    defaultMetaDescription: 'CrownDesk is the leading Dental CAD Case Management SaaS for Dental Labs, Dentists, and CAD Designers. Precision crowns, bridges, veneers, and custom implant CAD design with lightning-fast turnaround.',
    defaultKeywords: 'Dental CAD, Dental Case Management, Exocad Design, Dental Lab Software, Crown and Bridge CAD, Dental STL Files, Dental CAD Outsourcing, Intraoral Scan Management, CrownDesk',
    defaultOgImage: '/assets/crowndesk-og.jpg',
    twitterHandle: '@crowndesk_',
    facebookUrl: 'https://www.facebook.com/share/1L6jSUFk3i/',
    instagramUrl: 'https://www.instagram.com/crowndesk_/',
    pages: {
      '/': {
        path: '/',
        pageName: 'Home',
        title: 'CrownDesk | Precision Dental CAD Case Management Platform',
        metaDescription: 'Streamline your dental clinic & lab CAD workflow. Upload scans, track real-time design progress, inspect 3D STL files, and download milling-ready restorations.',
        keywords: 'Dental CAD SaaS, Dental Case Tracking, Dental Lab CAD, Crown Design, STL Viewer',
        canonicalUrl: 'https://crowndesk.com/',
        ogTitle: 'CrownDesk — Dental CAD Case Management Platform',
        ogDescription: 'Precision Dental CAD. Seamless Case Management for Dental Labs and Doctors.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/services': {
        path: '/services',
        pageName: 'Services & Turnaround',
        title: 'Dental CAD Design Services & Turnaround | CrownDesk',
        metaDescription: 'Explore CrownDesk dental CAD services: Single Crowns, Multi-unit Bridges, Implant Abutments, Ultra-thin Veneers, Inlays/Onlays, and Full Arch All-on-X.',
        keywords: 'Crown CAD, Bridge CAD, Implant Abutment Design, Veneer CAD, Full Arch Bar',
        canonicalUrl: 'https://crowndesk.com/services',
        ogTitle: 'Dental CAD Design Services | CrownDesk',
        ogDescription: 'Full suite of anatomical dental CAD restorations with 12 to 24 hour turnaround.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/pricing': {
        path: '/pricing',
        pageName: 'Pricing & Offers',
        title: 'Transparent Unit Pricing & Welcome Offers | CrownDesk',
        metaDescription: 'Simple, transparent per-unit dental CAD pricing. First 3 units FREE for new customers. Zero setup fees or contracts.',
        keywords: 'Dental CAD pricing, Dental lab design rates, Free dental CAD offer, CrownDesk pricing',
        canonicalUrl: 'https://crowndesk.com/pricing',
        ogTitle: 'Transparent Dental CAD Pricing | CrownDesk',
        ogDescription: 'Calculate your unit costs and get your first 3 units free with CrownDesk.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/how-it-works': {
        path: '/how-it-works',
        pageName: 'How It Works',
        title: 'How CrownDesk Works | 6-Step Precision Dental CAD Workflow',
        metaDescription: 'Discover how CrownDesk connects Doctors and Dental Labs with expert certified CAD designers through strict QC and instant approvals.',
        keywords: 'Dental CAD workflow, STL file design process, Dental case lifecycle',
        canonicalUrl: 'https://crowndesk.com/how-it-works',
        ogTitle: 'How CrownDesk Works | Seamless Dental CAD Workflow',
        ogDescription: 'From intraoral scan to milling-ready STL file in 6 transparent steps.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/about': {
        path: '/about',
        pageName: 'About Us',
        title: 'About CrownDesk | Digital Dental Engineering Excellence',
        metaDescription: 'Learn about CrownDesk, our certified team of digital dental technicians, high-precision CAD standards, and mission to empower dental practices worldwide.',
        keywords: 'About CrownDesk, Dental CAD company, Agra dental tech, Dental CAD India',
        canonicalUrl: 'https://crowndesk.com/about',
        ogTitle: 'About CrownDesk | Precision Dental CAD Excellence',
        ogDescription: 'Engineering high-accuracy dental prosthetics for dental practices and labs worldwide.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/contact': {
        path: '/contact',
        pageName: 'Contact & Support',
        title: 'Contact CrownDesk | 24/7 Dental CAD Support & Case Inquiries',
        metaDescription: 'Get in touch with CrownDesk customer support, call +91 9058322251, or email supportcrwundesk@gmail.com. Visit us at Lowyer Colony, Agra.',
        keywords: 'CrownDesk phone, CrownDesk support email, Dental CAD help, Agra dental CAD',
        canonicalUrl: 'https://crowndesk.com/contact',
        ogTitle: 'Contact CrownDesk | Dental CAD Support',
        ogDescription: 'Reach our dedicated dental tech support team anytime for case assistance.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/faq': {
        path: '/faq',
        pageName: 'Frequently Asked Questions',
        title: 'Frequently Asked Questions | CrownDesk Dental CAD',
        metaDescription: 'Find answers about supported scan formats (STL, PLY, OBJ), turnaround times, payment methods, revision policy, and file downloads.',
        keywords: 'Dental CAD FAQ, STL compatibility, CrownDesk revisions, Payment methods',
        canonicalUrl: 'https://crowndesk.com/faq',
        ogTitle: 'FAQ | CrownDesk Dental CAD Support',
        ogDescription: 'Everything you need to know about uploading, designing, and downloading cases.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      },
      '/track': {
        path: '/track',
        pageName: 'Track Case',
        title: 'Track Dental CAD Case by Case ID | CrownDesk',
        metaDescription: 'Check real-time status and timeline updates for your Dental CAD case using your unique Case ID (e.g. CD-2026-00001).',
        keywords: 'Track dental case, CD Case ID lookup, Dental CAD tracking',
        canonicalUrl: 'https://crowndesk.com/track',
        ogTitle: 'Track Your Dental CAD Case | CrownDesk',
        ogDescription: 'Instant real-time status and timeline verification for your CrownDesk cases.',
        ogImage: '/assets/crowndesk-og.jpg',
        ogType: 'website'
      }
    }
  };

  const paymentSettings: FullPaymentSettings = {
    providers: {
      upi: {
        id: 'gw-upi',
        provider: 'UPI',
        name: 'CrownDesk UPI Payment (GPay, PhonePe, Paytm, BHIM)',
        enabled: true,
        mode: 'LIVE',
        currency: 'INR',
        connectionStatus: 'CONNECTED',
        businessName: 'CrownDesk Dental Technologies',
        upiId: '9058322251@paytm',
        upiDisplayName: 'CrownDesk Digital Dental Lab (Anurag Nishad)',
        upiQrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=9058322251@paytm&pn=CrownDesk%20Dental%20CAD&cu=INR',
        upiInstructions: 'Scan with Google Pay, PhonePe, Paytm, or BHIM. After making the payment, enter your 12-digit UPI UTR / Reference number and upload the payment screenshot for instant account reconciliation.',
        verificationMode: 'MANUAL_ADMIN'
      }
    },
    settlement: {
      businessName: 'CrownDesk Dental CAD Lab & Technologies',
      businessEmail: 'anuragnishad895@gmail.com',
      businessPhone: '+91 9058322251',
      country: 'India',
      settlementCurrency: 'INR',
      settlementProvider: 'Direct Commercial Bank Account UPI Settlement',
      accountNickname: 'CrownDesk Primary Operations Account',
      notes: 'Direct UPI payments settled immediately to primary merchant account.'
    },
    policy: {
      paymentTiming: 'BEFORE_FINAL_DOWNLOAD',
      defaultCurrency: 'INR',
      enableGST: true,
      gstRatePercent: 18
    }
  };

  const taxSettings: TaxSettings = {
    taxEnabled: true,
    taxName: 'GST (Goods & Services Tax)',
    taxPercent: 18
  };

  const storageConfig: StorageConfig = {
    provider: (process.env.STORAGE_PROVIDER as any) || 'LOCAL_SECURE_VAULT',
    bucketName: process.env.AWS_S3_BUCKET || process.env.STORAGE_BUCKET || 'crowndesk-private-cases-vault',
    region: process.env.STORAGE_REGION || 'asia-south1 (Mumbai)',
    endpoint: process.env.STORAGE_ENDPOINT || '',
    accessKey: process.env.AWS_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY || '',
    secretKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    maxFileSizeMB: 250,
    allowedExtensions: ['.stl', '.ply', '.obj', '.zip', '.jpg', '.jpeg', '.png', '.pdf', '.dcm'],
    retentionDays: 365,
    autoBackupEnabled: true,
    connectionStatus: 'CONNECTED',
    lastConnectionCheck: '2026-08-17T06:00:00Z',
    totalStorageUsedBytes: 78651600
  };

  const smtpConfig: SMTPConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: 'supportcrwundesk@gmail.com',
    senderName: 'CrownDesk Dental CAD Support',
    senderEmail: 'supportcrwundesk@gmail.com',
    supportPhone: '+91 9058322251',
    businessAddress: '8A/GN/262, Lowyer Colony, Agra, India',
    isConfigured: true
  };

  const pricingHistory: PricingHistoryEntry[] = [
    {
      id: 'prc-hist-1',
      serviceId: 'srv-crown',
      serviceCode: 'CROWN',
      serviceName: 'Anterior & Posterior Crown',
      oldPriceINR: 699,
      newPriceINR: 799,
      oldPriceUSD: 10.0,
      newPriceUSD: 12.0,
      currency: 'INR',
      changedByUserId: adminId,
      changedByUserName: 'Anurag Nishad (Super Admin)',
      changedByUserRole: 'SUPER_ADMIN',
      timestamp: '2026-08-15T08:30:00Z',
      changeReason: 'Updated base pricing for high-accuracy 3D Pro multilayer zirconia CAD standards'
    },
    {
      id: 'prc-hist-2',
      serviceId: 'srv-bridge',
      serviceCode: 'BRIDGE',
      serviceName: 'Multi-Unit Bridge (3 to 14 Units)',
      oldPriceINR: 699,
      newPriceINR: 749,
      oldPriceUSD: 10.0,
      newPriceUSD: 11.0,
      currency: 'INR',
      changedByUserId: adminId,
      changedByUserName: 'Anurag Nishad (Super Admin)',
      changedByUserRole: 'SUPER_ADMIN',
      timestamp: '2026-08-15T08:35:00Z',
      changeReason: 'Multi-unit bridge precision connector calculation adjustments'
    },
    {
      id: 'prc-hist-3',
      serviceId: 'srv-implant',
      serviceCode: 'IMPLANT',
      serviceName: 'Custom Abutment & Screw-Retained Crown',
      oldPriceINR: 1299,
      newPriceINR: 1399,
      oldPriceUSD: 18.0,
      newPriceUSD: 20.0,
      currency: 'INR',
      changedByUserId: adminId,
      changedByUserName: 'Anurag Nishad (Super Admin)',
      changedByUserRole: 'SUPER_ADMIN',
      timestamp: '2026-08-15T08:40:00Z',
      changeReason: 'Ti-Base emergence profile and screw access channel alignment enhancement'
    }
  ];

  return {
    users,
    cases,
    services,
    offers,
    pricingHistory,
    payments,
    invoices,
    notifications,
    auditLogs,
    seo,
    paymentSettings,
    taxSettings,
    storageConfig,
    smtpConfig,
    otpStore: {},
    caseCounter: 3,
    invoiceCounter: 2
  };
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const seed = getDefaultSeed();
        return {
          ...seed,
          ...parsed,
          pricingHistory: parsed.pricingHistory || seed.pricingHistory || [],
          paymentSettings: {
            ...seed.paymentSettings,
            ...(parsed.paymentSettings || {}),
            providers: {
              ...seed.paymentSettings.providers,
              ...(parsed.paymentSettings?.providers || {})
            },
            settlement: {
              ...seed.paymentSettings.settlement,
              ...(parsed.paymentSettings?.settlement || {})
            },
            policy: {
              ...seed.paymentSettings.policy,
              ...(parsed.paymentSettings?.policy || {})
            }
          },
          taxSettings: {
            ...seed.taxSettings,
            ...(parsed.taxSettings || {
              taxEnabled: parsed.paymentSettings?.policy?.enableGST ?? seed.taxSettings.taxEnabled,
              taxName: parsed.paymentSettings?.policy?.taxName || seed.taxSettings.taxName,
              taxPercent: parsed.paymentSettings?.policy?.gstRatePercent ?? seed.taxSettings.taxPercent
            })
          },
          storageConfig: {
            ...seed.storageConfig,
            ...(parsed.storageConfig || {})
          },
          seo: {
            ...seed.seo,
            ...(parsed.seo || {}),
            pages: {
              ...seed.seo.pages,
              ...(parsed.seo?.pages || {})
            }
          }
        };
      }
    } catch (e) {
      console.warn('Error reading database file, using default seed:', e);
    }
    const seed = getDefaultSeed();
    this.saveDataDirect(seed);
    return seed;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // --- Sequential ID Generators with Database-Level Unique Guarantee ---
  public generateNextCaseId(): string {
    const year = new Date().getFullYear();
    
    // Scan existing cases to ensure counter is always higher than highest existing ID
    let maxNum = this.data.caseCounter || 0;
    for (const c of this.data.cases) {
      const match = c.id.match(/^CD-\d{4}-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    maxNum += 1;
    this.data.caseCounter = maxNum;
    const formattedNum = String(maxNum).padStart(5, '0');
    this.save();
    return `CD-${year}-${formattedNum}`;
  }

  public generateNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    let maxNum = this.data.invoiceCounter || 0;
    for (const i of this.data.invoices) {
      const match = i.invoiceNumber.match(/^CD-INV-\d{4}-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    maxNum += 1;
    this.data.invoiceCounter = maxNum;
    const formattedNum = String(maxNum).padStart(5, '0');
    this.save();
    return `CD-INV-${year}-${formattedNum}`;
  }

  // --- Audit Logging ---
  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
    return log;
  }

  // --- Notifications ---
  public createNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notif
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  // --- Users & RBAC ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    this.save();
    return true;
  }

  // --- Cases ---
  public getAllCases(): CaseRecord[] {
    return this.data.cases;
  }

  public findCaseById(id: string): CaseRecord | undefined {
    if (!id) return undefined;
    return this.data.cases.find(c => c.id.toUpperCase() === id.trim().toUpperCase());
  }

  public addCase(caseRec: CaseRecord): CaseRecord {
    const normalizedId = caseRec.id.trim().toUpperCase();
    const existing = this.data.cases.find(c => c.id.toUpperCase() === normalizedId);
    if (existing) {
      throw new Error(`Database Unique Constraint Violation: Case ID "${normalizedId}" already exists.`);
    }

    // Ensure all embedded files, timeline events, and comments are tied directly to this permanent unique Case ID
    if (caseRec.files) {
      caseRec.files = caseRec.files.map(f => ({ ...f, caseId: caseRec.id }));
    }
    if (caseRec.timeline) {
      caseRec.timeline = caseRec.timeline.map(t => ({ ...t, caseId: caseRec.id }));
    }
    if (caseRec.comments) {
      caseRec.comments = caseRec.comments.map(c => ({ ...c, caseId: caseRec.id }));
    }

    this.data.cases.unshift(caseRec);
    this.save();
    return caseRec;
  }

  public updateCase(id: string, updates: Partial<CaseRecord>): CaseRecord | undefined {
    const caseRec = this.findCaseById(id);
    if (!caseRec) return undefined;
    Object.assign(caseRec, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return caseRec;
  }

  public deleteCase(id: string): boolean {
    const index = this.data.cases.findIndex(c => c.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) return false;
    this.data.cases.splice(index, 1);
    this.save();
    return true;
  }

  // --- Services & Pricing ---
  public getAllServices(): ServicePricing[] {
    return this.data.services;
  }

  public findServiceById(id: string): ServicePricing | undefined {
    return this.data.services.find(s => s.id === id || s.code.toUpperCase() === id.toUpperCase());
  }

  public addService(service: ServicePricing, createdBy?: { userId: string; userName: string; userRole: string }): ServicePricing {
    const now = new Date().toISOString();
    const newService: ServicePricing = {
      ...service,
      createdAt: service.createdAt || now,
      updatedAt: service.updatedAt || now,
      currency: service.currency || 'INR',
      taxPercent: service.taxPercent !== undefined ? service.taxPercent : 18,
      active: service.active !== undefined ? service.active : true,
      isActive: service.active !== undefined ? service.active : true,
    };
    this.data.services.push(newService);
    
    if (createdBy) {
      this.logAudit({
        userId: createdBy.userId,
        userName: createdBy.userName,
        userRole: createdBy.userRole as any,
        action: 'SERVICE_CREATED',
        details: `Created new dental CAD service: ${newService.name} (${newService.code}) at ₹${newService.unitPriceINR} / ${newService.unitPriceUSD}`,
        ipAddress: '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    this.save();
    return newService;
  }

  public updateService(
    id: string,
    updates: Partial<ServicePricing>,
    changedBy?: { userId: string; userName: string; userRole: string; reason?: string }
  ): ServicePricing | undefined {
    const srv = this.findServiceById(id);
    if (!srv) return undefined;

    const oldPriceINR = srv.unitPriceINR;
    const oldPriceUSD = srv.unitPriceUSD;
    const priceChanged = (updates.unitPriceINR !== undefined && updates.unitPriceINR !== oldPriceINR) ||
                         (updates.unitPriceUSD !== undefined && updates.unitPriceUSD !== oldPriceUSD);

    Object.assign(srv, updates, { updatedAt: new Date().toISOString() });
    if (updates.active !== undefined) {
      srv.isActive = updates.active;
    }

    if (priceChanged && changedBy) {
      this.addPricingHistoryEntry({
        serviceId: srv.id,
        serviceCode: srv.code,
        serviceName: srv.name,
        oldPriceINR,
        newPriceINR: srv.unitPriceINR,
        oldPriceUSD,
        newPriceUSD: srv.unitPriceUSD,
        currency: srv.currency || 'INR',
        changedByUserId: changedBy.userId,
        changedByUserName: changedBy.userName,
        changedByUserRole: changedBy.userRole,
        changeReason: changedBy.reason || 'Admin updated service price in Pricing Management'
      });

      this.logAudit({
        userId: changedBy.userId,
        userName: changedBy.userName,
        userRole: changedBy.userRole as any,
        action: 'PRICING_UPDATED',
        details: `Updated price for ${srv.name} (${srv.code}): ₹${oldPriceINR} -> ₹${srv.unitPriceINR} (${oldPriceUSD} -> ${srv.unitPriceUSD}). Reason: ${changedBy.reason || 'Admin configuration update'}`,
        ipAddress: '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    this.save();
    return srv;
  }

  public toggleServiceActive(id: string, changedBy?: { userId: string; userName: string; userRole: string }): ServicePricing | undefined {
    const srv = this.findServiceById(id);
    if (!srv) return undefined;
    srv.active = !srv.active;
    srv.isActive = srv.active;
    srv.updatedAt = new Date().toISOString();

    if (changedBy) {
      this.logAudit({
        userId: changedBy.userId,
        userName: changedBy.userName,
        userRole: changedBy.userRole as any,
        action: srv.active ? 'SERVICE_ENABLED' : 'SERVICE_DISABLED',
        details: `${srv.active ? 'Enabled' : 'Disabled'} service: ${srv.name} (${srv.code})`,
        ipAddress: '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    this.save();
    return srv;
  }

  public checkServiceInUse(id: string): { inUse: boolean; count: number } {
    const srv = this.findServiceById(id);
    if (!srv) return { inUse: false, count: 0 };
    const count = (this.data.cases || []).filter(c => c.serviceId === srv.id || c.serviceCode === srv.code).length;
    return { inUse: count > 0, count };
  }

  public deleteService(id: string, deletedBy?: { userId: string; userName: string; userRole: string }): { success: boolean; reason?: string; inUseCount?: number } {
    const srv = this.findServiceById(id);
    if (!srv) return { success: false, reason: 'Service not found' };

    const index = this.data.services.findIndex(s => s.id === srv.id);
    if (index === -1) return { success: false, reason: 'Service index not found' };

    const check = this.checkServiceInUse(id);
    if (check.inUse) {
      // Instead of failing hard or leaving orphaned records, soft-disable the service
      srv.active = false;
      srv.isActive = false;
      srv.updatedAt = new Date().toISOString();
      this.save();

      if (deletedBy) {
        this.logAudit({
          userId: deletedBy.userId,
          userName: deletedBy.userName,
          userRole: deletedBy.userRole as any,
          action: 'SERVICE_SOFT_DISABLED',
          details: `Service ${srv.name} has ${check.count} historical cases. Marked as Disabled/Archived instead of permanent purge to protect case history snapshots.`,
          ipAddress: '127.0.0.1',
          result: 'SUCCESS'
        });
      }

      return {
        success: true,
        reason: 'SERVICE_ARCHIVED_DUE_TO_CASES',
        inUseCount: check.count
      };
    }

    this.data.services.splice(index, 1);
    
    if (deletedBy) {
      this.logAudit({
        userId: deletedBy.userId,
        userName: deletedBy.userName,
        userRole: deletedBy.userRole as any,
        action: 'SERVICE_DELETED',
        details: `Deleted service ${srv.name} (${srv.code})`,
        ipAddress: '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    this.save();
    return { success: true };
  }

  // --- Pricing History ---
  public getAllPricingHistory(): PricingHistoryEntry[] {
    return this.data.pricingHistory || [];
  }

  public addPricingHistoryEntry(entry: Omit<PricingHistoryEntry, 'id' | 'timestamp'>): PricingHistoryEntry {
    if (!this.data.pricingHistory) this.data.pricingHistory = [];
    const newEntry: PricingHistoryEntry = {
      id: `prc-hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.pricingHistory.unshift(newEntry);
    if (this.data.pricingHistory.length > 500) {
      this.data.pricingHistory = this.data.pricingHistory.slice(0, 500);
    }
    this.save();
    return newEntry;
  }

  // --- Offers ---
  public getAllOffers(includeInactive: boolean = true): Offer[] {
    if (includeInactive) return this.data.offers || [];
    return (this.data.offers || []).filter(o => o.active);
  }

  public findOfferById(id: string): Offer | undefined {
    return (this.data.offers || []).find(o => o.id === id);
  }

  public findOfferByCode(code: string, activeOnly: boolean = false): Offer | undefined {
    const cleanCode = code.trim().toUpperCase();
    return (this.data.offers || []).find(o => {
      const matches = o.code.toUpperCase() === cleanCode;
      return activeOnly ? matches && o.active : matches;
    });
  }

  public addOffer(offer: Offer): Offer {
    if (!this.data.offers) this.data.offers = [];
    this.data.offers.push(offer);
    this.save();
    return offer;
  }

  public updateOffer(id: string, updates: Partial<Offer>): Offer | undefined {
    if (!this.data.offers) this.data.offers = [];
    const off = this.data.offers.find(o => o.id === id);
    if (!off) return undefined;
    Object.assign(off, updates);
    this.save();
    return off;
  }

  public deleteOffer(id: string): boolean {
    if (!this.data.offers) return false;
    const index = this.data.offers.findIndex(o => o.id === id);
    if (index === -1) return false;
    this.data.offers.splice(index, 1);
    this.save();
    return true;
  }

  public toggleOfferActive(id: string): Offer | undefined {
    if (!this.data.offers) return undefined;
    const off = this.data.offers.find(o => o.id === id);
    if (!off) return undefined;
    off.active = !off.active;
    this.save();
    return off;
  }

  public incrementOfferUsage(code: string): void {
    if (!this.data.offers) return;
    const off = this.findOfferByCode(code, false);
    if (off) {
      off.timesRedeemed = (off.timesRedeemed || 0) + 1;
      this.save();
    }
  }

  // --- Invoices & Payments ---
  public getAllInvoices(): InvoiceRecord[] {
    return this.data.invoices;
  }

  public findInvoiceById(id: string): InvoiceRecord | undefined {
    return this.data.invoices.find(i => i.id === id || i.invoiceNumber === id || i.caseId === id);
  }

  public addInvoice(inv: InvoiceRecord): InvoiceRecord {
    const existing = this.data.invoices.find(i => i.invoiceNumber === inv.invoiceNumber);
    if (existing) {
      throw new Error(`Database Unique Constraint Violation: Invoice Number "${inv.invoiceNumber}" already exists.`);
    }
    this.data.invoices.unshift(inv);
    this.save();
    return inv;
  }

  public getAllPayments(): PaymentRecord[] {
    return this.data.payments;
  }

  public findPaymentById(id: string): PaymentRecord | undefined {
    return this.data.payments.find(p => p.id === id || p.transactionId === id || p.caseId === id);
  }

  public addPayment(pay: PaymentRecord): PaymentRecord {
    this.data.payments.unshift(pay);
    this.save();
    return pay;
  }

  public updatePayment(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const pay = this.data.payments.find(p => p.id === id);
    if (!pay) return undefined;
    Object.assign(pay, updates);
    this.save();
    return pay;
  }

  // --- Payment Gateway Settings ---
  public getRawPaymentSettings(): FullPaymentSettings {
    return this.data.paymentSettings;
  }

  public getMaskedPaymentSettings(): FullPaymentSettings {
    const raw = this.data.paymentSettings;

    return {
      providers: {
        upi: {
          ...raw.providers.upi
        }
      },
      settlement: { ...raw.settlement },
      policy: { ...raw.policy },
      taxSettings: raw.taxSettings ? { ...raw.taxSettings } : undefined
    };
  }

  public updatePaymentSettings(updates: Partial<FullPaymentSettings>): FullPaymentSettings {
    const current = this.data.paymentSettings;

    if (updates.providers) {
      // UPI
      if (updates.providers.upi) {
        current.providers.upi = {
          ...current.providers.upi,
          ...updates.providers.upi
        };
      }
    }

    if (updates.settlement) {
      current.settlement = {
        ...current.settlement,
        ...updates.settlement
      };
    }

    if (updates.policy) {
      current.policy = {
        ...current.policy,
        ...updates.policy
      };

      // Synchronize policy changes to taxSettings
      if (this.data.taxSettings) {
        if (typeof updates.policy.enableGST === 'boolean') {
          this.data.taxSettings.taxEnabled = updates.policy.enableGST;
        }
        if (typeof updates.policy.gstRatePercent === 'number') {
          this.data.taxSettings.taxPercent = updates.policy.gstRatePercent;
        }
        if (typeof updates.policy.taxName === 'string') {
          this.data.taxSettings.taxName = updates.policy.taxName;
        }
        if (typeof updates.policy.taxEnabled === 'boolean') {
          this.data.taxSettings.taxEnabled = updates.policy.taxEnabled;
        }
        if (typeof updates.policy.taxPercent === 'number') {
          this.data.taxSettings.taxPercent = updates.policy.taxPercent;
        }
      }
    }

    if (updates.taxSettings) {
      current.taxSettings = {
        ...current.taxSettings,
        ...updates.taxSettings
      };
    }

    this.save();
    return this.getMaskedPaymentSettings();
  }

  // --- Dynamic Tax Configuration Settings ---
  public getTaxSettings(): TaxSettings {
    if (!this.data.taxSettings) {
      const pol = this.data.paymentSettings?.policy;
      this.data.taxSettings = {
        taxEnabled: pol?.enableGST ?? pol?.taxEnabled ?? true,
        taxName: pol?.taxName || 'GST (Goods & Services Tax)',
        taxPercent: pol?.gstRatePercent ?? pol?.taxPercent ?? 18
      };
    }
    return this.data.taxSettings;
  }

  public updateTaxSettings(updates: Partial<TaxSettings>): TaxSettings {
    const current = this.getTaxSettings();
    if (typeof updates.taxEnabled === 'boolean') {
      current.taxEnabled = updates.taxEnabled;
    }
    if (typeof updates.taxName === 'string' && updates.taxName.trim()) {
      current.taxName = updates.taxName.trim();
    }
    if (typeof updates.taxPercent === 'number' && !isNaN(updates.taxPercent)) {
      current.taxPercent = Math.max(0, Math.min(100, updates.taxPercent));
    }

    // Keep paymentSettings.policy synchronized
    if (this.data.paymentSettings?.policy) {
      this.data.paymentSettings.policy.enableGST = current.taxEnabled;
      this.data.paymentSettings.policy.gstRatePercent = current.taxPercent;
      this.data.paymentSettings.policy.taxEnabled = current.taxEnabled;
      this.data.paymentSettings.policy.taxName = current.taxName;
      this.data.paymentSettings.policy.taxPercent = current.taxPercent;
    }

    this.save();
    return current;
  }

  // --- SEO Settings ---
  public getSEO(): GlobalSEOSettings {
    return this.data.seo;
  }

  public updateSEO(updates: Partial<GlobalSEOSettings>): GlobalSEOSettings {
    this.data.seo = {
      ...this.data.seo,
      ...updates,
      pages: {
        ...this.data.seo.pages,
        ...(updates.pages || {})
      }
    };
    this.save();
    return this.data.seo;
  }

  // --- Storage & SMTP Settings ---
  public getStorageConfig(): StorageConfig {
    return this.data.storageConfig;
  }

  public getMaskedStorageConfig(): StorageConfig {
    const raw = this.data.storageConfig;
    const mask = (val?: string) => (val && val.length > 0 ? '••••••••••••••••' : '');
    return {
      ...raw,
      secretKey: mask(raw.secretKey),
      supabaseServiceKey: mask(raw.supabaseServiceKey)
    };
  }

  public updateStorageConfig(updates: Partial<StorageConfig>): StorageConfig {
    const current = this.data.storageConfig;
    const newSecretKey = updates.secretKey && !updates.secretKey.startsWith('••••') ? updates.secretKey : current.secretKey;
    const newSupabaseServiceKey = updates.supabaseServiceKey && !updates.supabaseServiceKey.startsWith('••••') ? updates.supabaseServiceKey : current.supabaseServiceKey;

    this.data.storageConfig = {
      ...current,
      ...updates,
      secretKey: newSecretKey,
      supabaseServiceKey: newSupabaseServiceKey
    };
    this.save();
    return this.data.storageConfig;
  }

  public getSMTPConfig(): SMTPConfig {
    return this.data.smtpConfig;
  }

  public updateSMTPConfig(updates: Partial<SMTPConfig>): SMTPConfig {
    this.data.smtpConfig = { ...this.data.smtpConfig, ...updates };
    this.save();
    return this.data.smtpConfig;
  }

  // --- OTP Store ---
  public setOTP(email: string, otp: string, ttlSeconds = 600) {
    this.data.otpStore[email.toLowerCase()] = {
      otp,
      expiresAt: Date.now() + ttlSeconds * 1000,
      attempts: 0
    };
    this.save();
  }

  public verifyOTP(email: string, enteredOtp: string): { valid: boolean; reason?: string } {
    const entry = this.data.otpStore[email.toLowerCase()];
    if (!entry) {
      return { valid: false, reason: 'No OTP requested or code expired. Please request a new one.' };
    }
    if (Date.now() > entry.expiresAt) {
      delete this.data.otpStore[email.toLowerCase()];
      this.save();
      return { valid: false, reason: 'OTP expired. Please request a new OTP code.' };
    }
    if (entry.attempts >= 5) {
      delete this.data.otpStore[email.toLowerCase()];
      this.save();
      return { valid: false, reason: 'Maximum OTP attempts exceeded for security. Please request a fresh OTP.' };
    }

    entry.attempts += 1;
    if (entry.otp !== enteredOtp.trim()) {
      this.save();
      return { valid: false, reason: 'Incorrect 6-digit OTP code.' };
    }

    // Success - invalidate OTP
    delete this.data.otpStore[email.toLowerCase()];
    this.save();
    return { valid: true };
  }
}

export const db = new DatabaseStore();
