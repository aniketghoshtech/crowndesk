import React from 'react';
import { Logo } from '../brand/Logo';
import { Phone, Mail, MapPin, ShieldCheck, Award, Clock, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-xs">
      {/* Trust & Accreditations Banner */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Exocad & 3Shape</div>
              <div className="text-[11px] text-slate-500">Certified CAD Specialists</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200">12 - 24 Hour Turnaround</div>
              <div className="text-[11px] text-slate-500">Fast Express Delivery</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Zero Margin Discrepancy</div>
              <div className="text-[11px] text-slate-500">Strict 3-Stage QC Review</div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Encrypted Cloud Vault</div>
              <div className="text-[11px] text-slate-500">HIPAA & GDPR Compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Logo size="md" theme="dark" />
          <p className="text-xs text-slate-400 leading-relaxed">
            CrownDesk is India's leading digital dental CAD design outsourcing platform. Providing high-precision anatomic crowns, bridges, custom abutments, veneer smile makeovers, and clear aligners to dental clinics and laboratories worldwide.
          </p>
          <div className="text-[11px] text-cyan-400 font-mono">
            Direct CAD Support: +91 90583 22251
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">Dental CAD Services</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Zirconia & E.max Single Crowns</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Multi-Unit Bridges & Pontics</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Custom Titanium / Hybrid Abutments</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Aesthetic Anterior Veneer Smile Design</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Inlays, Onlays & Table Tops</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Digital Clear Aligner Staging</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('landing')} className="hover:text-cyan-400 transition">Home</button></li>
            <li><button onClick={() => onNavigate('tracker')} className="hover:text-cyan-400 transition">Track Dental Case by ID</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-cyan-400 transition">Pricing & Special Offers</button></li>
            <li><button onClick={() => onNavigate('auth')} className="hover:text-cyan-400 transition">Doctor / Lab Portal Login</button></li>
            <li><button onClick={() => onNavigate('new-case')} className="hover:text-cyan-400 transition">Submit New STL Case</button></li>
            <li><button onClick={() => onNavigate('admin-login')} className="hover:text-purple-400 transition flex items-center gap-1"><Lock className="w-3 h-3" /> Designer & Admin Staff Login</button></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">Clinical CAD Office</h4>
          <div className="flex items-start gap-2.5 text-xs text-slate-400">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>8A/GN/262, Lowyer Colony, Agra, India</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>+91 9058322251 (WhatsApp & Calls)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>supportcrwundesk@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CrownDesk Dental CAD Platform. All rights reserved.</p>
          <div className="flex gap-4 text-slate-500 text-[11px]">
            <span>Exocad Compatible</span>
            <span>•</span>
            <span>3Shape Compatible</span>
            <span>•</span>
            <span>Itero & Medit Scanner Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
