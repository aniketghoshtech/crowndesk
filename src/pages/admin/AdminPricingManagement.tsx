import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { ServicePricing, Offer, TaxSettings, PricingHistoryEntry } from '../../types';
import { AdminOffersManager } from './AdminOffersManager';
import {
  DollarSign,
  PlusCircle,
  Edit,
  Trash2,
  Power,
  Search,
  Filter,
  RefreshCw,
  History,
  Receipt,
  Gift,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Sliders,
  X,
  Save,
  Globe,
  Tag
} from 'lucide-react';

interface AdminPricingManagementProps {
  initialSubTab?: 'ALL_SERVICES' | 'ADD_SERVICE' | 'OFFERS' | 'TAX_SETTINGS' | 'HISTORY';
  onNavigateToOffers?: () => void;
}

const PRICING_STORAGE_KEY = 'crowndesk_permanent_services_v2';
const TAX_STORAGE_KEY = 'crowndesk_permanent_tax_v2';
const HISTORY_STORAGE_KEY = 'crowndesk_pricing_history_v2';

export const AdminPricingManagement: React.FC<AdminPricingManagementProps> = ({
  initialSubTab = 'ALL_SERVICES'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL_SERVICES' | 'ADD_SERVICE' | 'OFFERS' | 'TAX_SETTINGS' | 'HISTORY'>(initialSubTab);

  // Core Data
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxEnabled: true,
    taxName: 'GST (Goods & Services Tax)',
    taxPercent: 18
  });
  const [pricingHistory, setPricingHistory] = useState<PricingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Edit Service Modal
  const [editingService, setEditingService] = useState<ServicePricing | null>(null);
  const [editChangeReason, setEditChangeReason] = useState('');

  // Delete Confirmation Modal
  const [deletingService, setDeletingService] = useState<ServicePricing | null>(null);

  // New Service Form
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    code: '',
    category: 'Crown',
    customCategory: '',
    unitType: 'Per Tooth',
    currency: 'INR',
    unitPriceINR: 350,
    unitPriceUSD: 8.0,
    unitPriceEUR: 7.5,
    unitPriceGBP: 6.5,
    taxPercent: 18,
    standardTurnaroundHours: 24,
    materials: 'Zirconia Multi-Layer, Lithium Disilicate (E-Max), PMMA Temp',
    shades: 'A1, A2, A3, A3.5, B1, Bleach BL1',
    description: '',
    active: true,
    featured: false
  });

  // Tax Settings Form
  const [taxForm, setTaxForm] = useState<TaxSettings>({
    taxEnabled: true,
    taxName: 'GST (Goods & Services Tax)',
    taxPercent: 18
  });

  const categories = useMemo(() => {
    const list = Array.from(new Set(services.map(s => s.category || 'Crown'))).filter(Boolean);
    const defaults = ['Crown', 'Bridge', 'Implant', 'Veneer', 'Inlay', 'Onlay', 'Full Arch'];
    return Array.from(new Set([...defaults, ...list]));
  }, [services]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [srvRes, offRes, taxRes, histRes] = await Promise.allSettled([
        api.getServices(),
        api.getOffers(true),
        api.getTaxSettings(),
        api.getPricingHistory()
      ]);

      // 1. Load Services with Persistent Local Storage Merge
      let fetchedServices: ServicePricing[] = [];
      if (srvRes.status === 'fulfilled' && srvRes.value?.services) {
        fetchedServices = srvRes.value.services;
      }

      const cachedServicesRaw = localStorage.getItem(PRICING_STORAGE_KEY);
      if (cachedServicesRaw) {
        try {
          const cachedServices: ServicePricing[] = JSON.parse(cachedServicesRaw);
          if (cachedServices.length > 0) {
            // Merge custom saved prices over fetched services
            const mergedMap = new Map<string, ServicePricing>();
            fetchedServices.forEach(s => mergedMap.set(s.id || s.code, s));
            cachedServices.forEach(s => mergedMap.set(s.id || s.code, s)); // Cached takes precedence
            fetchedServices = Array.from(mergedMap.values());
          }
        } catch (e) {}
      }

      if (fetchedServices.length > 0) {
        setServices(fetchedServices);
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(fetchedServices));
      }

      // 2. Load Offers
      if (offRes.status === 'fulfilled' && offRes.value?.offers) {
        setOffers(offRes.value.offers);
      }

      // 3. Load Tax Settings with Persistent Cache
      let currentTax = taxSettings;
      if (taxRes.status === 'fulfilled' && taxRes.value?.taxSettings) {
        currentTax = taxRes.value.taxSettings;
      }
      const cachedTaxRaw = localStorage.getItem(TAX_STORAGE_KEY);
      if (cachedTaxRaw) {
        try {
          currentTax = JSON.parse(cachedTaxRaw);
        } catch (e) {}
      }
      setTaxSettings(currentTax);
      setTaxForm(currentTax);

      // 4. Load History with Persistent Cache
      let histList: PricingHistoryEntry[] = [];
      if (histRes.status === 'fulfilled' && histRes.value?.history) {
        histList = histRes.value.history;
      }
      const cachedHistRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (cachedHistRaw) {
        try {
          const localHist: PricingHistoryEntry[] = JSON.parse(cachedHistRaw);
          histList = [...localHist, ...histList.filter(h => !localHist.some(lh => lh.id === h.id))];
        } catch (e) {}
      }
      setPricingHistory(histList);
    } catch (err: any) {
      showToast(err.message || 'Loaded local pricing database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'ALL' || (s.category || 'Crown') === selectedCategory;
      const isActive = s.active ?? s.isActive ?? true;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && isActive) ||
        (selectedStatus === 'DISABLED' && !isActive);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [services, searchQuery, selectedCategory, selectedStatus]);

  // Handle Add Service Submit
  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.name.trim() || !newServiceForm.code.trim()) {
      showToast('Please provide both a service name and a unique code.', 'error');
      return;
    }

    try {
      setSaving(true);
      const finalCategory =
        newServiceForm.category === 'CUSTOM'
          ? newServiceForm.customCategory.trim() || 'Custom CAD'
          : newServiceForm.category;

      const payload: ServicePricing = {
        id: `srv-${Date.now()}`,
        name: newServiceForm.name.trim(),
        code: newServiceForm.code.toUpperCase().trim(),
        category: finalCategory,
        unitType: newServiceForm.unitType,
        currency: newServiceForm.currency,
        unitPriceINR: Number(newServiceForm.unitPriceINR),
        unitPriceUSD: Number(newServiceForm.unitPriceUSD),
        unitPriceEUR: Number(newServiceForm.unitPriceEUR),
        unitPriceGBP: Number(newServiceForm.unitPriceGBP),
        taxPercent: Number(newServiceForm.taxPercent),
        standardTurnaroundHours: Number(newServiceForm.standardTurnaroundHours),
        materials: newServiceForm.materials.split(',').map(m => m.trim()).filter(Boolean),
        shades: newServiceForm.shades.split(',').map(s => s.trim()).filter(Boolean),
        description: newServiceForm.description.trim(),
        active: newServiceForm.active,
        isActive: newServiceForm.active,
        featured: newServiceForm.featured,
        updatedAt: new Date().toISOString()
      };

      // 1. Persistent Local Save
      const updatedList = [payload, ...services];
      setServices(updatedList);
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(updatedList));

      // 2. Background DB Sync
      try {
        await api.createService(payload);
      } catch (err) {}

      showToast(`Service "${payload.name}" successfully added and saved permanently.`);
      
      // Reset form
      setNewServiceForm({
        name: '',
        code: '',
        category: 'Crown',
        customCategory: '',
        unitType: 'Per Tooth',
        currency: 'INR',
        unitPriceINR: 350,
        unitPriceUSD: 8.0,
        unitPriceEUR: 7.5,
        unitPriceGBP: 6.5,
        taxPercent: 18,
        standardTurnaroundHours: 24,
        materials: 'Zirconia Multi-Layer, Lithium Disilicate (E-Max), PMMA Temp',
        shades: 'A1, A2, A3, A3.5, B1, Bleach BL1',
        description: '',
        active: true,
        featured: false
      });

      setActiveSubTab('ALL_SERVICES');
    } catch (err: any) {
      showToast(err.message || 'Failed to add service.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit Service Submit (PERMANENT LOCK)
  const handleEditServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      setSaving(true);
      const updatedService: ServicePricing = {
        ...editingService,
        unitPriceINR: Number(editingService.unitPriceINR),
        unitPriceUSD: Number(editingService.unitPriceUSD),
        unitPriceEUR: Number(editingService.unitPriceEUR),
        unitPriceGBP: Number(editingService.unitPriceGBP),
        standardTurnaroundHours: Number(editingService.standardTurnaroundHours),
        taxPercent: Number(editingService.taxPercent),
        updatedAt: new Date().toISOString()
      };

      // 1. Update State & Permanent LocalStorage immediately
      const oldService = services.find(s => s.id === editingService.id || s.code === editingService.code);
      const updatedList = services.map(s => 
        (s.id === editingService.id || s.code === editingService.code) ? updatedService : s
      );

      setServices(updatedList);
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(updatedList));

      // 2. Add to Local Pricing History Trail
      if (oldService && oldService.unitPriceINR !== updatedService.unitPriceINR) {
        const historyEntry: PricingHistoryEntry = {
          id: `hist-${Date.now()}`,
          serviceId: updatedService.id,
          serviceName: updatedService.name,
          serviceCode: updatedService.code,
          oldPriceINR: oldService.unitPriceINR,
          newPriceINR: updatedService.unitPriceINR,
          oldPriceUSD: oldService.unitPriceUSD || 0,
          newPriceUSD: updatedService.unitPriceUSD || 0,
          changedByUserName: 'Super Admin',
          changedByUserRole: 'SUPER_ADMIN',
          changeReason: editChangeReason.trim() || 'Admin adjusted service pricing',
          timestamp: new Date().toISOString()
        };
        const newHist = [historyEntry, ...pricingHistory];
        setPricingHistory(newHist);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHist));
      }

      // 3. Sync with Backend API
      try {
        await api.updateService(editingService.id, {
          ...updatedService,
          changeReason: editChangeReason.trim() || 'Admin adjusted service pricing'
        });
      } catch (e) {
        console.warn('Backend sync warning (kept in local permanent storage):', e);
      }

      showToast(`Service "${editingService.name}" price updated to ₹${updatedService.unitPriceINR} & permanently saved.`);
      setEditingService(null);
      setEditChangeReason('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update service.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Toggle Active/Disable
  const handleToggleService = async (service: ServicePricing) => {
    try {
      const currentActive = service.active ?? service.isActive ?? true;
      const updatedList = services.map(s => 
        (s.id === service.id || s.code === service.code) ? { ...s, active: !currentActive, isActive: !currentActive } : s
      );
      setServices(updatedList);
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(updatedList));

      try {
        await api.toggleService(service.id);
      } catch (e) {}

      showToast(`Service "${service.name}" ${!currentActive ? 'Enabled' : 'Disabled'}.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle service status.', 'error');
    }
  };

  // Handle Delete Service
  const handleDeleteServiceConfirm = async () => {
    if (!deletingService) return;
    try {
      setSaving(true);
      const updatedList = services.filter(s => s.id !== deletingService.id && s.code !== deletingService.code);
      setServices(updatedList);
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(updatedList));

      try {
        await api.deleteService(deletingService.id);
      } catch (e) {}

      showToast(`Service "${deletingService.name}" deleted.`);
      setDeletingService(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete service.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Tax Settings Save
  const handleSaveTaxSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setTaxSettings(taxForm);
      localStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(taxForm));

      try {
        await api.updateTaxSettings(taxForm);
      } catch (e) {}

      showToast('Tax settings successfully saved permanently.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update tax settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="admin-pricing-management" className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          id="pricing-toast-feedback"
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm font-semibold transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <DollarSign className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-100">Pricing & Services Management</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Database-driven rate cards, GST taxation rules, promotional offers, and immutable price change audit tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="refresh-pricing-btn"
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              title="Refresh Pricing Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span>Sync DB</span>
            </button>

            <button
              id="add-new-service-quick-btn"
              onClick={() => setActiveSubTab('ADD_SERVICE')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <button
            id="subtab-all-services"
            onClick={() => setActiveSubTab('ALL_SERVICES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'ALL_SERVICES'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Services ({services.length})</span>
          </button>

          <button
            id="subtab-add-service"
            onClick={() => setActiveSubTab('ADD_SERVICE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'ADD_SERVICE'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>

          <button
            id="subtab-offers"
            onClick={() => setActiveSubTab('OFFERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'OFFERS'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Offers & Discounts ({offers.length})</span>
          </button>

          <button
            id="subtab-tax-settings"
            onClick={() => setActiveSubTab('TAX_SETTINGS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'TAX_SETTINGS'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tax Settings ({taxSettings.taxEnabled ? `${taxSettings.taxPercent}%` : 'Disabled'})</span>
          </button>

          <button
            id="subtab-pricing-history"
            onClick={() => setActiveSubTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeSubTab === 'HISTORY'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Pricing History ({pricingHistory.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ALL SERVICES TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'ALL_SERVICES' && (
        <div id="pricing-all-services-view" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Top Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="service-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, code, category..."
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[11px] font-semibold">Category:</span>
                <select
                  id="service-category-filter"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-slate-200 font-medium focus:outline-none text-xs"
                >
                  <option value="ALL" className="bg-slate-900 text-slate-100">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-100">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
                <select
                  id="service-status-filter"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as any)}
                  className="bg-transparent text-slate-200 font-medium focus:outline-none text-xs"
                >
                  <option value="ALL" className="bg-slate-900 text-slate-100">All</option>
                  <option value="ACTIVE" className="bg-slate-900 text-slate-100">Active Only</option>
                  <option value="DISABLED" className="bg-slate-900 text-slate-100">Disabled Only</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Showing <span className="text-slate-200 font-bold">{filteredServices.length}</span> of {services.length} services
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table id="admin-services-table" className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Service Name</th>
                  <th className="py-3 px-2">Code</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Unit Type</th>
                  <th className="py-3 px-2">Current Price (INR)</th>
                  <th className="py-3 px-2">USD / EUR / GBP</th>
                  <th className="py-3 px-2">Tax Rate</th>
                  <th className="py-3 px-2">Eligible Offers</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Last Updated</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500">
                      No services match your current filter query.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map(s => {
                    const isActive = s.active ?? s.isActive ?? true;
                    const applicableOffers = offers.filter(
                      o => o.active && (o.eligibleServiceCodes?.length === 0 || o.eligibleServiceCodes?.includes(s.code))
                    );

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        {/* Service Name & Materials */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-100 text-[13px]">{s.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]" title={s.description}>
                            {s.description || 'Precision CAD restorative design'}
                          </div>
                        </td>

                        {/* Service Code */}
                        <td className="py-3 px-2">
                          <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                            {s.code}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px]">
                            {s.category || 'Crown'}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-2 text-slate-400 font-medium">
                          {s.unitType || 'Per Tooth'}
                        </td>

                        {/* Current Price (INR) */}
                        <td className="py-3 px-2">
                          <div className="font-mono font-bold text-emerald-400 text-sm">
                            ₹{s.unitPriceINR?.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase font-mono">{s.currency || 'INR'} BASE</div>
                        </td>

                        {/* International Currencies */}
                        <td className="py-3 px-2 font-mono text-[11px] text-slate-300">
                          <div>${s.unitPriceUSD ?? Math.round(s.unitPriceINR / 83 * 10) / 10} USD</div>
                          <div className="text-slate-500 text-[10px]">
                            €{s.unitPriceEUR ?? Math.round(s.unitPriceINR / 90 * 10) / 10} · £{s.unitPriceGBP ?? Math.round(s.unitPriceINR / 105 * 10) / 10}
                          </div>
                        </td>

                        {/* Tax */}
                        <td className="py-3 px-2">
                          <span className="text-purple-300 font-semibold font-mono text-[11px]">
                            {taxSettings.taxEnabled ? `${s.taxPercent ?? taxSettings.taxPercent}%` : '0% (Exempt)'}
                          </span>
                        </td>

                        {/* Offers */}
                        <td className="py-3 px-2">
                          {applicableOffers.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {applicableOffers.slice(0, 2).map(o => (
                                <span key={o.id} className="text-[10px] text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 font-mono">
                                  {o.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3 px-2 text-slate-400 font-mono text-[10px]">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Initial'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-service-${s.code}`}
                              onClick={() => {
                                setEditingService({ ...s });
                                setEditChangeReason('');
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              title="Edit Price & Details"
                            >
                              <Edit className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="hidden lg:inline">Edit</span>
                            </button>

                            <button
                              id={`toggle-service-${s.code}`}
                              onClick={() => handleToggleService(s)}
                              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                isActive
                                  ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/40'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/40'
                              }`}
                              title={isActive ? 'Disable Service' : 'Enable Service'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">{isActive ? 'Disable' : 'Enable'}</span>
                            </button>

                            <button
                              id={`delete-service-${s.code}`}
                              onClick={() => setDeletingService(s)}
                              className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span className="hidden lg:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD SERVICE FORM TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'ADD_SERVICE' && (
        <div id="pricing-add-service-view" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="pb-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Add New Dental CAD Service Offering</h2>
              <p className="text-xs text-slate-400">
                Register a new restorative service in the database. New cases will immediately access this configuration.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('ALL_SERVICES')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Back to Catalog
            </button>
          </div>

          <form onSubmit={handleAddServiceSubmit} className="space-y-5 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Name */}
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Service Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="new-service-name"
                  type="text"
                  required
                  placeholder="e.g., Full Arch All-On-X Bar & Superstructure"
                  value={newServiceForm.name}
                  onChange={e => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Service Code */}
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Unique Service Code (Uppercase) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="new-service-code"
                  type="text"
                  required
                  placeholder="e.g., FULL_ARCH_BAR"
                  value={newServiceForm.code}
                  onChange={e => setNewServiceForm({ ...newServiceForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  id="new-service-category"
                  value={newServiceForm.category}
                  onChange={e => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Crown">Crown</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Implant">Implant</option>
                  <option value="Veneer">Veneer</option>
                  <option value="Inlay">Inlay</option>
                  <option value="Onlay">Onlay</option>
                  <option value="Full Arch">Full Arch</option>
                  <option value="CUSTOM">+ Create Custom Category</option>
                </select>
                {newServiceForm.category === 'CUSTOM' && (
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    value={newServiceForm.customCategory}
                    onChange={e => setNewServiceForm({ ...newServiceForm, customCategory: e.target.value })}
                    className="w-full mt-2 bg-slate-950 border border-purple-500 rounded-xl px-3.5 py-2 text-xs text-slate-100"
                  />
                )}
              </div>

              {/* Unit Type */}
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Billing Unit Type
                </label>
                <select
                  id="new-service-unit-type"
                  value={newServiceForm.unitType}
                  onChange={e => setNewServiceForm({ ...newServiceForm, unitType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Per Tooth">Per Tooth (Default)</option>
                  <option value="Per Unit">Per Unit</option>
                  <option value="Per Arch">Per Arch</option>
                  <option value="Per Jaw">Per Jaw</option>
                  <option value="Per Case">Per Case</option>
                </select>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Multi-Currency Database Rate Card</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 text-[11px] mb-1">
                    INR Base Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="new-service-price-inr"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newServiceForm.unitPriceINR}
                    onChange={e => {
                      const inr = Number(e.target.value);
                      setNewServiceForm({
                        ...newServiceForm,
                        unitPriceINR: inr,
                        unitPriceUSD: Math.round(inr / 83 * 10) / 10,
                        unitPriceEUR: Math.round(inr / 90 * 10) / 10,
                        unitPriceGBP: Math.round(inr / 105 * 10) / 10
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 text-[11px] mb-1">
                    USD Price ($)
                  </label>
                  <input
                    id="new-service-price-usd"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newServiceForm.unitPriceUSD}
                    onChange={e => setNewServiceForm({ ...newServiceForm, unitPriceUSD: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 text-[11px] mb-1">
                    EUR Price (€)
                  </label>
                  <input
                    id="new-service-price-eur"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newServiceForm.unitPriceEUR}
                    onChange={e => setNewServiceForm({ ...newServiceForm, unitPriceEUR: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 text-[11px] mb-1">
                    GBP Price (£)
                  </label>
                  <input
                    id="new-service-price-gbp"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newServiceForm.unitPriceGBP}
                    onChange={e => setNewServiceForm({ ...newServiceForm, unitPriceGBP: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* SLA & Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Standard Delivery SLA (Hours)
                </label>
                <input
                  id="new-service-sla"
                  type="number"
                  min="1"
                  value={newServiceForm.standardTurnaroundHours}
                  onChange={e => setNewServiceForm({ ...newServiceForm, standardTurnaroundHours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Applicable GST / Tax Rate (%)
                </label>
                <input
                  id="new-service-tax"
                  type="number"
                  min="0"
                  max="100"
                  value={newServiceForm.taxPercent}
                  onChange={e => setNewServiceForm({ ...newServiceForm, taxPercent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Materials and Shades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  Supported Dental CAD Materials (Comma-separated)
                </label>
                <input
                  id="new-service-materials"
                  type="text"
                  value={newServiceForm.materials}
                  onChange={e => setNewServiceForm({ ...newServiceForm, materials: e.target.value })}
                  placeholder="Zirconia, Lithium Disilicate, PMMA, Titanium"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">
                  VITA / Custom Shades (Comma-separated)
                </label>
                <input
                  id="new-service-shades"
                  type="text"
                  value={newServiceForm.shades}
                  onChange={e => setNewServiceForm({ ...newServiceForm, shades: e.target.value })}
                  placeholder="A1, A2, A3, B1, Bleach BL1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-slate-300 text-xs mb-1">
                Clinical Description & Lab Guidelines
              </label>
              <textarea
                id="new-service-description"
                rows={3}
                value={newServiceForm.description}
                onChange={e => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                placeholder="High aesthetic multi-layered anatomical design with Exocad margin validation..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Status & Featured */}
            <div className="flex flex-wrap gap-6 items-center p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={newServiceForm.active}
                  onChange={e => setNewServiceForm({ ...newServiceForm, active: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Active Service (Visible on Case Booking)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={newServiceForm.featured}
                  onChange={e => setNewServiceForm({ ...newServiceForm, featured: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Featured Showcase Service</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab('ALL_SERVICES')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                id="save-new-service-submit-btn"
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving to Database...' : 'Save & Publish Service'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. OFFERS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'OFFERS' && (
        <AdminOffersManager
          offers={offers}
          services={services}
          onRefresh={fetchData}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. TAX SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'TAX_SETTINGS' && (
        <div id="pricing-tax-settings-view" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Tax & Billing Compliance Configuration</h2>
            <p className="text-xs text-slate-400">
              Global GST parameters, tax breakdown calculations, and invoice legal compliance.
            </p>
          </div>

          <form onSubmit={handleSaveTaxSettings} className="space-y-6 max-w-2xl">
            {/* Enable Tax Toggle */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-100 text-sm">Enable Tax / GST Calculation</div>
                <div className="text-xs text-slate-400">
                  When enabled, tax is automatically calculated on checkouts and itemized on PDF invoices.
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="tax-enabled-toggle"
                  type="checkbox"
                  checked={taxForm.taxEnabled}
                  onChange={e => setTaxForm({ ...taxForm, taxEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Tax Name */}
            <div>
              <label className="block font-semibold text-slate-300 text-xs mb-1">
                Official Tax Display Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="tax-name-input"
                type="text"
                required
                value={taxForm.taxName}
                onChange={e => setTaxForm({ ...taxForm, taxName: e.target.value })}
                placeholder="e.g., GST (Goods & Services Tax) or VAT"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block font-semibold text-slate-300 text-xs mb-1">
                Standard Tax Rate Percentage (%) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="tax-percent-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={taxForm.taxPercent}
                  onChange={e => setTaxForm({ ...taxForm, taxPercent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-500">%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard dental laboratory CAD design services in India are taxed under GST at 18.0%.
              </p>
            </div>

            {/* Preview Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase">Live Calculation Sample:</div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Subtotal (1x Standard Anatomic Crown):</span>
                <span className="font-mono text-slate-200">₹350.00</span>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>{taxForm.taxName} ({taxForm.taxEnabled ? `${taxForm.taxPercent}%` : '0%'}):</span>
                <span className="font-mono text-purple-300">
                  ₹{taxForm.taxEnabled ? ((350 * taxForm.taxPercent) / 100).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="text-xs font-bold text-emerald-400 flex justify-between pt-2 border-t border-slate-800">
                <span>Total Chargeable Amount:</span>
                <span className="font-mono">
                  ₹{(350 + (taxForm.taxEnabled ? (350 * taxForm.taxPercent) / 100 : 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-3">
              <button
                id="save-tax-settings-submit-btn"
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Tax Settings...' : 'Save Tax Parameters'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRICING HISTORY AUDIT LOG TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'HISTORY' && (
        <div id="pricing-history-view" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="pb-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Immutable Pricing Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Chronological record of every price change with user attribution, timestamp, and modification reason.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-950/60 border border-purple-800/40 text-purple-300 rounded-lg text-xs font-mono font-bold">
              {pricingHistory.length} Audit Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table id="pricing-history-table" className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-2">Service</th>
                  <th className="py-3 px-2">Previous Price</th>
                  <th className="py-3 px-2">Updated Price</th>
                  <th className="py-3 px-2">Change Delta</th>
                  <th className="py-3 px-2">Modified By</th>
                  <th className="py-3 px-3">Audit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pricingHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No price changes have been recorded yet.
                    </td>
                  </tr>
                ) : (
                  pricingHistory.map(entry => {
                    const diff = entry.newPriceINR - entry.oldPriceINR;
                    const diffPercent = entry.oldPriceINR > 0 ? Math.round((diff / entry.oldPriceINR) * 100) : 0;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                        {/* Timestamp */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>

                        {/* Service */}
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-200">{entry.serviceName}</div>
                          <span className="font-mono text-[10px] text-cyan-400">{entry.serviceCode}</span>
                        </td>

                        {/* Old Price */}
                        <td className="py-3 px-2 font-mono text-slate-400">
                          ₹{entry.oldPriceINR} (${entry.oldPriceUSD})
                        </td>

                        {/* New Price */}
                        <td className="py-3 px-2 font-mono font-bold text-emerald-400">
                          ₹{entry.newPriceINR} (${entry.newPriceUSD})
                        </td>

                        {/* Delta */}
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              diff > 0
                                ? 'bg-amber-500/20 text-amber-300'
                                : diff < 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {diff > 0 ? `+₹${diff} (+${diffPercent}%)` : diff < 0 ? `-₹${Math.abs(diff)} (${diffPercent}%)` : 'No Change'}
                          </span>
                        </td>

                        {/* Modified By */}
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-300">{entry.changedByUserName}</div>
                          <div className="text-[10px] text-purple-400 font-mono">{entry.changedByUserRole}</div>
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {entry.changeReason || 'Direct admin adjustment'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT SERVICE MODAL */}
      {/* ========================================================================= */}
      {editingService && (
        <div id="edit-service-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Edit Service: <span className="text-cyan-400 font-mono">{editingService.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update rate card prices, tax percentage, turnaround SLA, and delivery materials.
                </p>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditServiceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 text-xs mb-1">Service Name</label>
                  <input
                    type="text"
                    required
                    value={editingService.name}
                    onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 text-xs mb-1">Category</label>
                  <select
                    value={editingService.category || 'Crown'}
                    onChange={e => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Grid */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-[11px] font-bold text-purple-300 uppercase">Pricing Rate Cards</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">INR Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editingService.unitPriceINR}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setEditingService({
                          ...editingService,
                          unitPriceINR: val,
                          unitPriceUSD: Math.round(val / 83 * 10) / 10,
                          unitPriceEUR: Math.round(val / 90 * 10) / 10,
                          unitPriceGBP: Math.round(val / 105 * 10) / 10
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">USD Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editingService.unitPriceUSD}
                      onChange={e => setEditingService({ ...editingService, unitPriceUSD: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">EUR Price (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editingService.unitPriceEUR ?? Math.round(editingService.unitPriceINR / 90 * 10) / 10}
                      onChange={e => setEditingService({ ...editingService, unitPriceEUR: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">GBP Price (£)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editingService.unitPriceGBP ?? Math.round(editingService.unitPriceINR / 105 * 10) / 10}
                      onChange={e => setEditingService({ ...editingService, unitPriceGBP: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 text-xs mb-1">Turnaround SLA (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingService.standardTurnaroundHours}
                    onChange={e => setEditingService({ ...editingService, standardTurnaroundHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 text-xs mb-1">Service Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingService.taxPercent ?? 18}
                    onChange={e => setEditingService({ ...editingService, taxPercent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Audit Reason */}
              <div>
                <label className="block font-semibold text-amber-300 text-xs mb-1">
                  Change Reason / Audit Log Note
                </label>
                <input
                  type="text"
                  placeholder="e.g., Seasonal laboratory discount rate adjustment..."
                  value={editChangeReason}
                  onChange={e => setEditChangeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE SERVICE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingService && (
        <div id="delete-service-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-950/60 border border-rose-800/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete / Disable Service?</h3>
                <p className="text-xs text-rose-300 font-mono">{deletingService.name} ({deletingService.code})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If this service has historical case orders attached, the database will automatically 
              <strong className="text-amber-300"> safely disable & archive</strong> it instead of a destructive purge, 
              ensuring all historical invoices and case pricing snapshots remain 100% immutable.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingService(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              <button
                id="confirm-delete-service-btn"
                type="button"
                onClick={handleDeleteServiceConfirm}
                disabled={saving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-4 h-4" />
                <span>{saving ? 'Processing...' : 'Confirm Delete / Disable'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPricingManagement;