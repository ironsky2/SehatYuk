import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { signInWithEmail, signUpWithEmail } from '../services/supabase';

const SLIDES = [
  {
    id: 1,
    tag: 'Defisit Terarah & Nyaman',
    tagColor: 'bg-rose-100 text-rose-700',
    icon: 'local_fire_department',
    iconColor: 'bg-gradient-to-tr from-rose-500 to-pink-400 text-white',
    title: 'Defisit Kalori yang Terarah & Realistis',
    description:
      'Pantau kalori harian dengan sistem alert otomatis agar defisit tetap aman dan berenergi. Nikmati fitur Jatah Mie 2 mingguan agar diet tetap menyenangkan tanpa rasa bersalah.',
    chips: [
      { icon: 'notifications_active', label: 'Alert Kalori Real-Time' },
      { icon: 'ramen_dining', label: 'Jatah Mie 2 Mingguan' },
      { icon: 'water_drop', label: 'Target Hidrasi 8 Gelas' }
    ]
  },
  {
    id: 2,
    tag: 'Sinkronisasi Alami Tubuh',
    tagColor: 'bg-emerald-100 text-emerald-800',
    icon: 'spa',
    iconColor: 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white',
    title: 'Harmonisasi dengan 4 Fase Siklus Hormon',
    description:
      'Metabolisme wanita berubah di tiap fase siklus. Sehat Yuk! otomatis menyesuaikan anjuran nutrisi, porsi makan, dan latihan fisik dari fase Menstruasi hingga Luteal.',
    chips: [
      { icon: 'calendar_month', label: 'Kalender Siklus Otomatis' },
      { icon: 'restaurant', label: 'Nutrisi per Fase Hormon' },
      { icon: 'fitness_center', label: 'Panduan Olahraga Tepat' }
    ]
  },
  {
    id: 3,
    tag: '100% Offline & Presisi GPS',
    tagColor: 'bg-amber-100 text-amber-800',
    icon: 'hourglass_top',
    iconColor: 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white',
    title: 'Intermittent Fasting & Puasa Sunnah',
    description:
      'Timer eating window fleksibel (11:00 - 19:00) dan jadwal Sahur, Imsak, serta Buka Puasa Senin-Kamis yang dihitung secara astronomis akurat di perangkat Anda.',
    chips: [
      { icon: 'timer', label: 'Eating Window Countdown' },
      { icon: 'mosque', label: 'Jadwal Buka Puasa Otomatis' },
      { icon: 'volume_up', label: 'Notifikasi Bel Alami di Luar App' }
    ]
  },
  {
    id: 4,
    tag: 'Keamanan Privasi Tertinggi',
    tagColor: 'bg-indigo-100 text-indigo-800',
    icon: 'verified_user',
    iconColor: 'bg-gradient-to-tr from-indigo-500 to-blue-500 text-white',
    title: 'Data Pribadi Anda 100% Terlindungi',
    description:
      'Didukung oleh Supabase PostgreSQL dengan Row Level Security (RLS). Catatan berat badan, siklus menstruasi, dan riwayat makan Anda terenkripsi dan hanya dapat diakses oleh Anda.',
    chips: [
      { icon: 'lock', label: 'Row Level Security (RLS)' },
      { icon: 'cloud_sync', label: 'Cloud Sync Multi-Device' },
      { icon: 'phonelink_setup', label: 'Mode Tamu Offline Siap Pakai' }
    ]
  }
];

export default function OnboardingAuthScreen({ initialMode = 'intro', onCompleteIntro }) {
  const { handleGoogleSignIn, isSupabaseConfigured, showNotification, continueAsGuest, saveSession } = useApp();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuthForm, setShowAuthForm] = useState(initialMode === 'auth');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFinishIntro = () => {
    onCompleteIntro?.();
    setShowAuthForm(true);
  };

  const handleNextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinishIntro();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Harap isi email dan password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'register') {
        const { data, error } = await signUpWithEmail(email.trim(), password, {
          full_name: fullName.trim() || 'Bunda'
        });

        if (error) {
          setErrorMessage(error.message || 'Gagal mendaftar akun baru.');
        } else {
          if (data?.user) {
            saveSession?.(data.user, false);
          }
          setSuccessMessage('Pendaftaran berhasil! Akun Anda telah aktif.');
          showNotification('Selamat Datang!', 'Akun Anda telah berhasil dibuat.');
          onCompleteIntro?.();
        }
      } else {
        const { data, error } = await signInWithEmail(email.trim(), password);

        if (error) {
          setErrorMessage(error.message || 'Email atau password salah.');
        } else {
          if (data?.user) {
            saveSession?.(data.user, false);
          }
          setSuccessMessage('Login berhasil! Membuka aplikasi...');
          showNotification('Berhasil Masuk', 'Selamat datang kembali di Sehat Yuk!');
          onCompleteIntro?.();
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      onCompleteIntro?.();
      await handleGoogleSignIn();
    } catch (err) {
      setErrorMessage('Gagal menghubungkan Google: ' + err.message);
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    onCompleteIntro?.();
    continueAsGuest?.();
    showNotification('Mode Offline Aktif 🌸', 'Selamat mencoba Sehat Yuk! Data tersimpan di HP Anda.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-surface to-surface flex flex-col justify-between max-w-md mx-auto w-full p-5 relative overflow-y-auto">
      {/* Decorative Background Blob */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-28 w-60 h-60 rounded-full bg-pink-100/50 blur-2xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sehat Yuk" className="w-8 h-8 object-contain" />
          <span className="font-headline-sm font-bold text-lg text-primary tracking-tight">
            Sehat Yuk!
          </span>
        </div>

        {!showAuthForm ? (
          <button
            onClick={handleFinishIntro}
            className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors py-1.5 px-3 rounded-full bg-surface-container-high/60"
          >
            Lewati ke Masuk ➔
          </button>
        ) : (
          <button
            onClick={() => setShowAuthForm(false)}
            className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors py-1.5 px-3 rounded-full bg-surface-container-high/60 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">info</span>
            Panduan Fitur
          </button>
        )}
      </header>

      {/* Main Slide Carousel or Auth Form */}
      <main className="relative z-10 flex-1 flex flex-col justify-center my-auto py-2">
        {!showAuthForm ? (
          /* SLIDE CAROUSEL */
          <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Slide Badge & Icon */}
            <div className="flex flex-col items-center text-center gap-3">
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs ${SLIDES[currentSlide].tagColor}`}
              >
                {SLIDES[currentSlide].tag}
              </span>

              <div
                className={`w-20 h-20 rounded-3xl ${SLIDES[currentSlide].iconColor} shadow-lg shadow-rose-500/20 flex items-center justify-center transform transition-transform hover:scale-105 duration-300`}
              >
                <span className="material-symbols-outlined text-[40px]">
                  {SLIDES[currentSlide].icon}
                </span>
              </div>
            </div>

            {/* Slide Text Content */}
            <div className="text-center space-y-2 px-1">
              <h1 className="font-headline-md text-2xl font-black text-on-surface tracking-tight leading-snug">
                {SLIDES[currentSlide].title}
              </h1>
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                {SLIDES[currentSlide].description}
              </p>
            </div>

            {/* Feature Chips */}
            <div className="flex flex-col gap-2 pt-1">
              {SLIDES[currentSlide].chips.map((chip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface truncate">
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* AUTHENTICATION FORM */
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-1">
              <h2 className="font-headline-md text-2xl font-black text-on-surface tracking-tight">
                {authMode === 'login' ? 'Selamat Datang Kembali 🌸' : 'Mulai Hidup Sehat 🌸'}
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {authMode === 'login'
                  ? 'Masuk untuk menyinkronkan data kesehatan Anda'
                  : 'Buat akun Anda untuk mencadangkan data secara aman'}
              </p>
            </div>

            {/* Google One-Click Login */}
            <button
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-label-lg text-xs font-bold flex items-center justify-center gap-3 shadow-sm active:scale-98 transition-all"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-outline-variant/40" />
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                atau email
              </span>
              <div className="flex-1 h-px bg-outline-variant/40" />
            </div>

            {/* Toggle Mode Tab */}
            <div className="flex p-1 bg-surface-container rounded-xl border border-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Feedback Messages */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
              {authMode === 'register' && (
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bunda Sarah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 pr-9 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 active:scale-98 transition-all"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span>Memproses...</span>
                  </>
                ) : authMode === 'login' ? (
                  'Masuk ke Sehat Yuk'
                ) : (
                  'Daftar & Mulai'
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom Controls / Indicator Dots */}
      <footer className="relative z-10 pt-4 pb-2 flex flex-col gap-3">
        {!showAuthForm ? (
          <>
            {/* Dots Indicator */}
            <div className="flex items-center justify-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === i ? 'w-6 bg-primary' : 'w-2 bg-outline-variant/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2.5">
              {currentSlide > 0 && (
                <button
                  onClick={handlePrevSlide}
                  className="py-3 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold active:scale-95 transition-all"
                >
                  Kembali
                </button>
              )}

              {currentSlide === SLIDES.length - 1 ? (
                <button
                  onClick={handleFinishIntro}
                  className="flex-1 py-3.5 px-4 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md shadow-primary/25 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <span>Lanjut ke Autentikasi ➔</span>
                </button>
              ) : (
                <button
                  onClick={handleNextSlide}
                  className="flex-1 py-3.5 px-6 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md shadow-primary/25 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <span>Lanjut</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* Guest Mode Option */
          <div className="flex flex-col items-center gap-1 pt-1 border-t border-outline-variant/30">
            <button
              onClick={handleContinueAsGuest}
              className="text-xs font-bold text-primary hover:underline py-1.5 flex items-center gap-1"
            >
              <span>Lanjut sebagai Tamu (Mode Offline)</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
            <p className="text-[10px] text-outline text-center">
              Anda tetap dapat menggunakan seluruh fitur dan menghubungkan akun nanti di Profil.
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}
