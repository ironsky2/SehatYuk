import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getPrayerTimesForDate, INDONESIAN_CITIES } from '../utils/prayerTimes';
import confetti from 'canvas-confetti';

export default function FastingScreen() {
  const { data, updateProfile, showNotification, isFastingActive, toggleFastingActive } = useApp();

  const [mode, setMode] = useState(data.fastingMode || 'sunnah');
  const [activeDoaTab, setActiveDoaTab] = useState('buka');
  const [sahurReminderActive, setSahurReminderActive] = useState(true);

  // Prayer times
  const [prayerTimes, setPrayerTimes] = useState(() =>
    getPrayerTimesForDate(new Date(), data.profile?.coords?.lat, data.profile?.coords?.lng)
  );

  const [maghribCountdown, setMaghribCountdown] = useState('02:18:45');
  const [fastingProgress, setFastingProgress] = useState(82);
  const [fastingPhaseLabel, setFastingPhaseLabel] = useState('Menuju Waktu Berbuka');
  const [ifCountdown, setIfCountdown] = useState('04:32:10');
  const [isEatingWindowOpen, setIsEatingWindowOpen] = useState(false);
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);
  const [copiedDoa, setCopiedDoa] = useState(false);

  // Recalculate prayer times if coordinates change
  useEffect(() => {
    setPrayerTimes(getPrayerTimesForDate(new Date(), data.profile?.coords?.lat, data.profile?.coords?.lng));
  }, [data.profile?.coords]);

  // Real-time ticking timers
  useEffect(() => {
    const tick = () => {
      const now = new Date();

      // 1. Maghrib countdown & dynamic progress
      const imsakDate = prayerTimes.raw.imsak;
      const maghribDate = prayerTimes.raw.maghrib;
      const totalDuration = maghribDate.getTime() - imsakDate.getTime();

      if (now < imsakDate) {
        setFastingPhaseLabel('Menuju Waktu Imsak');
        let diffImsak = imsakDate.getTime() - now.getTime();
        const h = Math.floor(diffImsak / 3600000);
        const m = Math.floor((diffImsak % 3600000) / 60000);
        const s = Math.floor((diffImsak % 60000) / 1000);
        setMaghribCountdown(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
        setFastingProgress(0);
      } else if (now >= imsakDate && now < maghribDate) {
        setFastingPhaseLabel('Menuju Waktu Berbuka');
        let diffMaghrib = maghribDate.getTime() - now.getTime();
        const h = Math.floor(diffMaghrib / 3600000);
        const m = Math.floor((diffMaghrib % 3600000) / 60000);
        const s = Math.floor((diffMaghrib % 60000) / 1000);
        setMaghribCountdown(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
        const elapsed = now.getTime() - imsakDate.getTime();
        const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
        setFastingProgress(pct);
      } else {
        setFastingPhaseLabel('Waktu Berbuka Tiba');
        setMaghribCountdown('Alhamdulillah Buka!');
        setFastingProgress(100);
      }

      // 2. IF 16:8 countdown
      const [startH, startM] = (data.profile?.ifStart || '11:00').split(':').map(Number);
      const [endH, endM] = (data.profile?.ifEnd || '19:00').split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(startH, startM, 0, 0);

      const endDate = new Date();
      endDate.setHours(endH, endM, 0, 0);

      if (now >= startDate && now < endDate) {
        setIsEatingWindowOpen(true);
        let rem = endDate.getTime() - now.getTime();
        const h = Math.floor(rem / 3600000);
        const m = Math.floor((rem % 3600000) / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        setIfCountdown(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
      } else {
        setIsEatingWindowOpen(false);
        let nextStart = new Date(startDate);
        if (now >= endDate) {
          nextStart.setDate(nextStart.getDate() + 1);
        }
        let rem = nextStart.getTime() - now.getTime();
        const h = Math.floor(rem / 3600000);
        const m = Math.floor((rem % 3600000) / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        setIfCountdown(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes, data.profile?.ifStart, data.profile?.ifEnd]);

  const handleCityChange = (city) => {
    updateProfile({
      city: city.name,
      coords: { lat: city.lat, lng: city.lng }
    });
    setCitySelectorOpen(false);
  };

  const handleLogNiat = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00855b', '#4edea3', '#b90538']
    });
    showNotification('Niat Puasa Dicatat 🤲', 'Semoga berkah, lancar, dan tubuh Bunda senantiasa sehat bugar.');
  };

  const handleCopyDoa = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDoa(true);
    setTimeout(() => setCopiedDoa(false), 2000);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Kartu Status Aktif / Non-Aktif Puasa */}
      <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isFastingActive ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[20px]">
              {isFastingActive ? 'bedtime' : 'restaurant'}
            </span>
          </div>
          <div>
            <span className="font-label-sm text-xs font-bold text-on-surface block">
              {isFastingActive ? 'Sedang Menjalankan Puasa' : 'Sedang Tidak Berpuasa'}
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              {isFastingActive ? 'Jadwal sahur, imsak & buka puasa aktif' : 'Jadwal makan normal (diet harian)'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleFastingActive()}
          className={`px-3 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
            isFastingActive
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {isFastingActive ? 'check_circle' : 'power_settings_new'}
          </span>
          <span>{isFastingActive ? 'Aktif' : 'Aktifkan'}</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="bg-surface-container p-1 rounded-full flex items-center justify-between shadow-xs border border-outline-variant/20 relative">
        <button
          onClick={() => setMode('sunnah')}
          className={`flex-1 py-2 rounded-full font-label-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 ${
            mode === 'sunnah'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">bedtime</span>
          <span>Puasa Sunnah</span>
        </button>

        <button
          onClick={() => setMode('if')}
          className={`flex-1 py-2 rounded-full font-label-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 ${
            mode === 'if'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">timelapse</span>
          <span>IF 16:8 (Hari Biasa)</span>
        </button>
      </div>

      {/* Jika Puasa Non-Aktif, Tampilkan Banner Ramah */}
      {!isFastingActive && (
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-2.5 text-center items-center">
          <div className="w-12 h-12 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">restaurant_menu</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              Hari Ini Sedang Tidak Berpuasa
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1 max-w-xs leading-relaxed">
              Bunda dapat menikmati ritme makan normal dengan defisit kalori terarah. Klik tombol di atas jika Bunda ingin mulai berpuasa.
            </p>
          </div>
        </div>
      )}

      {/* CONTAINER: PUASA SENIN-KAMIS (F4) */}
      {mode === 'sunnah' && (
        <div className="flex flex-col gap-4">
          {/* Status & Gentle Greeting Banner */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary-fixed/30 pointer-events-none blur-xl" />
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0 shadow-xs">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                spa
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full font-label-sm text-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  Puasa Senin & Kamis
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-label-sm text-xs bg-secondary-fixed text-on-secondary-fixed font-bold">
                  Waktu Otomatis GPS
                </span>
              </div>
              <h2 className="font-headline-sm text-base text-on-surface font-extrabold mt-1 tracking-tight">
                {isFastingActive ? 'Alhamdulillah, Puasa Berjalan Lancar 🤲' : 'Jadwal Sholat & Imsakiyah Hari Ini'}
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                {isFastingActive
                  ? 'Tubuh beristirahat, jiwa lebih tenang. Niatkan karena Allah dan kesehatan diri.'
                  : 'Waktu adhan dihitung otomatis berdasarkan koordinat GPS Anda.'}
              </p>
            </div>
          </div>

          {/* Offline GPS Prayer Times Quick Bar */}
          <div className="bg-surface-container-low p-4 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-on-surface-variant">
              <div
                onClick={() => setCitySelectorOpen(!citySelectorOpen)}
                className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">my_location</span>
                <span className="font-label-sm text-xs truncate font-bold text-on-surface underline">
                  {data.profile?.city || 'Lokasi Otomatis (GPS)'}
                </span>
                <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                GPS Otomatis
              </span>
            </div>

            {/* City Selector Accordion */}
            {citySelectorOpen && (
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-2 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-xs font-bold text-on-surface">Pilih Wilayah / Kota:</span>
                  <button onClick={() => setCitySelectorOpen(false)} className="text-outline text-xs">Tutup</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {INDONESIAN_CITIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleCityChange(c)}
                      className={`text-left text-xs p-1.5 rounded-lg transition-colors ${
                        data.profile.city === c.name
                          ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                          : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="bg-surface-container-lowest p-2.5 rounded-xl flex flex-col items-center justify-center text-center shadow-xs border border-outline-variant/20">
                <span className="font-label-sm text-xs text-on-surface-variant font-medium">Imsak</span>
                <span className="font-headline-sm text-base text-on-surface font-extrabold mt-0.5">
                  {prayerTimes.imsak}
                </span>
                <span className="font-label-sm text-[10px] text-outline">WIB</span>
              </div>
              <div className="bg-surface-container-lowest p-2.5 rounded-xl flex flex-col items-center justify-center text-center shadow-xs border border-outline-variant/20">
                <span className="font-label-sm text-xs text-on-surface-variant font-medium">Subuh</span>
                <span className="font-headline-sm text-base text-on-surface font-extrabold mt-0.5">
                  {prayerTimes.subuh}
                </span>
                <span className="font-label-sm text-[10px] text-outline">WIB</span>
              </div>
              <div className="bg-primary-fixed p-2.5 rounded-xl flex flex-col items-center justify-center text-center shadow-xs border border-primary/20">
                <span className="font-label-sm text-xs text-on-primary-fixed font-bold">
                  Maghrib (Buka)
                </span>
                <span className="font-headline-sm text-base text-primary font-black mt-0.5">
                  {prayerTimes.maghrib}
                </span>
                <span className="font-label-sm text-[10px] text-on-primary-fixed-variant font-semibold">
                  WIB
                </span>
              </div>
            </div>
          </div>

          {/* Radial Countdown Dial */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_24px_-2px_rgba(244,63,94,0.08)] border border-outline-variant/30 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute w-44 h-44 rounded-full bg-secondary-container/15 blur-2xl pointer-events-none" />
            <div className="relative w-52 h-52 flex items-center justify-center my-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  className="text-surface-container"
                  cx="100"
                  cy="100"
                  fill="transparent"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                />
                <circle
                  className="text-primary-container"
                  cx="100"
                  cy="100"
                  fill="transparent"
                  r="80"
                  stroke="currentColor"
                  strokeDasharray="502.65"
                  strokeDashoffset={502.65 - (fastingProgress / 100) * 502.65}
                  strokeLinecap="round"
                  strokeWidth="12"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(220, 44, 79, 0.45))',
                    transition: 'stroke-dashoffset 1s ease'
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center px-4">
                <div className="flex items-center gap-1 text-primary mb-1">
                  <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                  <span className="font-label-sm text-[10px] font-bold tracking-wider uppercase">
                    {fastingPhaseLabel}
                  </span>
                </div>
                <span className="font-metric-display text-2xl text-on-surface font-extrabold tracking-tight">
                  {maghribCountdown}
                </span>
                <span className="font-label-sm text-[10px] text-tertiary font-bold bg-tertiary-fixed px-2.5 py-0.5 rounded-full mt-1.5 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  {fastingProgress}% Terlampaui
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2.5 mt-2 pt-2 border-t border-surface-container-low">
              <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[16px]">wb_twilight</span>
                </div>
                <div className="text-left">
                  <p className="font-label-sm text-[10px] text-on-surface-variant leading-tight">
                    Mulai Puasa
                  </p>
                  <p className="font-label-md text-xs text-on-surface font-bold">Imsak {prayerTimes.imsak}</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                </div>
                <div className="text-left">
                  <p className="font-label-sm text-[10px] text-on-surface-variant leading-tight">
                    Autofagi Sel
                  </p>
                  <p className="font-label-md text-xs text-tertiary font-bold">Fase Aktif</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 w-full mt-3">
              <button
                onClick={() => {
                  setSahurReminderActive(!sahurReminderActive);
                  showNotification(
                    sahurReminderActive ? 'Pengingat Dinonaktifkan' : 'Pengingat Aktif ⏰',
                    'Alarm sahur (03:45) & buka puasa (17:52) diaktifkan.'
                  );
                }}
                className={`flex-1 py-2.5 px-3 rounded-full font-label-md text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                  sahurReminderActive
                    ? 'bg-secondary-fixed text-on-secondary-fixed shadow-xs'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">alarm</span>
                <span>{sahurReminderActive ? 'Pengingat Buka Aktif' : 'Pasang Alarm'}</span>
              </button>
              <button
                onClick={handleLogNiat}
                className="py-2.5 px-4 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(185,5,56,0.3)] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">favorite</span>
                <span>Catat Niat</span>
              </button>
            </div>
          </div>

          {/* Islamic Cards: Niat & Doa Berbuka */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                </div>
                <h3 className="font-headline-sm text-base text-on-surface font-bold">
                  Doa & Niat Puasa
                </h3>
              </div>
              <button
                onClick={() =>
                  handleCopyDoa(
                    activeDoaTab === 'buka'
                      ? "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ - Dzahabaz zhama'u wabtallatil 'uruuqu wa tsabatal ajru in syaa Allah."
                      : "نَوَيْتُ صَوْمَ يَوْمِ الخَمِيْسِ لِلَّهِ تَعَالَى - Nawaitu shauma yaumil khamiisi lillaahi ta'aalaa."
                  )
                }
                className="font-label-sm text-[11px] text-primary font-bold flex items-center gap-0.5 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedDoa ? 'check' : 'content_copy'}
                </span>
                <span>{copiedDoa ? 'Disalin!' : 'Salin Teks'}</span>
              </button>
            </div>

            {/* Tabs inside Niat Card */}
            <div className="bg-surface-container-low p-1 rounded-full flex gap-1 border border-outline-variant/20">
              <button
                onClick={() => setActiveDoaTab('buka')}
                className={`flex-1 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all ${
                  activeDoaTab === 'buka'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Doa Berbuka Puasa
              </button>
              <button
                onClick={() => setActiveDoaTab('niat')}
                className={`flex-1 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all ${
                  activeDoaTab === 'niat'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Niat Puasa Sunnah
              </button>
            </div>

            {/* Doa Berbuka Content */}
            {activeDoaTab === 'buka' ? (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-surface-container-low rounded-xl text-right border border-outline-variant/20">
                  <p className="font-headline-sm text-lg leading-loose text-on-surface font-semibold tracking-wide" dir="rtl">
                    ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ
                  </p>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant italic">
                  "Dzahabaz zhama'u wabtallatil 'uruuqu wa tsabatal ajru in syaa Allah."
                </p>
                <p className="font-body-sm text-xs text-on-surface font-medium bg-secondary-fixed/40 p-2.5 rounded-xl border border-secondary/20">
                  <span className="font-bold text-primary">Artinya:</span> "Telah hilang dahaga, telah basah urat-urat dan telah pasti pahala, insya Allah." (HR. Abu Daud no. 2357).
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-surface-container-low rounded-xl text-right border border-outline-variant/20">
                  <p className="font-headline-sm text-lg leading-loose text-on-surface font-semibold tracking-wide" dir="rtl">
                    نَوَيْتُ صَوْمَ يَوْمِ الخَمِيْسِ / الإِثْنَيْنِ لِلَّهِ تَعَالَى
                  </p>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant italic">
                  "Nawaitu shauma yaumil khamiisi / yaumil itsnaini lillaahi ta'aalaa."
                </p>
                <p className="font-body-sm text-xs text-on-surface font-medium bg-secondary-fixed/40 p-2.5 rounded-xl border border-secondary/20">
                  <span className="font-bold text-primary">Artinya:</span> "Saya niat puasa hari Senin/Kamis karena Allah Ta'ala."
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant text-xs border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
              <span className="font-label-sm">
                Disunnahkan berbuka dengan kurma basah (*ruthab*) atau seteguk air putih hangat.
              </span>
            </div>
          </div>

          {/* 3-Week Streak Tracker */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="material-symbols-outlined text-[20px] text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold tracking-tight">
                  Streak Istiqomah
                </h3>
              </div>
              <span className="font-label-sm text-xs text-primary font-bold bg-primary-fixed px-2.5 py-0.5 rounded-full">
                Level 3 (3 Minggu)
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <p className="font-headline-sm text-sm text-on-surface font-bold leading-snug">
                🔥 3 Minggu Berturut-turut Puasa Senin & Kamis Terpenuhi!
              </p>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Konsistensi Anda menjaga metabolisme insulin tetap sensitif dan pencernaan bersih.
              </p>

              {/* Visual Days Streak */}
              <div className="grid grid-cols-6 gap-1.5 mt-3">
                {['Sen 1', 'Kam 1', 'Sen 2', 'Kam 2', 'Sen 3', 'Kam 3'].map((day, idx) => (
                  <div
                    key={day}
                    className={`flex flex-col items-center p-2 rounded-xl text-xs ${
                      idx < 5
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                        : 'bg-primary text-on-primary shadow-xs font-bold animate-pulse'
                    }`}
                  >
                    <span>{day}</span>
                    <span
                      className="material-symbols-outlined text-[16px] mt-0.5"
                      style={idx < 5 ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {idx < 5 ? 'check' : 'hourglass_bottom'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTAINER: INTERMITTENT FASTING (F3) */}
      {mode === 'if' && (
        <div className="flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-primary shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-on-surface font-bold">
                    Intermittent Fasting 16:8
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Protokol Hari Kerja & Non-Puasa Sunnah
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-label-sm text-xs bg-surface-container text-on-surface-variant font-bold">
                Standar
              </span>
            </div>

            {/* Eating Window Card */}
            <div className="p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-2 border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-xs text-on-surface font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">restaurant</span>
                  Jendela Makan (8 Jam):
                </span>
                <span className="font-headline-sm text-base font-extrabold text-primary">
                  {data.profile.ifStart} – {data.profile.ifEnd} WIB
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                Boleh makan di rentang jam ini. Di luar jendela, puasa kalori (minum air putih, teh tawar, atau kopi hitam diperbolehkan).
              </p>
            </div>

            {/* Status Dial */}
            <div className="p-5 bg-surface-container-low rounded-xl flex flex-col items-center text-center my-1 border border-outline-variant/20">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-xs font-bold mb-2 shadow-xs ${
                  isEatingWindowOpen
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : 'bg-primary-fixed text-on-primary-fixed'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isEatingWindowOpen ? 'bg-tertiary animate-pulse' : 'bg-primary animate-pulse'
                  }`}
                />
                {isEatingWindowOpen ? '🟢 Boleh Makan (Window Terbuka)' : '🔴 Sedang Puasa IF'}
              </div>
              <span className="font-metric-display text-2xl font-black text-on-surface">
                {ifCountdown}
              </span>
              <span className="text-[11px] text-on-surface-variant mt-1">
                {isEatingWindowOpen ? 'Sisa Waktu Jendela Makan' : 'Menuju Jendela Makan Berikutnya'}
              </span>
            </div>

            {/* Notification Schedule List */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-label-sm text-xs font-bold text-on-surface">
                Jadwal Pengingat Otomatis IF:
              </span>
              <div className="p-2.5 rounded-xl bg-surface-container-low text-xs flex justify-between items-center border border-outline-variant/20">
                <span className="font-bold text-primary">⏰ 11:00 WIB</span>
                <span className="text-on-surface-variant">Eating window dimulai! Boleh makan 🍽️</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low text-xs flex justify-between items-center border border-outline-variant/20">
                <span className="font-bold text-secondary">⏰ 18:30 WIB</span>
                <span className="text-on-surface-variant">30 menit lagi eating window tutup</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low text-xs flex justify-between items-center border border-outline-variant/20">
                <span className="font-bold text-outline">⏰ 19:00 WIB</span>
                <span className="text-on-surface-variant">Eating window tutup. Mulai puasa IF 💪</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
