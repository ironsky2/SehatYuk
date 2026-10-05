import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getPrayerTimesForDate } from '../utils/prayerTimes';
import { calculateCycleInfo } from '../utils/hormoneCycle';
import CalorieAlertBanner from '../components/CalorieAlertBanner';

export default function DashboardScreen() {
  const {
    data,
    totalCalories,
    calorieTarget,
    addWaterGlass,
    setActiveTab,
    setQuickMealModalOpen
  } = useApp();

  const [prayerTimes, setPrayerTimes] = useState(() =>
    getPrayerTimesForDate(new Date(), data.profile.coords.lat, data.profile.coords.lng)
  );

  const [countdownText, setCountdownText] = useState('02:18:40');
  const [waterButtonFeedback, setWaterButtonFeedback] = useState(false);

  // Recalculate prayer times if coords change
  useEffect(() => {
    setPrayerTimes(getPrayerTimesForDate(new Date(), data.profile.coords.lat, data.profile.coords.lng));
  }, [data.profile.coords]);

  // Real-time ticking countdown to Imsak or Maghrib
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const imsakDate = prayerTimes.raw.imsak;
      const maghribDate = prayerTimes.raw.maghrib;

      if (now < imsakDate) {
        let diff = imsakDate.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdownText(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} (Imsak)`
        );
        return;
      }

      let diff = maghribDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdownText('Alhamdulillah Buka!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownText(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  // Hormone cycle calculations
  const cycleInfo = calculateCycleInfo(data.profile.hpht, data.profile.cycleLength);

  // Calorie calculations
  const caloriePercent = Math.round((totalCalories / calorieTarget) * 100);
  const remainingCalories = Math.max(calorieTarget - totalCalories, 0);

  // Donut SVG circumference math (r=40 -> 2 * PI * 40 ≈ 251.2)
  const circumference = 251.2;
  const strokeOffset = circumference - (Math.min(caloriePercent, 100) / 100) * circumference;

  let calorieColor = '#00855b'; // Hijau aman
  let calorieStatusText = 'Aman';
  let calorieBadgeBg = 'bg-tertiary-fixed text-on-tertiary-fixed';
  if (caloriePercent > 100) {
    calorieColor = '#ba1a1a'; // Merah
    calorieStatusText = 'Over Limit';
    calorieBadgeBg = 'bg-error-container text-on-error-container';
  } else if (caloriePercent >= 95) {
    calorieColor = '#f97316'; // Oranye
    calorieStatusText = 'Peringatan';
    calorieBadgeBg = 'bg-orange-100 text-orange-800';
  } else if (caloriePercent >= 80) {
    calorieColor = '#a93349'; // Kuning/Rose
    calorieStatusText = 'Hampir Penuh';
    calorieBadgeBg = 'bg-secondary-fixed text-on-secondary-fixed';
  }

  const handleWaterClick = () => {
    addWaterGlass();
    setWaterButtonFeedback(true);
    setTimeout(() => {
      setWaterButtonFeedback(false);
    }, 1400);
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Calorie Alert Banner if over limit */}
      <CalorieAlertBanner />

      {/* 1. Header Greeting & Status Badges */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_florist
            </span>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
              Halo, {data.profile.name}!
            </h1>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            {todayFormatted}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.profile.isNursing ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-xs">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                child_care
              </span>
              <span className="font-label-sm text-xs font-semibold">Menyusui Ramah</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-xs">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                fitness_center
              </span>
              <span className="font-label-sm text-xs font-semibold">Defisit Kalori Terarah</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-xs">
            <span className="material-symbols-outlined text-[15px]">trending_down</span>
            <span className="font-label-sm text-xs font-semibold">Target Defisit Aktif</span>
          </div>
        </div>
      </div>

      {/* 2. Banner Notifikasi Puasa Sunnah (Senin / Kamis) */}
      {data.isPuasaSunnahActive && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-fixed via-secondary-fixed to-surface-container-low p-4 shadow-sm border border-outline-variant/30">
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-surface/90 flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                nights_stay
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-label-lg text-label-lg text-on-primary-fixed font-bold">
                  Puasa Sunnah Hari Ini
                </p>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface font-label-sm text-xs text-tertiary font-bold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  Aktif
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-primary-fixed-variant mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                Maghrib <strong className="font-bold text-on-surface">{prayerTimes.maghrib} WIB</strong> ({data.profile.city})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Kartu Ring Donut Kalori & Rincian Makan */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">donut_large</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Pola Energi Harian</h2>
          </div>
          <span className="font-label-sm text-xs text-tertiary font-semibold bg-tertiary-fixed/30 px-2.5 py-0.5 rounded-full">
            {data.profile.isNursing ? 'Sesuai Ritme Laktasi' : 'Defisit Terarah'}
          </span>
        </div>

        {/* Chart + Metrik */}
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#f4f2fd"
                strokeWidth="11"
              />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke={calorieColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                strokeWidth="11"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-metric-display text-[22px] leading-tight text-on-surface font-extrabold">
                {caloriePercent}%
              </span>
              <span className="font-label-sm text-[11px] font-bold -mt-0.5" style={{ color: calorieColor }}>
                {calorieStatusText}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display-lg-mobile text-2xl text-on-surface font-bold">
                {totalCalories.toLocaleString()}
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                / {calorieTarget.toLocaleString()} kkal
              </span>
            </div>
            <p className="font-body-sm text-xs text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                {totalCalories > calorieTarget ? 'error' : 'check_circle'}
              </span>
              {totalCalories > calorieTarget ? (
                <span className="text-error font-semibold">
                  Lebih: {(totalCalories - calorieTarget).toLocaleString()} kkal
                </span>
              ) : (
                <span>
                  Sisa jatah: <strong className="font-semibold text-on-surface">{remainingCalories.toLocaleString()} kkal</strong>
                </span>
              )}
            </p>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-0.5 leading-snug">
              Tetap berenergi saat defisit & berpuasa seimbang.
            </p>
          </div>
        </div>

        {/* Mini Meal Timeline */}
        <div className="flex flex-col gap-2 pt-1 border-t border-surface-container-low">
          {data.meals.slice(0, 3).map((meal) => (
            <div
              key={meal.id}
              onClick={() => setActiveTab('makan')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[16px]">{meal.icon || 'restaurant'}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-label-md text-xs text-on-surface font-semibold truncate">
                    {meal.timeCategory} <span className="text-[10px] text-on-surface-variant font-normal">({meal.time})</span>
                  </p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                    {meal.name}
                  </p>
                </div>
              </div>
              <span className="font-label-md text-xs text-on-surface font-bold whitespace-nowrap pl-2">
                {meal.calories} kkal
              </span>
            </div>
          ))}
          {data.meals.length === 0 && (
            <p className="text-center font-body-sm text-xs text-on-surface-variant py-2">
              Belum ada makanan dicatat hari ini.
            </p>
          )}
        </div>
      </div>

      {/* 4. Grid Dua Kolom: Countdown Puasa & Fase Hormon */}
      <div className="grid grid-cols-2 gap-3">
        {/* Countdown Puasa */}
        <div 
          onClick={() => setActiveTab('if-dan-puasa')}
          className="rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm border border-outline-variant/30 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-xs text-on-surface-variant font-medium">Menuju Buka</span>
            <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
            </div>
          </div>
          <div className="my-2">
            <p className="font-headline-md text-xl font-extrabold text-primary tracking-tight">
              {countdownText}
            </p>
            <span className="font-label-sm text-[11px] text-tertiary font-semibold">Puasa berjalan lancar</span>
          </div>
          <div className="pt-2 flex items-center justify-between font-label-sm text-[10px] text-on-surface-variant border-t border-surface-container">
            <span>Imsak: {prayerTimes.imsak}</span>
            <span>Buka: {prayerTimes.maghrib}</span>
          </div>
        </div>

        {/* Fase Folikuler */}
        <div
          onClick={() => setActiveTab('siklus')}
          className="rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm border border-outline-variant/30 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-xs text-on-surface-variant font-medium">
              Siklus: Hari ke-{cycleInfo.currentDay}
            </span>
            <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[14px]">spa</span>
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-tertiary text-[16px]">eco</span>
              <p className="font-headline-sm text-base text-on-surface font-bold">
                {cycleInfo.phase.name}
              </p>
            </div>
            <span className="font-label-sm text-[11px] text-tertiary font-semibold">
              {cycleInfo.phase.badge}
            </span>
          </div>
          <p className="font-body-sm text-[10px] text-on-surface-variant leading-snug line-clamp-2">
            {cycleInfo.phase.tips}
          </p>
        </div>
      </div>

      {/* 5. Kebutuhan Vital: Hidrasi & Quick Badges */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline-sm text-base text-on-surface font-bold">Kebutuhan Vital</h3>
          <span
            onClick={() => setActiveTab('makan')}
            className="font-label-sm text-xs text-primary font-semibold cursor-pointer hover:underline"
          >
            Lihat Detail
          </span>
        </div>

        {/* Water Tracker Card */}
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">water_drop</span>
              </div>
              <div>
                <p className="font-label-lg text-sm text-on-surface font-bold">
                  {data.profile.isNursing ? 'Hidrasi Menyusui' : 'Target Hidrasi Harian'}
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  {(data.waterGlasses * 0.25).toFixed(1)} dari 2.5 Liter tercapai
                </p>
              </div>
            </div>
            <span className="font-headline-sm text-base text-primary font-bold">
              {data.waterGlasses}{' '}
              <span className="font-label-sm text-xs text-on-surface-variant font-normal">/ 8 Gelas</span>
            </span>
          </div>

          {/* Water Glass Segment Indicators */}
          <div className="grid grid-cols-8 gap-1.5 py-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div
                key={idx}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx <= data.waterGlasses ? 'bg-primary shadow-xs' : 'bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
          <p className="font-label-sm text-[11px] text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">alarm</span>
            Minum 2 gelas air hangat saat sahur & 2 gelas saat berbuka.
          </p>
        </div>

        {/* Dual Mini Metric: Olahraga & Jatah Mie */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => setActiveTab('progress')}
            className="rounded-2xl bg-surface-container-lowest p-3 shadow-sm border border-outline-variant/30 flex items-center gap-2.5 cursor-pointer hover:bg-surface-container-low transition-colors active:scale-98"
          >
            <div className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">directions_walk</span>
            </div>
            {data.exercises && data.exercises.length > 0 ? (
              <div className="min-w-0">
                <span className="font-label-sm text-[11px] text-on-surface-variant block truncate">
                  {data.exercises[0].name}
                </span>
                <p className="font-label-lg text-xs text-on-surface font-bold truncate">
                  {data.exercises[0].duration} mnt{' '}
                  <span className="text-tertiary font-normal">(-{data.exercises[0].caloriesBurned} kkal)</span>
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <span className="font-label-sm text-[11px] text-on-surface-variant block">Olahraga</span>
                <p className="font-label-lg text-xs text-on-surface font-bold truncate">
                  0 sesi <span className="text-tertiary font-normal">(Catat)</span>
                </p>
              </div>
            )}
          </div>

          <div
            onClick={() => setActiveTab('progress')}
            className="rounded-2xl bg-surface-container-lowest p-3 shadow-sm border border-outline-variant/30 flex items-center gap-2.5 cursor-pointer hover:bg-surface-container-low transition-colors active:scale-98"
          >
            <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">ramen_dining</span>
            </div>
            <div className="min-w-0">
              <span className="font-label-sm text-[11px] text-on-surface-variant block">Jatah Mie</span>
              <p className="font-label-lg text-xs text-on-surface font-bold truncate">
                {data.mieTracker.quota > 0 ? 'Sisa 1 Porsi' : '0 Porsi'}{' '}
                <span className="text-outline text-[10px] font-normal">/ 2 mgg</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Quick Action Row */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={handleWaterClick}
          className={`flex-1 py-2.5 px-2 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            waterButtonFeedback
              ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
              : 'bg-surface-container-lowest text-primary hover:bg-secondary-fixed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {waterButtonFeedback ? 'check' : 'add_circle'}
          </span>
          <span className="font-label-sm text-xs font-bold">
            {waterButtonFeedback ? 'Tercatat!' : '+250ml Air'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className="flex-1 py-2.5 px-2 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-center gap-1.5 text-on-surface hover:bg-surface-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary">scale</span>
          <span className="font-label-sm text-xs font-semibold">Timbang BB</span>
        </button>

        <button
          onClick={() => setActiveTab('if-dan-puasa')}
          className="flex-1 py-2.5 px-2 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex items-center justify-center gap-1.5 text-on-surface hover:bg-surface-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px] text-tertiary">mosque</span>
          <span className="font-label-sm text-xs font-semibold">Jadwal Sholat</span>
        </button>
      </div>

      {/* 7. Floating Action CTA */}
      <div className="sticky bottom-2 inset-x-0 flex justify-center z-40 py-2">
        <button
          onClick={() => setQuickMealModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-on-primary shadow-[0_10px_25px_-4px_rgba(244,63,94,0.35)] hover:bg-primary-container transition-all active:scale-95 font-bold"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add
          </span>
          <span className="font-label-lg text-sm tracking-wide">
            Catat Makan Cepat
          </span>
        </button>
      </div>
    </div>
  );
}
