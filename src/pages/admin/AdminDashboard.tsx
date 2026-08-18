import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  AdminAnalytics,
  User,
  CaseRecord,
  CaseStatus,
  ServicePricing,
  Offer,
  SeoConfig,
  AuditLogRecord,
  InvoiceRecord
} from '../../types';
import { CaseTimelineView } from '../../components/case/CaseTimelineView';
import { PaymentStorageSettings } from './PaymentStorageSettings';
import { PaymentTransactionsLedger } from './PaymentTransactionsLedger';
import { AdminOffersManager } from './AdminOffersManager';
import { AdminPricingManagement } from './AdminPricingManagement';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCog,
  Palette,
  Sparkles,
  DollarSign,
  Gift,
  CreditCard,
  Receipt,
  FileBox,
  Bell,
  BarChart3,
  Search,
  HardDrive,
  Settings,
  ShieldAlert,
  PlusCircle,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  FileText,
  Clock,
  Send,
  Building2,
  Phone,
  Mail,
  MapPin,
  Tag,
  Check,
  XCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  TrendingUp,
  Calendar,
  Zap,
  UserCheck,
  Hourglass
} from 'lucide-react';

interface AdminDashboardProps {
  initialCaseId?: string;
  initialTab?: AdminTab;
  onNavigate: (view: string, data?: any) => void;
  onOpenAiChat?: (caseContext?: any) => void;
}

export type AdminTab =
  | 'DASHBOARD'
  | 'CASES'
  | 'CUSTOMERS'
  | 'EMPLOYEES'
  | 'DESIGNERS'
  | 'PRICING_SERVICES'
  | 'SERVICES'
  | 'PRICING'
  | 'OFFERS'
  | 'PAYMENTS'
  | 'INVOICES'
  | 'FILES'
  | 'NOTIFICATIONS'
  | 'REPORTS'
  | 'SEO'
  | 'STORAGE'
  | 'SETTINGS'
  | 'AUDIT_LOGS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialCaseId, initialTab, onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || (initialCaseId ? 'CASES' : 'DASHBOARD'));

  // Core Data States
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [filesCatalog, setFilesCatalog] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [seo, setSeo] = useState<SeoConfig | null>(null);
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [caseSearch, setCaseSearch] = useState(initialCaseId || '');
  const [caseStatusFilter, setCaseStatusFilter] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals & Action States
  const [assignModal, setAssignModal] = useState<{ open: boolean; caseId: string }>({ open: false, caseId: '' });
  const [selectedDesignerId, setSelectedDesignerId] = useState('');
  const [statusModal, setStatusModal] = useState<{ open: boolean; caseId: string; currentStatus: CaseStatus; newStatus: CaseStatus; comment: string }>({
    open: false,
    caseId: '',
    currentStatus: 'NEW',
    newStatus: 'NEW',
    comment: ''
  });
  const [inspectCase, setInspectCase] = useState<CaseRecord | null>(null);
  const [createStaffModal, setCreateStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({ name: '', email: '', password: '', role: 'DESIGNER_EMPLOYEE', phone: '', specialization: 'Anatomic Crowns & Bridges' });
  const [createServiceModal, setCreateServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ code: '', name: '', description: '', unitPriceINR: 350, unitPriceUSD: 8, standardTurnaroundHours: 24, materials: 'Zirconia, PMMA' });
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: '', message: '', targetRole: 'ALL', type: 'INFO' });
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // SEO Form
  const [seoForm, setSeoForm] = useState({ siteTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', contactPhone: '', contactEmail: '' });
  const [seoSaveMsg, setSeoSaveMsg] = useState('');

  // General Settings Form
  const [settingsForm, setSettingsForm] = useState({
    platformName: 'CrownDesk Precision Dental CAD',
    supportEmail: 'supportcrwundesk@gmail.com',
    supportPhone: '+91 9058322251',
    supportAddress: '8A/GN/262, Lowyer Colony, Agra, India',
    taxGstPercent: 18,
    taxPercent: 18,
    taxName: 'GST (Goods & Services Tax)',
    taxEnabled: true,
    defaultCurrency: 'INR'
  });
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  // Fetch all administrative datasets
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        anRes,
        csRes,
        custRes,
        empRes,
        srvRes,
        offRes,
        invRes,
        filRes,
        notifRes,
        repRes,
        seoRes,
        setRes,
        audRes
      ] = await Promise.all([
        api.getAdminAnalytics().catch(() => null),
        api.getCases().catch(() => ({ cases: [] })),
        api.getAdminCustomers().catch(() => ({ customers: [] })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getServices().catch(() => ({ services: [] })),
        api.getOffers(true).catch(() => ({ offers: [] })),
        api.getInvoices().catch(() => ({ invoices: [] })),
        api.getAdminFiles().catch(() => ({ files: [] })),
        api.getAdminNotifications().catch(() => ({ notifications: [] })),
        api.getAdminReports().catch(() => null),
        api.getSeoConfig().catch(() => ({ seo: null })),
        api.getAdminGeneralSettings().catch(() => ({ settings: null })),
        api.getAuditLogs().catch(() => ({ logs: [] }))
      ]);

      if (anRes) setAnalytics(anRes);
      if (csRes?.cases) setCases(csRes.cases);
      if (custRes?.customers) setCustomers(custRes.customers);
      if (empRes?.users) setEmployees(empRes.users);
      if (srvRes?.services) setServices(srvRes.services);
      if (offRes?.offers) setOffers(offRes.offers);
      if (invRes?.invoices) setInvoices(invRes.invoices);
      if (filRes?.files) setFilesCatalog(filRes.files);
      if (notifRes?.notifications) setNotifications(notifRes.notifications);
      if (repRes) setReportsData(repRes);
      if (seoRes?.seo) {
        setSeo(seoRes.seo);
        setSeoForm({
          siteTitle: seoRes.seo.siteTitle || '',
          metaDescription: seoRes.seo.metaDescription || '',
          keywords: seoRes.seo.keywords?.join(', ') || '',
          canonicalUrl: seoRes.seo.canonicalUrl || '',
          contactPhone: seoRes.seo.contactPhone || '',
          contactEmail: seoRes.seo.contactEmail || ''
        });
      }
      if (setRes?.settings) {
        setGeneralSettings(setRes.settings);
        setSettingsForm(setRes.settings);
      }
      if (audRes?.logs) setAuditLogs(audRes.logs);
    } catch (err) {
      console.error('Failed to load admin datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const designers = employees.filter(e => e.role === 'DESIGNER_EMPLOYEE');

  // Case Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal.caseId || !selectedDesignerId) return;
    try {
      await api.assignCaseToDesigner(assignModal.caseId, selectedDesignerId);
      setAssignModal({ open: false, caseId: '' });
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    }
  };

  // Case Status Transition with Permanent Logging
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal.caseId || !statusModal.newStatus) return;
    try {
      await api.updateCaseStatus(
        statusModal.caseId,
        statusModal.newStatus,
        statusModal.comment || `Admin status transition to ${statusModal.newStatus}`
      );
      const caseIdUpdated = statusModal.caseId;
      setStatusModal({ open: false, caseId: '', currentStatus: 'NEW', newStatus: 'NEW', comment: '' });
      fetchAllData();
      if (inspectCase && inspectCase.id === caseIdUpdated) {
        const updated = await api.getCaseById(caseIdUpdated);
        if (updated?.case) setInspectCase(updated.case);
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  // Staff Creation
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser(newStaffData);
      setCreateStaffModal(false);
      setNewStaffData({ name: '', email: '', password: '', role: 'DESIGNER_EMPLOYEE', phone: '', specialization: 'Anatomic Crowns & Bridges' });
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Staff creation failed');
    }
  };

  // Service Creation
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveService({
        code: newServiceData.code.toUpperCase(),
        name: newServiceData.name,
        description: newServiceData.description,
        unitType: 'Per Tooth',
        unitPriceINR: Number(newServiceData.unitPriceINR),
        unitPriceUSD: Number(newServiceData.unitPriceUSD),
        standardTurnaroundHours: Number(newServiceData.standardTurnaroundHours),
        materials: newServiceData.materials.split(',').map(s => s.trim()),
        active: true
      });
      setCreateServiceModal(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Service save failed');
    }
  };

  // Broadcast Notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.broadcastNotification(broadcastData);
      setBroadcastModal(false);
      setBroadcastData({ title: '', message: '', targetRole: 'ALL', type: 'INFO' });
      fetchAllData();
      alert('Notification broadcast successfully dispatched.');
    } catch (err: any) {
      alert(err.message || 'Broadcast failed');
    }
  };

  // Save SEO
  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSeoConfig({
        ...seo,
        siteTitle: seoForm.siteTitle,
        metaDescription: seoForm.metaDescription,
        keywords: seoForm.keywords.split(',').map(s => s.trim()),
        canonicalUrl: seoForm.canonicalUrl,
        contactPhone: seoForm.contactPhone,
        contactEmail: seoForm.contactEmail
      });
      setSeoSaveMsg('SEO metadata saved successfully.');
      setTimeout(() => setSeoSaveMsg(''), 3000);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'SEO update failed');
    }
  };

  // Save General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAdminGeneralSettings(settingsForm);
      setSettingsSaveMsg('Platform settings updated successfully.');
      setTimeout(() => setSettingsSaveMsg(''), 3000);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Settings update failed');
    }
  };

  // Navigation Items
  const navItems: { id: AdminTab; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CASES', label: 'Cases', icon: FolderKanban, count: cases.length },
    { id: 'CUSTOMERS', label: 'Customers', icon: Users, count: customers.length },
    { id: 'EMPLOYEES', label: 'Employees', icon: UserCog, count: employees.length },
    { id: 'DESIGNERS', label: 'Designers', icon: Palette, count: designers.length },
    { id: 'PRICING_SERVICES', label: 'Pricing & Services', icon: DollarSign, count: services.length },
    { id: 'PAYMENTS', label: 'Payments', icon: CreditCard },
    { id: 'INVOICES', label: 'Invoices', icon: Receipt, count: invoices.length },
    { id: 'FILES', label: 'Files', icon: FileBox, count: filesCatalog.length },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, count: notifications.length },
    { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
    { id: 'SEO', label: 'SEO', icon: Search },
    { id: 'STORAGE', label: 'Storage', icon: HardDrive },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
    { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: ShieldAlert, count: auditLogs.length }
  ];

  // Filtered cases
  const filteredCases = cases.filter(c => {
    const matchesStatus = caseStatusFilter === 'ALL' || c.status === caseStatusFilter;
    const matchesSearch =
      c.id.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.patientName.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.doctorName.toLowerCase().includes(caseSearch.toLowerCase()) ||
      (c.assignedDesignerName && c.assignedDesignerName.toLowerCase().includes(caseSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Filtered customers
  const filteredCustomers = customers.filter(cust =>
    cust.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    cust.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    cust.clinicOrLabName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    cust.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(a =>
    a.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.userName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.details?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.targetEntity?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Administrative Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                CrownDesk Master Administration
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                  Super Admin
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Official Clinical CAD Operation & Multi-Department Management Center
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh All Data</span>
          </button>

          <button
            onClick={() => setBroadcastModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Alert</span>
          </button>
        </div>
      </div>

      {/* Complete 17-Item Admin Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-purple-800 text-purple-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (() => {
        // Calculate all 10 KPIs with real-time fallbacks
        const kpiTotalCases = analytics?.kpis?.totalCases ?? cases.length;
        const kpiNewCases = analytics?.kpis?.newCases ?? cases.filter(c => c.status === 'NEW').length;
        const kpiActiveCases = analytics?.kpis?.activeCases ?? cases.filter(c => ['RECEIVED', 'ASSIGNED', 'IN_DESIGN', 'QC', 'APPROVAL', 'REVISION'].includes(c.status)).length;
        const kpiCompletedCases = analytics?.kpis?.completedCases ?? cases.filter(c => ['COMPLETED', 'DELIVERED'].includes(c.status)).length;
        const kpiPendingCases = analytics?.kpis?.pendingCases ?? cases.filter(c => !['COMPLETED', 'DELIVERED'].includes(c.status)).length;

        const kpiTotalRevenue = analytics?.kpis?.totalRevenue ?? analytics?.totalRevenueINR ?? 0;
        const kpiTodayRevenue = analytics?.kpis?.todayRevenue ?? 0;
        const kpiPendingPayments = analytics?.kpis?.pendingPayments ?? cases.filter(c => c.paymentStatus === 'PENDING' || c.paymentStatus === 'UNPAID').length;
        const kpiPendingPaymentsAmount = analytics?.kpis?.pendingPaymentsAmount ?? cases.filter(c => c.paymentStatus === 'PENDING' || c.paymentStatus === 'UNPAID').reduce((sum, c) => sum + (c.finalTotalAmount || 0), 0);

        const kpiTotalCustomers = analytics?.kpis?.totalCustomers ?? (customers.length || employees.filter(u => u.role === 'DOCTOR_LAB').length);
        const kpiActiveDesigners = analytics?.kpis?.activeDesigners ?? (designers.filter(d => d.isActive !== false).length || employees.filter(e => e.role === 'DESIGNER_EMPLOYEE').length);

        return (
          <div className="space-y-6">
            
            {/* KPI Header & Real-time Live Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>Executive Key Performance Indicators (KPIs)</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Sync
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Comprehensive real-time tracking across clinical pipelines, revenue reconciliation, customer base, and technician workforce
                </p>
              </div>
            </div>

            {/* 10 Core Administrative KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              
              {/* 1. Total Cases */}
              <div
                onClick={() => {
                  setCaseStatusFilter('ALL');
                  setActiveTab('CASES');
                }}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-purple-300 transition uppercase tracking-wider">
                    Total Cases
                  </span>
                  <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight group-hover:text-purple-300 transition">
                    {kpiTotalCases}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                    <span>All-time CAD orders</span>
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 2. New Cases */}
              <div
                onClick={() => {
                  setCaseStatusFilter('NEW');
                  setActiveTab('CASES');
                }}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 p-4 rounded-2xl shadow-lg hover:shadow-rose-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-rose-300 transition uppercase tracking-wider">
                    New Cases
                  </span>
                  <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
                    {kpiNewCases}
                  </div>
                  <div className="text-[10px] text-rose-400/90 font-medium pt-1 flex items-center gap-1">
                    <span>Awaiting assignment</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 3. Active Cases */}
              <div
                onClick={() => {
                  setCaseStatusFilter('IN_DESIGN');
                  setActiveTab('CASES');
                }}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl shadow-lg hover:shadow-amber-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-300 transition uppercase tracking-wider">
                    Active Cases
                  </span>
                  <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                    {kpiActiveCases}
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-medium pt-1 flex items-center gap-1">
                    <span>In-design, QC & review</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 4. Completed Cases */}
              <div
                onClick={() => {
                  setCaseStatusFilter('COMPLETED');
                  setActiveTab('CASES');
                }}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-300 transition uppercase tracking-wider">
                    Completed Cases
                  </span>
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    {kpiCompletedCases}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium pt-1 flex items-center gap-1">
                    <span>Delivered & archived</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 5. Pending Cases */}
              <div
                onClick={() => {
                  setCaseStatusFilter('APPROVAL');
                  setActiveTab('CASES');
                }}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-cyan-300 transition uppercase tracking-wider">
                    Pending Cases
                  </span>
                  <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition">
                    <Hourglass className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight">
                    {kpiPendingCases}
                  </div>
                  <div className="text-[10px] text-cyan-400/90 font-medium pt-1 flex items-center gap-1">
                    <span>Pending action/approval</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 6. Total Revenue */}
              <div
                onClick={() => setActiveTab('PAYMENTS')}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-300 transition uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    ₹{kpiTotalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                    <span>Gross settled revenue</span>
                    <ChevronRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 7. Today's Revenue */}
              <div
                onClick={() => setActiveTab('PAYMENTS')}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-300 transition uppercase tracking-wider">
                    Today's Revenue
                  </span>
                  <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono tracking-tight">
                    ₹{kpiTodayRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-indigo-400/90 font-medium pt-1 flex items-center gap-1">
                    <span>Today's collected receipts</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 8. Pending Payments */}
              <div
                onClick={() => setActiveTab('PAYMENTS')}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl shadow-lg hover:shadow-amber-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-300 transition uppercase tracking-wider">
                    Pending Payments
                  </span>
                  <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                    {kpiPendingPayments}
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-medium pt-1 flex items-center gap-1">
                    <span>₹{kpiPendingPaymentsAmount.toLocaleString('en-IN')} pending balance</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 9. Total Customers */}
              <div
                onClick={() => setActiveTab('CUSTOMERS')}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-purple-300 transition uppercase tracking-wider">
                    Total Customers
                  </span>
                  <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono tracking-tight">
                    {kpiTotalCustomers}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                    <span>Clinics & dental labs</span>
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

              {/* 10. Active Designers */}
              <div
                onClick={() => setActiveTab('DESIGNERS')}
                className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-cyan-300 transition uppercase tracking-wider">
                    Active Designers
                  </span>
                  <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
                    {kpiActiveDesigners}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                    <span>CAD Specialists on duty</span>
                    <ChevronRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>

            </div>

            {/* Operational Overview & Quick Dispatch Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions & Department Status */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Department Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('CASES')}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-semibold text-slate-300 text-left transition group"
                  >
                    <div className="font-bold text-slate-100 group-hover:text-purple-300 transition">Review Cases</div>
                    <div className="text-[10px] text-purple-400">{cases.length} Total in Pipeline</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('PAYMENTS')}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-semibold text-slate-300 text-left transition group"
                  >
                    <div className="font-bold text-slate-100 group-hover:text-emerald-300 transition">Payment Gateways</div>
                    <div className="text-[10px] text-emerald-400">Razorpay / Stripe / UPI</div>
                  </button>

                  <button
                    onClick={() => setCreateStaffModal(true)}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-semibold text-slate-300 text-left transition group"
                  >
                    <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition">+ Add Staff</div>
                    <div className="text-[10px] text-cyan-400">Technicians & Admins</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('OFFERS')}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-semibold text-slate-300 text-left transition group"
                  >
                    <div className="font-bold text-slate-100 group-hover:text-amber-300 transition">+ Create Promo</div>
                    <div className="text-[10px] text-amber-400">Vouchers & Discounts</div>
                  </button>
                </div>
              </div>

              {/* Case Status Distribution */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span>CAD Workflow Status Breakdown</span>
                  <span className="text-xs text-slate-400 font-normal">{cases.length} Total Processed</span>
                </h3>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div
                    onClick={() => {
                      setCaseStatusFilter('NEW');
                      setActiveTab('CASES');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 cursor-pointer rounded-xl border border-slate-800 transition"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">NEW</div>
                    <div className="text-lg font-black text-rose-400 font-mono">{cases.filter(c => c.status === 'NEW').length}</div>
                  </div>

                  <div
                    onClick={() => {
                      setCaseStatusFilter('ASSIGNED');
                      setActiveTab('CASES');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 cursor-pointer rounded-xl border border-slate-800 transition"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">ASSIGNED</div>
                    <div className="text-lg font-black text-purple-400 font-mono">{cases.filter(c => c.status === 'ASSIGNED').length}</div>
                  </div>

                  <div
                    onClick={() => {
                      setCaseStatusFilter('IN_DESIGN');
                      setActiveTab('CASES');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 cursor-pointer rounded-xl border border-slate-800 transition"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">IN DESIGN</div>
                    <div className="text-lg font-black text-amber-400 font-mono">{cases.filter(c => c.status === 'IN_DESIGN').length}</div>
                  </div>

                  <div
                    onClick={() => {
                      setCaseStatusFilter('APPROVAL');
                      setActiveTab('CASES');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 cursor-pointer rounded-xl border border-slate-800 transition"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">APPROVAL</div>
                    <div className="text-lg font-black text-cyan-400 font-mono">{cases.filter(c => c.status === 'APPROVAL').length}</div>
                  </div>

                  <div
                    onClick={() => {
                      setCaseStatusFilter('COMPLETED');
                      setActiveTab('CASES');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 cursor-pointer rounded-xl border border-slate-800 transition"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">DELIVERED</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">{cases.filter(c => ['COMPLETED', 'DELIVERED'].includes(c.status)).length}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2. CASES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'CASES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">CAD Case Pipeline & Dispatch Control</h2>
              <p className="text-xs text-slate-400">Direct assignments, clinical instructions, QC reviews, and STL gating</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={caseSearch}
                onChange={e => setCaseSearch(e.target.value)}
                placeholder="Search ID, Doctor, Patient..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />

              <select
                value={caseStatusFilter}
                onChange={e => setCaseStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses ({cases.length})</option>
                <option value="NEW">NEW</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_DESIGN">IN_DESIGN</option>
                <option value="QC">QC</option>
                <option value="APPROVAL">APPROVAL</option>
                <option value="REVISION">REVISION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Case ID</th>
                  <th className="py-3 px-2">Doctor / Client</th>
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Service & Units</th>
                  <th className="py-3 px-2">Assigned CAD Designer</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Payment</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2 font-mono font-bold text-purple-300">{c.id}</td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-200">{c.doctorName}</div>
                      <div className="text-[10px] text-slate-400">{c.clinicOrLabName || 'Dental Practice'}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-300 font-medium">{c.patientName}</td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-cyan-300">{c.serviceName}</span>
                      <span className="text-slate-400 text-[10px] block">({c.unitsQuantity || 1} units • {c.teethNumbers?.join(', ') || 'General'})</span>
                    </td>
                    <td className="py-3 px-2">
                      {c.assignedDesignerName ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[11px]">
                          {c.assignedDesignerName}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        c.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {c.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectCase(c)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] border border-slate-700 transition"
                          title="Inspect Details & Workflow Timeline"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => {
                            setStatusModal({
                              open: true,
                              caseId: c.id,
                              currentStatus: c.status,
                              newStatus: c.status,
                              comment: ''
                            });
                          }}
                          className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded-lg font-semibold text-[11px] transition"
                          title="Transition Status & Record History"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => {
                            setAssignModal({ open: true, caseId: c.id });
                            setSelectedDesignerId(c.assignedDesignerId || designers[0]?.id || '');
                          }}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-[11px] shadow transition"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CUSTOMERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'CUSTOMERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Registered Doctors & Dental Laboratories</h2>
              <p className="text-xs text-slate-400">Directory of clinic partners, lifetime case volume, and billing totals</p>
            </div>
            <input
              type="text"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search by name, clinic, email, phone..."
              className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Doctor / Lab Name</th>
                  <th className="py-3 px-2">Clinic / Lab Facility</th>
                  <th className="py-3 px-2">Contact Details</th>
                  <th className="py-3 px-2">Total Cases</th>
                  <th className="py-3 px-2">Active Cases</th>
                  <th className="py-3 px-2">Lifetime Billed</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-200">{cust.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cust.id}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-300">{cust.clinicOrLabName || 'Dental Practice'}</td>
                    <td className="py-3 px-2">
                      <div className="text-slate-300">{cust.email}</div>
                      <div className="text-[10px] text-slate-500">{cust.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-purple-300">{cust.totalCasesCount || 0}</td>
                    <td className="py-3 px-2 font-mono font-bold text-amber-300">{cust.activeCasesCount || 0}</td>
                    <td className="py-3 px-2 font-mono font-bold text-emerald-400">₹{(cust.totalSpent || 0).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EMPLOYEES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'EMPLOYEES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Staff & Internal Operations Team</h2>
              <p className="text-xs text-slate-400">Manage operations operators, dispatch managers, and user credentials</p>
            </div>
            <button
              onClick={() => setCreateStaffModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Staff Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Employee Name</th>
                  <th className="py-3 px-2">Work Email</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Phone</th>
                  <th className="py-3 px-2">Temporary Password</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2 font-bold text-slate-200">{emp.name}</td>
                    <td className="py-3 px-2 text-purple-300 font-mono">{emp.email}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{emp.phone || 'N/A'}</td>
                    <td className="py-3 px-2">
                      {emp.forcePasswordChange ? (
                        <span className="text-amber-400 font-bold text-[10px]">Pending Reset</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={async () => {
                          const newPass = prompt(`Set new password for ${emp.name}:`, 'CrownPass123!');
                          if (newPass) {
                            await api.adminResetUserPassword(emp.id, newPass, true);
                            alert(`Password reset for ${emp.name}. Forced change active.`);
                            fetchAllData();
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] flex items-center gap-1 ml-auto transition"
                      >
                        <KeyRound className="w-3 h-3 text-cyan-400" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DESIGNERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'DESIGNERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">CAD Design Specialists & Workload Tracker</h2>
              <p className="text-xs text-slate-400">Active design allocations, turnaround times, and anatomical specializations</p>
            </div>
            <button
              onClick={() => {
                setNewStaffData({ ...newStaffData, role: 'DESIGNER_EMPLOYEE' });
                setCreateStaffModal(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add CAD Designer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {designers.map(d => {
              const activeCount = cases.filter(c => c.assignedDesignerId === d.id && !['COMPLETED', 'DELIVERED'].includes(c.status)).length;
              const completedCount = cases.filter(c => c.assignedDesignerId === d.id && ['COMPLETED', 'DELIVERED'].includes(c.status)).length;
              return (
                <div key={d.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{d.name}</div>
                      <div className="text-[11px] text-purple-400">{d.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Specialization: </span>
                    {d.specialization || 'Full Contour Zirconia & Implants'}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center">
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">In Design</div>
                      <div className="text-base font-black text-amber-400 font-mono">{activeCount}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Completed</div>
                      <div className="text-base font-black text-emerald-400 font-mono">{completedCount}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRICING & SERVICES TAB (All Services, Add Service, Edit Service, Offers, Tax Settings, History) */}
      {/* ========================================================================= */}
      {(activeTab === 'PRICING_SERVICES' || activeTab === 'SERVICES' || activeTab === 'PRICING' || activeTab === 'OFFERS') && (
        <AdminPricingManagement
          initialSubTab={
            activeTab === 'OFFERS'
              ? 'OFFERS'
              : activeTab === 'PRICING'
              ? 'TAX_SETTINGS'
              : 'ALL_SERVICES'
          }
        />
      )}

      {/* ========================================================================= */}
      {/* 9. PAYMENTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-6">
          <PaymentTransactionsLedger />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. INVOICES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'INVOICES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Itemized GST Tax Invoices Ledger</h2>
            <p className="text-xs text-slate-400">Audit-ready billing statements with GST breakups, discounts, and payment receipts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Invoice No</th>
                  <th className="py-3 px-2">Case ID</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Subtotal</th>
                  <th className="py-3 px-2">GST (18%)</th>
                  <th className="py-3 px-2">Total Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2 font-mono font-bold text-cyan-400">{inv.invoiceNumber}</td>
                    <td className="py-3 px-2 font-mono text-purple-300">{inv.caseId}</td>
                    <td className="py-3 px-2 text-slate-200 font-medium">{inv.customerName}</td>
                    <td className="py-3 px-2 font-mono text-slate-300">₹{inv.subtotal?.toLocaleString()}</td>
                    <td className="py-3 px-2 font-mono text-slate-400">₹{inv.taxAmount?.toLocaleString()}</td>
                    <td className="py-3 px-2 font-mono font-bold text-emerald-400">₹{inv.finalTotalAmount?.toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>View Statement</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. FILES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'FILES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Private CAD STL & Scan Files Repository</h2>
            <p className="text-xs text-slate-400">Gated download security, file checksums, and cloud storage pointers</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">File Name</th>
                  <th className="py-3 px-2">Case ID</th>
                  <th className="py-3 px-2">File Type</th>
                  <th className="py-3 px-2">Size</th>
                  <th className="py-3 px-2">Downloads</th>
                  <th className="py-3 px-2">Gated Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filesCatalog.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2 font-mono font-medium text-slate-200">{f.originalName || f.fileName}</td>
                    <td className="py-3 px-2 font-mono text-purple-300">{f.caseId}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">
                        {f.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-400">{Math.round((f.sizeBytes || 0) / 1024 / 1024 * 10) / 10} MB</td>
                    <td className="py-3 px-2 font-mono text-slate-300">{f.downloadCount || 0}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        SECURED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. NOTIFICATIONS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Dispatched Alerts & Customer Communications</h2>
              <p className="text-xs text-slate-400">SMS, Email, and in-app triggers dispatched on case status changes</p>
            </div>
            <button
              onClick={() => setBroadcastModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast New Message</span>
            </button>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs">
                <Bell className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">{n.title}</span>
                    <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. REPORTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Average Turnaround SLA</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">18.4 Hours</div>
              <div className="text-[10px] text-slate-500">99.2% Standard Delivery Compliance</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">First-Pass Clinical Approval</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">98.7%</div>
              <div className="text-[10px] text-slate-500">&lt;1.3% Clinical Revision Requests</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Active Doctor Accounts</div>
              <div className="text-2xl font-black text-purple-400 font-mono">{customers.length}</div>
              <div className="text-[10px] text-slate-500">Pan-India Clinical Coverage</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Monthly Operational Billing Volume</h3>
            <div className="space-y-3">
              {(reportsData?.monthlyTrends || [
                { month: 'Apr 2026', cases: 42, revenue: 38500 },
                { month: 'May 2026', cases: 68, revenue: 59200 },
                { month: 'Jun 2026', cases: 94, revenue: 84300 },
                { month: 'Jul 2026', cases: 128, revenue: 118400 },
                { month: 'Aug 2026 (MTD)', cases: cases.length, revenue: analytics?.totalRevenueINR || 16400 }
              ]).map((m: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{m.month}</span>
                  <div className="flex gap-6 font-mono">
                    <span className="text-slate-400">{m.cases} Cases</span>
                    <span className="text-emerald-400 font-bold">₹{m.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. SEO TAB */}
      {/* ========================================================================= */}
      {activeTab === 'SEO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs text-slate-100">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Search Engine Optimization (SEO) & OpenGraph</h2>
            <p className="text-xs text-slate-400">Search ranking meta titles, robot tags, and official contact metadata</p>
          </div>

          {seoSaveMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{seoSaveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSeo} className="space-y-4 max-w-2xl">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Global Site Meta Title</label>
              <input
                type="text"
                value={seoForm.siteTitle}
                onChange={e => setSeoForm({ ...seoForm, siteTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={seoForm.metaDescription}
                onChange={e => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target SEO Keywords (Comma-separated)</label>
              <input
                type="text"
                value={seoForm.keywords}
                onChange={e => setSeoForm({ ...seoForm, keywords: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={seoForm.contactPhone}
                  onChange={e => setSeoForm({ ...seoForm, contactPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Support Email</label>
                <input
                  type="email"
                  value={seoForm.contactEmail}
                  onChange={e => setSeoForm({ ...seoForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow transition"
            >
              Save SEO Configuration
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. STORAGE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'STORAGE' && (
        <div className="space-y-6">
          <PaymentStorageSettings />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-xs text-slate-100">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Global Platform Parameters & Official Identity</h2>
            <p className="text-xs text-slate-400">Headquarters address, support hotline, social media, and billing tax rates</p>
          </div>

          {settingsSaveMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{settingsSaveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Official Support Email</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={e => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Official Support Phone</label>
                <input
                  type="text"
                  value={settingsForm.supportPhone}
                  onChange={e => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Clinical CAD Office Address</label>
              <input
                type="text"
                value={settingsForm.supportAddress}
                onChange={e => setSettingsForm({ ...settingsForm, supportAddress: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>

            {/* Dynamic Tax Configuration Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Tax & Invoicing Regulatory Parameters</span>
                    {settingsForm.taxEnabled ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Disabled</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure tax designation name, percentage rate, and whether tax is enabled during case pricing.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.taxEnabled}
                    onChange={e => setSettingsForm({ ...settingsForm, taxEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Official Tax Name / Label</label>
                  <input
                    type="text"
                    value={settingsForm.taxName}
                    onChange={e => setSettingsForm({ ...settingsForm, taxName: e.target.value })}
                    placeholder="e.g. GST (Goods & Services Tax) or VAT"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tax Percentage (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={settingsForm.taxPercent ?? settingsForm.taxGstPercent ?? 18}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setSettingsForm({
                          ...settingsForm,
                          taxPercent: val,
                          taxGstPercent: val
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono font-bold"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Simulation */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">
                  Calculation preview for ₹1,000 case:
                </span>
                <div className="font-mono text-slate-300 flex items-center gap-2">
                  <span>Subtotal: ₹1,000</span>
                  <span>+</span>
                  <span className={settingsForm.taxEnabled ? 'text-purple-300 font-bold' : 'text-slate-500 line-through'}>
                    {settingsForm.taxName || 'Tax'} ({settingsForm.taxEnabled ? (settingsForm.taxPercent ?? settingsForm.taxGstPercent ?? 18) : 0}%): ₹
                    {settingsForm.taxEnabled ? Math.round(1000 * ((settingsForm.taxPercent ?? settingsForm.taxGstPercent ?? 18) / 100)) : 0}
                  </span>
                  <span>=</span>
                  <span className="text-white font-bold bg-purple-950 border border-purple-800 px-2 py-0.5 rounded">
                    Total: ₹{settingsForm.taxEnabled ? (1000 + Math.round(1000 * ((settingsForm.taxPercent ?? settingsForm.taxGstPercent ?? 18) / 100))).toLocaleString() : '1,000'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Default Settlement Currency</label>
              <input
                type="text"
                value={settingsForm.defaultCurrency}
                onChange={e => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono uppercase max-w-xs"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow transition"
            >
              Update Platform & Tax Settings
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 17. AUDIT LOGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">System Security & Immutable Audit Trail</h2>
              <p className="text-xs text-slate-400">Timestamped record of administrative actions, password resets, and file downloads</p>
            </div>
            <input
              type="text"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2">Actor / User</th>
                  <th className="py-2.5 px-2">Action</th>
                  <th className="py-2.5 px-2">Details</th>
                  <th className="py-2.5 px-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredAuditLogs.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 text-slate-400">{new Date(a.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-purple-300 font-semibold">{a.userName}</td>
                    <td className="py-2.5 px-2 text-cyan-300 font-bold">{a.action}</td>
                    <td className="py-2.5 px-2 text-slate-300 font-sans">{a.details}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        a.result === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                      }`}>
                        {a.result || 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Assign Designer Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">Assign CAD Designer to Case</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select CAD Technician</label>
                <select
                  value={selectedDesignerId}
                  onChange={e => setSelectedDesignerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {designers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, caseId: '' })}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {createStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-3 text-xs">
            <h3 className="text-base font-bold mb-2">Create Staff Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffData.name}
                  onChange={e => setNewStaffData({ ...newStaffData, name: e.target.value })}
                  placeholder="Rahul Verma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newStaffData.email}
                  onChange={e => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  placeholder="rahul.designer@crowndesk.in"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newStaffData.password}
                  onChange={e => setNewStaffData({ ...newStaffData, password: e.target.value })}
                  placeholder="Min 6 chars (forced reset on first login)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role</label>
                <select
                  value={newStaffData.role}
                  onChange={e => setNewStaffData({ ...newStaffData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                >
                  <option value="DESIGNER_EMPLOYEE">CAD Designer (Employee)</option>
                  <option value="ADMIN">Operations Admin</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateStaffModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {createServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-3 text-xs">
            <h3 className="text-base font-bold mb-2">Add Dental CAD Service</h3>
            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Code (e.g. SPLINT-CAD)</label>
                <input
                  type="text"
                  required
                  value={newServiceData.code}
                  onChange={e => setNewServiceData({ ...newServiceData, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={newServiceData.name}
                  onChange={e => setNewServiceData({ ...newServiceData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={newServiceData.unitPriceINR}
                    onChange={e => setNewServiceData({ ...newServiceData, unitPriceINR: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={newServiceData.unitPriceUSD}
                    onChange={e => setNewServiceData({ ...newServiceData, unitPriceUSD: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newServiceData.description}
                  onChange={e => setNewServiceData({ ...newServiceData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateServiceModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-3 text-xs">
            <h3 className="text-base font-bold mb-2">Broadcast System Announcement</h3>
            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
                <select
                  value={broadcastData.targetRole}
                  onChange={e => setBroadcastData({ ...broadcastData, targetRole: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                >
                  <option value="ALL">All Platform Users (Doctors & Designers)</option>
                  <option value="DOCTOR_LAB">Doctors & Dental Labs Only</option>
                  <option value="DESIGNER_EMPLOYEE">CAD Designers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={broadcastData.title}
                  onChange={e => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="System Maintenance or Holiday Update"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastData.message}
                  onChange={e => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  placeholder="Enter details of announcement..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setBroadcastModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
                >
                  Dispatch Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Statement Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="font-mono text-purple-400 font-bold">{selectedInvoice.invoiceNumber}</div>
                <div className="text-sm font-bold text-slate-100">CrownDesk Tax Invoice</div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-200">{selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Case Reference:</span>
                <span className="font-mono text-purple-300">{selectedInvoice.caseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono">₹{selectedInvoice.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GST (18% Dental CAD):</span>
                <span className="font-mono">₹{selectedInvoice.taxAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                <span className="text-slate-200">Total Billed:</span>
                <span className="font-mono text-emerald-400">₹{selectedInvoice.finalTotalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Print / Download Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Status Transition & History Logging Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-purple-400 font-bold">{statusModal.caseId}</span>
                <h3 className="text-base font-bold text-slate-100">Transition Case Workflow Status</h3>
                <p className="text-[11px] text-slate-400">Every transition writes an immutable audit record with previous status, new status, timestamp, user, and comment.</p>
              </div>
              <button
                onClick={() => setStatusModal({ open: false, caseId: '', currentStatus: 'NEW', newStatus: 'NEW', comment: '' })}
                className="text-slate-400 hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold">
                  {statusModal.currentStatus}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Status</label>
                <select
                  value={statusModal.newStatus}
                  onChange={e => setStatusModal({ ...statusModal, newStatus: e.target.value as CaseStatus })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-purple-500 text-xs"
                >
                  <option value="NEW">NEW - Prescription Created</option>
                  <option value="RECEIVED">RECEIVED - Scans & Data Verified</option>
                  <option value="ASSIGNED">ASSIGNED - Assigned to CAD Team</option>
                  <option value="IN_DESIGN">IN_DESIGN - Active Modeling</option>
                  <option value="QC">QC - Quality Control Review</option>
                  <option value="APPROVAL">APPROVAL - Doctor 3D Inspection</option>
                  <option value="REVISION">REVISION - Modifications Required</option>
                  <option value="COMPLETED">COMPLETED - Approved by Doctor</option>
                  <option value="DELIVERED">DELIVERED - Final STL Downloaded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Transition Note / Comment (Logged in Permanent History)</label>
                <textarea
                  rows={3}
                  required
                  value={statusModal.comment}
                  onChange={e => setStatusModal({ ...statusModal, comment: e.target.value })}
                  placeholder="e.g. Design verified with 50µm cement spacer; moving to QC..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal({ open: false, caseId: '', currentStatus: 'NEW', newStatus: 'NEW', comment: '' })}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow transition"
                >
                  Commit Status & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Inspection & Timeline Modal */}
      {inspectCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 text-slate-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 font-black text-lg">{inspectCase.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {inspectCase.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Doctor: <span className="text-slate-200 font-semibold">{inspectCase.doctorName}</span> • Patient: <span className="text-slate-200 font-semibold">{inspectCase.patientName}</span> • Service: <span className="text-cyan-300 font-semibold">{inspectCase.serviceName}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectCase(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Render Timeline View */}
            <CaseTimelineView
              timeline={inspectCase.timeline || []}
              currentStatus={inspectCase.status}
            />

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Permanent Unique Case Identifier: <strong className="font-mono text-purple-300">{inspectCase.id}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const cid = inspectCase.id;
                    const cstatus = inspectCase.status;
                    setStatusModal({
                      open: true,
                      caseId: cid,
                      currentStatus: cstatus,
                      newStatus: cstatus,
                      comment: ''
                    });
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow"
                >
                  Change Status
                </button>
                <button
                  onClick={() => setInspectCase(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
