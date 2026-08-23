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

const ROOT_DB_FILE = path.join(process.cwd(), 'crowndesk_db.json');
const TMP_DB_FILE = path.join('/tmp', 'crowndesk_db.json');

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
const DEFAULT_INITIAL_ADMIN_PASSWORD = process.env.CROWNDESK_INITIAL_ADMIN_PASSWORD || 'anurag123';

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
    }
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
      eligibleServiceCodes: [],
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
      forcePasswordChange: false,
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
      offerDiscountAmount: 1598,
      taxAmount: 0,
      finalTotalAmount: 0,
      paymentId: 'pay_cd_welcome_0001',
      invoiceId: 'CD-INV-2026-00001',
      finalStlUnlocked: true,
      files: [],
      timeline: [],
      comments: [],
      revisionHistory: [],
      createdAt: '2026-08-16T10:15:00Z',
      updatedAt: '2026-08-17T02:35:00Z'
    }
  ];

  const payments: PaymentRecord[] = [];
  const invoices: InvoiceRecord[] = [];
  const notifications: AppNotification[] = [];
  const auditLogs: AuditLogEntry[] = [];

  const seo: GlobalSEOSettings = {
    siteName: 'CrownDesk — Dental CAD Case Management Platform',
    defaultTitle: 'CrownDesk | Precision Dental CAD Case Management Platform',
    titleTemplate: '%s | CrownDesk Dental CAD',
    defaultMetaDescription: 'CrownDesk is the leading Dental CAD Case Management SaaS for Dental Labs, Dentists, and CAD Designers.',
    defaultKeywords: 'Dental CAD, Dental Case Management, Exocad Design, Dental Lab Software',
    defaultOgImage: '/assets/crowndesk-og.jpg',
    twitterHandle: '@crowndesk_',
    facebookUrl: 'https://www.facebook.com/share/1L6jSUFk3i/',
    instagramUrl: 'https://www.instagram.com/crowndesk_/',
    pages: {}
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
        upiId: process.env.MERCHANT_UPI_ID || '9058322251@kotakbank',
        upiDisplayName: 'CrownDesk Digital Dental Lab (Anurag Nishad)',
        upiQrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=9058322251@kotakbank&pn=CrownDesk%20Dental%20CAD&cu=INR',
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
      settlementProvider: 'Direct Kotak Mahindra Bank Account UPI Settlement',
      accountNickname: 'CrownDesk Kotak Primary Operations Account',
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
    provider: (process.env.STORAGE_PROVIDER as any) || 'SUPABASE',
    bucketName: process.env.STORAGE_BUCKET || 'crowndesk-files',
    region: process.env.STORAGE_REGION || 'ap-northeast-1',
    endpoint: process.env.STORAGE_ENDPOINT || '',
    accessKey: process.env.AWS_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY || '',
    secretKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://wubumkaugtoyktzrxoiu.supabase.co',
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

  const pricingHistory: PricingHistoryEntry[] = [];

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
      let targetFile: string | null = null;
      if (fs.existsSync(TMP_DB_FILE)) {
        targetFile = TMP_DB_FILE;
      } else if (fs.existsSync(ROOT_DB_FILE)) {
        targetFile = ROOT_DB_FILE;
      }

      if (targetFile) {
        const fileContent = fs.readFileSync(targetFile, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const seed = getDefaultSeed();
        return {
          ...seed,
          ...parsed,
          pricingHistory: parsed.pricingHistory || seed.pricingHistory || [],
          offers: parsed.offers || seed.offers || [],
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
    const jsonContent = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(ROOT_DB_FILE, jsonContent, 'utf-8');
      return;
    } catch (rootErr) {
      try {
        fs.writeFileSync(TMP_DB_FILE, jsonContent, 'utf-8');
      } catch (tmpErr) {
        console.warn('Filesystem write bypassed, persisting in-memory:', tmpErr);
      }
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public generateNextCaseId(): string {
    const year = new Date().getFullYear();
    let maxNum = this.data.caseCounter || 0;
    for (const c of this.data.cases) {
      const match = c.id.match(/^CD-\d{4}-(\d+)$/i);
      if (match) {
        const num = parseInt(match, 10);
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
        const num = parseInt(match, 10);
        if (num > maxNum) maxNum = num;
      }
    }
    maxNum += 1;
    this.data.invoiceCounter = maxNum;
    const formattedNum = String(maxNum).padStart(5, '0');
    this.save();
    return `CD-INV-${year}-${formattedNum}`;
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
    return log;
  }

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

  // Users
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

  // Cases
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

  // Services
  public getAllServices(): ServicePricing[] {
    return this.data.services;
  }

  public findServiceById(id: string): ServicePricing | undefined {
    return this.data.services.find(s => s.id === id || s.code.toUpperCase() === id.toUpperCase());
  }

  public addService(service: ServicePricing): ServicePricing {
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
    this.save();
    return newService;
  }

  public updateService(id: string, updates: Partial<ServicePricing>): ServicePricing | undefined {
    const srv = this.findServiceById(id);
    if (!srv) return undefined;
    Object.assign(srv, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return srv;
  }

  public deleteService(id: string): boolean {
    const index = this.data.services.findIndex(s => s.id === id || s.code.toUpperCase() === id.toUpperCase());
    if (index === -1) return false;
    this.data.services.splice(index, 1);
    this.save();
    return true;
  }

  // Offers
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
    this.data.offers.unshift(offer);
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

  // Pricing History (Fixed: Added getAllPricingHistory and addPricingHistory)
  public getAllPricingHistory(): PricingHistoryEntry[] {
    return this.data.pricingHistory || [];
  }

  public addPricingHistory(entry: Partial<PricingHistoryEntry> & { serviceId: string; newPriceINR: number }): PricingHistoryEntry {
    if (!this.data.pricingHistory) {
      this.data.pricingHistory = [];
    }
    const newEntry: PricingHistoryEntry = {
      id: entry.id || `prc-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: entry.serviceId,
      serviceName: entry.serviceName || 'Dental CAD Service',
      previousPriceINR: entry.previousPriceINR ?? entry.newPriceINR,
      newPriceINR: entry.newPriceINR,
      changedBy: entry.changedBy || 'Admin',
      reason: entry.reason || 'Price adjustment',
      timestamp: entry.timestamp || new Date().toISOString()
    };
    this.data.pricingHistory.unshift(newEntry);
    this.save();
    return newEntry;
  }

  // Invoices
  public getAllInvoices(): InvoiceRecord[] {
    return this.data.invoices;
  }

  public findInvoiceById(id: string): InvoiceRecord | undefined {
    return this.data.invoices.find(i => i.id === id || i.invoiceNumber === id || i.caseId === id);
  }

  public addInvoice(inv: InvoiceRecord): InvoiceRecord {
    this.data.invoices.unshift(inv);
    this.save();
    return inv;
  }

  // Payments
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

  // Payment Settings
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

    if (updates.providers?.upi) {
      current.providers.upi = {
        ...current.providers.upi,
        ...updates.providers.upi
      };
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
    }

    this.save();
    return this.getMaskedPaymentSettings();
  }

  // Tax Settings
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
    this.save();
    return current;
  }

  // SEO
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

  // Storage
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

  // SMTP
  public getSMTPConfig(): SMTPConfig {
    return this.data.smtpConfig;
  }

  public updateSMTPConfig(updates: Partial<SMTPConfig>): SMTPConfig {
    this.data.smtpConfig = { ...this.data.smtpConfig, ...updates };
    this.save();
    return this.data.smtpConfig;
  }

  // OTP
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

    delete this.data.otpStore[email.toLowerCase()];
    this.save();
    return { valid: true };
  }
}

export const db = new DatabaseStore();