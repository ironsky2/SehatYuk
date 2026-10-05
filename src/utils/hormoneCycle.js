export const PHASES = {
  MENSTRUASI: {
    key: 'menstruasi',
    name: 'Menstruasi',
    badge: 'Haid Selesai 1 Okt',
    icon: 'water_drop',
    emoji: '🔴',
    colorClass: 'bg-error-container text-on-error-container',
    tagClass: 'bg-error-container text-on-error-container',
    tips: 'Haid telah tuntas (23 Sept - 1 Okt). Tubuh memasuki pemulihan energi optimal.',
    pilarMakan: 'Konsumsi makanan kaya zat besi seperti daging merah tanpa lemak, bayam, dan buah bit. Minum air hangat yang cukup.',
    pilarOlahraga: 'Peregangan lembut, gentle yoga, atau jalan kaki santai. Hindari olahraga berintensitas tinggi.',
    pilarMood: 'Hormon stabil kembali. Berikan waktu istirahat ekstra, hindari stres dan beban kerja berlebih.'
  },
  FOLIKULER: {
    key: 'folikuler',
    name: 'Folikuler',
    badge: 'Energi Prima',
    icon: 'potted_plant',
    emoji: '🌱',
    colorClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    tagClass: 'bg-tertiary-fixed/40 text-on-tertiary-fixed',
    tips: 'Energi tinggi & metabolisme prima! Fase terbaik untuk defisit kalori & latihan cardio.',
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
    tips: 'Puncak performa & stamina tinggi. Cocok untuk latihan intensitas sedang-tinggi.',
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
    tips: 'Antisipasi nafsu makan meningkat. Perbanyak protein & relaksasi tubuh.',
    pilarMakan: 'Cegah craving gula dengan perbanyak protein kompleks, ubi manis, magnesium (dark chocolate 70%), dan cukup kalsium.',
    pilarOlahraga: 'Kurangi beban secara bertahap. Pilih pilates, senam peregangan, jalan santai, atau yoga relaksasi.',
    pilarMood: 'Progesteron meningkat menjelang siklus berikutnya. Luangkan waktu rileks, tidur lebih awal, dan lakukan teknik pernapasan.'
  }
};

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) {
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
}

export function getPhaseForCycleDay(dayNumber, periodDuration = 9) {
  const day = Math.max(1, dayNumber);
  if (day >= 1 && day <= periodDuration) return PHASES.MENSTRUASI;
  if (day > periodDuration && day <= 13) return PHASES.FOLIKULER;
  if (day >= 14 && day <= 16) return PHASES.OVULASI;
  return PHASES.LUTEAL;
}

export function getCycleDayForDate(targetDate, hphtString = '2026-09-23', cycleLength = 28) {
  const hpht = parseLocalDate(hphtString);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.round((target.getTime() - hpht.getTime()) / (1000 * 60 * 60 * 24));
  return (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;
}

export function getPhaseForDay(dayNumber, cycleLength = 28, periodDuration = 9) {
  const day = ((dayNumber - 1) % cycleLength) + 1;
  return getPhaseForCycleDay(day, periodDuration);
}

export function calculateCycleInfo(
  hphtString = '2026-09-23',
  cycleLength = 28,
  targetDate = new Date(),
  periodDuration = 9
) {
  const hpht = parseLocalDate(hphtString);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffTime = target.getTime() - hpht.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Cycle day 1-based (mod cycleLength)
  const currentDay = (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;
  const phase = getPhaseForCycleDay(currentDay, periodDuration);

  // Next period date
  const cyclesPassed = Math.floor(diffDays / cycleLength);
  const nextPeriod = new Date(hpht.getTime() + (cyclesPassed + 1) * cycleLength * 24 * 60 * 60 * 1000);

  return {
    currentDay,
    cycleLength,
    periodDuration,
    phase,
    nextPeriod: nextPeriod.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}
