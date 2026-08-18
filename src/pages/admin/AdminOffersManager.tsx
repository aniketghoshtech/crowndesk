import React, { useState } from 'react';
import { Offer, ServicePricing } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Tag, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Calendar, 
  UserCheck, 
  Users, 
  Layers, 
  Percent, 
  Gift, 
  X, 
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AdminOffersManagerProps {
  offers: Offer[];
  services: ServicePricing[];
  onRefresh: () => void;
}

interface OfferFormData {
  id?: string;
  code: string;
  title: string;
  description: string;
  offerType: 'FREE_UNITS' | 'BUY_X_GET_Y' | 'PERCENTAGE';
  buyQuantityRequired: number;
  freeUnitsCount: number;
  percentageDiscount: number;
  eligibleServiceCodes: string[];
  isNewCustomerOnly: boolean;
  startDate: string;
  endDate: string;
  maxUsagePerCustomer: number;
  active: boolean;
}

const DEFAULT_OFFER_FORM: OfferFormData = {
  code: '',
  title: '',
  description: '',
  offerType: 'FREE_UNITS',
  buyQuantityRequired: 1,
  freeUnitsCount: 3,
  percentageDiscount: 0,
  eligibleServiceCodes: [],
  isNewCustomerOnly: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  maxUsagePerCustomer: 1,
  active: true
};

export const AdminOffersManager: React.FC<AdminOffersManagerProps> = ({
  offers,
  services,
  onRefresh
}) => {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(DEFAULT_OFFER_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Stats calculation
  const totalOffers = offers.length;
  const activeOffers = offers.filter(o => o.active).length;
  const newCustomerOffers = offers.filter(o => o.isNewCustomerOnly).length;
  const totalRedemptions = offers.reduce((acc, o) => acc + (o.timesRedeemed || 0), 0);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingOfferId(null);
    setFormData(DEFAULT_OFFER_FORM);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setFormData({
      id: offer.id,
      code: offer.code,
      title: offer.title,
      description: offer.description || '',
      offerType: offer.offerType || 'FREE_UNITS',
      buyQuantityRequired: offer.buyQuantityRequired || 1,
      freeUnitsCount: offer.freeUnitsCount || 0,
      percentageDiscount: offer.percentageDiscount || 0,
      eligibleServiceCodes: offer.eligibleServiceCodes || [],
      isNewCustomerOnly: Boolean(offer.isNewCustomerOnly),
      startDate: offer.startDate ? offer.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: offer.endDate ? offer.endDate.split('T')[0] : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      maxUsagePerCustomer: offer.maxUsagePerCustomer || 1,
      active: offer.active !== undefined ? offer.active : true
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleApplyPreset = (preset: 'NEW_CUSTOMER_3_FREE' | 'MOLAR_5_PLUS_2' | 'PERCENTAGE_10') => {
    if (preset === 'NEW_CUSTOMER_3_FREE') {
      setFormData({
        ...formData,
        code: 'WELCOME3FREE',
        title: 'New Customer — First 3 Units FREE',
        description: 'First 3 CAD design units completely free on the first case submission for new clinics & dental labs.',
        offerType: 'FREE_UNITS',
        buyQuantityRequired: 1,
        freeUnitsCount: 3,
        percentageDiscount: 0,
        eligibleServiceCodes: [],
        isNewCustomerOnly: true,
        maxUsagePerCustomer: 1,
        active: true
      });
    } else if (preset === 'MOLAR_5_PLUS_2') {
      setFormData({
        ...formData,
        code: 'MOLAR5PLUS2',
        title: '5 Molar + 2 Molar FREE',
        description: 'Order 5 or more crown units and receive 2 additional molar units designed completely FREE of charge.',
        offerType: 'BUY_X_GET_Y',
        buyQuantityRequired: 5,
        freeUnitsCount: 2,
        percentageDiscount: 0,
        eligibleServiceCodes: services.filter(s => s.code.includes('CROWN') || s.code === 'CROWN').map(s => s.code).length > 0
          ? services.filter(s => s.code.includes('CROWN') || s.code === 'CROWN').map(s => s.code)
          : ['CROWN'],
        isNewCustomerOnly: false,
        maxUsagePerCustomer: 10,
        active: true
      });
    } else if (preset === 'PERCENTAGE_10') {
      setFormData({
        ...formData,
        code: 'PROCAD10',
        title: '10% Off All CAD Designs',
        description: 'Enjoy a flat 10% promotional discount across all single and multi-unit digital prescriptions.',
        offerType: 'PERCENTAGE',
        buyQuantityRequired: 1,
        freeUnitsCount: 0,
        percentageDiscount: 10,
        eligibleServiceCodes: [],
        isNewCustomerOnly: false,
        maxUsagePerCustomer: 5,
        active: true
      });
    }
  };

  const handleToggleServiceSelection = (code: string) => {
    setFormData(prev => {
      const exists = prev.eligibleServiceCodes.includes(code);
      if (exists) {
        return { ...prev, eligibleServiceCodes: prev.eligibleServiceCodes.filter(c => c !== code) };
      } else {
        return { ...prev, eligibleServiceCodes: [...prev.eligibleServiceCodes, code] };
      }
    });
  };

  const handleToggleActive = async (id: string, code: string) => {
    try {
      await api.toggleOffer(id);
      toast.success(`Toggled status for offer ${code}`);
      onRefresh();
    } catch (err: any) {
      toast.error(`Failed to toggle offer status for ${code}: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteOffer = async (id: string, code: string) => {
    try {
      await api.deleteOffer(id);
      toast.success(`Offer ${code} deleted successfully.`);
      onRefresh();
    } catch (err: any) {
      toast.error(`Failed to delete offer ${code}: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      setErrorMsg('Promo code and offer title are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        offerType: formData.offerType,
        buyQuantityRequired: Number(formData.buyQuantityRequired) || 1,
        freeUnitsCount: formData.offerType === 'PERCENTAGE' ? 0 : Number(formData.freeUnitsCount) || 0,
        percentageDiscount: formData.offerType === 'PERCENTAGE' ? Number(formData.percentageDiscount) || 0 : 0,
        eligibleServiceCodes: formData.eligibleServiceCodes,
        isNewCustomerOnly: Boolean(formData.isNewCustomerOnly),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
        maxUsagePerCustomer: Number(formData.maxUsagePerCustomer) || 1,
        active: Boolean(formData.active)
      };

      if (editingOfferId) {
        await api.updateOffer(editingOfferId, payload);
      } else {
        await api.saveOffer(payload);
      }

      setModalOpen(false);
      setEditingOfferId(null);
      setFormData(DEFAULT_OFFER_FORM);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save offer. Please check code uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="admin-offers-manager" className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Offers</div>
            <div className="text-xl font-black text-slate-100">{totalOffers} Rules</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Active Promotions</div>
            <div className="text-xl font-black text-emerald-400">{activeOffers} Active</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">New Customer Only</div>
            <div className="text-xl font-black text-blue-400">{newCustomerOffers} Rules</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Redemptions</div>
            <div className="text-xl font-black text-amber-400">{totalRedemptions} Applied</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">Flexible Offer & Promo Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure buy quantity requirements, free units, service eligibility, new customer conditions, date windows, and usage caps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              id="admin-btn-create-offer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Configure New Offer</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Campaign Presets (Click to create & customize):</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                handleOpenCreateModal();
                handleApplyPreset('NEW_CUSTOMER_3_FREE');
              }}
              className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 text-blue-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Gift className="w-3.5 h-3.5 text-blue-400" />
              <span>New Customer — First 3 Units FREE</span>
            </button>

            <button
              onClick={() => {
                handleOpenCreateModal();
                handleApplyPreset('MOLAR_5_PLUS_2');
              }}
              className="px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>5 Molar + 2 Molar FREE (Buy 5, Get 2 Free)</span>
            </button>

            <button
              onClick={() => {
                handleOpenCreateModal();
                handleApplyPreset('PERCENTAGE_10');
              }}
              className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-800/40 border border-purple-700/50 text-purple-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Percent className="w-3.5 h-3.5 text-purple-400" />
              <span>10% Off All CAD Services</span>
            </button>
          </div>
        </div>

        {/* Offers Cards / Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offers.map(offer => {
            const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
            const isUpcoming = offer.startDate && new Date(offer.startDate) > new Date();

            return (
              <div
                key={offer.id}
                id={`offer-card-${offer.code}`}
                className={`p-5 rounded-2xl border transition-all ${
                  offer.active && !isExpired
                    ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-75'
                } space-y-4`}
              >
                {/* Top row: Code + Status Badges */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      title="Click to copy promo code"
                      className="px-2.5 py-1 bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 rounded-lg text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 transition group"
                    >
                      <span>{offer.code}</span>
                      <Copy className="w-3 h-3 text-purple-400 group-hover:scale-110" />
                    </button>
                    {copiedCode === offer.code && (
                      <span className="text-[10px] text-emerald-400 font-bold animate-fade-in">Copied!</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {offer.isNewCustomerOnly && (
                      <span className="px-2 py-0.5 bg-blue-950/60 border border-blue-800/50 text-blue-300 rounded text-[10px] font-bold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>New Customer Only</span>
                      </span>
                    )}

                    {offer.active ? (
                      isExpired ? (
                        <span className="px-2 py-0.5 bg-red-950/60 border border-red-800/50 text-red-300 rounded text-[10px] font-bold">
                          Expired
                        </span>
                      ) : isUpcoming ? (
                        <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800/50 text-amber-300 rounded text-[10px] font-bold">
                          Scheduled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 rounded text-[10px] font-bold">
                          Active
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded text-[10px] font-bold">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Offer Title & Description */}
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{offer.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{offer.description || 'No description provided.'}</p>
                </div>

                {/* Rule Parameter Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Offer Type</span>
                    <span className="font-semibold text-slate-200">
                      {offer.offerType === 'BUY_X_GET_Y'
                        ? 'Buy X Get Y Free'
                        : offer.offerType === 'PERCENTAGE'
                        ? 'Percentage %'
                        : 'Free Units'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Buy Required</span>
                    <span className="font-semibold text-amber-300">
                      Min {offer.buyQuantityRequired || 1} Unit(s)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Free / Discount</span>
                    <span className="font-semibold text-emerald-400">
                      {offer.offerType === 'PERCENTAGE'
                        ? `${offer.percentageDiscount}% Off`
                        : `${offer.freeUnitsCount || 0} Unit(s) Free`}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Eligible Service</span>
                    <span className="font-semibold text-slate-300 truncate block" title={offer.eligibleServiceCodes?.join(', ') || 'All Services'}>
                      {!offer.eligibleServiceCodes || offer.eligibleServiceCodes.length === 0
                        ? 'All CAD Services'
                        : offer.eligibleServiceCodes.join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Max per Client</span>
                    <span className="font-semibold text-slate-300">
                      {offer.maxUsagePerCustomer ? `${offer.maxUsagePerCustomer} time(s)` : 'Unlimited'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Total Redemptions</span>
                    <span className="font-semibold text-purple-300">
                      {offer.timesRedeemed || 0} applied
                    </span>
                  </div>
                </div>

                {/* Date Validity & Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'Immediate'} →{' '}
                      {offer.endDate ? new Date(offer.endDate).toLocaleDateString() : 'No expiry'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Toggle Active / Inactive Button */}
                    <button
                      onClick={() => handleToggleActive(offer.id, offer.code)}
                      title={offer.active ? 'Disable this offer' : 'Enable this offer'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
                        offer.active
                          ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {offer.active ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(offer)}
                      title="Edit offer parameters"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteOffer(offer.id, offer.code)}
                      title="Delete offer"
                      className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-lg text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {offers.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-950/50 border border-slate-800 rounded-2xl">
              <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-slate-300 font-bold text-sm">No promotional offers created yet</div>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Use the Quick Campaign Presets above or click "Configure New Offer" to set up promo rules for your clients.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Comprehensive Create / Edit Offer Modal */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {editingOfferId ? `Edit Offer Rule: ${formData.code}` : 'Configure New Promotional Offer'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define custom buy thresholds, free units, service scoping, and eligibility criteria.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/70 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Presets Bar inside Modal */}
            {!editingOfferId && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Load Preset Template:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('NEW_CUSTOMER_3_FREE')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    🎁 New Customer — First 3 Units FREE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('MOLAR_5_PLUS_2')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    🦷 5 Molar + 2 Molar FREE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('PERCENTAGE_10')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    🏷️ 10% Off All CAD
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: Promo Code & Offer Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Promo Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME3FREE"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono uppercase focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Offer Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Customer — First 3 Units FREE"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. First 3 units 100% free for new clinicians on initial order"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Row 2: Offer Rule Type & Quantities */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Rule Engine Configuration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Promotion Rule Type</label>
                    <select
                      value={formData.offerType}
                      onChange={e => setFormData({ ...formData, offerType: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500"
                    >
                      <option value="FREE_UNITS">Free Units on Order (e.g. First 3 Free)</option>
                      <option value="BUY_X_GET_Y">Buy X Quantity, Get Y Free (e.g. 5+2)</option>
                      <option value="PERCENTAGE">Percentage Discount (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Buy Quantity (Min required)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.buyQuantityRequired}
                      onChange={e => setFormData({ ...formData, buyQuantityRequired: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Minimum units in prescription to trigger offer
                    </span>
                  </div>

                  {formData.offerType !== 'PERCENTAGE' ? (
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Free Quantity (Units)
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formData.freeUnitsCount}
                        onChange={e => setFormData({ ...formData, freeUnitsCount: Math.max(1, Number(e.target.value)) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Number of units designed completely free
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">
                        Discount Percent (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={formData.percentageDiscount}
                        onChange={e => setFormData({ ...formData, percentageDiscount: Math.min(100, Math.max(1, Number(e.target.value))) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Percentage off order subtotal
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Scoping */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-semibold">
                    Eligible Service Scope
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formData.eligibleServiceCodes.length === 0
                      ? 'Valid for ALL CAD services'
                      : `${formData.eligibleServiceCodes.length} specific service(s) selected`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select specific CAD services this promotion applies to, or leave empty to apply across all services.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, eligibleServiceCodes: [] })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      formData.eligibleServiceCodes.length === 0
                        ? 'bg-purple-600 border-purple-500 text-white shadow'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ★ All CAD Services
                  </button>

                  {services.map(srv => {
                    const isSelected = formData.eligibleServiceCodes.includes(srv.code);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => handleToggleServiceSelection(srv.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {srv.name} ({srv.code})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eligibility, Validity Dates, Usage Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* New Customer Only Toggle */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <label className="block text-slate-300 font-semibold">New Customer Eligibility</label>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="offer-new-customer-checkbox"
                      checked={formData.isNewCustomerOnly}
                      onChange={e => setFormData({ ...formData, isNewCustomerOnly: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                    />
                    <label htmlFor="offer-new-customer-checkbox" className="text-slate-300 cursor-pointer select-none">
                      New Customers Only
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Restricts voucher to first-time case submissions
                  </span>
                </div>

                {/* Start Date */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <label className="block text-slate-300 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 block">Campaign launch date</span>
                </div>

                {/* End Date */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <label className="block text-slate-300 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                  />
                  <span className="text-[10px] text-slate-500 block">Expiration date</span>
                </div>
              </div>

              {/* Maximum Usage & Active Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <label className="block text-slate-300 font-semibold">Maximum Usage Per Customer</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxUsagePerCustomer}
                    onChange={e => setFormData({ ...formData, maxUsagePerCustomer: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    How many times an individual customer can redeem this offer
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <label className="block text-slate-300 font-semibold">Offer Status</label>
                    <span className="text-[10px] text-slate-400">
                      {formData.active ? 'Active and redeemable by qualified clients' : 'Disabled (will reject voucher inputs)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition ${
                      formData.active
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {formData.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{formData.active ? 'ACTIVE' : 'INACTIVE'}</span>
                  </button>
                </div>
              </div>

              {/* Live Rule Simulation Box */}
              <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-2xl space-y-1 text-[11px]">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rule Logic Summary:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  When a {formData.isNewCustomerOnly ? 'NEW ' : ''}customer orders at least{' '}
                  <span className="text-amber-300 font-bold">{formData.buyQuantityRequired} unit(s)</span>{' '}
                  {formData.eligibleServiceCodes.length > 0 ? (
                    <>of <span className="text-purple-300 font-bold">{formData.eligibleServiceCodes.join(', ')}</span></>
                  ) : (
                    'of any CAD service'
                  )}
                  , they receive{' '}
                  <span className="text-emerald-400 font-bold">
                    {formData.offerType === 'PERCENTAGE'
                      ? `${formData.percentageDiscount}% discount`
                      : `${formData.freeUnitsCount} unit(s) 100% FREE`}
                  </span>
                  . Max {formData.maxUsagePerCustomer} redemption(s) per client.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="admin-btn-save-offer"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition active:scale-95"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingOfferId ? 'Update Offer' : 'Create Offer'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminOffersManager;
