import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import GeminiKeyModal from './GeminiKeyModal';
import { hasGeminiApiKey } from '../services/geminiService';
import { calculateNutritionMetrics } from '../utils/nutritionCalculator';

export default function ProfileSettingsModal({ isOpen, onClose }) {
  const {
    data,
    updateProfile,
    addWeightLog,
    today,
    authUser,
    handleGoogleSignIn,
    handleSignOut,
    clearAllData,
    syncStatus,
    lastSyncedAt,
    triggerManualSync,
    isSyncing,
    showNotification,
    exportData,
    importData
  } = useApp();

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profil'); // 'profil' | 'akun'
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form profile state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(1400);
  const [isNursing, setIsNursing] = useState(false);

  // Lock body scroll saat modal aktif untuk mencegah scroll chaining / error scroll background
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && data.profile) {
      setName(data.profile.name || authUser?.user_metadata?.full_name || '');
      setAge(data.profile.age ? String(data.profile.age) : '');
      setHeight(data.profile.height ? String(data.profile.height) : '');
      setStartWeight(data.profile.startWeight ? String(data.profile.startWeight) : '');
      setCurrentWeight(data.profile.currentWeight ? String(data.profile.currentWeight) : '');
      setTargetWeight(data.profile.targetWeight ? String(data.profile.targetWeight) : '');
      setWaist(data.profile.waistCircumference ? String(data.profile.waistCircumference) : '');
      setDailyCalorieTarget(data.profile.dailyCalorieTarget || 1400);
      setIsNursing(Boolean(data.profile.isNursing));
      setIsSavedToast(false);
    }
  }, [isOpen, data.profile, authUser]);

  // Kalkulasi Kalori Ilmiah & Terpercaya (Mifflin-St Jeor)
  const metrics = useMemo(() => {
    return calculateNutritionMetrics({
      age,
      height,
      currentWeight,
      startWeight,
      targetWeight,
      waistCircumference: waist,
      isNursing
    });
  }, [age, height, currentWeight, startWeight, targetWeight, waist, isNursing]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleApplyRecommendedCalories = () => {
    if (metrics.isValid) {
      setDailyCalorieTarget(metrics.recommendedCalories);
      showNotification(
        'Target Diterapkan 🎯',
        `Target kalori harian disetel ke ${metrics.recommendedCalories} kkal sesuai formula medis Mifflin-St Jeor.`
      );
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const startWNum = Number(startWeight) || null;
    const currentWNum = Number(currentWeight) || null;
    const targetWNum = Number(targetWeight) || null;
    const waistNum = Number(waist) || null;

    const updatedFields = {
      name: name.trim(),
      nameCustom: Boolean(name.trim()),
      age: Number(age) || null,
      height: Number(height) || null,
      startWeight: startWNum || currentWNum || null,
      currentWeight: currentWNum || null,
      targetWeight: targetWNum,
      waistCircumference: waistNum,
      dailyCalorieTarget: Number(dailyCalorieTarget) || metrics.recommendedCalories || 1400,
      bmr: metrics.bmr || null,
      tdee: metrics.tdee || null,
      isNursing
    };

    if (currentWNum > 0 && currentWNum !== Number(data.profile.currentWeight)) {
      if (!updatedFields.startWeight && !data.profile.startWeight) {
        updatedFields.startWeight = currentWNum;
      }
      addWeightLog(currentWNum, waistNum, today);
    }

    try {
      await updateProfile(updatedFields);
      setIsSavedToast(true);
      showNotification('Profil Disimpan 🌸', 'Data profil dan target kalori Bunda berhasil disinkronkan.');
      setTimeout(() => {
        setIsSavedToast(false);
        onClose();
      }, 500);
    } catch (err) {
      console.warn('Gagal menyimpan profil:', err);
      showNotification('Profil Disimpan Lokal 💾', 'Data tersimpan di perangkat Bunda.');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (importData(json)) {
        showNotification('Data Dipulihkan ✅', 'Cadangan data berhasil dimuat ke aplikasi.');
      }
    } catch {
      alert('File backup JSON tidak valid.');
    }
  };

  const keyConfigured = hasGeminiApiKey();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in select-none"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-outline-variant/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Sticky Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-outline-variant/20 flex-shrink-0 bg-surface-container-lowest z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={data.profile.avatar || authUser?.user_metadata?.avatar_url || '/avatar.png'}
                alt="Avatar"
                className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-secondary ring-2 ring-surface" />
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-sm text-base font-bold text-on-surface truncate">
                {name || data.profile.name || 'Profil & Target Kalori'}
              </h3>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                {authUser ? authUser.email : 'Mode Offline (Tamu)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all flex-shrink-0"
            aria-label="Tutup modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 2. Tab Navigation Switcher */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0 bg-surface-container-lowest z-10">
          <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('profil')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'profil'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Data Diri & Target</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('akun')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'akun'
                  ? 'bg-surface-container-highest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              <span>Kunci AI & Cloud</span>
            </button>
          </div>
        </div>

        {/* 3. Smooth Scrollable Content Container (overscroll-contain) */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 overscroll-contain touch-pan-y">
          {activeTab === 'profil' ? (
            <form id="profileForm" onSubmit={handleSaveProfile} className="space-y-4">
              {/* Bagian 1: Identitas Dasar */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                    Nama Panggilan / Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama Bunda..."
                    className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                      Usia (Tahun)
                    </label>
                    <input
                      type="number"
                      min="12"
                      max="90"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Contoh: 28"
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                      Tinggi Badan (cm)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="220"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Contoh: 160"
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Perjalanan Berat Badan */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
                  <span>Perjalanan Berat Badan (kg)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant font-medium">
                      BB Awal
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="200"
                      value={startWeight}
                      onChange={(e) => setStartWeight(e.target.value)}
                      placeholder="65"
                      className="w-full bg-surface-container-lowest rounded-xl px-2.5 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 font-semibold text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant font-medium">
                      BB Sekarang
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="200"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      placeholder="60"
                      className="w-full bg-surface-container-lowest rounded-xl px-2.5 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 font-bold text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-primary font-bold">
                      Target BB
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="200"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="54"
                      className="w-full bg-surface-container-lowest rounded-xl px-2.5 py-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 border border-primary/30 font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Lingkar Pinggang & Status Menyusui */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                    Lingkar Pinggang (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="Contoh: 76"
                    className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 mt-5">
                  <div className="min-w-0 pr-1">
                    <span className="font-label-sm text-xs font-bold text-on-surface block truncate">
                      Menyusui?
                    </span>
                    <span className="font-body-sm text-[10px] text-on-surface-variant block truncate">
                      +350 kkal laktasi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNursing(!isNursing)}
                    className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                      isNursing ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                        isNursing ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bagian 4: KARTU KALKULATOR KALORI MEDIS (Mifflin-St Jeor) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/80 via-pink-50/50 to-orange-50/30 border border-rose-200/60 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <span className="material-symbols-outlined text-[18px]">calculate</span>
                    <span>Kalkulator Kalori Medis</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    Mifflin-St Jeor
                  </span>
                </div>

                {metrics.isValid ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/30">
                        BMI: {metrics.bmi} ({metrics.bmiCategory})
                      </span>
                      {metrics.waistStatus && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/30">
                          Pinggang: {metrics.waistStatus}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-surface-container-lowest/90 border border-rose-100">
                      <div>
                        <span className="text-[10px] text-on-surface-variant block">BMR Basal</span>
                        <strong className="text-xs text-on-surface">{metrics.bmr} kkal</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block">TDEE Aktif</span>
                        <strong className="text-xs text-on-surface">{metrics.tdee} kkal</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-primary block font-bold">Rekomendasi</span>
                        <strong className="text-xs text-primary font-black">{metrics.recommendedCalories} kkal</strong>
                      </div>
                    </div>

                    <p className="text-[10px] text-on-surface-variant leading-tight italic">
                      {metrics.description}
                    </p>

                    {Number(dailyCalorieTarget) !== metrics.recommendedCalories && (
                      <button
                        type="button"
                        onClick={handleApplyRecommendedCalories}
                        className="w-full py-2 px-3 rounded-xl bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                        <span>Terapkan Target Rekomendasi ({metrics.recommendedCalories} kkal)</span>
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    Lengkapi usia, tinggi badan, dan berat badan di atas untuk kalkulasi otomatis target kalori ilmiah.
                  </p>
                )}
              </div>

              {/* Bagian 5: Target Kalori Harian Aktif */}
              <div className="flex flex-col gap-1 pb-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                    Target Kalori Harian Anda (kkal/hari)
                  </label>
                  <span className="text-xs text-primary font-bold">
                    {dailyCalorieTarget} kkal
                  </span>
                </div>
                <input
                  type="number"
                  step="25"
                  min="1000"
                  max="3500"
                  value={dailyCalorieTarget}
                  onChange={(e) => setDailyCalorieTarget(e.target.value)}
                  placeholder="1400"
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 font-bold"
                />
                <span className="text-[10px] text-on-surface-variant">
                  Dapat disesuaikan manual atau mengikuti hasil hitung kalkulator medis di atas.
                </span>
              </div>

              {/* Status Sesi & Tombol Logout */}
              <div className="pt-3 pb-1 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-on-surface">Sesi Aktif</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant truncate">
                    {authUser ? `Cloud: ${authUser.email}` : 'Sesi Lokal (Data tersimpan di HP)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await handleSignOut(true);
                    if (ok) onClose();
                  }}
                  className="py-1.5 px-3 rounded-xl border border-error/40 text-error hover:bg-error hover:text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
                  <span>Keluar</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: Kunci AI & Cloud Settings */
            <div className="space-y-3.5 pb-2">
              {/* Konfigurasi Gemini API Key */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                    <span className="font-label-sm text-xs font-bold text-on-surface">
                      Kunci Google Gemini AI
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      keyConfigured ? 'bg-secondary/15 text-secondary' : 'bg-outline-variant/30 text-outline'
                    }`}
                  >
                    {keyConfigured ? 'Aktif' : 'Belum Ada'}
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                  Digunakan untuk menghitung kalori makanan via AI teks dan foto tanpa batas.
                </p>
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">key</span>
                  <span>{keyConfigured ? 'Kelola Kunci Gemini' : 'Pasang Kunci Gemini Gratis'}</span>
                </button>
              </div>

              {/* Akun Supabase Cloud */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">cloud_sync</span>
                    <span className="font-label-sm text-xs font-bold text-on-surface">
                      Sinkronisasi Cloud
                    </span>
                  </div>
                  <span className="text-[10px] text-tertiary font-bold">
                    {syncStatus === 'syncing' ? 'Menyinkronkan...' : lastSyncedAt ? `Tersinkron: ${lastSyncedAt}` : 'Lokal'}
                  </span>
                </div>

                {authUser ? (
                  <div className="space-y-2 pt-1 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Akun:</span>
                      <strong className="text-on-surface truncate max-w-[200px]">{authUser.email}</strong>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={triggerManualSync}
                        disabled={isSyncing}
                        className="flex-1 py-2 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <span className={`material-symbols-outlined text-[15px] ${isSyncing ? 'animate-spin' : ''}`}>
                          sync
                        </span>
                        <span>Sinkronkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSignOut();
                          onClose();
                        }}
                        className="py-2 px-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold hover:bg-error-container/80 active:scale-95 transition-all"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                      Hubungkan akun Google agar data tersimpan aman di cloud multi-perangkat.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Masuk dengan Google</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Cadangan & Pemulihan Data JSON */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">backup</span>
                  <span className="font-label-sm text-xs font-bold text-on-surface">
                    Cadangan & Pemulihan JSON
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                  Unduh data kesehatan Anda atau pulihkan saat berganti HP.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={exportData}
                    className="py-2 px-3 rounded-xl bg-surface-container text-on-surface font-label-sm text-xs font-bold flex items-center justify-center gap-1 hover:bg-surface-container-high active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Export Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-label-sm text-xs font-bold flex items-center justify-center gap-1 hover:bg-primary-fixed-dim active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    <span>Import Data</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Hapus Semua Data */}
              <div className="p-3.5 rounded-2xl bg-error-container/20 border border-error/30 space-y-2 mt-1">
                <div className="flex items-center gap-1.5 text-error font-bold text-xs">
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                  <span>Kosongkan Seluruh Data</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-snug">
                  Bersihkan semua data lokal dan cloud tanpa mengembalikan data dummy.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Hapus seluruh data catatan dan mulai dari awal? Semua riwayat akan dibersihkan.')) {
                      await clearAllData(true);
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-error text-error hover:bg-error hover:text-on-error font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span>Hapus Semua Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Sticky Bottom Action Footer (Hanya di Tab Profil) */}
        {activeTab === 'profil' && (
          <div className="px-5 py-3 border-t border-outline-variant/20 flex-shrink-0 bg-surface-container-lowest z-10">
            <button
              type="submit"
              form="profileForm"
              disabled={isSaving}
              className="w-full py-3 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-on-primary font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : isSavedToast ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Simpan Profil & Target</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal Kunci Gemini */}
      <GeminiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </div>
  );
}
