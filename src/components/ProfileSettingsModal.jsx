import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import GeminiKeyModal from './GeminiKeyModal';
import { hasGeminiApiKey } from '../services/geminiService';

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
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState('profil'); // 'profil' | 'akun'
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Form profile state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(1500);
  const [isNursing, setIsNursing] = useState(false);

  useEffect(() => {
    if (isOpen && data.profile) {
      setName(data.profile.name || authUser?.user_metadata?.full_name || '');
      setAge(data.profile.age ? String(data.profile.age) : '');
      setHeight(data.profile.height ? String(data.profile.height) : '');
      setCurrentWeight(data.profile.currentWeight ? String(data.profile.currentWeight) : '');
      setTargetWeight(data.profile.targetWeight ? String(data.profile.targetWeight) : '');
      setWaist(data.profile.waistCircumference ? String(data.profile.waistCircumference) : '');
      setDailyCalorieTarget(data.profile.dailyCalorieTarget || 1500);
      setIsNursing(Boolean(data.profile.isNursing));
      setIsSavedToast(false);
    }
  }, [isOpen, data.profile, authUser]);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedFields = {
      name: name.trim(),
      nameCustom: Boolean(name.trim()),
      age: Number(age) || null,
      height: Number(height) || null,
      targetWeight: Number(targetWeight) || null,
      waistCircumference: Number(waist) || null,
      dailyCalorieTarget: Number(dailyCalorieTarget) || 1500,
      isNursing
    };

    const newWeightNum = Number(currentWeight);
    if (newWeightNum > 0 && newWeightNum !== Number(data.profile.currentWeight)) {
      updatedFields.currentWeight = newWeightNum;
      if (!data.profile.startWeight) {
        updatedFields.startWeight = newWeightNum;
      }
      addWeightLog(newWeightNum, Number(waist) || null, today);
    }

    updateProfile(updatedFields);
    setIsSavedToast(true);
    showNotification('Profil Disimpan 🌸', 'Data profil dan target kalori Bunda berhasil diperbarui.');
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 900);
  };

  const keyConfigured = hasGeminiApiKey();

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto border border-outline-variant/30 pb-8 sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={data.profile.avatar || authUser?.user_metadata?.avatar_url || '/avatar.png'}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-surface" />
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                {name || data.profile.name || 'Profil & Pengaturan'}
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {authUser ? authUser.email : 'Mode Offline / Tamu'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher: Profil vs Akun & Data */}
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

        {/* Tab 1: Form Profil Diri */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
            {/* Nama */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                Nama Panggilan / Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
              />
            </div>

            {/* Usia & Tinggi Badan */}
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
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
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
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
                />
              </div>
            </div>

            {/* Berat Badan Sekarang & Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                  BB Sekarang (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="Contoh: 60"
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                  Target BB (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="Contoh: 54"
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 font-bold text-primary"
                />
              </div>
            </div>

            {/* Lingkar Pinggang & Target Kalori */}
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                  Target Kalori (kkal)
                </label>
                <input
                  type="number"
                  step="50"
                  value={dailyCalorieTarget}
                  onChange={(e) => setDailyCalorieTarget(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 font-bold"
                />
              </div>
            </div>

            {/* Status Menyusui Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">child_care</span>
                <div>
                  <span className="font-label-sm text-xs font-bold text-on-surface block">
                    Sedang Menyusui?
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Menyesuaikan kebutuhan hidrasi harian
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNursing(!isNursing)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  isNursing ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    isNursing ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Tombol Simpan Profil */}
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-1"
            >
              {isSavedToast ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Kunci AI, Cloud & Hapus Data */}
        {activeTab === 'akun' && (
          <div className="flex flex-col gap-3.5">
            {/* Kunci Google Gemini AI */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                  <span className="font-label-sm text-xs font-bold text-on-surface">
                    Google Gemini AI Key
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    keyConfigured
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  {keyConfigured ? 'Aktif' : 'Belum Terpasang'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                Digunakan untuk menghitung kalori makanan secara akurat via teks maupun foto kamera.
              </p>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-0.5"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">key</span>
                <span>{keyConfigured ? 'Ubah / Uji Kunci Gemini' : 'Pasang Kunci Gemini Gratis'}</span>
              </button>
            </div>

            {/* Akun Supabase Cloud */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2.5">
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
                <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Akun Terhubung:</span>
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
                      onClick={handleSignOut}
                      className="py-2 px-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold hover:bg-error-container/80 active:scale-95 transition-all"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pt-1">
                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                    Hubungkan akun Google agar catatan kalori dan berat badan tersimpan aman di cloud multi-perangkat.
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

            {/* Hapus Semua Data (Clean Reset) */}
            <div className="p-3.5 rounded-2xl bg-error-container/20 border border-error/30 flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-error font-bold text-xs">
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                <span>Kosongkan Seluruh Data</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Menghapus semua riwayat makanan, berat badan, serta membersihkan data tanpa mengembalikan profil dummy.
              </p>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl border border-error text-error hover:bg-error hover:text-on-error font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span>Hapus Semua Data Sekarang</span>
              </button>
            </div>
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
