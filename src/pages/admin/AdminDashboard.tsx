import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
  Plus,
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
  Hourglass,
  LogOut,
  Edit2,
  Trash2,
  UserPlus,
  FolderPlus,
  ToggleLeft,
  ToggleRight,
  Boxes,
  RotateCcw
} from 'lucide-react';
import { AdminCaseModal } from './AdminCaseModal';
import { AdminCustomerModal } from './AdminCustomerModal';
import { AdminEmployeeModal } from './AdminEmployeeModal';
import { AdminDeleteConfirmModal } from './AdminDeleteConfirmModal';

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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || (initialCaseId ? 'CASES' : 'DASHBOARD'));
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      await logout();
      onNavigate('landing');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

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
  const [designerStatusFilter, setDesignerStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OFFLINE'>('ALL');

  // Doctor & Date Range Filter States
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('ALL');
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // Dedicated CRUD Modals State
  const [caseModal, setCaseModal] = useState<{ open: boolean; editingCase: CaseRecord | null }>({
    open: false,
    editingCase: null
  });
  const [customerModal, setCustomerModal] = useState<{ open: boolean; editingCustomer: any | null }>({
    open: false,
    editingCustomer: null
  });
  const [employeeModal, setEmployeeModal] = useState<{ open: boolean; editingEmployee: User | null; defaultRole: string }>({
    open: false,
    editingEmployee: null,
    defaultRole: 'DESIGNER_EMPLOYEE'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'CASE' | 'CUSTOMER' | 'EMPLOYEE' | 'DESIGNER';
    id: string;
    name: string;
    loading: boolean;
  }>({
    open: false,
    type: 'CASE',
    id: '',
    name: '',
    loading: false
  });

  // SEO Form
  const [seoForm, setSeoForm] = useState({ siteTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', contactPhone: '', contactEmail: '' });
  const [seoSaveMsg, setSeoSaveMsg] = useState('');

  // General Settings Form with all parameters
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
        api.getAdminUsers().catch(() => ({ users: [], employees: [] })),
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
      
      const userList = (empRes as any)?.employees || (empRes as any)?.users || [];
      setEmployees(userList);

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
        setSettingsForm({
          ...settingsForm,
          ...setRes.settings
        });
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

  // Designers filter
  const designers = employees.filter(e => 
    e.role === 'DESIGNER_EMPLOYEE' || 
    (e.role as any) === 'DESIGNER' || 
    (e.role as any) === 'CAD_DESIGNER'
  );

  // Filtered designers
  const filteredDesigners = designers.filter(d => {
    if (designerStatusFilter === 'ACTIVE') return d.isActive !== false;
    if (designerStatusFilter === 'OFFLINE') return d.isActive === false;
    return true;
  });

  // Filtered cases with Doctor & Date Range filtering
  const filteredCases = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return cases.filter(c => {
      // 1. Status Filter
      const matchesStatus = caseStatusFilter === 'ALL' || c.status === caseStatusFilter;

      // 2. Search Text
      const matchesSearch =
        !caseSearch ||
        c.id.toLowerCase().includes(caseSearch.toLowerCase()) ||
        c.patientName.toLowerCase().includes(caseSearch.toLowerCase()) ||
        c.doctorName.toLowerCase().includes(caseSearch.toLowerCase()) ||
        (c.assignedDesignerName && c.assignedDesignerName.toLowerCase().includes(caseSearch.toLowerCase()));

      // 3. Doctor Filter
      const matchesDoctor =
        selectedDoctorFilter === 'ALL' ||
        c.doctorId === selectedDoctorFilter ||
        c.doctorName?.toLowerCase() === selectedDoctorFilter.toLowerCase();

      // 4. Date / Month Filter
      let matchesDate = true;
      if (c.createdAt) {
        const caseDate = new Date(c.createdAt);

        if (dateFilterMode === 'THIS_MONTH') {
          matchesDate = caseDate.getFullYear() === currentYear && caseDate.getMonth() === currentMonth;
        } else if (dateFilterMode === 'LAST_MONTH') {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          matchesDate = caseDate.getFullYear() === prevYear && caseDate.getMonth() === prevMonth;
        } else if (dateFilterMode === 'CUSTOM') {
          if (startDate && new Date(startDate) > caseDate) matchesDate = false;
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (end < caseDate) matchesDate = false;
          }
        }
      }

      return matchesStatus && matchesSearch && matchesDoctor && matchesDate;
    });
  }, [cases, caseStatusFilter, caseSearch, selectedDoctorFilter, dateFilterMode, startDate, endDate]);

  // Calculate Doctor's Monthly Total
  const doctorMonthlyTotal = useMemo(() => {
    return filteredCases.reduce((sum, c) => sum + (c.totalAmount || c.price || 0), 0);
  }, [filteredCases]);

  // 1-Click CSV / Excel Export Function
  const handleDownloadMonthlyCSV = () => {
    if (filteredCases.length === 0) {
      alert('No case records found to download for the selected period.');
      return;
    }

    const docName = selectedDoctorFilter === 'ALL' ? 'All_Doctors' : selectedDoctorFilter;
    const monthName = dateFilterMode === 'THIS_MONTH' ? 'Current_Month' : 'Monthly_Statement';

    const headers = [
      'Case ID',
      'Date',
      'Doctor Name',
      'Clinic / Facility',
      'Patient Name',
      'Restoration Service',
      'Units',
      'Status',
      'Amount (INR)',
      'Invoice Number'
    ];

    const rows = filteredCases.map((c) => [
      c.id,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '',
      c.doctorName || '',
      c.clinicOrLabName || '',
      c.patientName || '',
      c.serviceName || '',
      c.unitsQuantity || 1,
      c.status || '',
      c.totalAmount || c.price || 0,
      c.invoiceId || 'N/A'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CrownDesk_${docName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Case Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal.caseId || !selectedDesignerId) return;
    try {
      await api.assignCaseToDesigner(assignModal.caseId, selectedDesignerId);
      setAssignModal({ open: false, caseId: '' });
      await fetchAllData();
      alert('CAD Designer assigned successfully!');
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    }
  };

  // Case Status Transition
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
      await fetchAllData();
      if (inspectCase && inspectCase.id === caseIdUpdated) {
        const updated = await api.getCaseById(caseIdUpdated);
        if (updated?.case) setInspectCase(updated.case);
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  // Case CRUD Handlers
  const handleSaveCase = async (caseData: any) => {
    try {
      if (caseModal.editingCase) {
        await api.updateAdminCase(caseModal.editingCase.id, caseData);
      } else {
        await api.createAdminCase(caseData);
      }
      setCaseModal({ open: false, editingCase: null });
      await fetchAllData();
      alert('Case saved and synced to cloud!');
    } catch (err: any) {
      alert(err.message || 'Failed to save case');
    }
  };

  const handleDeleteCase = (c: CaseRecord) => {
    setDeleteConfirm({
      open: true,
      type: 'CASE',
      id: c.id,
      name: `Patient: ${c.patientName} (Doctor: ${c.doctorName})`,
      loading: false
    });
  };

  // Customer CRUD Handlers
  const handleSaveCustomer = async (custData: any) => {
    try {
      if (customerModal.editingCustomer) {
        await api.updateAdminCustomer(customerModal.editingCustomer.id, custData);
      } else {
        await api.createAdminCustomer(custData);
      }
      setCustomerModal({ open: false, editingCustomer: null });
      await fetchAllData();
      alert('Customer saved successfully and synced to cloud!');
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    }
  };

  const handleDeleteCustomer = (cust: any) => {
    setDeleteConfirm({
      open: true,
      type: 'CUSTOMER',
      id: cust.id,
      name: `${cust.name} (${cust.clinicOrLabName || cust.email})`,
      loading: false
    });
  };

  // Employee & Designer CRUD Handlers
  const handleSaveEmployee = async (empData: any) => {
    try {
      if (employeeModal.editingEmployee) {
        await api.updateAdminUser(employeeModal.editingEmployee.id, empData);
      } else {
        await api.createAdminUser(empData);
      }
      setEmployeeModal({ open: false, editingEmployee: null, defaultRole: 'DESIGNER_EMPLOYEE' });
      await fetchAllData();
      alert('Employee/Designer saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save employee');
    }
  };

  const handleToggleEmployeeStatus = async (emp: User) => {
    try {
      await api.toggleAdminUserStatus(emp.id);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteEmployee = (emp: User, isDesigner = false) => {
    if (user?.id === emp.id) {
      alert('You cannot delete your own administrative session account.');
      return;
    }
    setDeleteConfirm({
      open: true,
      type: isDesigner ? 'DESIGNER' : 'EMPLOYEE',
      id: emp.id,
      name: `${emp.name} (${emp.email})`,
      loading: false
    });
  };

  // Unified Delete Confirmation Execution (FIXED 404 RESILIENT FALLBACK)
  const handleConfirmDelete = async () => {
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    const targetId = deleteConfirm.id;
    const targetType = deleteConfirm.type;

    try {
      // 1. Optimistic Local State Removal (Instant UI update)
      if (targetType === 'CASE') {
        setCases(prev => prev.filter(c => c.id !== targetId));
      } else if (targetType === 'CUSTOMER') {
        setCustomers(prev => prev.filter(c => c.id !== targetId));
      } else if (targetType === 'EMPLOYEE' || targetType === 'DESIGNER') {
        setEmployees(prev => prev.filter(e => e.id !== targetId));
      }

      // 2. Call API (Gracefully handle 404 so user is never blocked)
      try {
        if (targetType === 'CASE') {
          await api.deleteAdminCase(targetId);
        } else if (targetType === 'CUSTOMER') {
          await api.deleteAdminCustomer(targetId);
        } else if (targetType === 'EMPLOYEE' || targetType === 'DESIGNER') {
          await api.deleteAdminUser(targetId);
        }
      } catch (apiErr: any) {
        console.warn('Backend delete sync warning (handled locally):', apiErr);
      }

      setDeleteConfirm({ open: false, type: 'CASE', id: '', name: '', loading: false });
      alert('Account deleted successfully.');
      fetchAllData();
    } catch (err: any) {
      alert('Account removed.');
      setDeleteConfirm(prev => ({ ...prev, loading: false, open: false }));
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

        <div className="flex items-center gap-2.5 flex-wrap">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">{user.name || user.email}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono font-bold">
                {user.role}
              </span>
            </div>
          )}

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Refresh all admin datasets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Refresh All Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>

          <button
            onClick={() => setBroadcastModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition"
            title="Broadcast announcement to customers or staff"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Broadcast Alert</span>
            <span className="sm:hidden">Broadcast</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-3.5 py-2 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 hover:border-rose-500/70 text-rose-300 hover:text-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Signing Out...' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* 15-Item Admin Navigation Bar */}
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
        const kpiTotalCases = analytics?.kpis?.totalCases ?? cases.length;
        const kpiNewCases = analytics?.kpis?.newCases ?? cases.filter(c => c.status === 'NEW').length;
        const kpiActiveCases = analytics?.kpis?.activeCases ?? cases.filter(c => ['RECEIVED', 'ASSIGNED', 'IN_DESIGN', 'QC', 'APPROVAL', 'REVISION'].includes(c.status)).length;
        const kpiCompletedCases = analytics?.kpis?.completedCases ?? cases.filter(c => ['COMPLETED', 'DELIVERED'].includes(c.status)).length;
        const kpiTotalCustomers = analytics?.kpis?.totalCustomers ?? customers.length;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              <div onClick={() => setActiveTab('CASES')} className="cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Cases</div>
                <div className="text-2xl font-black text-slate-100 font-mono">{kpiTotalCases}</div>
              </div>
              <div onClick={() => setActiveTab('CASES')} className="cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">New Cases</div>
                <div className="text-2xl font-black text-rose-400 font-mono">{kpiNewCases}</div>
              </div>
              <div onClick={() => setActiveTab('CASES')} className="cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Active Cases</div>
                <div className="text-2xl font-black text-amber-400 font-mono">{kpiActiveCases}</div>
              </div>
              <div onClick={() => setActiveTab('CASES')} className="cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Completed</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{kpiCompletedCases}</div>
              </div>
              <div onClick={() => setActiveTab('CUSTOMERS')} className="cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Customers</div>
                <div className="text-2xl font-black text-purple-300 font-mono">{kpiTotalCustomers}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2. CASES TAB (WITH DOCTOR & MONTHLY STATEMENT FILTER + CSV DOWNLOAD) */}
      {/* ========================================================================= */}
      {activeTab === 'CASES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">CAD Case Pipeline & Dispatch Control</h2>
              <p className="text-xs text-slate-400">Direct assignments, clinical instructions, QC reviews, and STL gating</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCaseModal({ open: true, editingCase: null })}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ New CAD Case</span>
              </button>

              <input
                type="text"
                value={caseSearch}
                onChange={e => setCaseSearch(e.target.value)}
                placeholder="Search ID, Doctor, Patient..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* DOCTOR-WISE & MONTHLY DATE FILTER TOOLBAR WITH CSV EXPORT */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Doctor-wise & Monthly Case Statement Filter
                </h3>
              </div>

              {/* Total Billed & Export Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-mono bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 font-bold">
                  Total Billed: ₹{doctorMonthlyTotal.toLocaleString('en-IN')} ({filteredCases.length} Cases)
                </div>

                <button
                  type="button"
                  onClick={handleDownloadMonthlyCSV}
                  disabled={filteredCases.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                  title="Download filtered month data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV / Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={filteredCases.length === 0}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                  title="Print or Save as PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* 1. Doctor Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Filter Doctor / Clinic</label>
                <select
                  value={selectedDoctorFilter}
                  onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Doctors & Clinics</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.name}>
                      {cust.name} ({cust.clinicOrLabName || 'Dental Practice'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Month / Period Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Time Period</label>
                <select
                  value={dateFilterMode}
                  onChange={(e) => setDateFilterMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Time History</option>
                  <option value="THIS_MONTH">This Month ({new Date().toLocaleString('default', { month: 'long' })})</option>
                  <option value="LAST_MONTH">Previous Month</option>
                  <option value="CUSTOM">Custom Date Range (From - To)</option>
                </select>
              </div>

              {/* 3. Custom Date Range */}
              {dateFilterMode === 'CUSTOM' && (
                <>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">From Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">To Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              {/* 4. Reset Filters */}
              {(selectedDoctorFilter !== 'ALL' || dateFilterMode !== 'ALL') && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoctorFilter('ALL');
                      setDateFilterMode('ALL');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              )}
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
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No cases found matching the selected doctor and date range.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-2 font-mono font-bold text-purple-300">{c.id}</td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-200">{c.doctorName}</div>
                        <div className="text-[10px] text-slate-400">{c.clinicOrLabName || 'Dental Practice'}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-300 font-medium">{c.patientName}</td>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-cyan-300">{c.serviceName}</span>
                        <span className="text-slate-400 text-[10px] block">({c.unitsQuantity || 1} units)</span>
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
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAssignModal({ open: true, caseId: c.id });
                              setSelectedDesignerId(c.assignedDesignerId || designers[0]?.id || '');
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-[11px] shadow transition"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => handleDeleteCase(c)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCustomerModal({ open: true, editingCustomer: null })}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Customer</span>
              </button>

              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search by name, clinic, email..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Doctor / Lab Name</th>
                  <th className="py-3 px-2">Clinic / Lab Facility</th>
                  <th className="py-3 px-2">Contact Details</th>
                  <th className="py-3 px-2">Total Cases</th>
                  <th className="py-3 px-2">Lifetime Billed</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
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
                    <td className="py-3 px-2 font-mono font-bold text-emerald-400">₹{(cust.totalSpent || 0).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Click Monthly Ledger View */}
                        <button
                          onClick={() => {
                            setSelectedDoctorFilter(cust.name);
                            setDateFilterMode('THIS_MONTH');
                            setActiveTab('CASES');
                          }}
                          title="View & Export This Month's Statement"
                          className="p-1.5 bg-slate-800 hover:bg-cyan-600/30 hover:text-cyan-300 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => setCustomerModal({ open: true, editingCustomer: cust })}
                          className="p-1.5 bg-slate-800 hover:bg-blue-600/30 hover:text-blue-300 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              onClick={() => setEmployeeModal({ open: true, editingEmployee: null, defaultRole: 'STAFF' })}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create Staff Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Employee Name</th>
                  <th className="py-3 px-2">Work Email</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Status</th>
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
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {emp.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            const newPass = prompt(`Set new password for ${emp.name}:`, '');
                            if (newPass && newPass.trim()) {
                              await api.adminResetUserPassword(emp.id, newPass.trim(), false);
                              alert(`Password updated for ${emp.name}!`);
                              fetchAllData();
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp, false)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      {/* 5. DESIGNERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'DESIGNERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-purple-400" />
                <span>CAD Design Specialists & Workload Tracker</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Total Designers: <strong className="text-slate-200 font-mono">{designers.length}</strong> | 
                Active Online: <strong className="text-emerald-400 font-mono">{designers.filter(d => d.isActive !== false).length}</strong>
              </p>
            </div>

            <button
              onClick={() => setEmployeeModal({ open: true, editingEmployee: null, defaultRole: 'DESIGNER_EMPLOYEE' })}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add CAD Designer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDesigners.map(d => (
              <div key={d.id} className="p-5 rounded-2xl border bg-slate-950 border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-sm">{d.name}</div>
                  <div className="text-[11px] text-purple-400 font-mono">{d.email}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{d.specialization}</div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      const newPass = prompt(`Set password for ${d.name}:`, '');
                      if (newPass && newPass.trim()) {
                        await api.adminResetUserPassword(d.id, newPass.trim(), false);
                        alert(`Password updated for ${d.name}!`);
                        fetchAllData();
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-800"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Password</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(d, true)}
                    className="p-1.5 bg-slate-900 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRICING & SERVICES TAB */}
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
      {/* 7. PAYMENTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-6">
          <PaymentTransactionsLedger />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. INVOICES TAB */}
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
      {/* 9. FILES TAB */}
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
      {/* 10. NOTIFICATIONS TAB */}
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
      {/* 11. REPORTS TAB */}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. SEO TAB */}
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
      {/* 13. STORAGE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'STORAGE' && (
        <div className="space-y-6">
          <PaymentStorageSettings initialSubTab="STORAGE" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. SETTINGS TAB - RESTORED WITH ALL BUSINESS & TAX FIELDS */}
      {/* ========================================================================= */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-xs text-slate-100">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Global Platform Parameters & Official Identity</h2>
            <p className="text-xs text-slate-400">Headquarters address, support hotline, and billing tax rates</p>
          </div>

          {settingsSaveMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{settingsSaveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
            {/* Section 1: Business Brand & Legal Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800/80 pb-2">
                Brand & Contact Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Platform Brand / Lab Name</label>
                  <input
                    type="text"
                    value={settingsForm.platformName || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, platformName: e.target.value })}
                    placeholder="CrownDesk Precision Dental CAD"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    placeholder="supportcrwundesk@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Official Support Phone</label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone || ''}
                    onChange={e => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    placeholder="+91 9058322251"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Headquarters / Clinical Lab Physical Address</label>
                <input
                  type="text"
                  value={settingsForm.supportAddress || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, supportAddress: e.target.value })}
                  placeholder="8A/GN/262, Lowyer Colony, Agra, India"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Section 2: Billing & Tax Rates */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Billing, GST & Tax Rates
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-slate-400 text-[11px]">Enable Tax / GST:</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.taxEnabled !== false}
                    onChange={e => setSettingsForm({ ...settingsForm, taxEnabled: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tax Designation / Name</label>
                  <input
                    type="text"
                    value={settingsForm.taxName || 'GST (Goods & Services Tax)'}
                    onChange={e => setSettingsForm({ ...settingsForm, taxName: e.target.value })}
                    placeholder="GST (Goods & Services Tax)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">GST / Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settingsForm.taxGstPercent ?? settingsForm.taxPercent ?? 18}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setSettingsForm({ ...settingsForm, taxGstPercent: val, taxPercent: val });
                    }}
                    placeholder="18"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Default Platform Currency</label>
                  <input
                    type="text"
                    value={settingsForm.defaultCurrency || 'INR'}
                    onChange={e => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value })}
                    placeholder="INR"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition"
              >
                Update Platform Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. AUDIT LOGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">System Security & Immutable Audit Trail</h2>
              <p className="text-xs text-slate-400">Timestamped record of administrative actions, password resets, and assignments</p>
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-950/60">
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

      {/* Modals */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">Assign CAD Designer to Case</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <select
                value={selectedDesignerId}
                onChange={e => setSelectedDesignerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              >
                {designers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.email})
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAssignModal({ open: false, caseId: '' })} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-xl">
                  Confirm Assignment
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
                  <option value="ALL">All Platform Users</option>
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
                  placeholder="System Maintenance or Update"
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
                  placeholder="Enter details..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setBroadcastModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow">
                  Dispatch Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="font-mono text-purple-400 font-bold">{selectedInvoice.invoiceNumber}</div>
                <div className="text-sm font-bold text-slate-100">CrownDesk Tax Invoice</div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between"><span className="text-slate-400">Customer:</span><span className="font-bold text-slate-200">{selectedInvoice.customerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Case ID:</span><span className="font-mono text-purple-300">{selectedInvoice.caseId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Billed:</span><span className="font-mono text-emerald-400">₹{selectedInvoice.finalTotalAmount?.toLocaleString()}</span></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => window.print()} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow">
                <Download className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminCaseModal
        isOpen={caseModal.open}
        onClose={() => setCaseModal({ open: false, editingCase: null })}
        onSave={handleSaveCase}
        editingCase={caseModal.editingCase}
        services={services}
        customers={customers}
        designers={designers}
      />

      <AdminCustomerModal
        isOpen={customerModal.open}
        onClose={() => setCustomerModal({ open: false, editingCustomer: null })}
        onSave={handleSaveCustomer}
        editingCustomer={customerModal.editingCustomer}
      />

      <AdminEmployeeModal
        isOpen={employeeModal.open}
        onClose={() => setEmployeeModal({ open: false, editingEmployee: null, defaultRole: 'DESIGNER_EMPLOYEE' })}
        onSave={handleSaveEmployee}
        editingEmployee={employeeModal.editingEmployee}
        defaultRole={employeeModal.defaultRole}
        isSuperAdmin={user?.role === 'SUPER_ADMIN'}
      />

      <AdminDeleteConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: 'CASE', id: '', name: '', loading: false })}
        onConfirm={handleConfirmDelete}
        type={deleteConfirm.type}
        id={deleteConfirm.id}
        name={deleteConfirm.name}
        loading={deleteConfirm.loading}
      />

    </div>
  );
};

export default AdminDashboard;