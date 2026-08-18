import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal';
import { GeminiDentalChatModal } from './components/ai/GeminiDentalChatModal';

import { LandingPage } from './pages/LandingPage';
import { PublicCaseTrackerPage } from './pages/PublicCaseTrackerPage';
import { PricingPage } from './pages/PricingPage';
import { AuthPage } from './pages/AuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { NewCaseSubmissionPage } from './pages/customer/NewCaseSubmissionPage';
import { DesignerDashboard } from './pages/designer/DesignerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Bot, Sparkles, Globe } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAdmin, isDesigner, isDoctor } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<any>(null);

  // Gemini AI Chatbot state
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeCaseContext, setActiveCaseContext] = useState<any>(null);

  // Auto-route based on role when entering dashboard
  const handleNavigate = (view: string, data?: any) => {
    setViewParams(data || null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAiChat = (caseContext?: any) => {
    setActiveCaseContext(caseContext || null);
    setAiChatOpen(true);
  };

  // Listen to hash and pathname changes for direct linking (/admin, #tracker, etc.)
  useEffect(() => {
    const handleUrlRouting = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.replace('#', '').toLowerCase();

      if (pathname === '/admin' || pathname === '/admin/' || hash === 'admin' || hash === 'admin-login') {
        if (isAdmin) {
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('admin-login');
        }
        return;
      }

      if (hash) {
        setCurrentView(hash);
      }
    };

    handleUrlRouting();
    window.addEventListener('hashchange', handleUrlRouting);
    window.addEventListener('popstate', handleUrlRouting);
    return () => {
      window.removeEventListener('hashchange', handleUrlRouting);
      window.removeEventListener('popstate', handleUrlRouting);
    };
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased relative">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAiChat={handleOpenAiChat}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage onNavigate={handleNavigate} onOpenAiChat={handleOpenAiChat} />
        )}
        {currentView === 'tracker' && (
          <PublicCaseTrackerPage
            initialSearchId={viewParams?.searchId}
            onNavigate={handleNavigate}
            onOpenAiChat={handleOpenAiChat}
          />
        )}
        {currentView === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentView === 'auth' && <AuthPage onNavigate={handleNavigate} />}
        {currentView === 'admin-login' && <AdminLoginPage onNavigate={handleNavigate} />}
        {currentView === 'new-case' && (
          <NewCaseSubmissionPage
            initialData={viewParams}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'customer-dashboard' && (
          <CustomerDashboard
            initialCaseId={viewParams?.selectedCaseId}
            onNavigate={handleNavigate}
            onOpenAiChat={handleOpenAiChat}
          />
        )}
        {currentView === 'designer-dashboard' && (
          <DesignerDashboard
            initialCaseId={viewParams?.selectedCaseId}
            onNavigate={handleNavigate}
            onOpenAiChat={handleOpenAiChat}
          />
        )}
        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            initialCaseId={viewParams?.selectedCaseId}
            initialTab={viewParams?.targetTab}
            onNavigate={handleNavigate}
            onOpenAiChat={handleOpenAiChat}
          />
        )}
      </main>

      {/* Floating Gemini AI Assistant Widget */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => handleOpenAiChat()}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full shadow-2xl shadow-cyan-500/30 border border-cyan-400/40 hover:scale-105 transition duration-200"
          title="Open CrownDesk Gemini Dental CAD Assistant"
        >
          {/* Animated pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-cyan-400/30 animate-ping pointer-events-none opacity-40" />

          <div className="w-6 h-6 rounded-full bg-slate-950/40 flex items-center justify-center text-cyan-200">
            <Bot className="w-4 h-4 group-hover:rotate-12 transition" />
          </div>

          <div className="flex flex-col text-left leading-none">
            <span className="text-xs font-black tracking-wide flex items-center gap-1">
              Gemini CAD AI <Sparkles className="w-3 h-3 text-cyan-300" />
            </span>
            <span className="text-[10px] text-cyan-200/80 font-medium">
              Search Grounding Active
            </span>
          </div>
        </button>
      </div>

      {/* Global Gemini Dental Chatbot Modal */}
      <GeminiDentalChatModal
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        initialCaseContext={activeCaseContext}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Security Force Password Change Dialog */}
      <ForcePasswordChangeModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
