import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ToothSelectorChart } from '../../components/case/ToothSelectorChart';
import { ServicePricing, Offer } from '../../types';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  FileCode,
  ShieldCheck,
  Tag,
  ArrowRight,
  User,
  Building,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface NewCaseSubmissionPageProps {
  initialData?: {
    serviceId?: string;
    quantity?: number;
    coupon?: string;
  };
  onNavigate: (view: string, data?: any) => void;
}

export const NewCaseSubmissionPage: React.FC<NewCaseSubmissionPageProps> = ({
  initialData,
  onNavigate
}) => {
  const { user, isDoctor } = useAuth();

  // Reference lists
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  // Form states
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [clinicName, setClinicName] = useState(user?.clinicName || '');
  const [selectedServiceId, setSelectedServiceId] = useState(initialData?.serviceId || '');
  const [restorationType, setRestorationType] = useState('Full Anatomical Crown');
  const [material, setMaterial] = useState('Multi-layer Zirconia (3D Pro)');
  const [shade, setShade] = useState('A2');
  const [occlusalClearance, setOcclusalClearance] = useState('Standard (0.05 mm)');
  const [contactTightness, setContactTightness] = useState('Medium Contact');
  const [turnaroundType, setTurnaroundType] = useState<'STANDARD_24H' | 'EXPRESS_12H' | 'RUSH_6H'>('STANDARD_24H');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Selected Teeth
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>(['14', '15']);

  // Files
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  // Promo code
  const [couponCode, setCouponCode] = useState(initialData?.coupon || 'FIRSTFREE');

  // Calculation breakdown
  const [pricingCalc, setPricingCalc] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [srvRes, offRes] = await Promise.all([api.getServices(), api.getOffers()]);
        setServices(srvRes.services || []);
        setOffers(offRes.offers || []);
        if (!selectedServiceId && srvRes.services?.length) {
          setSelectedServiceId(srvRes.services[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // Update live pricing estimate
  useEffect(() => {
    if (!selectedServiceId) return;
    const units = Math.max(1, selectedTeeth.length);
    const fetchCalc = async () => {
      try {
        const res = await api.calculatePrice(selectedServiceId, units, couponCode);
        setPricingCalc(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCalc();
  }, [selectedServiceId, selectedTeeth, couponCode]);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      alert('Please log in as a Doctor or Lab to submit a CAD case.');
      onNavigate('auth');
      return;
    }

    if (selectedTeeth.length === 0) {
      setError('Please select at least one tooth number on the FDI chart.');
      return;
    }

    if (!patientName.trim()) {
      setError('Please provide the patient reference name or code.');
      return;
    }

    try {
      setSubmitting(true);
      const units = selectedTeeth.length;

      // 1. Submit Case Metadata
      const caseRes = await api.createCase({
        patientName,
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender,
        clinicName: clinicName || user.clinicName || 'Clinic',
        serviceId: selectedServiceId,
        teethNumbers: selectedTeeth,
        unitsQuantity: units,
        restorationType,
        material,
        shade,
        occlusalClearance,
        contactTightness,
        turnaroundType,
        specialInstructions,
        offerCode: couponCode
      });

      const newCaseId = caseRes.case.id;

      // 2. Upload any selected initial scan files
      if (filesToUpload.length > 0) {
        for (const f of filesToUpload) {
          const formData = new FormData();
          formData.append('file', f);
          formData.append('caseId', newCaseId);
          formData.append('fileType', 'SCAN_STL');
          await api.uploadFile(formData);
        }
      }

      setSubmitting(false);
      onNavigate('customer-dashboard', { selectedCaseId: newCaseId });
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Case submission failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-cyan-400" />
            <span>New Dental CAD Case Submission</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Specify clinical parameters, select FDI tooth positions, upload intraoral scans, and dispatch to CAD designers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('customer-dashboard')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition"
        >
          ← Back to Cases
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Patient, FDI Chart, Specs & Uploads */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Patient & Clinic Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>1. Patient & Clinic Reference</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Patient Name / Ref Code *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  required
                  placeholder="e.g. Ramesh Kumar or PT-8821"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinic / Lab Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  placeholder="Crown Clinic"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 42"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={e => setPatientGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Turnaround Speed</label>
                <select
                  value={turnaroundType}
                  onChange={e => setTurnaroundType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="STANDARD_24H">Standard (24 Hours)</option>
                  <option value="EXPRESS_12H">Express (12 Hours) (+20%)</option>
                  <option value="RUSH_6H">Rush Urgent (6 Hours) (+50%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Interactive FDI Tooth Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                2. Interactive FDI 2-Digit Tooth Selector
              </h3>
              <div className="text-xs text-cyan-400 font-mono font-bold">
                {selectedTeeth.length} {selectedTeeth.length === 1 ? 'Tooth' : 'Teeth'} Selected
              </div>
            </div>

            <ToothSelectorChart
              selectedTeeth={selectedTeeth}
              onChange={setSelectedTeeth}
            />
          </div>

          {/* 3. Clinical & Material Specifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              3. CAD Restoration Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">CAD Service</label>
                <select
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-semibold"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.unitPriceINR})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Restoration Type</label>
                <select
                  value={restorationType}
                  onChange={e => setRestorationType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Full Anatomical Crown">Full Anatomical Crown</option>
                  <option value="Anatomic Coping (Cut-Back)">Anatomic Coping (Cut-Back)</option>
                  <option value="Multi-Unit Bridge / Pontic">Multi-Unit Bridge / Pontic</option>
                  <option value="Custom Hybrid Abutment">Custom Hybrid Abutment</option>
                  <option value="Aesthetic Veneer / Laminate">Aesthetic Veneer / Laminate</option>
                  <option value="Inlay / Onlay / Overlay">Inlay / Onlay / Overlay</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Material</label>
                <select
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Multi-layer Zirconia (3D Pro)">Multi-layer Zirconia (3D Pro)</option>
                  <option value="High Translucency Zirconia (HT)">High Translucency Zirconia (HT)</option>
                  <option value="IPS e.max CAD Lithium Disilicate">IPS e.max CAD Lithium Disilicate</option>
                  <option value="PMMA Temporary / Wax-Up">PMMA Temporary / Wax-Up</option>
                  <option value="Cobalt-Chromium (CoCr)">Cobalt-Chromium (CoCr)</option>
                  <option value="Titanium Grade 5">Titanium Grade 5</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vita Classical Shade</label>
                <select
                  value={shade}
                  onChange={e => setShade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                >
                  {['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1 (Bleach)', 'BL2', 'BL3'].map(sh => (
                    <option key={sh} value={sh}>{sh}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Occlusal Clearance</label>
                <select
                  value={occlusalClearance}
                  onChange={e => setOcclusalClearance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Light Contact (0.02 mm)">Light Contact (0.02 mm)</option>
                  <option value="Standard (0.05 mm)">Standard (0.05 mm)</option>
                  <option value="Heavy Contact (0.10 mm)">Heavy Contact (0.10 mm)</option>
                  <option value="Out of Occlusion (-0.15 mm)">Out of Occlusion (-0.15 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Proximal Contacts</label>
                <select
                  value={contactTightness}
                  onChange={e => setContactTightness(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Light Contact">Light Contact (Dental Floss Glide)</option>
                  <option value="Medium Contact">Medium Contact (Standard Snap)</option>
                  <option value="Tight Contact">Tight Contact (Heavy Resistance)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                Clinical Design Instructions & Notes for CAD Technician
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Leave buccal margin supragingival, match lingual contour to tooth #24, create canine guidance..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 4. Intraoral Scan File Uploads */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>4. Intraoral Scan Files (STL, PLY, OBJ, ZIP)</span>
            </h3>

            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/60 transition group">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition mb-2" />
              <span className="text-xs font-bold text-slate-200">
                Click or Drag & Drop Upper Arch, Lower Arch & Bite Scans
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Accepts .STL, .PLY, .OBJ, .ZIP, .RAR (Up to 250MB per file)
              </span>
              <input
                type="file"
                multiple
                onChange={handleFileDrop}
                className="hidden"
                accept=".stl,.ply,.obj,.zip,.rar,.pdf"
              />
            </label>

            {filesToUpload.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Selected Uploads:</div>
                {filesToUpload.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-200 font-semibold">{f.name}</span>
                      <span className="text-slate-500 text-[10px]">
                        ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Summary & Coupon Drawer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-24 space-y-5 text-slate-100">
            <h3 className="text-sm font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>Prescription Summary</span>
              <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                {selectedTeeth.length} Units
              </span>
            </h3>

            {/* Coupon Code Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Have a Promo Code?</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FIRSTFREE"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Unit Rate:</span>
                <span>₹{pricingCalc?.unitPrice || 0} / unit</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({selectedTeeth.length} teeth):</span>
                <span>₹{pricingCalc?.subtotal || 0}</span>
              </div>

              {Number(pricingCalc?.offerDiscountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                  <span>Offer ({pricingCalc?.appliedOfferCode}):</span>
                  <span>- ₹{pricingCalc?.offerDiscountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>
                  {pricingCalc?.taxEnabled === false 
                    ? 'Tax (Exempt/Disabled):' 
                    : `${pricingCalc?.taxName || 'Tax'} (${pricingCalc?.taxPercent !== undefined ? pricingCalc?.taxPercent : 18}%):`}
                </span>
                <span>₹{pricingCalc?.taxAmount || 0}</span>
              </div>

              <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center text-sm font-bold text-slate-100">
                <span>Total Amount:</span>
                <span className="text-xl font-black text-cyan-400">
                  ₹{pricingCalc?.finalTotalAmount || 0}
                </span>
              </div>
            </div>

            {/* Quality & Security Guarantee */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>CrownDesk Quality Promise</span>
              </div>
              <p>
                Every STL file is validated for occlusal contact, interproximal resistance & cement gap precision before delivery.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-xl shadow-cyan-500/25 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Dispatching Case to CAD Lab...' : 'Dispatch Case to Designers'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
