import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { triggerSystemNotification, playNotificationSound } from '../utils/notificationSound';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser, getCurrentUser } from '../services/supabase';
import { localDateStr, startOfWeekStr, formatDateLabel } from '../utils/dateUtils';

const STORAGE_KEY = 'sehat_yuk_app_data_v3';

const defaultState = {
  profile: {
    name: 'Bunda',
    avatar: '/avatar.png',
    age: 30,
    isNursing: false, // Tidak menyusui sesuai update PRD
    height: 158,
    startWeight: 65.0,
    currentWeight: 65.0,
    targetWeight: 59.0,
    waistCircumference: 84,
    hpht: '2026-09-23', // Haid mulai 23 Sept
    periodEnd: '2026-10-01', // Selesai 1 Okt
    periodDuration: 9,
    cycleLength: 28,
    ifStart: '11:00',
    ifEnd: '19:00',
    dailyCalorieTarget: 1300,
    bmr: 1380,
    tdee: 1650,
    city: 'Jakarta Selatan',
    coords: { lat: -6.2615, lng: 106.8106 }
  },
  meals: [], // Bersih tanpa data dummy
  waterGlasses: 0, // Mulai dari 0 gelas
  waterDate: localDateStr(), // Tanggal catatan air minum (reset otomatis tiap hari)
  exercises: [], // Bersih tanpa data dummy
  exerciseDaysCompleted: 0, // Diturunkan dari riwayat olahraga minggu berjalan
  mieTracker: {
    quota: 1,
    consumed: 0,
    period: '1 Okt - 14 Okt 2026',
    lastEaten: null
  },
  weightLogs: [], // Bersih tanpa data dummy
  fastingMode: 'sunnah', // 'sunnah' or 'if'
  isPuasaSunnahActive: true,
  streaks: [false, false, false, false, false, false],
  notifications: {
    eatingWindow: true,
    puasaSunnah: true,
    calorieAlert: true,
    weighIn: true,
    hormone: true,
    exercise: true
  }
};

const AppContext = createContext(null);

// Gabungkan data tersimpan/impor dengan struktur default agar tidak ada field yang hilang.
function normalizeData(parsed) {
  const today = localDateStr();
  const meals = (Array.isArray(parsed.meals) ? parsed.meals : []).map((m) => ({
    ...m,
    date: m.date || localDateStr(new Date(Number(m.id) || Date.now()))
  }));
  const sameDayWater = parsed.waterDate === today;
  return {
    ...defaultState,
    ...parsed,
    profile: {
      ...defaultState.profile,
      ...parsed.profile,
      coords: {
        lat: parsed.profile?.coords?.lat ?? defaultState.profile.coords.lat,
        lng: parsed.profile?.coords?.lng ?? defaultState.profile.coords.lng
      },
      isNursing: false,
      hpht: parsed.profile?.hpht || defaultState.profile.hpht,
      periodEnd: parsed.profile?.periodEnd || defaultState.profile.periodEnd,
      periodDuration: 9
    },
    mieTracker: { ...defaultState.mieTracker, ...parsed.mieTracker },
    notifications: { ...defaultState.notifications, ...parsed.notifications },
    meals,
    exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
    weightLogs: Array.isArray(parsed.weightLogs) ? parsed.weightLogs : [],
    waterGlasses: sameDayWater ? Number(parsed.waterGlasses) || 0 : 0,
    waterDate: today
  };
}

// Hitung ulang BMR (Mifflin-St Jeor, wanita) & TDEE (aktivitas ringan-rendah)
function computeEnergy(profile) {
  const w = Number(profile.currentWeight);
  const h = Number(profile.height);
  const a = Number(profile.age);
  if (!(w > 0 && h > 0 && a > 0)) return {};
  const bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);
  return { bmr, tdee: Math.round(bmr * 1.2) };
}

export function AppProvider({ children }) {
  const [rawData, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return normalizeData(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load stored state:', e);
    }
    return { ...defaultState, waterDate: localDateStr() };
  });

  // Tanggal hari ini (diperbarui otomatis saat lewat tengah malam)
  const [today, setToday] = useState(localDateStr());
  const [selectedDate, setSelectedDate] = useState(localDateStr());

  useEffect(() => {
    const id = setInterval(() => {
      const now = localDateStr();
      setToday((prev) => {
        if (prev !== now) {
          setSelectedDate((sel) => (sel === prev ? now : sel));
          return now;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Nilai turunan: air minum hari ini & hari olahraga minggu ini
  const weekStart = startOfWeekStr();
  const exerciseDays = new Set(
    rawData.exercises.filter((e) => e.date >= weekStart && e.date <= today).map((e) => e.date)
  ).size;
  const data = {
    ...rawData,
    waterGlasses: rawData.waterDate === today ? rawData.waterGlasses : 0,
    exerciseDaysCompleted: Math.min(exerciseDays, 5)
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inAppAlert, setInAppAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('beranda');
  const [quickMealModalOpen, setQuickMealModalOpen] = useState(false);
  const [hasAlertedOverLimit, setHasAlertedOverLimit] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    try {
      return localStorage.getItem('sehat_yuk_onboarding_completed') === 'true';
    } catch {
      return false;
    }
  });

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    try {
      localStorage.setItem('sehat_yuk_onboarding_completed', 'true');
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    try {
      localStorage.removeItem('sehat_yuk_onboarding_completed');
    } catch (e) {
      console.error('Failed to reset onboarding state:', e);
    }
  };

  // Terapkan nama/foto Google ke profil, tapi jangan timpa nama yang sudah diubah manual
  const applyAuthProfile = (user) => {
    if (!user?.user_metadata?.full_name) return;
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: prev.profile.nameCustom ? prev.profile.name : user.user_metadata.full_name,
        avatar: user.user_metadata.avatar_url || prev.profile.avatar
      }
    }));
  };

  // Check Supabase Auth state and listen to login changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      getCurrentUser()
        .then((user) => {
          if (user) {
            setAuthUser(user);
            applyAuthProfile(user);
          }
        })
        .catch((err) => {
          console.warn('Auth get user error:', err);
        });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        applyAuthProfile(user);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch (err) {
      console.warn('Supabase auth listener initialization error:', err);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [rawData]);

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSyncToast('Koneksi pulih. Data otomatis tersinkron!');
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerSyncToast('Bunda sedang offline. Data tetap tersimpan aman di HP.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Kalori hari ini (hanya makanan bertanggal hari ini)
  const todayMeals = data.meals.filter((m) => m.date === today);
  const totalCalories = todayMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
  const calorieTarget = data.profile.dailyCalorieTarget || 1300;
  const isOverCalorieLimit = totalCalories > calorieTarget;

  // Kalori pada tanggal yang sedang dilihat di layar Makan
  const selectedMeals = data.meals.filter((m) => m.date === selectedDate);
  const selectedCalories = selectedMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);

  // Check calories alert whenever meals change (single trigger, with outside-app push & chime sound)
  const calorieAlertEnabled = data.notifications?.calorieAlert !== false;

  useEffect(() => {
    if (isOverCalorieLimit && !hasAlertedOverLimit) {
      if (calorieAlertEnabled) {
        showNotification(
          '⚠️ Peringatan Kalori!',
          `Kalori hari ini sudah melebihi target (${totalCalories.toLocaleString()} / ${calorieTarget.toLocaleString()} kkal). Istirahatkan pencernaan ya Bunda 🌸`
        );
      }
      setHasAlertedOverLimit(true);
    } else if (!isOverCalorieLimit && hasAlertedOverLimit) {
      setHasAlertedOverLimit(false);
    }
  }, [totalCalories, calorieTarget, isOverCalorieLimit, hasAlertedOverLimit, calorieAlertEnabled]);

  function triggerSyncToast(message) {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  }

  // Dual notification: In-App visual banner + Outside application system tray & offline bell chime sound
  function showNotification(title, body) {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setInAppAlert({ title, body, time: timeStr });
    triggerSystemNotification(title, body);
  }

  function requestNotificationPermission() {
    playNotificationSound();
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          showNotification(
            'Notifikasi Aktif 🔔',
            'Suara bel dan pengingat di luar aplikasi telah aktif. Bunda akan diingatkan tepat waktu!'
          );
        }
      });
    }
  }

  // Action methods
  const addMeal = (newMeal) => {
    const mealDate = newMeal.date || localDateStr();
    const isToday = mealDate === localDateStr();
    const item = {
      id: Date.now(),
      name: newMeal.name,
      calories: Math.round(Number(newMeal.calories) * (Number(newMeal.portionMultiplier) || 1)),
      timeCategory: newMeal.timeCategory || 'Makan 1',
      date: mealDate,
      time: isToday
        ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
        : '',
      portion: newMeal.portionName || 'Sedang (1.0x)',
      portionMultiplier: Number(newMeal.portionMultiplier) || 1.0,
      icon: getIconForCategory(newMeal.timeCategory)
    };

    setData((prev) => ({
      ...prev,
      meals: [item, ...prev.meals]
    }));

    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#b90538', '#fe7488', '#00855b']
    });
  };

  const deleteMeal = (id) => {
    setData((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== id)
    }));
  };

  const editMeal = (id, updatedFields) => {
    setData((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === id ? { ...m, ...updatedFields } : m))
    }));
  };

  const addWaterGlass = () => {
    setData((prev) => {
      const todayNow = localDateStr();
      const base = prev.waterDate === todayNow ? prev.waterGlasses : 0;
      const next = Math.min(base + 1, 12);
      if (next === 8) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00855b', '#4edea3', '#b90538']
        });
        showNotification('Target Hidrasi Tercapai! 💧', 'Alhamdulillah, 8 gelas (2 Liter) air hari ini sudah terpenuhi.');
      }
      return { ...prev, waterGlasses: next, waterDate: todayNow };
    });
  };

  const resetWater = () => {
    setData((prev) => ({ ...prev, waterGlasses: 0, waterDate: localDateStr() }));
  };

  const consumeMie = () => {
    if (data.mieTracker.quota <= 0) {
      alert('⛔ Jatah mie periode ini sudah habis! Tahan dulu ya Bunda 💪');
      return false;
    }
    setData((prev) => ({
      ...prev,
      mieTracker: {
        ...prev.mieTracker,
        quota: 0,
        consumed: prev.mieTracker.consumed + 1,
        lastEaten: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      }
    }));
    return true;
  };

  const resetMieTracker = () => {
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const periodStr = `${today.getDate()} ${today.toLocaleDateString('id-ID', { month: 'short' })} - ${twoWeeksLater.getDate()} ${twoWeeksLater.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
    setData((prev) => ({
      ...prev,
      mieTracker: {
        quota: 1,
        consumed: 0,
        period: periodStr,
        lastEaten: prev.mieTracker.lastEaten || 'Belum ada'
      }
    }));
    showNotification('Siklus Mie Baru Dimulai 🍜', `Periode baru (${periodStr}) aktif dengan 1 kuota mie.`);
  };

  const addWeightLog = (weight, waist, dateStr) => {
    const numWeight = parseFloat(weight);
    const numWaist = parseFloat(waist);
    if (!Number.isFinite(numWeight) || numWeight <= 0) return false;
    const dateISO = dateStr || localDateStr();

    setData((prev) => {
      const waistValue = Number.isFinite(numWaist) && numWaist > 0 ? numWaist : prev.profile.waistCircumference;
      // Satu catatan per tanggal: catatan baru menggantikan yang lama di tanggal sama
      const merged = [
        ...prev.weightLogs.filter((l) => l.dateISO !== dateISO),
        {
          weight: numWeight,
          waist: waistValue,
          dateISO,
          date: formatDateLabel(dateISO, { day: 'numeric', month: 'short' })
        }
      ]
        .sort((a, b) => String(a.dateISO || '').localeCompare(String(b.dateISO || '')))
        .map((l, i) => ({ ...l, week: `Mg ${i + 1}` }));

      const latest = merged[merged.length - 1];
      const profile = {
        ...prev.profile,
        currentWeight: latest.weight,
        waistCircumference: latest.waist
      };
      return { ...prev, profile: { ...profile, ...computeEnergy(profile) }, weightLogs: merged };
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#b90538', '#dc2c4f', '#6ffbbe']
    });
    return true;
  };

  const addExercise = (exercise) => {
    const exDate = exercise.date || localDateStr();
    const isToday = exDate === localDateStr();
    const item = {
      id: Date.now(),
      name: exercise.name,
      type: exercise.type || 'Brisk Walking',
      duration: Number(exercise.duration) || 20,
      intensity: exercise.intensity || 'Sedang',
      caloriesBurned: Number(exercise.caloriesBurned) || 60,
      time: isToday
        ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
        : '',
      date: exDate
    };

    setData((prev) => ({
      ...prev,
      exercises: [item, ...prev.exercises]
    }));

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.75 },
      colors: ['#00855b', '#4edea3']
    });
  };

  const updateProfile = (fields) => {
    setData((prev) => {
      const profile = { ...prev.profile, ...fields };
      if ('name' in fields) profile.nameCustom = true;
      return { ...prev, profile: { ...profile, ...computeEnergy(profile) } };
    });
  };

  const togglePuasaSunnah = () => {
    setData((prev) => ({
      ...prev,
      isPuasaSunnahActive: !prev.isPuasaSunnahActive
    }));
  };

  const setFastingMode = (mode) => {
    setData((prev) => ({
      ...prev,
      fastingMode: mode
    }));
  };

  const toggleNotification = (key) => {
    setData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const exportData = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sehat_yuk_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Backup Berhasil 💾', 'File data JSON telah diunduh ke perangkat.');
  };

  const importData = (importedJson) => {
    try {
      const parsed = typeof importedJson === 'string' ? JSON.parse(importedJson) : importedJson;
      if (!parsed.profile || !parsed.meals) {
        throw new Error('Format data tidak valid');
      }
      setData(normalizeData(parsed));
      showNotification('Data Dipulihkan 🔄', 'Semua riwayat kalori, berat badan, dan profil berhasil dimuat.');
      return true;
    } catch (err) {
      alert('Gagal memulihkan data: Format file JSON tidak sesuai.');
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase belum dikonfigurasi di file .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY). Silakan masukkan key Supabase Anda terlebih dahulu!');
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      alert('Gagal menghubungkan Google: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setAuthUser(null);
    showNotification('Berhasil Keluar', 'Sesi akun Google telah diakhiri.');
  };

  const clearAllData = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data dan memulai dari catatan baru?')) {
      localStorage.removeItem(STORAGE_KEY);
      setData({ ...defaultState, waterDate: localDateStr() });
      showNotification('Data Dibersihkan 🧹', 'Seluruh data telah di-reset. Anda dapat mulai mengisi data riil baru!');
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        isOnline,
        isSyncing,
        authUser,
        isSupabaseConfigured,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
        handleGoogleSignIn,
        handleSignOut,
        clearAllData,
        activeTab,
        setActiveTab,
        inAppAlert,
        setInAppAlert,
        quickMealModalOpen,
        setQuickMealModalOpen,
        totalCalories,
        todayMeals,
        today,
        selectedDate,
        setSelectedDate,
        selectedMeals,
        selectedCalories,
        calorieTarget,
        isOverCalorieLimit,
        addMeal,
        deleteMeal,
        editMeal,
        addWaterGlass,
        resetWater,
        consumeMie,
        resetMieTracker,
        addWeightLog,
        addExercise,
        updateProfile,
        togglePuasaSunnah,
        setFastingMode,
        toggleNotification,
        requestNotificationPermission,
        showNotification,
        playNotificationSound,
        exportData,
        importData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

function getIconForCategory(cat) {
  switch (cat) {
    case 'Sahur':
      return 'wb_twilight';
    case 'Buka Puasa':
      return 'soup_kitchen';
    case 'Takjil / Camilan':
    case 'Snack Siang':
      return 'nutrition';
    case 'Makan Malam':
      return 'dinner_dining';
    default:
      return 'bakery_dining';
  }
}
