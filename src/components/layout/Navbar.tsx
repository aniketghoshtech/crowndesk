import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { CaseSearchModal } from '../case/CaseSearchModal';
import {
  Search,
  PlusCircle,
  LayoutDashboard,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  Phone,
  Tag,
  Boxes,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  onOpenAiChat?: (caseContext?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAiChat }) => {
  const { user, logout, isAdmin, isDesigner, isDoctor } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleNav = (view: string, data?: any) => {
    onNavigate(view, data);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <div
              onClick={() => handleNav('landing')}
              className="cursor-pointer transition transform hover:scale-[1.02]"
            >
              <Logo size="md" theme="dark" />
            </div>

            {/* Center Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <button
                onClick={() => handleNav('landing')}
                className={`px-3 py-2 rounded-xl transition ${
                  currentView === 'landing'
                    ? 'bg-slate-800/80 text-cyan-400 font-bold'
                    : 'hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="px-3 py-2 rounded-xl flex items-center gap-1.5 transition text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 shadow-sm"
                title="Search by Case ID (CD-2026-XXXXX)"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search Case</span>
              </button>

              <button
                onClick={() => handleNav('tracker')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                  currentView === 'tracker'
                    ? 'bg-slate-800/80 text-cyan-400 font-bold'
                    : 'hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Tracker</span>
              </button>

              <button
                onClick={() => handleNav('pricing')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                  currentView === 'pricing'
                    ? 'bg-slate-800/80 text-cyan-400 font-bold'
                    : 'hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pricing</span>
              </button>

              {/* CrownDesk Bot AI Button */}
              {onOpenAiChat && (
                <button
                  type="button"
                  onClick={() => onOpenAiChat()}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-500/40 rounded-xl text-cyan-300 font-bold flex items-center gap-1.5 shadow-sm transition hover:border-cyan-400 hover:scale-[1.02]"
                  title="Open AI CAD Assistant"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>CAD Bot</span>
                </button>
              )}

              {/* Active Logged-In Role Links */}
              {user && (
                <>
                  {isDoctor && (
                    <button
                      onClick={() => handleNav('customer-dashboard')}
                      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                        currentView === 'customer-dashboard' || currentView === 'new-case'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'hover:text-slate-100 hover:bg-slate-900/60'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                      <span>My Cases</span>
                    </button>
                  )}

                  {isDesigner && (
                    <button
                      onClick={() => handleNav('designer-dashboard')}
                      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                        currentView === 'designer-dashboard'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'hover:text-slate-100 hover:bg-slate-900/60'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5 text-amber-400" />
                      <span>CAD Workbench</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleNav('admin-dashboard')}
                      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                        currentView === 'admin-dashboard'
                          ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                          : 'hover:text-slate-100 hover:bg-slate-900/60'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                </>
              )}
            </nav>

            {/* Right Action Controls (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href="tel:+919058322251"
                className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition mr-2"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>+91 90583 22251</span>
              </a>

              {user ? (
                /* Logged in User Badge */
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl pl-3">
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-200 leading-none truncate max-w-[110px]">
                      {user.name}
                    </div>
                    <div className="text-[9px] text-cyan-400 uppercase tracking-wider font-semibold">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>

                  {isDoctor && (
                    <button
                      onClick={() => handleNav('new-case')}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>New Case</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      if (window.location.hash) {
                        window.history.replaceState(null, '', window.location.pathname);
                      }
                      await logout();
                      handleNav('landing');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Unified Login + Admin + Send Case */
                <div className="flex items-center gap-2">
                  {/* Single Unified Login Button */}
                  <button
                    onClick={() => handleNav('auth')}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition flex items-center gap-1.5 shadow-sm"
                    title="Doctor & Designer Portal Login"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Login</span>
                  </button>

                  {/* Admin Console */}
                  <button
                    onClick={() => handleNav('admin-login')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-purple-300 bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-800 transition flex items-center gap-1"
                    title="Super Admin Login"
                  >
                    <Lock className="w-3 h-3 text-purple-400" />
                    <span>Admin</span>
                  </button>

                  {/* Send CAD Case CTA */}
                  <button
                    onClick={() => handleNav('new-case')}
                    className="ml-1 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition transform active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Send Case</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="p-2 text-cyan-400 bg-slate-900 rounded-xl border border-slate-800"
                title="Search Case ID"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 rounded-xl border border-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
            <button
              onClick={() => handleNav('landing')}
              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-900 rounded-xl"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Search Case ID
            </button>
            <button
              onClick={() => handleNav('tracker')}
              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-cyan-400" /> Live Tracker
            </button>
            <button
              onClick={() => handleNav('pricing')}
              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-900 rounded-xl"
            >
              Pricing & Offers
            </button>

            {onOpenAiChat && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAiChat();
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> crowndesk bot
                </span>
                <span className="px-2 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 rounded font-mono">Live</span>
              </button>
            )}

            {user ? (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="px-3 py-1 text-xs text-slate-400">
                  Logged in as <span className="text-cyan-300 font-bold">{user.name}</span> ({user.role})
                </div>
                {isDoctor && (
                  <>
                    <button
                      onClick={() => handleNav('customer-dashboard')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-cyan-400 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" /> My CAD Dashboard
                    </button>
                    <button
                      onClick={() => handleNav('new-case')}
                      className="w-full py-2.5 bg-cyan-600 text-white text-xs font-bold rounded-xl text-center"
                    >
                      Submit New Case
                    </button>
                  </>
                )}
                {isDesigner && (
                  <button
                    onClick={() => handleNav('designer-dashboard')}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-amber-400 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                  >
                    <Boxes className="w-4 h-4" /> CAD Designer Workbench
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleNav('admin-dashboard')}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-purple-400 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Admin Control Panel
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (window.location.hash) {
                      window.history.replaceState(null, '', window.location.pathname);
                    }
                    await logout();
                    handleNav('landing');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:bg-slate-900 rounded-xl flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              /* Mobile Single Unified Login + Admin + Send Case */
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => handleNav('auth')}
                  className="w-full py-2.5 bg-slate-900 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Portal Login (Doctor & Designer)</span>
                </button>

                <button
                  onClick={() => handleNav('admin-login')}
                  className="w-full py-2.5 bg-slate-900 text-slate-400 border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Admin Console</span>
                </button>

                <button
                  onClick={() => handleNav('new-case')}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl text-center shadow-md font-bold"
                >
                  Send CAD Case Now →
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Authenticated Case Search Modal */}
      <CaseSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNav}
      />
    </>
  );
};