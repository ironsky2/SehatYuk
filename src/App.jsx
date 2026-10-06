import React, { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import QuickMealModal from './components/QuickMealModal';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import LogMakanScreen from './screens/LogMakanScreen';
import FastingScreen from './screens/FastingScreen';
import CycleScreen from './screens/CycleScreen';
import ProgressScreen from './screens/ProgressScreen';
import OnboardingAuthScreen from './screens/OnboardingAuthScreen';

export default function App() {
  const { activeTab, hasCompletedOnboarding, completeOnboarding, authUser } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // PWA Install prompt listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Show intro slides & authentication screen on first visit
  // (harus setelah semua hook agar urutan hook konsisten di setiap render)
  if (!hasCompletedOnboarding && !authUser) {
    return <OnboardingAuthScreen onComplete={completeOnboarding} />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'beranda':
        return <DashboardScreen />;
      case 'makan':
        return <LogMakanScreen />;
      case 'if-dan-puasa':
        return <FastingScreen />;
      case 'siklus':
        return <CycleScreen />;
      case 'progress':
        return <ProgressScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-high/40 flex justify-center antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Central Mobile Container Shell */}
      <div className="w-full max-w-md min-h-screen bg-surface flex flex-col relative shadow-[0_0_50px_-10px_rgba(244,63,94,0.12)] border-x border-outline-variant/20">
        {/* Top Header */}
        <Header />

        {/* Main Screen Content */}
        <main className="flex-1 flex flex-col relative w-full px-4 pt-20 pb-28">
          {/* PWA Install Banner */}
          {showInstallBanner && (
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-primary-fixed via-secondary-fixed to-surface-container-low shadow-sm flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.png" alt="App Icon" className="w-9 h-9 rounded-xl object-contain bg-surface p-1 shadow-xs flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-on-primary-fixed text-xs truncate">Pasang Aplikasi Sehat Yuk!</p>
                  <p className="text-[11px] text-on-primary-fixed-variant truncate">Akses offline cepat langsung dari HP</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all"
                >
                  Install
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="p-1 text-on-primary-fixed-variant hover:text-on-surface"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {renderActiveScreen()}
        </main>

        {/* Quick Meal Global Floating Modal */}
        <QuickMealModal />

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
