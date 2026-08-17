import {
  User,
  CaseRecord,
  ServicePricing,
  Offer,
  InvoiceRecord,
  AppNotification,
  SeoConfig,
  AdminAnalytics,
  AuditLogRecord,
  TaxSettings
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('crowndesk_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  async login(email: string, pass: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  async adminLogin(email: string, pass: string) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Admin login failed');
    return json;
  },

  async forceChangePassword(newPassword: string, confirmPassword: string) {
    const res = await fetch(`${API_BASE}/auth/force-change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword, confirmPassword })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Password update failed');
    return json;
  },

  async requestForgotPasswordOtp(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'OTP request failed');
    return json;
  },

  async verifyOtpAndResetPassword(data: { email: string; otp: string; newPassword: string; confirmPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/verify-otp-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Password reset failed');
    return json;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Session expired');
    return json;
  },

  // Cases
  async getCases(params?: { status?: string; priority?: string; search?: string }): Promise<{ cases: CaseRecord[] }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/cases?${q}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch cases');
    return json;
  },

  async getCaseById(id: string): Promise<{ case: CaseRecord }> {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Case not found');
    return json;
  },

  async searchCase(caseId: string): Promise<{ case: CaseRecord; isAuthorizedFullView: boolean; userRole?: string; scope?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/cases/search/${encodeURIComponent(caseId.trim())}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Case search failed');
    return json;
  },

  async trackCasePublic(caseId: string): Promise<{ case: CaseRecord; isAuthorizedFullView?: boolean }> {
    const res = await fetch(`${API_BASE}/cases/search/${encodeURIComponent(caseId.trim())}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Case not found');
    return json;
  },

  async createCase(caseData: any): Promise<{ case: CaseRecord }> {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(caseData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit case');
    return json;
  },

  async updateCaseStatus(caseId: string, newStatus: string, comment?: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newStatus, comment })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Status update failed');
    return json;
  },

  async approveCase(caseId: string, comment?: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Approval failed');
    return json;
  },

  async requestRevision(caseId: string, revisionReason: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/revision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ revisionReason })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Revision request failed');
    return json;
  },

  async deliverCase(caseId: string, comment?: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/deliver`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Delivery confirmation failed');
    return json;
  },

  async assignCaseToDesigner(caseId: string, designerId: string, notes?: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ designerId, notes })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Designer assignment failed');
    return json;
  },

  async postCaseComment(caseId: string, message: string, isTechnicalOnly = false) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, isTechnicalOnly })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to post comment');
    return json;
  },

  // Files
  async uploadFile(formData: FormData) {
    const token = localStorage.getItem('crowndesk_token');
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'File upload failed');
    return json;
  },

  // Services & Pricing
  async getServices(): Promise<{ services: ServicePricing[] }> {
    const res = await fetch(`${API_BASE}/services`);
    return res.json();
  },

  async saveService(serviceData: any) {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData)
    });
    return res.json();
  },

  async calculatePrice(serviceId: string, quantity: number, offerCode?: string) {
    const res = await fetch(`${API_BASE}/pricing/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ serviceId, quantity, offerCode })
    });
    return res.json();
  },

  async getOffers(includeInactive = false): Promise<{ offers: Offer[] }> {
    const query = includeInactive ? '?includeInactive=true' : '';
    const res = await fetch(`${API_BASE}/offers${query}`);
    return res.json();
  },

  async saveOffer(offerData: any) {
    const res = await fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(offerData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create offer');
    return json;
  },

  async updateOffer(id: string, offerData: any) {
    const res = await fetch(`${API_BASE}/offers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(offerData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update offer');
    return json;
  },

  async toggleOffer(id: string) {
    const res = await fetch(`${API_BASE}/offers/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to toggle offer status');
    return json;
  },

  async deleteOffer(id: string) {
    const res = await fetch(`${API_BASE}/offers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete offer');
    return json;
  },

  // Payments & Invoices
  async getPublicPaymentConfig() {
    const res = await fetch(`${API_BASE}/payments/public-config`);
    return res.json();
  },

  async createPaymentOrder(caseId: string, gateway = 'RAZORPAY') {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ caseId, gateway })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Payment initialization failed');
    return json;
  },

  async verifyPayment(data: { caseId: string; gateway: string; transactionId?: string; gatewayOrderId?: string; paymentMethod?: string }) {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Payment verification failed');
    return json;
  },

  async submitManualPaymentProof(data: { caseId: string; gateway: string; transactionId: string; notes?: string; proofUrl?: string }) {
    const res = await fetch(`${API_BASE}/payments/manual-proof`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit payment proof');
    return json;
  },

  async getInvoices(caseId?: string): Promise<{ invoices: InvoiceRecord[] }> {
    const q = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const res = await fetch(`${API_BASE}/invoices${q}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Admin Payment & Storage Settings
  async getAdminPaymentSettings(): Promise<{ paymentSettings: any }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch payment settings');
    return json;
  },

  async updateAdminPaymentSettings(settings: any) {
    const res = await fetch(`${API_BASE}/admin/payment-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save payment settings');
    return json;
  },

  async testAdminPaymentConnection(provider: string) {
    const res = await fetch(`${API_BASE}/admin/payment-settings/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ provider })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Payment connection test failed');
    return json;
  },

  async getAdminPayments(params?: { status?: string; gateway?: string; search?: string }) {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/admin/payments?${q}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch payment ledger');
    return json;
  },

  async approveAdminPayment(paymentId: string) {
    const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to approve payment');
    return json;
  },

  async rejectAdminPayment(paymentId: string, reason: string) {
    const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reject payment');
    return json;
  },

  async refundAdminPayment(paymentId: string, refundReason: string) {
    const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ refundReason })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to process refund');
    return json;
  },

  async getAdminStorageSettings(): Promise<{ storageConfig: any }> {
    const res = await fetch(`${API_BASE}/admin/storage-settings`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch storage settings');
    return json;
  },

  async updateAdminStorageSettings(config: any) {
    const res = await fetch(`${API_BASE}/admin/storage-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update storage settings');
    return json;
  },

  async testAdminStorageConnection() {
    const res = await fetch(`${API_BASE}/admin/storage-settings/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Storage connection test failed');
    return json;
  },

  // Admin Controls
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async createAdminUser(data: any) {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async adminResetUserPassword(userId: string, newPassword: string, forceChange = true) {
    const res = await fetch(`${API_BASE}/admin/employees/${userId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword, forceChange })
    });
    return res.json();
  },

  async getAdminCustomers(): Promise<{ customers: any[] }> {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAdminFiles(): Promise<{ files: any[]; totalFiles: number }> {
    const res = await fetch(`${API_BASE}/admin/files`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAdminNotifications(): Promise<{ notifications: any[] }> {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async broadcastNotification(data: { title: string; message: string; targetRole?: string; type?: string }) {
    const res = await fetch(`${API_BASE}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAdminReports(): Promise<{ summary: any; serviceBreakdown: any[]; monthlyTrends: any[] }> {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getTaxSettings(): Promise<{ taxSettings: TaxSettings }> {
    const res = await fetch(`${API_BASE}/pricing/tax-settings`);
    return res.json();
  },

  async getAdminTaxSettings(): Promise<{ taxSettings: TaxSettings }> {
    const res = await fetch(`${API_BASE}/admin/tax-settings`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateAdminTaxSettings(taxSettings: { taxEnabled: boolean; taxName: string; taxPercent: number }) {
    const res = await fetch(`${API_BASE}/admin/tax-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taxSettings)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update tax settings');
    return json;
  },

  async getAdminGeneralSettings(): Promise<{ settings: any; taxSettings?: TaxSettings }> {
    const res = await fetch(`${API_BASE}/admin/general-settings`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateAdminGeneralSettings(settings: any) {
    const res = await fetch(`${API_BASE}/admin/general-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async getAuditLogs(): Promise<{ logs: AuditLogRecord[] }> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getSeoConfig(): Promise<{ seo: SeoConfig }> {
    const res = await fetch(`${API_BASE}/seo`);
    return res.json();
  },

  async updateSeoConfig(seoData: any) {
    const res = await fetch(`${API_BASE}/seo`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(seoData)
    });
    return res.json();
  }
};
