export const PHASES = {
  MENSTRUASI: {
    key: 'menstruasi',
    name: 'Menstruasi',
    badge: 'Haid',
    icon: 'water_drop',
    emoji: '🔴',
    colorClass: 'bg-error-container text-on-error-container',
    tagClass: 'bg-error-container text-on-error-container',
    tips: 'Istirahat cukup. Defisit minimal. Perkaya zat besi.',
    pilarMakan: 'Konsumsi makanan kaya zat besi seperti daging merah tanpa lemak, bayam, dan buah bit. Minum air hangat yang cukup.',
    pilarOlahraga: 'Peregangan lembut, gentle yoga, atau jalan kaki santai. Hindari olahraga berintensitas tinggi.',
    pilarMood: 'Hormon sedang rendah. Berikan waktu istirahat ekstra, hindari stres dan beban kerja berlebih.'
  },
  FOLIKULER: {
    key: 'folikuler',
    name: 'Folikuler',
    badge: 'Energi Prima',
    icon: 'potted_plant',
    emoji: '🌱',
    colorClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    tagClass: 'bg-tertiary-fixed/40 text-on-tertiary-fixed',
    tips: 'Energi tinggi! Ideal untuk defisit agresif & cardio.',
    pilarMakan: 'Perbanyak sayuran hijau & protein tinggi serat, kurangi karbohidrat olahan. Tubuh sedang sangat efektif menyerap mikronutrien.',
    pilarOlahraga: 'Cocok untuk brisk walk 30 menit atau senam aerobik intensitas sedang. Sendi lebih fleksibel dan pemulihan otot berlangsung cepat.',
    pilarMood: 'Fokus tinggi, suasana hati cerah, waktu pas untuk rencanakan meal prep mingguan atau mulai agenda produktif baru!'
  },
  OVULASI: {
    key: 'ovulasi',
    name: 'Ovulasi',
    badge: 'Puncak Performa',
    icon: 'local_fire_department',
    emoji: '⚡',
    colorClass: 'bg-secondary-container text-on-secondary-container',
    tagClass: 'bg-secondary-container/30 text-on-secondary-container',
    tips: 'Puncak performa. HIIT & defisit sedang.',
    pilarMakan: 'Tingkatkan asupan antioksidan (beri, tomat), lemak sehat (alpukat, kacang-kacangan), dan serat untuk metabolisme estrogen.',
    pilarOlahraga: 'Kekuatan dan energi di titik tertinggi. Bagus untuk latihan beban ringan atau HIIT singkat 20 menit.',
    pilarMood: 'Rasa percaya diri dan komunikasi optimal. Cocok untuk aktivitas sosial dan interaksi aktif.'
  },
  LUTEAL: {
    key: 'luteal',
    name: 'Luteal',
    badge: 'Antisipasi Craving',
    icon: 'nightlight_round',
    emoji: '🌙',
    colorClass: 'bg-surface-container-high text-on-surface-variant',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
    tips: 'Antisipasi craving. Perbanyak protein & relaksasi.',
    pilarMakan: 'Cegah craving gula dengan perbanyak protein kompleks, ubi manis, magnesium (dark chocolate 70%), dan cukup kalsium.',
    pilarOlahraga: 'Kurangi beban secara bertahap. Pilih pilates, senam peregangan, atau renang santai.',
    pilarMood: 'Progesteron meningkat dan menjelang PMS. Luangkan waktu rileks, tidur lebih awal, dan lakukan teknik pernapasan.'
  }
};

export function calculateCycleInfo(hphtString = '2026-10-01', cycleLength = 28, targetDate = new Date()) {
  const hpht = new Date(hphtString);
  const diffTime = targetDate.getTime() - hpht.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Cycle day 1-based (mod cycleLength)
  const currentDay = diffDays >= 0 ? (diffDays % cycleLength) + 1 : 1;
  
  let phase = PHASES.FOLIKULER;
  if (currentDay >= 1 && currentDay <= 5) {
    phase = PHASES.MENSTRUASI;
  } else if (currentDay >= 6 && currentDay <= 13) {
    phase = PHASES.FOLIKULER;
  } else if (currentDay >= 14 && currentDay <= 16) {
    phase = PHASES.OVULASI;
  } else {
    phase = PHASES.LUTEAL;
  }

  // Next period date
  const cyclesPassed = Math.floor(diffDays / cycleLength);
  const nextPeriod = new Date(hpht.getTime() + (cyclesPassed + 1) * cycleLength * 24 * 60 * 60 * 1000);

  return {
    currentDay,
    cycleLength,
    phase,
    nextPeriod: nextPeriod.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}

export function getPhaseForDay(dayNumber, cycleLength = 28) {
  const day = ((dayNumber - 1) % cycleLength) + 1;
  if (day >= 1 && day <= 5) return PHASES.MENSTRUASI;
  if (day >= 6 && day <= 13) return PHASES.FOLIKULER;
  if (day >= 14 && day <= 16) return PHASES.OVULASI;
  return PHASES.LUTEAL;
}
