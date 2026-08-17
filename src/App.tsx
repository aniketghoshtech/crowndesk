import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal';

import { LandingPage } from './pages/LandingPage';
import { PublicCaseTrackerPage } from './pages/PublicCaseTrackerPage';
import { PricingPage } from './pages/PricingPage';
import { AuthPage } from './pages/AuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { NewCaseSubmissionPage } from './pages/customer/NewCaseSubmissionPage';
import { DesignerDashboard } from './pages/designer/DesignerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainApp: React.FC = () => {
  const { user, isAdmin, isDesigner, isDoctor } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<any>(null);

  // Auto-route based on role when entering dashboard
  const handleNavigate = (view: string, data?: any) => {
    setViewParams(data || null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased">
      {/* Navigation Header */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'tracker' && (
          <PublicCaseTrackerPage
            initialSearchId={viewParams?.searchId}
            onNavigate={handleNavigate}
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
          />
        )}
        {currentView === 'designer-dashboard' && (
          <DesignerDashboard
            initialCaseId={viewParams?.selectedCaseId}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            initialCaseId={viewParams?.selectedCaseId}
            initialTab={viewParams?.targetTab}
            onNavigate={handleNavigate}
          />
        )}
      </main>

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
