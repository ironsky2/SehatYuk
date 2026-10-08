/**
 * Helper utilitas untuk menghitung kelayakan & jadwal konsumsi Mie Instan (aturan 1 porsi per 14 hari)
 */

export function getMieEligibility(mieTracker) {
  const quota = mieTracker?.quota ?? 1;
  const history = Array.isArray(mieTracker?.history) ? mieTracker.history : [];

  // Jika kuota masih ada (1)
  if (quota > 0) {
    return {
      canEatNow: true,
      badgeText: '1 Jatah Tersedia',
      badgeColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
      headline: 'Bunda Boleh Makan Mie Hari Ini! 🍜',
      subline: '1 kuota 2 mingguan masih tersedia. Nikmati tanpa rasa bersalah dengan hacks sehat!',
      daysRemaining: 0,
      daysPassed: 14,
      progressPercent: 100,
      nextDateFormatted: 'Hari Ini'
    };
  }

  // Jika kuota sudah habis (0), hitung mundur dari tanggal makan terakhir
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastDate = new Date();
  const lastHistoryDate = history[0]?.date;
  const rawLastEaten = mieTracker?.lastEatenDate || lastHistoryDate;

  if (rawLastEaten) {
    const parts = String(rawLastEaten).split('-');
    if (parts.length === 3) {
      lastDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      const parsed = new Date(rawLastEaten);
      if (!isNaN(parsed.getTime())) lastDate = parsed;
    }
  } else if (mieTracker?.startDate) {
    const parsed = new Date(mieTracker.startDate);
    if (!isNaN(parsed.getTime())) lastDate = parsed;
  }
  lastDate.setHours(0, 0, 0, 0);

  // Tanggal boleh makan lagi = tanggal makan terakhir + 14 hari
  const nextDate = new Date(lastDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const diffTime = nextDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.min(14, Math.max(0, 14 - daysRemaining));
  const progressPercent = Math.round((daysPassed / 14) * 100);

  const formattedDate = nextDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const shortDate = nextDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });

  // Jika sudah melewati 14 hari
  if (daysRemaining <= 0) {
    return {
      canEatNow: true,
      badgeText: 'Jeda 14 Hari Selesai 🎉',
      badgeColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
      headline: 'Jeda 14 Hari Selesai, Sudah Boleh Makan Mie Lagi! 🍜',
      subline: 'Periode jeda 2 minggu sudah tuntas. Silakan mulai siklus baru atau nikmati jatah berikutnya.',
      daysRemaining: 0,
      daysPassed: 14,
      progressPercent: 100,
      nextDateFormatted: 'Sekarang (Sudah Boleh)',
      shortDate
    };
  }

  return {
    canEatNow: false,
    badgeText: `Tersisa ${daysRemaining} Hari Lagi`,
    badgeColor: 'bg-secondary-fixed text-on-secondary-fixed',
    headline: `Boleh Makan Lagi: ${formattedDate}`,
    subline: `Tersisa ${daysRemaining} hari lagi jeda sehat agar kadar natrium & retensi air tubuh kembali optimal.`,
    daysRemaining,
    daysPassed,
    progressPercent,
    nextDateFormatted: formattedDate,
    shortDate
  };
}
