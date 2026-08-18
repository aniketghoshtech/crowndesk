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
  TaxSettings,
  PricingHistoryEntry
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('crowndesk_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T = any>(res: Response, defaultError = 'Request failed'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!data) {
    const text = await res.text().catch(() => '');
    data = { error: text || res.statusText || defaultError };
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || (typeof data === 'string' ? data : `${defaultError} (Status ${res.status})`);
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Registration failed');
  },

  async login(email: string, pass: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    return handleResponse(res, 'Login failed');
  },

  async adminLogin(email: string, pass: string) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    return handleResponse(res, 'Admin login failed');
  },

  async forceChangePassword(newPassword: string, confirmPassword: string) {
    const res = await fetch(`${API_BASE}/auth/force-change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword, confirmPassword })
    });
    return handleResponse(res, 'Password update failed');
  },

  async requestForgotPasswordOtp(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res, 'OTP request failed');
  },

  async verifyOtpAndResetPassword(data: { email: string; otp: string; newPassword: string; confirmPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/verify-otp-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Password reset failed');
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ user: User }>(res, 'Session expired');
  },

  // Cases
  async getCases(params?: { status?: string; priority?: string; search?: string }): Promise<{ cases: CaseRecord[] }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/cases?${q}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ cases: CaseRecord[] }>(res, 'Failed to fetch cases');
  },

  async getCaseById(id: string): Promise<{ case: CaseRecord }> {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ case: CaseRecord }>(res, 'Case not found');
  },

  async searchCase(caseId: string): Promise<{ case: CaseRecord; isAuthorizedFullView: boolean; userRole?: string; scope?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/cases/search/${encodeURIComponent(caseId.trim())}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ case: CaseRecord; isAuthorizedFullView: boolean; userRole?: string; scope?: string; message?: string }>(res, 'Case search failed');
  },

  async trackCasePublic(caseId: string): Promise<{ case: CaseRecord; isAuthorizedFullView?: boolean }> {
    const res = await fetch(`${API_BASE}/cases/search/${encodeURIComponent(caseId.trim())}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ case: CaseRecord; isAuthorizedFullView?: boolean }>(res, 'Case not found');
  },

  async createCase(caseData: any): Promise<{ case: CaseRecord }> {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(caseData)
    });
    return handleResponse<{ case: CaseRecord }>(res, 'Failed to submit case');
  },

  async updateCaseStatus(caseId: string, newStatus: string, comment?: string) {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newStatus, comment })
    });
    return handleResponse(res, 'Status update failed');
  },

  async approveCase(caseId: string, comment?: string) {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment })
    });
    return handleResponse(res, 'Approval failed');
  },

  async requestRevision(caseId: string, revisionReason: string) {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/revision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ revisionReason })
    });
    return handleResponse(res, 'Revision request failed');
  },

  async deliverCase(caseId: string, comment?: string) {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/deliver`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment })
    });
    return handleResponse(res, 'Delivery confirmation failed');
  },

  async assignCaseToDesigner(caseId: string, designerId: string, notes?: string) {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ designerId, notes })
    });
    return handleResponse(res, 'Designer assignment failed');
  },

  async postCaseComment(caseId: string, message: string, isTechnicalOnly = false) {
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, isTechnicalOnly })
    });
    return handleResponse(res, 'Failed to post comment');
  },

  // Files
  async uploadFile(formData: FormData) {
    const token = localStorage.getItem('crowndesk_token');
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    return handleResponse(res, 'File upload failed');
  },

  // Services & Pricing
  async getServices(): Promise<{ services: ServicePricing[] }> {
    const res = await fetch(`${API_BASE}/services`);
    return handleResponse<{ services: ServicePricing[] }>(res, 'Failed to fetch services');
  },

  async createService(serviceData: Partial<ServicePricing>) {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData)
    });
    return handleResponse(res, 'Failed to create service');
  },

  // Backward-compatible alias
  async saveService(serviceData: any) {
    return this.createService(serviceData);
  },

  async updateService(id: string, serviceData: Partial<ServicePricing> & { changeReason?: string }) {
    const res = await fetch(`${API_BASE}/services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData)
    });
    return handleResponse(res, 'Failed to update service');
  },

  async toggleService(id: string) {
    const res = await fetch(`${API_BASE}/services/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to toggle service status');
  },

  async deleteService(id: string) {
    const res = await fetch(`${API_BASE}/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to delete service');
  },

  async getPricingHistory(serviceId?: string): Promise<{ history: PricingHistoryEntry[] }> {
    const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : '';
    const res = await fetch(`${API_BASE}/pricing/history${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ history: PricingHistoryEntry[] }>(res, 'Failed to fetch pricing history');
  },

  async getTaxSettings(): Promise<{ taxSettings: TaxSettings }> {
    const res = await fetch(`${API_BASE}/pricing/tax-settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ taxSettings: TaxSettings }>(res, 'Failed to fetch tax settings');
  },

  async updateTaxSettings(taxSettings: Partial<TaxSettings>) {
    const res = await fetch(`${API_BASE}/pricing/tax-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taxSettings)
    });
    return handleResponse(res, 'Failed to update tax settings');
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
    return handleResponse(res, 'Failed to calculate price');
  },

  async getOffers(includeInactive = false): Promise<{ offers: Offer[] }> {
    const query = includeInactive ? '?includeInactive=true' : '';
    const res = await fetch(`${API_BASE}/offers${query}`);
    return handleResponse<{ offers: Offer[] }>(res, 'Failed to fetch offers');
  },

  async saveOffer(offerData: any) {
    const res = await fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(offerData)
    });
    return handleResponse(res, 'Failed to create offer');
  },

  async updateOffer(id: string, offerData: any) {
    const res = await fetch(`${API_BASE}/offers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(offerData)
    });
    return handleResponse(res, 'Failed to update offer');
  },

  async toggleOffer(id: string) {
    const res = await fetch(`${API_BASE}/offers/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to toggle offer status');
  },

  async deleteOffer(id: string) {
    const res = await fetch(`${API_BASE}/offers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to delete offer');
  },

  // UPI Payments & Invoices
  async getPublicPaymentConfig() {
    const res = await fetch(`${API_BASE}/payments/public-config`);
    return handleResponse(res, 'Failed to fetch payment config');
  },

  async submitUpiPayment(data: {
    caseId: string;
    upiTransactionId: string;
    paymentScreenshot?: string;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/payments/upi/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'UPI payment submission failed');
  },

  // Backward-compatible alias
  async submitManualPaymentProof(data: { caseId: string; gateway?: string; transactionId: string; notes?: string; proofUrl?: string }) {
    return this.submitUpiPayment({
      caseId: data.caseId,
      upiTransactionId: data.transactionId,
      paymentScreenshot: data.proofUrl,
      notes: data.notes
    });
  },

  async getInvoices(caseId?: string): Promise<{ invoices: InvoiceRecord[] }> {
    const q = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
    const res = await fetch(`${API_BASE}/invoices${q}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ invoices: InvoiceRecord[] }>(res, 'Failed to fetch invoices');
  },

  // Admin Payment Management
  async getAdminPaymentSettings(): Promise<{ paymentSettings: any }> {
    const res = await fetch(`${API_BASE}/admin/payment-settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ paymentSettings: any }>(res, 'Failed to fetch payment settings');
  },

  async updateAdminPaymentSettings(settings: any) {
    const res = await fetch(`${API_BASE}/admin/payment-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res, 'Failed to save payment settings');
  },

  async testAdminPaymentConnection(provider = 'UPI') {
    const res = await fetch(`${API_BASE}/admin/payment-settings/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ provider })
    });
    return handleResponse(res, 'Payment connection test failed');
  },

  async getAdminPayments(params?: { status?: string; search?: string }) {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/admin/payments?${q}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to fetch payment ledger');
  },

  async verifyAdminPayment(paymentId: string) {
    const res = await fetch(`${API_BASE}/admin/payments/${encodeURIComponent(paymentId)}/verify`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to verify payment');
  },

  async approveAdminPayment(paymentId: string) {
    return this.verifyAdminPayment(paymentId);
  },

  async rejectAdminPayment(paymentId: string, reason: string) {
    const res = await fetch(`${API_BASE}/admin/payments/${encodeURIComponent(paymentId)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res, 'Failed to reject payment');
  },

  async refundAdminPayment(paymentId: string, refundReason: string) {
    const res = await fetch(`${API_BASE}/admin/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ refundReason })
    });
    return handleResponse(res, 'Failed to process refund');
  },

  async getAdminStorageSettings(): Promise<{ storageConfig: any }> {
    const res = await fetch(`${API_BASE}/admin/storage-settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ storageConfig: any }>(res, 'Failed to fetch storage settings');
  },

  async updateAdminStorageSettings(config: any) {
    const res = await fetch(`${API_BASE}/admin/storage-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return handleResponse(res, 'Failed to update storage settings');
  },

  async testAdminStorageConnection() {
    const res = await fetch(`${API_BASE}/admin/storage-settings/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Storage connection test failed');
  },

  // Admin Controls
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AdminAnalytics>(res, 'Failed to fetch analytics');
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ users: User[] }>(res, 'Failed to fetch employees');
  },

  async createAdminUser(data: any) {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Failed to create user');
  },

  async updateAdminUser(userId: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/employees/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Failed to update employee');
  },

  async deleteAdminUser(userId: string) {
    const res = await fetch(`${API_BASE}/admin/employees/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to delete employee');
  },

  async toggleAdminUserStatus(userId: string) {
    const res = await fetch(`${API_BASE}/admin/employees/${encodeURIComponent(userId)}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to toggle employee status');
  },

  async adminResetUserPassword(userId: string, newPassword: string, forceChange = true) {
    const res = await fetch(`${API_BASE}/admin/employees/${encodeURIComponent(userId)}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword, forceChange })
    });
    return handleResponse(res, 'Failed to reset password');
  },

  async getAdminCustomers(): Promise<{ customers: any[] }> {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ customers: any[] }>(res, 'Failed to fetch customers');
  },

  async createAdminCustomer(data: any) {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Failed to create customer');
  },

  async updateAdminCustomer(customerId: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/customers/${encodeURIComponent(customerId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Failed to update customer');
  },

  async deleteAdminCustomer(customerId: string) {
    const res = await fetch(`${API_BASE}/admin/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to delete customer');
  },

  async createAdminCase(caseData: any) {
    const res = await fetch(`${API_BASE}/admin/cases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(caseData)
    });
    return handleResponse(res, 'Failed to create case');
  },

  async updateAdminCase(caseId: string, caseData: any) {
    const res = await fetch(`${API_BASE}/admin/cases/${encodeURIComponent(caseId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(caseData)
    });
    return handleResponse(res, 'Failed to update case');
  },

  async deleteAdminCase(caseId: string) {
    const res = await fetch(`${API_BASE}/admin/cases/${encodeURIComponent(caseId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res, 'Failed to delete case');
  },

  async getAdminFiles(): Promise<{ files: any[]; totalFiles: number }> {
    const res = await fetch(`${API_BASE}/admin/files`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ files: any[]; totalFiles: number }>(res, 'Failed to fetch files');
  },

  async getAdminNotifications(): Promise<{ notifications: any[] }> {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ notifications: any[] }>(res, 'Failed to fetch notifications');
  },

  async broadcastNotification(data: { title: string; message: string; targetRole?: string; type?: string }) {
    const res = await fetch(`${API_BASE}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Failed to broadcast notification');
  },

  async getAdminReports(): Promise<{ summary: any; serviceBreakdown: any[]; monthlyTrends: any[] }> {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ summary: any; serviceBreakdown: any[]; monthlyTrends: any[] }>(res, 'Failed to fetch reports');
  },

  async getAdminTaxSettings(): Promise<{ taxSettings: TaxSettings }> {
    const res = await fetch(`${API_BASE}/admin/tax-settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ taxSettings: TaxSettings }>(res, 'Failed to fetch admin tax settings');
  },

  async updateAdminTaxSettings(taxSettings: { taxEnabled: boolean; taxName: string; taxPercent: number }) {
    const res = await fetch(`${API_BASE}/admin/tax-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taxSettings)
    });
    return handleResponse(res, 'Failed to update tax settings');
  },

  async getAdminGeneralSettings(): Promise<{ settings: any; taxSettings?: TaxSettings }> {
    const res = await fetch(`${API_BASE}/admin/general-settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ settings: any; taxSettings?: TaxSettings }>(res, 'Failed to fetch general settings');
  },

  async updateAdminGeneralSettings(settings: any) {
    const res = await fetch(`${API_BASE}/admin/general-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res, 'Failed to update general settings');
  },

  async getAuditLogs(): Promise<{ logs: AuditLogRecord[] }> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ logs: AuditLogRecord[] }>(res, 'Failed to fetch audit logs');
  },

  async getSeoConfig(): Promise<{ seo: SeoConfig }> {
    const res = await fetch(`${API_BASE}/seo`);
    return handleResponse<{ seo: SeoConfig }>(res, 'Failed to fetch SEO configuration');
  },

  async updateSeoConfig(seoData: any) {
    const res = await fetch(`${API_BASE}/seo`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(seoData)
    });
    return handleResponse(res, 'Failed to update SEO configuration');
  },

  // Firebase Auth Synchronization
  async syncFirebaseUser(userData: { uid: string; email: string; name?: string; photoURL?: string }) {
    const res = await fetch(`${API_BASE}/auth/firebase-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse<{ token: string; user: User }>(res, 'Firebase authentication synchronization failed');
  },

  // Gemini AI Multi-Turn Chat
  async geminiChat(params: {
    messages: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>;
    model?: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | string;
    role?: 'cad_specialist' | 'clinical_analyst' | 'instant_assistant' | 'research_analyst' | string;
    enableSearch?: boolean;
    caseContext?: any;
    customSystemPrompt?: string;
  }) {
    const res = await fetch(`${API_BASE}/gemini/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse<{
      text: string;
      model: string;
      groundingMetadata?: any;
      usage?: any;
      mode?: 'live' | 'fallback';
    }>(res, 'Gemini AI Chat generation failed');
  },

  // Gemini Live Search Grounding
  async geminiSearchGroundedInfo(query: string, topic?: string) {
    const res = await fetch(`${API_BASE}/gemini/search-grounded-info`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, topic })
    });
    return handleResponse<{
      text: string;
      groundingMetadata?: any;
      model: string;
    }>(res, 'Search Grounding failed');
  }
};
