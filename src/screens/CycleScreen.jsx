import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { calculateCycleInfo, getCycleDayForDate, getPhaseForCycleDay, parseLocalDate, PHASES } from '../utils/hormoneCycle';
import confetti from 'canvas-confetti';

export default function CycleScreen() {
  const { data, updateProfile, showNotification } = useApp();

  const initialHpht = parseLocalDate(data.profile?.hpht)
    ? data.profile.hpht
    : new Date().toISOString().split('T')[0];

  const [hphtModalOpen, setHphtModalOpen] = useState(false);
  const [newHpht, setNewHpht] = useState(initialHpht);
  const [newCycleLength, setNewCycleLength] = useState(data.profile?.cycleLength || 28);
  const [newPeriodDuration, setNewPeriodDuration] = useState(data.profile?.periodDuration || 6);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // Pastikan body scroll tidak terkunci saat masuk ke halaman siklus
  useEffect(() => {
    document.body.style.overflow = '';
  }, []);

  const cycleInfo = calculateCycleInfo(
    data.profile?.hpht,
    data.profile?.cycleLength,
    new Date(),
    data.profile?.periodDuration
  );

  const handleSaveHpht = (e) => {
    e.preventDefault();
    updateProfile({
      hpht: newHpht,
      cycleLength: Number(newCycleLength) || 28,
      periodDuration: Number(newPeriodDuration) || 6
    });
    setHphtModalOpen(false);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 }
    });
    showNotification('Siklus Diperbarui 🌸', `HPHT dicatat ${newHpht} (Siklus ${newCycleLength} hari). Kalender otomatis terupdate.`);
  };

  // Dynamic calendar generation based on currentMonthOffset
  const today = new Date();
  const baseMonthDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
  const displayYear = baseMonthDate.getFullYear();
  const displayMonth = baseMonthDate.getMonth();
  const monthName = baseMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(displayYear, displayMonth, 1).getDay(); // 0 = Min, 1 = Sen ...
  const prevMonthDays = new Date(displayYear, displayMonth, 0).getDate();

  const calendarCells = [];

  // Padding previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    const label = prevMonthDays - startDayOfWeek + 1 + i;
    calendarCells.push({ dayNumber: null, isCurrentMonth: false, label });
  }

  // Current month days
  const hasValidHpht = Boolean(parseLocalDate(data.profile?.hpht));
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(displayYear, displayMonth, d);
    const cycleDay = hasValidHpht
      ? getCycleDayForDate(cellDate, data.profile?.hpht, data.profile?.cycleLength || 28)
      : null;
    const phase = cycleDay
      ? getPhaseForCycleDay(cycleDay, data.profile?.periodDuration || 6)
      : null;
    const isToday =
      d === today.getDate() &&
      displayMonth === today.getMonth() &&
      displayYear === today.getFullYear();

    calendarCells.push({
      dayNumber: d,
      cellDate,
      cycleDay,
      isCurrentMonth: true,
      phase,
      isToday
    });
  }

  const handleCellClick = (cell) => {
    if (!cell.isCurrentMonth) return;
    setSelectedDayDetail(cell);
  };

  const currentPhase = cycleInfo?.phase || PHASES.FOLIKULER;

  return (
    <div className="flex flex-col w-full gap-4 pb-28 touch-pan-y overscroll-contain">
      {/* Salutation & Gentle Encouragement Banner */}
      <div className="flex items-center justify-between bg-primary-fixed/40 px-4 py-3 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-primary shadow-xs">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </div>
          <div>
            <p className="font-label-sm text-[11px] text-on-surface-variant font-medium">
              Siklus & Hormon Pribadi
            </p>
            <p className="font-headline-sm text-sm text-primary font-bold">
              Halo, {data.profile?.name || 'Bunda'}! ✨
            </p>
          </div>
        </div>
        {hasValidHpht ? (
          <span className="font-label-sm text-xs px-2.5 py-1 rounded-full bg-surface text-tertiary font-bold shadow-xs">
            Hari ke-{cycleInfo.currentDay}
          </span>
        ) : (
          <button
            onClick={() => setHphtModalOpen(true)}
            className="font-label-sm text-xs px-3 py-1 rounded-full bg-primary text-on-primary font-bold shadow-xs active:scale-95 transition-all"
          >
            + Catat HPHT
          </button>
        )}
      </div>

      {/* Primary Card: Fase Hari Ini atau Ajakan Catat HPHT */}
      {!hasValidHpht ? (
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center gap-2.5">
          <div className="w-12 h-12 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">calendar_month</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">Belum Mencatat Tanggal Haid (HPHT)</h3>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-xs mt-0.5 leading-relaxed">
              Catat hari pertama haid terakhir Anda untuk mendapatkan kalkulasi fase hormon dan panduan nutrisi harian yang akurat.
            </p>
          </div>
          <button
            onClick={() => setHphtModalOpen(true)}
            className="mt-1 py-2 px-4 rounded-full bg-primary text-on-primary font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Catat Hari Pertama Haid</span>
          </button>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-tertiary-fixed/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-3">
            {/* Title & Status Badge */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">
                    {currentPhase.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base text-on-surface font-extrabold">
                    Fase {currentPhase.name}
                  </h3>
                  <span className="font-label-sm text-xs text-tertiary font-semibold">
                    Hari ke-{cycleInfo.currentDay} dari Siklus {data.profile?.cycleLength || 28} Hari
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed font-label-sm text-xs font-bold">
                {currentPhase.badge}
              </span>
            </div>

            {/* Explanatory Text */}
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              {currentPhase.tips}
            </p>

            {/* 28-Day Interactive Cycle Bar */}
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-label-sm text-[11px] text-on-surface-variant font-medium">
                <span>Hari 1 (Haid)</span>
                <span className="font-bold text-primary">
                  Hari {cycleInfo.currentDay} (Saat Ini)
                </span>
                <span>Hari {data.profile?.cycleLength || 28}</span>
              </div>

              {/* Progress Bar Segmented Representation */}
              <div className="relative w-full h-3 bg-surface-container rounded-full overflow-hidden flex">
                <div className="h-full bg-primary-container" style={{ width: '21%' }} title="Menstruasi" />
                <div className="h-full bg-tertiary-fixed-dim" style={{ width: '25%' }} title="Folikuler" />
                <div className="h-full bg-secondary-container" style={{ width: '11%' }} title="Ovulasi" />
                <div className="h-full bg-secondary-fixed" style={{ width: '43%' }} title="Luteal" />

                {/* Pin */}
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-on-surface rounded-full shadow-md transform -translate-x-1/2 ring-2 ring-surface"
                  style={{ left: `${Math.min(100, Math.max(0, (cycleInfo.currentDay / (data.profile?.cycleLength || 28)) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-label-sm text-on-surface-variant pt-0.5">
                <span>Perkiraan Haid Berikutnya:</span>
                <span className="font-bold text-on-surface">{cycleInfo.nextPeriod}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Pilar Panduan Kesehatan Postpartum & Fase Siklus */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-headline-sm text-sm text-on-surface font-bold px-1">
          Panduan Ritme Tubuh Bunda
        </h3>

        {/* Pilar 1: Makanan & Gizi */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">nutrition</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-label-lg text-xs font-bold text-on-surface">
                Pilar 1: Nutrisi & Piring Sehat
              </p>
              <span className="font-label-sm text-[10px] text-tertiary font-bold px-2 py-0.5 bg-tertiary-fixed/40 rounded-full">
                Fokus Metabolisme
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-snug">
              {currentPhase.pilarMakan}
            </p>
          </div>
        </div>

        {/* Pilar 2: Olahraga & Gerak */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">directions_run</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-label-lg text-xs font-bold text-on-surface">
                Pilar 2: Olahraga Ramah Ibu
              </p>
              <span className="font-label-sm text-[10px] text-secondary font-bold px-2 py-0.5 bg-secondary-fixed rounded-full">
                Stamina Naik
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-snug">
              {currentPhase.pilarOlahraga}
            </p>
          </div>
        </div>

        {/* Pilar 3: Mood & Pikiran */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">self_improvement</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-label-lg text-xs font-bold text-on-surface">
                Pilar 3: Mood & Pikiran
              </p>
              <span className="font-label-sm text-[10px] text-primary font-bold px-2 py-0.5 bg-primary-fixed rounded-full">
                Mood Cerah
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-snug">
              {currentPhase.pilarMood}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Card: Healthy Meal Inspiration */}
      <div
        className="relative w-full h-32 rounded-2xl overflow-hidden shadow-sm flex items-end p-4 bg-cover bg-center border border-outline-variant/30"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(26, 27, 34, 0.9), rgba(26, 27, 34, 0.2)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuC4q9wCSJtlV6Q8QdwxsXjr9SBy7g0lANwuelRAzTSrIUjfrnl3trJXui3VHFYHSCm8vI0RDEWbC9AUJbnVIIvZ4ItTGhhvRMEZX7XBEzlXHpygmcHo389eVgEOKHsZi9hvh7J6EoKP6S8S3wfXeL2_8Q5UFN6-HpufRSjM56L5JxAROLsVsjY6U0eZ-nIiSA30v_9H0voLfeUAxJwvdzjauYMlfL-WBW03LFAgzVzJ9RkFbT9g3x2o')"
        }}
      >
        <div className="relative z-10 flex items-center justify-between w-full text-on-primary">
          <div>
            <p className="font-label-sm text-[11px] opacity-90 font-medium">Inspirasi Piring Sehat Hari Ini</p>
            <p className="font-headline-sm text-sm font-bold">
              Sayur Bening Bayam & Pepes Ikan
            </p>
          </div>
          <button
            onClick={() => setRecipeModalOpen(true)}
            className="px-3 py-1.5 bg-surface text-on-surface rounded-full font-label-sm text-xs font-bold shadow-xs hover:bg-surface-bright active:scale-95 transition-transform flex items-center gap-1"
          >
            <span>Resep</span>
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Kalender Bulanan Siklus Interaktif */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              calendar_month
            </span>
            <h3 className="font-headline-sm text-base font-bold text-on-surface capitalize">
              {monthName}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonthOffset((prev) => prev - 1)}
              aria-label="Bulan Sebelumnya"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {currentMonthOffset !== 0 && (
              <button
                onClick={() => setCurrentMonthOffset(0)}
                className="px-2 py-0.5 text-[11px] font-label-sm rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold active:scale-95"
              >
                Hari Ini
              </button>
            )}
            <button
              onClick={() => setCurrentMonthOffset((prev) => prev + 1)}
              aria-label="Bulan Berikutnya"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-label-sm text-xs text-on-surface-variant font-bold">
          <span>Min</span>
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span>Sab</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-label-md text-xs touch-pan-y">
          {calendarCells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <span key={idx} className="py-2 text-on-surface-variant/30 font-normal">
                  {cell.label}
                </span>
              );
            }

            const { phase, dayNumber, isToday } = cell;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(cell)}
                className={`relative py-2 rounded-xl font-bold transition-all touch-manipulation select-none active:scale-95 ${
                  isToday
                    ? 'bg-tertiary-container text-on-tertiary font-extrabold shadow-sm ring-2 ring-tertiary-fixed scale-105'
                    : phase?.colorClass || 'bg-surface-container-low text-on-surface-variant/70'
                }`}
                title={
                  phase
                    ? `Hari ${dayNumber} - ${phase.name} (Siklus hari ke-${cell.cycleDay})`
                    : `Hari ${dayNumber} (HPHT belum dicatat)`
                }
              >
                <span className="relative z-10">{dayNumber}</span>
                {isToday && (
                  <>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-container rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-container rounded-full ring-1 ring-surface" />
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Legenda 4 Kode Warna */}
        <div className="mt-1 pt-2 bg-surface-container-low rounded-xl p-3 flex flex-col gap-1.5 border border-outline-variant/20">
          <p className="font-label-sm text-xs font-bold text-on-surface">
            Legenda Fase Siklus:
          </p>
          <div className="grid grid-cols-2 gap-2 font-label-sm text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-error-container flex items-center justify-center text-[9px]">
                🔴
              </span>
              <span className="text-on-surface-variant">
                <strong className="text-on-surface">Menstruasi</strong> (Hari 1-{data.profile?.periodDuration || 6})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-tertiary-fixed flex items-center justify-center text-[9px]">
                🌱
              </span>
              <span className="text-on-surface-variant">
                <strong className="text-on-surface">Folikuler</strong> (Hari {(data.profile?.periodDuration || 6) + 1}-13)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-secondary-container flex items-center justify-center text-[9px]">
                ⚡
              </span>
              <span className="text-on-surface-variant">
                <strong className="text-on-surface">Ovulasi</strong> (Hari 14-16)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-surface-container-high flex items-center justify-center text-[9px]">
                🌙
              </span>
              <span className="text-on-surface-variant">
                <strong className="text-on-surface">Luteal</strong> (Hari 17-{data.profile?.cycleLength || 28})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Inspector Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedDayDetail.phase?.emoji || '📅'}</span>
                <div>
                  <h4 className="font-headline-sm font-bold text-sm text-on-surface">
                    {selectedDayDetail.dayNumber} {monthName}
                  </h4>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {selectedDayDetail.phase
                      ? `Fase ${selectedDayDetail.phase.name} (Hari ke-${selectedDayDetail.cycleDay} Siklus)`
                      : 'Tanggal Haid (HPHT) belum dicatat'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {selectedDayDetail.phase ? (
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <strong className="text-primary block mb-0.5">🥗 Rekomendasi Nutrisi:</strong>
                  <p className="text-on-surface-variant">{selectedDayDetail.phase.pilarMakan}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <strong className="text-secondary block mb-0.5">🏃 Rekomendasi Olahraga:</strong>
                  <p className="text-on-surface-variant">{selectedDayDetail.phase.pilarOlahraga}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <strong className="text-tertiary block mb-0.5">🌸 Mood & Relaksasi:</strong>
                  <p className="text-on-surface-variant">{selectedDayDetail.phase.pilarMood}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 text-xs text-center py-2">
                <p className="text-on-surface-variant">
                  Silakan catat tanggal HPHT Bunda terlebih dahulu agar perkiraan fase hormon pada tanggal ini dapat dihitung.
                </p>
                <button
                  onClick={() => {
                    setSelectedDayDetail(null);
                    setHphtModalOpen(true);
                  }}
                  className="py-2 px-4 rounded-full bg-primary text-on-primary font-bold text-xs"
                >
                  Catat HPHT Sekarang
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedDayDetail(null)}
              className="mt-1 w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-full font-label-md text-xs font-bold shadow-xs active:scale-98"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {recipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-headline-sm font-bold text-sm text-on-surface">Sayur Bening & Pepes Ikan</h4>
              <button onClick={() => setRecipeModalOpen(false)}>
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Bahan:</strong> 1 ikat bayam segar, 1 buah jagung manis pipil, 2 butir bawang merah, temu kunci, 1 ekor ikan nila/kembung dibumbui kemangi & kunyit kukus.
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Keunggulan Nutrisi:</strong> Tinggi zat besi, kaya vitamin K, asam folat, dan asam lemak omega-3 untuk metabolisme aktif serta energi kebugaran Bunda.
            </p>
            <div className="p-2.5 bg-secondary-fixed rounded-xl text-xs font-bold text-on-secondary-fixed text-center">
              Estimasi: ~280 kkal per porsi lengkap
            </div>
            <button
              onClick={() => setRecipeModalOpen(false)}
              className="w-full py-2.5 bg-primary text-on-primary rounded-full font-label-md text-xs font-bold active:scale-98"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Primary Interactive Action: Log HPHT Baru */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setHphtModalOpen(true)}
          className="w-full py-3.5 px-4 rounded-full bg-primary text-on-primary font-label-lg text-sm font-bold shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
          <span>Catat Hari Pertama Haid (HPHT) Baru</span>
        </button>
        <p className="text-center font-body-sm text-xs text-on-surface-variant">
          HPHT terakhir:{' '}
          <span className="font-bold text-on-surface">
            {hasValidHpht ? data.profile.hpht : 'Belum dicatat'}
          </span>{' '}
          • Panjang siklus:{' '}
          <span className="font-bold text-on-surface">{data.profile?.cycleLength || 28} hari</span>
        </p>
      </div>

      {/* HPHT Modal */}
      {hphtModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 flex flex-col gap-3.5 shadow-2xl border border-outline-variant/30 pb-10 sm:pb-5">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-headline-sm font-bold text-base text-on-surface">
                Ubah HPHT & Siklus Bulanan
              </h3>
              <button onClick={() => setHphtModalOpen(false)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveHpht} className="flex flex-col gap-3">
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant block mb-1 font-medium">
                  Hari Pertama Haid Terakhir (HPHT):
                </label>
                <input
                  type="date"
                  required
                  value={newHpht}
                  onChange={(e) => setNewHpht(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-label-sm text-xs text-on-surface-variant block mb-1 font-medium">
                    Panjang Siklus:
                  </label>
                  <input
                    type="number"
                    min="21"
                    max="45"
                    required
                    value={newCycleLength}
                    onChange={(e) => setNewCycleLength(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 text-xs"
                  />
                  <span className="text-[10px] text-on-surface-variant">Rata-rata 28 hari</span>
                </div>
                <div>
                  <label className="font-label-sm text-xs text-on-surface-variant block mb-1 font-medium">
                    Durasi Haid:
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    required
                    value={newPeriodDuration}
                    onChange={(e) => setNewPeriodDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 text-xs"
                  />
                  <span className="text-[10px] text-on-surface-variant">Rata-rata 5-7 hari</span>
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 w-full py-3 bg-primary text-on-primary rounded-full font-label-lg font-bold text-xs shadow-sm active:scale-98"
              >
                Simpan & Sinkronkan Siklus
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
