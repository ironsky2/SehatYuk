import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { data, isOnline, isSyncing, activeTab, setActiveTab, requestNotificationPermission, showNotification } = useApp();
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  const getScreenTitle = () => {
    switch (activeTab) {
      case 'beranda':
        return 'Beranda';
      case 'makan':
        return 'Makan';
      case 'if-dan-puasa':
        return 'IF & Puasa';
      case 'siklus':
        return 'Siklus';
      case 'progress':
        return 'Progress';
      default:
        return 'Beranda';
    }
  };

  const handleNotifClick = () => {
    requestNotificationPermission();
    setNotifModalOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.05)] pt-safe">
        <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-md mx-auto w-full">
          {/* Left: Logo & Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              alt="Logo Sehat Yuk"
              className="h-8 w-auto object-contain flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              src="/logo.png"
              onClick={() => setActiveTab('beranda')}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight truncate cursor-pointer hover:opacity-90"
                  onClick={() => setActiveTab('beranda')}
                >
                  Sehat Yuk!
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isOnline ? 'bg-tertiary-container animate-pulse' : 'bg-error'
                  }`}
                />
                <span
                  className={`font-label-sm text-[11px] font-semibold ${
                    isOnline ? 'text-tertiary' : 'text-error'
                  }`}
                >
                  {isSyncing ? 'Menyinkronkan...' : isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="text-outline/40 text-[10px]">•</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium truncate">
                  {getScreenTitle()}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleNotifClick}
              aria-label="Pusat Notifikasi"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-90 transition-all relative"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              aria-label="Profil Bunda"
              className="p-0.5 rounded-full bg-primary-fixed hover:ring-2 hover:ring-primary active:scale-90 transition-all ml-0.5"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shadow-sm"
                src={data.profile.avatar || '/avatar.png'}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Pusat Notifikasi Drawer / Modal */}
      {notifModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setNotifModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                </div>
                <div>
                  <h3 className="font-headline-sm font-bold text-on-surface text-base">
                    Pusat Pengingat Bunda 🌸
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">Sesuai ritme puasa & eating window</p>
                </div>
              </div>
              <button
                onClick={() => setNotifModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">wb_twilight</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-on-surface">Sahur Puasa Sunnah</strong>
                    <span className="text-[10px] text-outline font-medium">03:45 WIB</span>
                  </div>
                  <p className="text-on-surface-variant mt-0.5">"Sahur! Bangun sekarang ya Bunda 🌙 Minum 2 gelas air hangat."</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">schedule</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-on-surface">Jendela Makan (IF) Buka</strong>
                    <span className="text-[10px] text-outline font-medium">11:00 WIB</span>
                  </div>
                  <p className="text-on-surface-variant mt-0.5">"Eating window dimulai! Boleh makan bergizi sekarang 🍽️"</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5">
                <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">dinner_dining</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-on-surface">Waktu Maghrib (Buka Puasa)</strong>
                    <span className="text-[10px] text-outline font-medium">17:52 WIB</span>
                  </div>
                  <p className="text-on-surface-variant mt-0.5">"Alhamdulillah, waktunya berbuka! Awali dengan 3 butir kurma & air putih 🌸"</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5">
                <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">timer_off</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-on-surface">Jendela Makan Tutup</strong>
                    <span className="text-[10px] text-outline font-medium">19:00 WIB</span>
                  </div>
                  <p className="text-on-surface-variant mt-0.5">"Eating window tutup. Istirahatkan pencernaan sampai esok hari 💪"</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                requestNotificationPermission();
                showNotification('Tes Notifikasi & Bunyi Bel 🔔', 'Pengingat luar aplikasi Sehat Yuk! bersuara dan muncul di notifikasi HP Bunda.');
                setNotifModalOpen(false);
              }}
              className="mt-1 w-full py-2.5 bg-primary text-on-primary rounded-full font-label-md font-semibold active:scale-98 transition-transform flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
              <span>Uji Bunyi & Notifikasi Luar Aplikasi</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
