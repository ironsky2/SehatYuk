import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { getMieEligibility } from '../utils/mieUtils';
import { localDateStr } from '../utils/dateUtils';

const MIE_VARIANTS = [
  {
    id: 'indomie_goreng',
    name: 'Indomie Goreng Original',
    brand: 'Indomie',
    calories: 380,
    sodiumMg: 1070,
    icon: '🍜',
    desc: 'Varian favorit klasik Indonesia'
  },
  {
    id: 'mie_kuah',
    name: 'Mie Kuah Soto / Kari Ayam',
    brand: 'Indomie / Sedaap',
    calories: 350,
    sodiumMg: 1340,
    icon: '🍲',
    desc: 'Kuah hangat gurih berempah'
  },
  {
    id: 'mie_sehat',
    name: 'Mie Oven / Sehat (Lemonilo/FitMee)',
    brand: 'Sehat / Rendah Kalori',
    calories: 280,
    sodiumMg: 780,
    icon: '🥗',
    desc: 'Dipanggang bukan digoreng'
  },
  {
    id: 'mie_pedas',
    name: 'Mie Pedas Korea (Samyang/Gekikara)',
    brand: 'Pedas',
    calories: 530,
    sodiumMg: 1280,
    icon: '🌶️',
    desc: 'Tinggi kalori & saus kental'
  },
  {
    id: 'bihun_kwetiau',
    name: 'Bihun / Kwetiau Instan',
    brand: 'Bihunku / Sedap',
    calories: 310,
    sodiumMg: 850,
    icon: '🥢',
    desc: 'Tekstur lembut ramah cerna'
  }
];

const HEALTH_HACKS = [
  { id: 'telur', label: 'Ditambah Telur (Rebus/Ceplok)', extraCal: 75, extraProtein: 6, tag: '+Protein Kenyang' },
  { id: 'sayur', label: 'Ditambah Sayur Hijau (Sawi/Bayam/Wortel)', extraCal: 25, extraProtein: 1, tag: '+Serat Alami' },
  { id: 'bumbu_separuh', label: 'Bumbu Dikurangi 1/2 Porsi', sodiumCut: 0.4, tag: '-40% Natrium' },
  { id: 'kuah_dibuang', label: 'Air Rebusan Dibuang / Kuah Tidak Dihabiskan', sodiumCut: 0.3, tag: 'Anti Kembung' }
];

export default function MieTrackerModal({ isOpen, onClose }) {
  const { data, consumeMie, deleteMieLog, resetMieTracker, addWaterGlass, showNotification } = useApp();

  const [activeTab, setActiveTab] = useState('catat'); // 'catat' | 'riwayat' | 'edukasi'
  const [consumedDate, setConsumedDate] = useState(localDateStr());
  const [selectedVariant, setSelectedVariant] = useState(MIE_VARIANTS[0]);
  const [customVariantName, setCustomVariantName] = useState('');
  const [selectedHacks, setSelectedHacks] = useState(['telur', 'sayur', 'bumbu_separuh']);
  const [mealTimeCategory, setMealTimeCategory] = useState('makanSiang');
  const [logToMeals, setLogToMeals] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQuota = data.mieTracker?.quota ?? 1;
  const historyList = data.mieTracker?.history || [];
  const mieEligibility = getMieEligibility(data.mieTracker);

  const toggleHack = (hackId) => {
    setSelectedHacks((prev) =>
      prev.includes(hackId) ? prev.filter((id) => id !== hackId) : [...prev, hackId]
    );
  };

  // Kalkulasi kalori dan sodium dinamis berdasarkan varian & hacks yang dicentang
  let calculatedCalories = selectedVariant.calories;
  let calculatedSodium = selectedVariant.sodiumMg;

  if (selectedHacks.includes('telur')) calculatedCalories += 75;
  if (selectedHacks.includes('sayur')) calculatedCalories += 25;
  if (selectedHacks.includes('bumbu_separuh')) calculatedSodium = Math.round(calculatedSodium * 0.6);
  if (selectedHacks.includes('kuah_dibuang')) calculatedSodium = Math.round(calculatedSodium * 0.7);

  const handleSaveMie = (e) => {
    e.preventDefault();
    if (currentQuota <= 0) {
      alert('⛔ Jatah periode ini sudah habis Bunda. Nikmati kembali di periode berikutnya!');
      return;
    }

    const appliedHacksLabels = HEALTH_HACKS.filter((h) => selectedHacks.includes(h.id)).map(
      (h) => h.label
    );

    const varietyTitle = customVariantName.trim() || selectedVariant.name;

    const ok = consumeMie({
      date: consumedDate,
      variety: varietyTitle,
      brand: selectedVariant.brand,
      calories: calculatedCalories,
      sodiumMg: calculatedSodium,
      addons: appliedHacksLabels,
      hacks: selectedHacks,
      timeCategory: mealTimeCategory,
      logToMeals,
      notes: notes.trim()
    });

    if (ok) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 }
      });
      showNotification(
        'Makan Mie Tercatat 🍜',
        `${varietyTitle} (~${calculatedCalories} kkal) pada ${consumedDate} tersimpan. Kuota 2 mingguan telah dipotong.`
      );
      setActiveTab('riwayat');
    }
  };

  const handleAddWaterBalance = () => {
    addWaterGlass();
    addWaterGlass();
    showNotification('Hidrasi Seimbang 💧', '2 Gelas air putih (+500ml) ditambahkan untuk menetralkan natrium tubuh.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-xl shadow-xs">
              🍜
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Tracker & Edukasi Mie Instan
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Jatah 1x per 2 minggu • Sehat & Bebas Rasa Bersalah
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

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-surface-container-low p-1 gap-1 border border-outline-variant/15 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('catat')}
            className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'catat'
                ? 'bg-surface shadow-xs text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">restaurant</span>
            <span>Catat Makan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'riwayat'
                ? 'bg-surface shadow-xs text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Riwayat & Kuota</span>
            {historyList.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                {historyList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edukasi')}
            className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'edukasi'
                ? 'bg-surface shadow-xs text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
            <span>Hacks Sehat</span>
          </button>
        </div>

        {/* TAB 1: FORM CATAT MAKAN MIE */}
        {activeTab === 'catat' && (
          <div className="flex flex-col gap-3.5">
            {/* Status & Jadwal Kapan Boleh Makan Mie Lagi Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                mieEligibility.canEatNow
                  ? 'bg-tertiary-fixed/30 border-tertiary/20'
                  : 'bg-secondary-fixed/40 border-secondary/30'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 shadow-xs ${
                  mieEligibility.canEatNow
                    ? 'bg-tertiary text-on-tertiary'
                    : 'bg-secondary text-on-secondary'
                }`}
              >
                {mieEligibility.canEatNow ? '✓' : `${mieEligibility.daysRemaining}h`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                    Jadwal Konsumsi Mie
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      mieEligibility.canEatNow
                        ? 'bg-tertiary/15 text-tertiary'
                        : 'bg-secondary/15 text-secondary'
                    }`}
                  >
                    {mieEligibility.badgeText}
                  </span>
                </div>
                <strong className="text-xs sm:text-sm font-extrabold text-on-surface block mt-0.5 leading-snug">
                  {mieEligibility.headline}
                </strong>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                  {mieEligibility.subline}
                </p>

                {/* Progress bar jeda 14 hari */}
                {!mieEligibility.canEatNow && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-500"
                        style={{ width: `${mieEligibility.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                      <span>Hari ke-{mieEligibility.daysPassed} jeda sehat</span>
                      <span>Target 14 hari</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {currentQuota > 0 ? (
              <form onSubmit={handleSaveMie} className="flex flex-col gap-3.5">
                {/* 1. Pilih Varian */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface flex items-center justify-between">
                    <span>1. Pilih Varian Mie Instan</span>
                    <span className="text-[11px] text-on-surface-variant font-normal">Pilih yang paling cocok</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MIE_VARIANTS.map((v) => {
                      const isSelected = selectedVariant.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary ring-1 ring-primary'
                              : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
                          }`}
                        >
                          <span className="text-xl flex-shrink-0 mt-0.5">{v.icon}</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-on-surface block truncate">
                              {v.name}
                            </span>
                            <span className="text-[10px] text-on-surface-variant block">
                              ~{v.calories} kkal • {v.sodiumMg} mg natrium
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Custom jika ingin nama spesifik */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-on-surface-variant">
                    Atau Ketik Nama Menu Spesifik (Opsional):
                  </label>
                  <input
                    type="text"
                    value={customVariantName}
                    onChange={(e) => setCustomVariantName(e.target.value)}
                    placeholder="Contoh: Indomie Mie Aceh Spesial Telur Kornet..."
                    className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* 2. Hacks Sehat Checklist */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-xs font-semibold text-on-surface flex items-center justify-between">
                    <span>2. Modifikasi Sehat Bunda (Centang yang dilakukan)</span>
                    <span className="text-[11px] text-primary font-bold">✨ Bikin Diet Tetap Aman</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HEALTH_HACKS.map((hack) => {
                      const isChecked = selectedHacks.includes(hack.id);
                      return (
                        <label
                          key={hack.id}
                          onClick={() => toggleHack(hack.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-secondary-fixed/40 border-secondary ring-1 ring-secondary/50 text-on-secondary-fixed'
                              : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by label onClick
                              className="rounded text-primary focus:ring-0"
                            />
                            <span className="text-xs font-semibold text-on-surface">
                              {hack.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface text-secondary border border-secondary/20">
                            {hack.tag}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Estimasi Nutrisi Live Preview */}
                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-on-surface-variant block">
                      Estimasi Porsi Ini:
                    </span>
                    <span className="text-xs font-extrabold text-on-surface">
                      {customVariantName.trim() || selectedVariant.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Kalori</span>
                      <span className="font-headline-sm text-base font-black text-primary">
                        {calculatedCalories} <span className="text-[10px] font-normal">kkal</span>
                      </span>
                    </div>
                    <div className="text-right border-l border-outline-variant/30 pl-3">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Natrium</span>
                      <span className="font-headline-sm text-base font-black text-secondary">
                        {calculatedSodium} <span className="text-[10px] font-normal">mg</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Pengaturan Tanggal & Waktu */}
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-medium text-on-surface-variant block mb-1">
                        📅 Tanggal Santap Mie:
                      </label>
                      <input
                        type="date"
                        value={consumedDate}
                        max={localDateStr()}
                        onChange={(e) => setConsumedDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-on-surface-variant block mb-1">
                        ⏰ Waktu Santap:
                      </label>
                      <select
                        value={mealTimeCategory}
                        onChange={(e) => setMealTimeCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="sarapan">Sarapan Pagi</option>
                        <option value="makanSiang">Makan Siang</option>
                        <option value="makanMalam">Makan Malam</option>
                        <option value="camilan">Camilan / Takjil</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface font-medium select-none">
                      <input
                        type="checkbox"
                        checked={logToMeals}
                        onChange={(e) => setLogToMeals(e.target.checked)}
                        className="rounded text-primary focus:ring-0"
                      />
                      <span className="text-[11px] leading-tight text-on-surface-variant">
                        Catat otomatis ke riwayat menu makan (Tab Makan) pada tanggal yang dipilih
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">ramen_dining</span>
                  <span>Simpan Catatan Makan Mie 🍜</span>
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2.5 text-center items-center">
                <span className="text-3xl">🧘‍♀️</span>
                <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                  Hebat! Bunda Berhasil Mengontrol Pola Makan
                </h4>
                <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                  Menjaga jarak 2 minggu antar porsi mie instan membantu tubuh Bunda bebas dari kembung, menjaga retensi air tetap rendah, dan mempercepat penurunan lingkar pinggang.
                </p>
                <div className="flex gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={handleAddWaterBalance}
                    className="flex-1 py-2 px-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">water_drop</span>
                    <span>+2 Gelas Air Penyeimbang</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetMieTracker}
                    className="py-2 px-3 rounded-xl border border-outline-variant/30 text-primary text-xs font-bold active:scale-95"
                  >
                    Reset Siklus
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RIWAYAT & SIKLUS */}
        {activeTab === 'riwayat' && (
          <div className="flex flex-col gap-3">
            {/* Status Periode Siklus 2 Mingguan */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">date_range</span>
                  <span className="font-bold text-xs text-on-surface">
                    Siklus 2 Mingguan Berjalan
                  </span>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant">
                  {data.mieTracker?.period || 'Periode Aktif'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-xs">
                <span className="text-on-surface-variant">Status Kuota:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    currentQuota > 0
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  {currentQuota > 0 ? '1 Jatah Tersedia' : 'Jatah Sudah Digunakan ⛔'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Terakhir Dinikmati:</span>
                <span className="font-bold text-on-surface">
                  {data.mieTracker?.lastEaten || 'Belum ada catatan'}
                </span>
              </div>

              <button
                type="button"
                onClick={resetMieTracker}
                className="mt-1 w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                <span>Mulai Siklus 2 Minggu Baru (Reset Kuota)</span>
              </button>
            </div>

            {/* Riwayat Konsumsi List */}
            <div className="flex flex-col gap-2">
              <h4 className="font-label-sm text-xs font-bold text-on-surface flex items-center justify-between px-1">
                <span>Daftar Riwayat Konsumsi Mie ({historyList.length})</span>
                <span className="text-[11px] text-on-surface-variant font-normal">Tersimpan lokal & aman</span>
              </h4>

              {historyList.length === 0 ? (
                <div className="p-5 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-center flex flex-col items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="text-2xl">🥣</span>
                  <span className="font-bold text-on-surface">Belum Ada Riwayat Konsumsi Mie</span>
                  <p className="text-[11px] max-w-xs leading-snug">
                    Ketika Bunda makan mie, catat di tab "Catat Makan" untuk merekam kalori dan modifikasi sehat yang diterapkan.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="font-bold text-on-surface block text-xs">
                            {item.variety}
                          </strong>
                          <span className="text-[11px] text-on-surface-variant">
                            {item.displayDate} {item.displayTime ? `• ${item.displayTime}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary text-xs">
                            {item.calories} kkal
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteMieLog(item.id)}
                            title="Hapus riwayat ini"
                            className="text-on-surface-variant/50 hover:text-error active:scale-90"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Hacks yang diterapkan */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.addons.map((addon, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary-fixed/40 text-on-secondary-fixed"
                            >
                              ✓ {addon}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HACKS & EDUKASI SODIUM */}
        {activeTab === 'edukasi' && (
          <div className="flex flex-col gap-3 text-xs">
            {/* Mengapa 2 Minggu Sekali? */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Mengapa Aturan 1 Porsi per 2 Minggu?</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed text-[11px]">
                Sebungkus mie instan rata-rata mengandung <strong>1.000 - 1.400 mg natrium</strong> (hampir 70% batas harian WHO yaitu 2.000 mg). Natrium tinggi mengikat air di tubuh sehingga timbangan bisa naik 1-2 kg semu (water retention). Jatah 2 mingguan memberi ruang relaksasi mental tanpa merusak ritme metabolisme Bunda 🌸
              </p>
            </div>

            {/* 4 Hacks Cerdas */}
            <div className="flex flex-col gap-2">
              <strong className="font-bold text-on-surface text-xs px-1">
                4 Trik Cerdas Menikmati Mie Instan Sehat:
              </strong>

              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
                  <span className="text-lg">🥬</span>
                  <div>
                    <strong className="text-on-surface font-bold block mb-0.5">
                      1. Dobel Porsi Sayuran Hijau
                    </strong>
                    <p className="text-on-surface-variant text-[11px] leading-snug">
                      Masukkan sawi, bayam, atau wortel minimal 1 mangkok. Serat memperlambat penyerapan karbohidrat sederhana sehingga gula darah tidak melonjak.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
                  <span className="text-lg">🍳</span>
                  <div>
                    <strong className="text-on-surface font-bold block mb-0.5">
                      2. Wajib Ada Protein Utama (Telur / Ayam)
                    </strong>
                    <p className="text-on-surface-variant text-[11px] leading-snug">
                      Protein memicu hormon kenyang (GLP-1 & PYY), membuat rasa puas bertahan hingga 4-5 jam ke depan dan mencegah craving makanan manis.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
                  <span className="text-lg">🧂</span>
                  <div>
                    <strong className="text-on-surface font-bold block mb-0.5">
                      3. Pakai 1/2 Sachet Bumbu & Buang Air Rebusan
                    </strong>
                    <p className="text-on-surface-variant text-[11px] leading-snug">
                      70% sodium terkonsentrasi di bumbu asin & kuah. Kurangi bumbu separuh dan jangan minum kuahnya sampai habis.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-2.5">
                  <span className="text-lg">💧</span>
                  <div>
                    <strong className="text-on-surface font-bold block mb-0.5">
                      4. Siram dengan 2 Gelas Air Putih Ekstra (+500ml)
                    </strong>
                    <p className="text-on-surface-variant text-[11px] leading-snug">
                      Minum air putih hangat setelah makan membantu ginjal membuang kelebihan garam melalui urin lebih cepat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button Water */}
            <button
              type="button"
              onClick={handleAddWaterBalance}
              className="w-full py-2.5 px-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">water_drop</span>
              <span>+ Tambah 2 Gelas Air Putih Penyeimbang Sekarang</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-outline-variant/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs active:scale-95 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
