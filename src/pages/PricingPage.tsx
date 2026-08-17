import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServicePricing, Offer } from '../types';
import { Tag, Sparkles, Clock, CheckCircle2, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [srvRes, offRes] = await Promise.all([api.getServices(), api.getOffers()]);
        setServices(srvRes.services || []);
        setOffers(offRes.offers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
          <Tag className="w-3.5 h-3.5" />
          <span>Transparent Dental CAD Rates</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
          Simple, Unit-Based CAD Pricing
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          No hidden fees, no subscriptions, zero licensing overhead. Pay only per designed tooth unit with complimentary revisions and instant 3D WebGL viewing.
        </p>

        {/* Currency Switcher */}
        <div className="inline-flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              currency === 'INR' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ₹ INR (India)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              currency === 'USD' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            $ USD (Global)
          </button>
        </div>
      </div>

      {/* Active Promotion Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map(off => (
          <div
            key={off.id}
            className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xl"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-slate-100">{off.title}</span>
              </div>
              <p className="text-xs text-slate-400">{off.description}</p>
              <div className="text-[11px] text-slate-500">
                Min {off.minUnits} Units • Valid until {new Date(off.validUntil).toLocaleDateString()}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-black text-sm px-3 py-1 rounded-lg">
                {off.code}
              </div>
              <button
                onClick={() => onNavigate('new-case', { coupon: off.code })}
                className="text-[11px] text-cyan-400 hover:underline mt-1 block font-semibold"
              >
                Apply to Case →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s => {
          const price = currency === 'INR' ? `₹${s.unitPriceINR}` : `$${s.unitPriceUSD}`;
          const isPopular = s.code === 'ZIR-CRW' || s.code === 'IMP-ABUT';

          return (
            <div
              key={s.id}
              className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between transition shadow-xl relative ${
                isPopular ? 'border-cyan-500 ring-1 ring-cyan-500/30' : 'border-slate-800'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] uppercase tracking-wider font-black px-3 py-0.5 rounded-full shadow-md">
                  Most Requested
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {s.code}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{s.standardTurnaroundHours}h</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{s.description}</p>

                {/* Price Display */}
                <div className="mt-6 mb-6">
                  <span className="text-3xl font-black text-slate-100">{price}</span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">/ {s.unitType}</span>
                </div>

                {/* Materials & Features */}
                <div className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Exocad / 3Shape Construction File</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3D Interactive WebGL Approval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Occlusion & Contact Revisions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Supported: {s.materials.slice(0, 2).join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('new-case', { serviceId: s.id })}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isPopular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                  }`}
                >
                  <span>Submit {s.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise / Lab Volume Contract */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-slate-100">Need High-Volume Lab CAD Outsourcing?</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          For dental laboratories producing over 100+ units monthly, we provide dedicated dedicated full-time CAD designers, custom XML nesting presets, and priority 6-hour turnarounds.
        </p>
        <a
          href="tel:+919058322251"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
        >
          <span>Contact Lab Operations (+91 90583 22251)</span>
        </a>
      </div>
    </div>
  );
};
