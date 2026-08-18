export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR_LAB' | 'DESIGNER_EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  clinicOrLabName?: string;
  accountType?: 'DOCTOR' | 'DENTAL_LAB';
  country?: string;
  address?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  forcePasswordChange?: boolean;
  avatarUrl?: string;
  specialization?: string; // For designers (e.g., "Crown & Bridge Specialist", "Implant Designer")
  activeCaseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type CaseStatus = 
  | 'NEW' 
  | 'RECEIVED' 
  | 'ASSIGNED' 
  | 'IN_DESIGN' 
  | 'QC' 
  | 'APPROVAL' 
  | 'REVISION' 
  | 'COMPLETED' 
  | 'DELIVERED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'UNDER_REVIEW' 
  | 'PAID' 
  | 'REJECTED' 
  | 'REFUNDED' 
  | 'EXEMPT' 
  | 'UNPAID' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'PENDING_VERIFICATION';

export type PriorityLevel = 'STANDARD' | 'RUSH' | 'URGENT';

export interface ToothItem {
  toothNumber: string; // e.g. "11", "12", "46"
  quadrant?: 'UR' | 'UL' | 'LL' | 'LR';
  serviceCode: string; // e.g. "CROWN", "BRIDGE", "VENEER"
  shade?: string; // e.g. "A1", "A2", "Bleach"
  material?: string; // e.g. "Zirconia Multi-Layer", "E-Max", "Titanium Custom"
  notes?: string;
}

export interface CaseFile {
  id: string;
  caseId: string;
  fileName: string;
  originalName: string;
  fileType: 'SCAN_STL' | 'SCAN_PLY' | 'SCAN_OBJ' | 'WORKING_FILE' | 'FINAL_STL' | 'IMAGE' | 'PDF' | 'ZIP';
  sizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserRole: UserRole;
  uploadedAt: string;
  version: number;
  isFinalDesign: boolean;
  downloadCount: number;
  fileUrl: string;
  storageKey: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  previousStatus?: CaseStatus;
  newStatus?: CaseStatus;
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  comment?: string;
  isTechnical?: boolean;
}

export interface CaseComment {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isTechnicalOnly: boolean; // If true, only visible to Admin and Designer
  timestamp: string;
}

export interface CaseRecord {
  id: string; // CD-2026-00001
  customerId: string;
  customerName: string;
  customerClinic: string;
  customerEmail: string;
  customerPhone: string;
  patientRef: string; // e.g. "Pt. Rajesh K. #892"
  doctorName?: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  material: string;
  shade: string;
  unitsQuantity: number;
  teeth: ToothItem[];
  instructions: string;
  additionalNotes?: string;
  dueDate: string;
  priority: PriorityLevel;
  
  // Status & Assignment
  status: CaseStatus;
  assignedDesignerId?: string;
  assignedDesignerName?: string;
  
  // Financials
  paymentStatus: PaymentStatus;
  unitPrice: number;
  currency: string; // "INR" or "USD"
  subtotal: number;
  discountAmount: number;
  offerCodeApplied?: string;
  offerDiscountAmount: number;
  taxAmount: number;
  finalTotalAmount: number;
  pricingSnapshot?: {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPriceINR: number;
    unitPriceUSD: number;
    unitPriceEUR?: number;
    unitPriceGBP?: number;
    taxPercent: number;
    unitType: string;
    snapshottedAt: string;
  };
  paymentId?: string;
  invoiceId?: string;
  clinicalNotes?: string;
  clinicOrLabName?: string;
  clinicName?: string;
  
  // Permissions & Access
  finalStlUnlocked: boolean;
  
  // Embedded Relations
  files: CaseFile[];
  timeline: TimelineEvent[];
  comments: CaseComment[];
  revisionHistory: {
    revisionNumber: number;
    requestedAt: string;
    requestedBy: string;
    reason: string;
    resolvedAt?: string;
    resolvedBy?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ServicePricing {
  id: string;
  code: string;
  name: string;
  category?: string; // "Crown", "Bridge", "Implant", "Veneer", "Inlay / Onlay", "Full Arch", "Smile Design", "Dentures", "Orthodontics", "Custom CAD"
  description: string;
  unitType: string; // "Per Tooth", "Per Unit", "Per Arch", "Per Case", "Per Smile"
  currency?: string; // "INR", "USD", "EUR", "GBP"
  unitPriceINR: number;
  unitPriceUSD: number;
  unitPriceEUR?: number;
  unitPriceGBP?: number;
  taxPercent: number;
  discountPercent: number;
  materials: string[];
  shades: string[];
  standardTurnaroundHours: number;
  active: boolean;
  isActive?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingHistoryEntry {
  id: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  oldPriceINR: number;
  newPriceINR: number;
  oldPriceUSD?: number;
  newPriceUSD?: number;
  currency: string;
  changedByUserId: string;
  changedByUserName: string;
  changedByUserRole: string;
  timestamp: string;
  changeReason?: string;
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  offerType: 'FREE_UNITS' | 'PERCENTAGE' | 'BUY_X_GET_Y';
  buyQuantityRequired?: number;
  freeUnitsCount?: number;
  percentageDiscount?: number;
  eligibleServiceCodes: string[]; // empty means all services
  isNewCustomerOnly: boolean;
  maxUsagePerCustomer: number;
  active: boolean;
  startDate: string;
  endDate: string;
  timesRedeemed?: number;
  validUntil?: string;
}

export interface PaymentGatewayConfig {
  id: string;
  provider: 'UPI';
  name: string;
  enabled: boolean;
  mode?: 'TEST' | 'LIVE';
  currency: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
  lastConnectionCheck?: string;
  
  // UPI specific
  businessName?: string;
  upiId?: string;
  upiDisplayName?: string;
  upiQrImageUrl?: string;
  upiInstructions?: string;
  verificationMode?: 'MANUAL_ADMIN' | 'INSTANT_PREVIEW';
}

export interface SettlementInfo {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  country: string;
  settlementCurrency: string;
  settlementProvider: string;
  accountNickname: string;
  notes?: string;
}

export interface TaxSettings {
  taxEnabled: boolean;
  taxName: string;
  taxPercent: number;
}

export interface PaymentPolicySettings {
  paymentTiming: 'BEFORE_DESIGN' | 'BEFORE_FINAL_DOWNLOAD';
  defaultCurrency: 'INR' | 'USD' | 'EUR';
  enableGST: boolean;
  gstRatePercent: number;
  taxName?: string;
  taxEnabled?: boolean;
  taxPercent?: number;
}

export interface FullPaymentSettings {
  providers: {
    upi: PaymentGatewayConfig;
  };
  settlement: SettlementInfo;
  policy: PaymentPolicySettings;
  taxSettings?: TaxSettings;
}

export interface PaymentRecord {
  id: string;
  caseId: string;
  case_id?: string;
  customerId: string;
  customer_id?: string;
  customerName: string;
  customer_name?: string;
  customerClinic?: string;
  serviceName?: string;
  service_name?: string;
  amount: number;
  currency: string;
  gateway?: string;
  paymentMethod: 'UPI' | string;
  payment_method?: 'UPI' | string;
  upiTransactionId?: string;
  upi_transaction_id?: string;
  transactionId: string;
  paymentScreenshot?: string;
  payment_screenshot?: string;
  paymentProofUrl?: string;
  paymentProofFileName?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  rejection_reason?: string;
  refundReason?: string;
  verifiedBy?: string;
  verified_by?: string;
  verifiedAt?: string;
  verified_at?: string;
  refundedBy?: string;
  refundedAt?: string;
  invoiceId: string;
  notes?: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // CD-INV-2026-00001
  caseId: string;
  customerId: string;
  customerName: string;
  customerClinic: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceName: string;
  unitsQuantity: number;
  unitPrice: number;
  currency: string;
  subtotal: number;
  discount: number;
  offerDeduction: number;
  taxAmount: number;
  totalAmount: number;
  paymentId: string;
  paymentGateway: string;
  paymentStatus: 'PAID' | 'UNPAID';
  issuedAt: string;
  paidAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  caseId?: string;
  targetId?: string;
  details?: string;
  ipAddress: string;
  userAgent?: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  timestamp: string;
}

export interface PageSEOSetting {
  path: string;
  pageName: string;
  title: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
}

export interface GlobalSEOSettings {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultMetaDescription: string;
  defaultKeywords: string;
  defaultOgImage: string;
  twitterHandle: string;
  facebookUrl: string;
  instagramUrl: string;
  pages: Record<string, PageSEOSetting>;
}

export interface StorageConfig {
  provider: 'SUPABASE' | 'AWS_S3' | 'CLOUDFLARE_R2' | 'GCS_PRIVATE' | 'S3_COMPATIBLE' | 'LOCAL_SECURE_VAULT';
  bucketName: string;
  region: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  maxFileSizeMB: number;
  allowedExtensions: string[];
  retentionDays: number;
  autoBackupEnabled: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
  lastConnectionCheck?: string;
  totalStorageUsedBytes: number;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  senderName: string;
  senderEmail: string;
  supportPhone: string;
  businessAddress: string;
  isConfigured: boolean;
}

export interface AdminAnalytics {
  totalRevenueINR: number;
  totalCases: number;
  newCases?: number;
  activeCases: number;
  completedCases?: number;
  pendingCases?: number;
  totalRevenue?: number;
  todayRevenue?: number;
  pendingPayments?: number;
  pendingPaymentsAmount?: number;
  totalCustomers?: number;
  totalUnitsMilled: number;
  activeDesigners: number;
  casesByStatus: Record<string, number>;
  kpis?: {
    totalCases: number;
    newCases: number;
    activeCases: number;
    completedCases: number;
    pendingCases: number;
    totalRevenue: number;
    totalRevenueINR: number;
    todayRevenue: number;
    pendingPayments: number;
    pendingPaymentsAmount?: number;
    totalCustomers: number;
    activeDesigners: number;
    totalUnitsMilled?: number;
  };
}
