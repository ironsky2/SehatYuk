import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { localDateStr, startOfWeekStr, addDays, parseDateStr } from '../utils/dateUtils';

export default function ProgressScreen() {
  const {
    data,
    today,
    consumeMie,
    resetMieTracker,
    addWeightLog,
    addExercise,
    toggleNotification,
    showNotification
  } = useApp();

  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [weightDate, setWeightDate] = useState(today);

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exName, setExName] = useState('Brisk Walking');
  const [exDuration, setExDuration] = useState('25');
  const [exIntensity, setExIntensity] = useState('Sedang');
  const [exDate, setExDate] = useState(today);



  const hasWeightLogs = Array.isArray(data.weightLogs) && data.weightLogs.length > 0;
  const startWeight = Number(data.profile?.startWeight) || (hasWeightLogs ? Number(data.weightLogs[0]?.weight) : 0);
  const currentWeight = Number(data.profile?.currentWeight) || (hasWeightLogs ? Number(data.weightLogs[data.weightLogs.length - 1]?.weight) : startWeight);
  const targetWeight = Number(data.profile?.targetWeight) || 0;
  const hasWeightData = currentWeight > 0 || hasWeightLogs;

  const lostWeight = startWeight > 0 && currentWeight > 0 ? Math.max(0, startWeight - currentWeight).toFixed(1) : '0.0';
  const remainingWeight = currentWeight > 0 && targetWeight > 0 ? Math.max(0, currentWeight - targetWeight).toFixed(1) : '-';

  // Progres menuju target total (awal -> target)
  const totalToLose = startWeight > 0 && targetWeight > 0 ? startWeight - targetWeight : 0;
  const monthlyProgressPercent = totalToLose > 0 && currentWeight > 0
    ? Math.max(0, Math.min(Math.round(((startWeight - currentWeight) / totalToLose) * 100), 100))
    : 0;

  // Dynamic Chart Math for Weight Logs (hanya dari riwayat riil pengguna)
  const logs = hasWeightLogs ? data.weightLogs : [];

  const weights = logs.map((l) => Number(l.weight) || currentWeight);
  const trendDiff = weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0;
  const minW = Math.min(...(weights.length > 0 ? weights : [50]), targetWeight > 0 ? targetWeight : 50) - 0.5;
  const maxW = Math.max(...(weights.length > 0 ? weights : [60]), startWeight > 0 ? startWeight : 60) + 0.5;
  const rangeW = maxW - minW || 1;

  const points = logs.map((l, i) => {
    const x = logs.length === 1 ? 150 : Math.round((i / (logs.length - 1)) * 300);
    const normalizedY = (Number(l.weight) - minW) / rangeW;
    const y = Math.round(55 - normalizedY * 42); // 13 (top) to 55 (bottom)
    return { x, y, weight: Number(l.weight).toFixed(1), week: l.week };
  });

  const pathD = points.length === 1
    ? `M 0,${points[0].y} L 300,${points[0].y}`
    : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  const areaD = points.length === 1
    ? `M 0,${points[0].y} L 300,${points[0].y} L 300,70 L 0,70 Z`
    : `${pathD} L 300,70 L 0,70 Z`;

  // Dynamic Waist Difference
  const initialWaist = Number(data.weightLogs?.[0]?.waist) || Number(data.profile?.waistCircumference) || 0;
  const currentWaist = Number(data.profile?.waistCircumference) || initialWaist;
  const hasWaist = currentWaist > 0;
  const waistDiff = hasWaist && initialWaist > 0 ? (currentWaist - initialWaist).toFixed(1) : '0.0';

  // Hari olahraga pada minggu berjalan (Senin-Jumat), berdasarkan tanggal sebenarnya
  const weekStart = startOfWeekStr(parseDateStr(today));
  const weekDots = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'].map((label, i) => {
    const dateStr = addDays(weekStart, i);
    return {
      label,
      done: (data.exercises || []).some((e) => e.date === dateStr),
      future: dateStr > today
    };
  });

  const handleConsumeMieClick = () => {
    if (data.mieTracker.quota <= 0) {
      alert('⛔ Jatah mie periode ini sudah habis! Tahan dulu ya Bunda 💪 Jaga defisit kalori & sodium tubuh tetap stabil.');
      return;
    }
    const success = consumeMie();
    if (success) {
      showNotification('Jatah Mie Dipotong 🍜', '1 jatah mie periode 2 mingguan telah dipakai. Jangan lupa minum air yang cukup!');
    }
  };

  const handleWeightSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    if (!(w >= 20 && w <= 300)) {
      alert('Masukkan berat badan yang valid (20-300 kg).');
      return;
    }
    const ok = addWeightLog(newWeight, newWaist, weightDate > today ? today : weightDate);
    if (!ok) return;
    setWeightModalOpen(false);
    showNotification('Berat Badan Dicatat ⚖️', `Berat badan ${w} kg tersimpan.`);
  };

  const handleExerciseSubmit = (e) => {
    e.preventDefault();
    const durationNum = Number(exDuration);
    const calBurn = Math.round(durationNum * (exIntensity === 'Tinggi' ? 6 : exIntensity === 'Sedang' ? 3.5 : 2.5));
    addExercise({
      name: exName,
      type: exName,
      duration: durationNum,
      intensity: exIntensity,
      caloriesBurned: calBurn,
      date: exDate > today ? today : exDate
    });
    setExerciseModalOpen(false);
    showNotification('Olahraga Dicatat 🏃', `Latihan ${exName} selama ${durationNum} menit (-${calBurn} kkal) tersimpan.`);
  };



  return (
    <div className="flex flex-col w-full gap-4">
      {/* Progress Highlights Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.08)] border border-outline-variant/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-primary uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Kemajuan Bunda
            </span>
            <h2 className="font-headline-md text-base text-on-surface font-extrabold mt-0.5 truncate">
              Pencapaian & Kebiasaan
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Konsistensi tanpa beban untuk tubuh yang lebih bugar.
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed shadow-xs">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
          </div>
        </div>

        {/* Motivational Pill */}
        <div className="mt-3 p-2.5 rounded-xl bg-surface-container-low flex items-center gap-2.5 border border-outline-variant/20">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-on-secondary">
            <span className="material-symbols-outlined text-[16px]">spa</span>
          </div>
          <p className="font-body-sm text-xs text-on-surface font-medium leading-tight">
            {Number(remainingWeight) > 0 ? (
              <>Tinggal <span className="text-primary font-bold">{remainingWeight} kg lagi</span> menuju target idealmu 🌸</>
            ) : (
              <>Target berat badan tercapai. Pertahankan ya Bunda 🌸</>
            )}
          </p>
        </div>
      </div>

      {/* F6: Kartu Pencapaian Target Berat Badan */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-xs">
              <span className="material-symbols-outlined text-[18px]">monitor_weight</span>
            </div>
            <span className="font-headline-sm text-base text-on-surface font-bold">
              Target Berat Badan
            </span>
          </div>
          {Number(lostWeight) > 0 && (
            <span className="font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold shadow-xs">
              Turun {lostWeight} kg
            </span>
          )}
        </div>

        {/* Stat Milestones Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col justify-center border border-outline-variant/20">
            <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Awal</span>
            <span className="font-headline-sm text-base text-on-surface font-bold mt-0.5">
              {startWeight > 0 ? startWeight.toFixed(1) : '-'}
            </span>
            <span className="font-label-sm text-[10px] text-outline">kg</span>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-fixed flex flex-col justify-center border border-primary/20 shadow-xs">
            <span className="font-label-sm text-[11px] text-on-primary-fixed font-bold">Sekarang</span>
            <span className="font-headline-sm text-base text-primary font-black mt-0.5">
              {currentWeight > 0 ? currentWeight.toFixed(1) : '-'}
            </span>
            <span className="font-label-sm text-[10px] text-on-primary-fixed-variant font-bold">kg</span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col justify-center border border-outline-variant/20">
            <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Target</span>
            <span className="font-headline-sm text-base text-on-surface font-bold mt-0.5">
              {targetWeight > 0 ? targetWeight.toFixed(1) : '-'}
            </span>
            <span className="font-label-sm text-[10px] text-outline">kg</span>
          </div>
        </div>

        {/* Monthly Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center font-label-sm text-xs">
            <span className="text-on-surface-variant font-medium">Progres Menuju Target</span>
            <span className="text-primary font-bold">{monthlyProgressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 shadow-xs"
              style={{ width: `${monthlyProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between font-label-sm text-[11px] text-outline">
            <span>Sisa menuju target: {remainingWeight} kg</span>
          </div>
        </div>

        {/* Dynamic SVG Line Chart for Weight Trend */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-surface-container-low">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-xs text-on-surface font-bold">
              Tren Berat Badan ({logs.length} Catatan)
            </span>
            {logs.length > 1 && (
              <span
                className={`font-label-sm text-xs flex items-center gap-0.5 font-semibold ${
                  trendDiff <= 0 ? 'text-tertiary' : 'text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {trendDiff <= 0 ? 'trending_down' : 'trending_up'}
                </span>
                {trendDiff > 0 ? '+' : ''}{trendDiff.toFixed(1)} kg
              </span>
            )}
          </div>
          {logs.length > 0 ? (
            <div className="h-28 w-full bg-surface-container-low rounded-xl p-2.5 flex flex-col justify-end relative overflow-hidden border border-outline-variant/20">
              <svg className="w-full h-20 overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 70">
                <defs>
                  <linearGradient id="chartGradient2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b90538" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#b90538" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#chartGradient2)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#b90538"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    fill={idx === points.length - 1 ? '#dc2c4f' : '#b90538'}
                    r={idx === points.length - 1 ? 5 : 4}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </svg>
              <div className="flex justify-between text-[10px] text-on-surface-variant font-label-sm pt-1">
                {points.slice(-4).map((p, idx) => (
                  <span
                    key={idx}
                    className={idx === points.slice(-4).length - 1 ? 'font-bold text-primary' : ''}
                  >
                    {p.week}: {p.weight}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 rounded-xl bg-surface-container-low/60 border border-dashed border-outline-variant/30 flex flex-col items-center text-center gap-1.5 my-1">
              <span className="material-symbols-outlined text-outline text-[24px]">monitor_weight</span>
              <p className="text-xs font-bold text-on-surface">Belum Ada Riwayat Timbangan</p>
              <p className="text-[11px] text-on-surface-variant max-w-xs">
                Catat timbangan pertama Anda untuk mulai memantau grafik penurunan berat badan.
              </p>
            </div>
          )}
        </div>

        {/* Secondary Metric: Lingkar Perut */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">straighten</span>
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface font-bold">Lingkar Perut</p>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                {hasWaist && initialWaist > 0 ? `Awal ${initialWaist} cm` : 'Belum diisi'}
              </p>
            </div>
          </div>
          <div className="text-right">
            {hasWaist ? (
              <>
                <span className="font-headline-sm text-base text-on-surface font-bold">
                  {currentWaist}
                </span>
                <span className="font-label-sm text-xs text-on-surface-variant"> cm</span>
                {initialWaist > 0 && (
                  <span className="block font-label-sm text-xs text-tertiary font-bold">
                    {Number(waistDiff) <= 0 ? `${waistDiff} cm` : `+${waistDiff} cm`}
                  </span>
                )}
              </>
            ) : (
              <span className="font-label-sm text-xs text-outline font-semibold">-</span>
            )}
          </div>
        </div>

        {/* Quick Weight Logging CTA Button */}
        <button
          onClick={openWeightModal}
          className="w-full py-3 px-4 rounded-full bg-primary text-on-primary font-label-lg text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(185,5,56,0.25)] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">scale</span>
          Catat Berat Badan
        </button>
      </div>

      {/* F8: Tracker Mie Instan 🍜 */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-container flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">ramen_dining</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-sm text-sm text-on-surface font-bold truncate">
                Tracker Mie Instan 🍜
              </h3>
              <p className="font-label-sm text-[11px] text-on-surface-variant truncate">
                Siklus 2 Mingguan ({data.mieTracker.period})
              </p>
            </div>
          </div>
          <span
            className={`font-label-sm text-xs px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-1 shadow-xs ${
              data.mieTracker.quota > 0
                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                : 'bg-error-container text-on-error-container'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                data.mieTracker.quota > 0 ? 'bg-tertiary' : 'bg-error'
              }`}
            />
            {data.mieTracker.quota > 0 ? '1 Jatah Tersisa' : 'Jatah Habis ⛔'}
          </span>
        </div>

        {/* Rule & Last Eaten Info Card */}
        <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">verified_user</span>
            <span className="font-label-md text-xs text-on-surface font-bold">
              Aturan Jatah Bijak
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            Maksimal 1 porsi per 2 minggu demi menjaga defisit kalori & kadar sodium tubuh tetap stabil tanpa merasa terkekang.
          </p>
          <div className="pt-1.5 flex items-center justify-between font-label-sm text-[11px] text-outline border-t border-surface-container">
            <span>Riwayat makan mie terakhir:</span>
            <span className="font-bold text-on-surface">{data.mieTracker.lastEaten}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConsumeMieClick}
            disabled={data.mieTracker.quota <= 0}
            className={`w-full py-2.5 px-4 rounded-full font-label-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              data.mieTracker.quota > 0
                ? 'bg-secondary-fixed text-on-secondary-fixed active:scale-[0.98] cursor-pointer shadow-xs'
                : 'bg-surface-container text-on-surface-variant/60 cursor-not-allowed opacity-70'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
            {data.mieTracker.quota > 0
              ? 'Saya Makan Mie Hari Ini (Potong Jatah)'
              : 'Jatah Periode Ini Telah Dipakai'}
          </button>

          {data.mieTracker.quota <= 0 && (
            <button
              onClick={resetMieTracker}
              className="w-full py-2 px-3 rounded-full bg-surface-container-low text-primary text-xs font-semibold hover:bg-surface-container flex items-center justify-center gap-1 active:scale-95 transition-all border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Mulai Periode 2 Minggu Baru
            </button>
          )}
        </div>
      </div>

      {/* F7: Ringkasan Olahraga Mingguan */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-xs">
              <span className="material-symbols-outlined text-[18px]">directions_run</span>
            </div>
            <span className="font-headline-sm text-base text-on-surface font-bold">
              Olahraga Mingguan
            </span>
          </div>
          <span className="font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold shadow-xs">
            {data.exerciseDaysCompleted} / 5 Hari Target
          </span>
        </div>

        {/* 5-Day Target Dots */}
        <div className="grid grid-cols-5 gap-1.5 pt-0.5">
          {weekDots.map(({ label, done, future }) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs ${
                done
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold shadow-xs'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant/20'
              } ${future ? 'opacity-60' : ''}`}
            >
              <span>{label}</span>
              <span className="material-symbols-outlined text-[15px]">
                {done ? 'check' : 'hourglass_empty'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={openExerciseModal}
          className="w-full py-2.5 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Catat Olahraga
        </button>
      </div>

      {/* F9: Pengaturan Notifikasi & Reminder */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
            <h3 className="font-headline-sm text-base text-on-surface font-bold">
              Notifikasi & Pengingat
            </h3>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-1 text-sm">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div>
              <p className="font-bold text-xs text-on-surface">Jadwal IF ({data.profile.ifStart} & {data.profile.ifEnd})</p>
              <p className="text-[11px] text-on-surface-variant">Eating window buka & tutup</p>
            </div>
            <input
              type="checkbox"
              checked={data.notifications.eatingWindow}
              onChange={() => toggleNotification('eatingWindow')}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div>
              <p className="font-bold text-xs text-on-surface">Puasa Sunnah (Sahur & Maghrib)</p>
              <p className="text-[11px] text-on-surface-variant">Alarm sahur, imsak & buka puasa</p>
            </div>
            <input
              type="checkbox"
              checked={data.notifications.puasaSunnah}
              onChange={() => toggleNotification('puasaSunnah')}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div>
              <p className="font-bold text-xs text-on-surface">Peringatan Batas Kalori</p>
              <p className="text-[11px] text-on-surface-variant">Notif instan saat melebihi target</p>
            </div>
            <input
              type="checkbox"
              checked={data.notifications.calorieAlert}
              onChange={() => toggleNotification('calorieAlert')}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div>
              <p className="font-bold text-xs text-on-surface">Timbang Berat Badan Hari Senin</p>
              <p className="text-[11px] text-on-surface-variant">Setiap Senin jam 06:30 pagi</p>
            </div>
            <input
              type="checkbox"
              checked={data.notifications.weighIn}
              onChange={() => toggleNotification('weighIn')}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>



      {/* Modal Weight Logging */}
      {weightModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-headline-sm font-bold text-base text-on-surface">Catat Berat Badan</h3>
              <button onClick={() => setWeightModalOpen(false)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleWeightSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  max={today}
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs font-medium border border-outline-variant/20"
                />
                {weightDate !== today && (
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Catatan di tanggal yang sama akan diganti.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg font-bold border border-outline-variant/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Lingkar Perut (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newWaist}
                  onChange={(e) => setNewWaist(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-lg font-bold border border-outline-variant/20"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full py-2.5 bg-primary text-on-primary rounded-full font-label-md text-xs font-bold shadow-xs active:scale-98"
              >
                Simpan Timbangan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Exercise Logging */}
      {exerciseModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-headline-sm font-bold text-base text-on-surface">Catat Olahraga Baru</h3>
              <button onClick={() => setExerciseModalOpen(false)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleExerciseSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  max={today}
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Jenis Olahraga
                </label>
                <select
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none border border-outline-variant/20 text-xs font-medium"
                >
                  <option value="Brisk Walking">Brisk Walking</option>
                  <option value="Power Walk">Power Walk</option>
                  <option value="Senam Aerobik">Senam Aerobik</option>
                  <option value="Gentle Yoga">Gentle Yoga</option>
                  <option value="Jogging">Jogging</option>
                  <option value="HIIT Ringan">HIIT Ringan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={exDuration}
                    onChange={(e) => setExDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Intensitas
                  </label>
                  <select
                    value={exIntensity}
                    onChange={(e) => setExIntensity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs font-medium"
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 w-full py-2.5 bg-primary text-on-primary rounded-full font-label-md text-xs font-bold shadow-xs active:scale-98"
              >
                Simpan Olahraga
              </button>
            </form>
 
          </div>
        </div>
      )}
    </div>
  );
}
