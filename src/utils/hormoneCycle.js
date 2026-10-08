export const PHASES = {
  MENSTRUASI: {
    key: 'menstruasi',
    name: 'Menstruasi',
    badge: 'Fase Pemulihan',
    icon: 'water_drop',
    emoji: '🔴',
    colorClass: 'bg-error-container text-on-error-container',
    tagClass: 'bg-error-container text-on-error-container',
    tips: 'Tubuh sedang melepaskan lapisan dinding rahim. Berikan waktu istirahat ekstra dan konsumsi makanan kaya zat besi.',
    pilarMakan: 'Konsumsi makanan kaya zat besi seperti daging merah tanpa lemak, bayam, hati ayam, dan buah bit. Minum air hangat yang cukup.',
    pilarOlahraga: 'Peregangan lembut, gentle yoga, atau jalan kaki santai. Hindari olahraga berintensitas tinggi.',
    pilarMood: 'Hormon estrogen dan progesteron di level rendah. Wajar merasa lelah, luangkan waktu relaksasi dan tidur lebih awal.'
  },
  FOLIKULER: {
    key: 'folikuler',
    name: 'Folikuler',
    badge: 'Energi Prima',
    icon: 'potted_plant',
    emoji: '🌱',
    colorClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    tagClass: 'bg-tertiary-fixed/40 text-on-tertiary-fixed',
    tips: 'Estrogen mulai meningkat, energi tinggi & metabolisme prima! Fase terbaik untuk defisit kalori & latihan fisik aktif.',
    pilarMakan: 'Perbanyak sayuran hijau & protein tinggi serat, kurangi karbohidrat olahan. Tubuh sedang sangat efektif menyerap mikronutrien.',
    pilarOlahraga: 'Cocok untuk brisk walk 30 menit, senam aerobik, atau jogging santai. Sendi fleksibel dan pemulihan otot berlangsung sangat cepat.',
    pilarMood: 'Fokus tinggi, motivasi kuat, suasana hati cerah. Waktu paling pas untuk konsistensi defisit kalori harian!'
  },
  OVULASI: {
    key: 'ovulasi',
    name: 'Ovulasi',
    badge: 'Puncak Performa',
    icon: 'local_fire_department',
    emoji: '⚡',
    colorClass: 'bg-secondary-container text-on-secondary-container',
    tagClass: 'bg-secondary-container/30 text-on-secondary-container',
    tips: 'Puncak hormon estrogen dan LH. Stamina dan rasa percaya diri berada di titik tertinggi dalam sebulan.',
    pilarMakan: 'Tingkatkan asupan antioksidan (beri, tomat), lemak sehat (alpukat, kacang-kacangan), dan serat untuk metabolisme estrogen.',
    pilarOlahraga: 'Kekuatan dan energi di titik tertinggi. Bagus untuk latihan beban ringan atau HIIT singkat 20 menit.',
    pilarMood: 'Rasa percaya diri dan komunikasi optimal. Cocok untuk aktivitas aktif dan olahraga luar ruangan.'
  },
  LUTEAL: {
    key: 'luteal',
    name: 'Luteal',
    badge: 'Antisipasi Craving',
    icon: 'nightlight_round',
    emoji: '🌙',
    colorClass: 'bg-surface-container-high text-on-surface-variant',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
    tips: 'Progesteron dominan. Metabolisme basal naik sedikit, waspadai dorongan ngemil (PMS craving).',
    pilarMakan: 'Cegah craving gula dengan perbanyak protein kompleks, ubi manis, magnesium (dark chocolate 70%), dan cukup kalsium.',
    pilarOlahraga: 'Kurangi beban secara bertahap. Pilih pilates, senam peregangan, jalan santai, atau yoga relaksasi.',
    pilarMood: 'Progesteron meningkat menjelang siklus berikutnya. Luangkan waktu rileks, tidur lebih awal, dan lakukan teknik pernapasan.'
  }
};

/**
 * Validasi dan parse tanggal lokal dari string YYYY-MM-DD atau Date object
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  const cleanStr = String(dateStr).trim();
  if (!cleanStr || cleanStr.toLowerCase().includes('belum')) return null;

  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const parsed = new Date(y, m, d);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const d = new Date(cleanStr);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Menentukan fase siklus menstruasi berdasarkan hari ke-N dan durasi haid
 */
export function getPhaseForCycleDay(dayNumber, periodDuration = 6) {
  const day = Number(dayNumber);
  if (!Number.isFinite(day) || day < 1) return PHASES.FOLIKULER;

  const pDuration = Number(periodDuration) > 0 ? Number(periodDuration) : 6;
  if (day <= pDuration) return PHASES.MENSTRUASI;
  if (day <= 13) return PHASES.FOLIKULER;
  if (day >= 14 && day <= 16) return PHASES.OVULASI;
  return PHASES.LUTEAL;
}

/**
 * Menghitung hari ke-berapa dalam siklus untuk tanggal tertentu
 */
export function getCycleDayForDate(targetDate, hphtString = null, cycleLength = 28) {
  if (!hphtString) return 1;
  const hpht = parseLocalDate(hphtString);
  if (!hpht) return 1;

  const cLen = Number(cycleLength) >= 18 && Number(cycleLength) <= 45 ? Number(cycleLength) : 28;
  const target = targetDate instanceof Date ? targetDate : (parseLocalDate(targetDate) || new Date());
  const targetNorm = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffDays = Math.round((targetNorm.getTime() - hpht.getTime()) / (1000 * 60 * 60 * 24));
  return (((diffDays % cLen) + cLen) % cLen) + 1;
}

export function getPhaseForDay(dayNumber, cycleLength = 28, periodDuration = 6) {
  const cLen = Number(cycleLength) || 28;
  const day = (((Number(dayNumber) - 1) % cLen) + cLen) % cLen + 1;
  return getPhaseForCycleDay(day, periodDuration);
}

/**
 * Menghitung informasi lengkap siklus hormon, fase hari ini, dan proyeksi haid berikutnya
 */
export function calculateCycleInfo(
  hphtString = null,
  cycleLength = 28,
  targetDate = new Date(),
  periodDuration = 6
) {
  const cLen = Number(cycleLength) >= 18 && Number(cycleLength) <= 45 ? Number(cycleLength) : 28;
  const pDur = Number(periodDuration) > 0 ? Number(periodDuration) : 6;

  const hpht = parseLocalDate(hphtString);
  if (!hpht) {
    return {
      hasHpht: false,
      currentDay: 1,
      cycleLength: cLen,
      periodDuration: pDur,
      phase: PHASES.FOLIKULER,
      nextPeriod: 'Belum dicatat'
    };
  }

  const target = targetDate instanceof Date ? targetDate : (parseLocalDate(targetDate) || new Date());
  const targetNorm = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetNorm.getTime() - hpht.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Hari ke-N dalam siklus 1-based (mod cycleLength)
  const currentDay = (((diffDays % cLen) + cLen) % cLen) + 1;
  const phase = getPhaseForCycleDay(currentDay, pDur);

  // Perkiraan tanggal haid berikutnya
  const cyclesPassed = Math.floor(diffDays / cLen);
  const nextPeriodDate = new Date(hpht.getTime() + (cyclesPassed + 1) * cLen * 24 * 60 * 60 * 1000);

  let formattedNextPeriod = 'Segera';
  if (!isNaN(nextPeriodDate.getTime())) {
    formattedNextPeriod = nextPeriodDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return {
    hasHpht: true,
    currentDay,
    cycleLength: cLen,
    periodDuration: pDur,
    phase: phase || PHASES.FOLIKULER,
    nextPeriod: formattedNextPeriod
  };
}
