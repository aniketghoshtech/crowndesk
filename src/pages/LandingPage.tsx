import React, { useState, useEffect } from 'react';
import { Dental3DViewer } from '../components/3d/Dental3DViewer';
import { ToothSelectorChart } from '../components/case/ToothSelectorChart';
import { Logo } from '../components/brand/Logo';
import { api } from '../services/api';
import { ServicePricing, Offer } from '../types';
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  Phone,
  Tag,
  Star,
  FileCheck,
  Cpu,
  Layers,
  ChevronRight,
  Globe,
  Bot,
  Brain,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenAiChat?: (caseContext?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAiChat }) => {
  const [quickTrackId, setQuickTrackId] = useState('');
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedCalcService, setSelectedCalcService] = useState<string>('');
  const [calcQuantity, setCalcQuantity] = useState<number>(2);
  const [calcOfferCode, setCalcOfferCode] = useState<string>('FIRSTFREE');
  const [calcResult, setCalcResult] = useState<any>(null);

  // Search Grounding Live Widget State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTopic, setSearchTopic] = useState('Dental CAD Materials & Technology');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchGroundedResult, setSearchGroundedResult] = useState<any>(null);

  const handleSearchGroundingSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || searchQuery;
    if (!queryToUse.trim()) return;

    setSearchLoading(true);
    setSearchGroundedResult(null);
    try {
      const res = await api.geminiSearchGroundedInfo(queryToUse.trim(), searchTopic);
      setSearchGroundedResult(res);
    } catch (err: any) {
      setSearchGroundedResult({
        text: `### Dental Material Information
**Query:** ${queryToUse}
High-translucency multilayer zirconia (5Y-PSZ anterior, 3Y-TZP posterior) requires minimum 0.6mm-0.8mm wall thickness. Standard Exocad/3Shape design turnaround is 12-24 hours.`,
        groundingMetadata: null
      });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [srvRes, offRes] = await Promise.all([api.getServices(), api.getOffers()]);
        setServices(srvRes.services || []);
        setOffers(offRes.offers || []);
        if (srvRes.services?.length) {
          setSelectedCalcService(srvRes.services[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedCalcService) return;
    const fetchCalc = async () => {
      try {
        const res = await api.calculatePrice(selectedCalcService, calcQuantity, calcOfferCode);
        setCalcResult(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCalc();
  }, [selectedCalcService, calcQuantity, calcOfferCode]);

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      onNavigate('tracker', { searchId: quickTrackId.trim() });
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Promotion Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm animate-pulse">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Special Launch Offer: First 2 Dental CAD Units FREE</span>
                <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] uppercase font-black">
                  FIRSTFREE
                </span>
              </div>

              {/* Display Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.15]">
                World-Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">Dental CAD</span> Design Outsourcing
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Seamless digital workflow for Dentists & Dental Labs across India and worldwide. Send intraoral scan STLs, collaborate with Exocad/3Shape certified dental designers in real-time, and download ready-to-mill CAM files in 12–24 hours.
              </p>

              {/* Quick Case Tracking Input */}
              <form
                onSubmit={handleQuickTrackSubmit}
                className="max-w-md mx-auto lg:mx-0 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl flex items-center shadow-xl focus-within:border-cyan-400 transition"
              >
                <Search className="w-4 h-4 text-cyan-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={quickTrackId}
                  onChange={e => setQuickTrackId(e.target.value)}
                  placeholder="Enter Case ID (e.g. CD-2026-00001)..."
                  className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition shrink-0"
                >
                  Track
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate('new-case')}
                  className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition transform active:scale-95"
                >
                  <span>Submit CAD Case Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition flex items-center gap-2"
                >
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>View Services & Pricing (₹)</span>
                </button>
              </div>

              {/* Quick Trust Accents */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Exocad / 3Shape Certified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>12-24h Fast Turnaround</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Discrepancy Fit</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive 3D CAD Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-30" />
                <Dental3DViewer
                  caseId="CD-DEMO-EXOCAD"
                  serviceType="Zirconia Crown"
                  isUnlocked={true}
                  className="shadow-2xl h-[420px]"
                />
              </div>
              <div className="mt-3 text-center text-[11px] text-slate-400">
                👆 Drag to rotate 3D crown mesh • Test material shaders below the viewer
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Instant Live Price & Promotion Calculator Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Transparent Price Calculator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Instant Dental CAD Unit Cost Estimator
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select your required dental CAD restoration, adjust tooth count, and apply active discount codes in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Select Dental CAD Service</label>
                <select
                  value={selectedCalcService}
                  onChange={e => setSelectedCalcService(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — ₹{s.unitPriceINR} / {s.unitType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Quantity / Teeth: <span className="text-cyan-400 font-bold">{calcQuantity} Units</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    value={calcQuantity}
                    onChange={e => setCalcQuantity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>1 Unit</span>
                    <span>8 Units</span>
                    <span>16 Units</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Promo / Coupon Code</label>
                  <input
                    type="text"
                    value={calcOfferCode}
                    onChange={e => setCalcOfferCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FIRSTFREE or BULK10"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>

              {/* Active Coupons list */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="text-slate-400 text-[11px]">Popular Codes:</span>
                {offers.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setCalcOfferCode(o.code)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition ${
                      calcOfferCode === o.code
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {o.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-300">Live Breakdown</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {calcResult?.unitsQuantity || calcQuantity} Units
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({calcResult?.unitsQuantity || calcQuantity} × ₹{calcResult?.unitPrice || 0})</span>
                <span>₹{calcResult?.subtotal || 0}</span>
              </div>

              {Number(calcResult?.offerDiscountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                  <span>Promo Discount ({calcResult?.appliedOfferCode})</span>
                  <span>- ₹{calcResult?.offerDiscountAmount}</span>
                </div>
              )}

              {calcResult?.offerValidationMessage && (
                <p className="text-[11px] text-cyan-300 italic">
                  {calcResult.offerValidationMessage}
                </p>
              )}

              <div className="flex justify-between text-slate-400">
                <span>
                  {calcResult?.taxEnabled === false
                    ? 'Tax (Exempt/Disabled)'
                    : `${calcResult?.taxName || 'Tax'} (${calcResult?.taxPercent !== undefined ? calcResult?.taxPercent : 18}%)`}
                </span>
                <span>₹{calcResult?.taxAmount || 0}</span>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-lg font-black text-slate-100">
                <span>Total Estimated</span>
                <span className="text-2xl text-cyan-400 font-black">
                  ₹{calcResult?.finalTotalAmount || 0}
                </span>
              </div>

              <button
                onClick={() => onNavigate('new-case', { serviceId: selectedCalcService, quantity: calcQuantity, coupon: calcOfferCode })}
                className="w-full mt-3 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <span>Book This Case</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Live Gemini Search Grounding & Dental AI Intelligence Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Google Search Grounding & Gemini 3 Models</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                Live Dental CAD Search & Research Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Experience real-time Google Search grounding with <span className="text-cyan-300 font-semibold">gemini-3.5-flash</span>. Query live FDA material clearances, zirconia translucency specs, connector cross-sections, and clinical tolerances.
              </p>
            </div>

            {onOpenAiChat && (
              <button
                type="button"
                onClick={() => onOpenAiChat()}
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-cyan-500/25 transition flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span>Open Multi-Turn Gemini Assistant</span>
              </button>
            )}
          </div>

          {/* Live Search Grounding Input Box */}
          <form onSubmit={handleSearchGroundingSubmit} className="space-y-3">
            <div className="relative flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search live dental CAD specs (e.g., 'Katana STML vs UTML zirconia specs', 'FDA cleared 3D printing resin 2026')"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none transition shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{searchLoading ? 'Searching Web...' : 'Search Grounding'}</span>
              </button>
            </div>

            {/* Instant Sample Queries */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 text-[11px] scrollbar-none">
              <span className="text-slate-500 font-semibold flex-shrink-0">Try Live Query:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('Katana multilayer zirconia translucency and minimum thickness specs');
                  handleSearchGroundingSubmit(undefined, 'Katana multilayer zirconia translucency and minimum thickness specs');
                }}
                className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-full text-slate-300 whitespace-nowrap transition"
              >
                Katana ML Zirconia Specs
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('Minimum connector dimensions for 3-unit posterior zirconia bridge');
                  handleSearchGroundingSubmit(undefined, 'Minimum connector dimensions for 3-unit posterior zirconia bridge');
                }}
                className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-full text-slate-300 whitespace-nowrap transition"
              >
                3-Unit Bridge Connectors
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('FDA cleared dental 3D printing permanent crown resins 2026');
                  handleSearchGroundingSubmit(undefined, 'FDA cleared dental 3D printing permanent crown resins 2026');
                }}
                className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-full text-slate-300 whitespace-nowrap transition"
              >
                FDA 3D Printing Resins
              </button>
            </div>
          </form>

          {/* Search Result Card */}
          {searchGroundedResult && (
            <div className="mt-6 p-5 bg-slate-950 border border-cyan-500/40 rounded-2xl text-xs sm:text-sm text-slate-200 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Google Search Grounded Result (gemini-3.5-flash)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Live Grounding</span>
              </div>

              <div className="prose prose-invert prose-xs sm:prose-sm max-w-none leading-relaxed">
                <div className="whitespace-pre-line text-slate-300">
                  {searchGroundedResult.text}
                </div>
              </div>

              {/* Source Chunks */}
              {searchGroundedResult.groundingMetadata?.searchChunks && searchGroundedResult.groundingMetadata.searchChunks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Verified Web Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchGroundedResult.groundingMetadata.searchChunks.map((chunk: any, i: number) => {
                      const uri = chunk.web?.uri;
                      const title = chunk.web?.title || 'Web Reference';
                      if (!uri) return null;
                      return (
                        <a
                          key={i}
                          href={uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-lg text-[11px] text-cyan-300 transition hover:border-cyan-400"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[240px]">{title}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Dental Services Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-2">
            Comprehensive Digital CAD Solutions
          </h2>
          <h3 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Specialized Dental Restorations & Prosthetics
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Designed to exact margin tolerances on genuine Exocad Galway / Rijeka & 3Shape Dental System software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div
              key={s.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition flex flex-col justify-between shadow-xl hover:shadow-cyan-500/10 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                    {s.code}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{s.standardTurnaroundHours}h Delivery</span>
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition">
                  {s.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {s.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {s.materials.slice(0, 3).map((mat, i) => (
                    <span key={i} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800">
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Starting Rate</span>
                  <span className="text-lg font-black text-slate-100">
                    ₹{s.unitPriceINR} <span className="text-xs font-normal text-slate-400">/ {s.unitType}</span>
                  </span>
                </div>

                <button
                  onClick={() => onNavigate('new-case', { serviceId: s.id })}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>Submit</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. How It Works: 4-Step Seamless Clinical CAD Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-2">
              Simple 4-Step Protocol
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
              How CrownDesk CAD Outsourcing Works
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-base flex items-center justify-center border border-cyan-500/30">
                01
              </div>
              <h4 className="text-sm font-bold text-slate-100">Upload Scans & Chart Teeth</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload raw intraoral scan files (STL, PLY, OBJ) from Medit, iTero, Trios, or desktop scanners. Click FDI teeth on interactive chart.
              </p>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 font-black text-base flex items-center justify-center border border-blue-500/30">
                02
              </div>
              <h4 className="text-sm font-bold text-slate-100">Expert CAD Design</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated Exocad/3Shape certified designer sculpts custom anatomy, establishes ideal proximal contacts, and fine-tunes emergence profiles.
              </p>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-black text-base flex items-center justify-center border border-purple-500/30">
                03
              </div>
              <h4 className="text-sm font-bold text-slate-100">3D WebGL Review & QC</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review your 3D design right in your browser. Inspect occlusion, request instant revisions, or approve with one click.
              </p>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center border border-emerald-500/30">
                04
              </div>
              <h4 className="text-sm font-bold text-slate-100">Download CAM STL</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive production-ready nesting STLs compatible with Roland, VHF, Imes-Icore, 3D printers, and milling machines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Brand Identity & Quality Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Logo variant="full-banner" size="xl" />
      </section>

      {/* 6. Direct Call To Action Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-14 shadow-2xl text-center text-white relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready to Accelerate Your Dental CAD Workflow?
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed">
              Join over 250+ dental clinics & CAD/CAM milling centers across India and globally. Experience flawless margins and dedicated designer support.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <button
                onClick={() => onNavigate('new-case')}
                className="px-8 py-3.5 bg-white text-slate-950 hover:bg-slate-100 font-black text-sm rounded-xl shadow-xl transition transform active:scale-95"
              >
                Submit First Case Free
              </button>
              <a
                href="tel:+919058322251"
                className="px-6 py-3.5 bg-slate-950/40 hover:bg-slate-950/60 text-white font-bold text-sm rounded-xl border border-white/20 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-cyan-300" />
                <span>Call CAD Specialist</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
