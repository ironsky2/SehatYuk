import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { triggerSystemNotification, playNotificationSound } from '../utils/notificationSound';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser, getCurrentUser } from '../services/supabase';

const STORAGE_KEY = 'sehat_yuk_app_data_v3';

const defaultState = {
  profile: {
    name: 'Bunda Sarah',
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
  exercises: [], // Bersih tanpa data dummy
  exerciseDaysCompleted: 0, // Mulai dari 0
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

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default structure and profile updates from latest requirements
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
          meals: Array.isArray(parsed.meals) ? parsed.meals : [],
          exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
          weightLogs: Array.isArray(parsed.weightLogs) ? parsed.weightLogs : []
        };
      }
    } catch (e) {
      console.error('Failed to load stored state:', e);
    }
    return defaultState;
  });

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

  // Check Supabase Auth state and listen to login changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      getCurrentUser()
        .then((user) => {
          if (user) {
            setAuthUser(user);
            if (user.user_metadata?.full_name) {
              setData((prev) => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  name: user.user_metadata.full_name || prev.profile.name,
                  avatar: user.user_metadata.avatar_url || prev.profile.avatar
                }
              }));
            }
          }
        })
        .catch((err) => {
          console.warn('Auth get user error:', err);
        });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        if (user && user.user_metadata?.full_name) {
          setData((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: user.user_metadata.full_name || prev.profile.name,
              avatar: user.user_metadata.avatar_url || prev.profile.avatar
            }
          }));
        }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [data]);

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

  // Check calories alert whenever meals change (single trigger, with outside-app push & chime sound)
  const totalCalories = data.meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
  const calorieTarget = data.profile.dailyCalorieTarget || 1300;
  const isOverCalorieLimit = totalCalories > calorieTarget;

  useEffect(() => {
    if (isOverCalorieLimit && !hasAlertedOverLimit) {
      showNotification(
        '⚠️ Peringatan Kalori!',
        `Kalori hari ini sudah melebihi target (${totalCalories.toLocaleString()} / ${calorieTarget.toLocaleString()} kkal). Istirahatkan pencernaan ya Bunda 🌸`
      );
      setHasAlertedOverLimit(true);
    } else if (!isOverCalorieLimit && hasAlertedOverLimit) {
      setHasAlertedOverLimit(false);
    }
  }, [totalCalories, calorieTarget, isOverCalorieLimit, hasAlertedOverLimit]);

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
    const item = {
      id: Date.now(),
      name: newMeal.name,
      calories: Math.round(Number(newMeal.calories) * (Number(newMeal.portionMultiplier) || 1)),
      timeCategory: newMeal.timeCategory || 'Makan 1',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
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
      const next = Math.min(prev.waterGlasses + 1, 12);
      if (next === 8) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00855b', '#4edea3', '#b90538']
        });
        showNotification('Target Hidrasi Tercapai! 💧', 'Alhamdulillah, 8 gelas (2 Liter) air hari ini sudah terpenuhi.');
      }
      return { ...prev, waterGlasses: next };
    });
  };

  const resetWater = () => {
    setData((prev) => ({ ...prev, waterGlasses: 0 }));
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

  const addWeightLog = (weight, waist) => {
    const numWeight = parseFloat(weight);
    const numWaist = parseFloat(waist);
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const weekCount = data.weightLogs.length + 1;

    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        currentWeight: numWeight,
        waistCircumference: numWaist
      },
      weightLogs: [
        ...prev.weightLogs,
        { week: `Mg ${weekCount}`, weight: numWeight, waist: numWaist, date: today }
      ]
    }));

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#b90538', '#dc2c4f', '#6ffbbe']
    });
  };

  const addExercise = (exercise) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const item = {
      id: Date.now(),
      name: exercise.name,
      type: exercise.type || 'Brisk Walking',
      duration: Number(exercise.duration) || 20,
      intensity: exercise.intensity || 'Sedang',
      caloriesBurned: Number(exercise.caloriesBurned) || 60,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
      date: todayStr
    };

    setData((prev) => {
      const hadExerciseToday = prev.exercises.some((e) => e.date === todayStr);
      const newDaysCount = hadExerciseToday ? prev.exerciseDaysCompleted : Math.min(prev.exerciseDaysCompleted + 1, 5);

      return {
        ...prev,
        exercises: [item, ...prev.exercises],
        exerciseDaysCompleted: newDaysCount
      };
    });

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.75 },
      colors: ['#00855b', '#4edea3']
    });
  };

  const resetExerciseWeek = () => {
    setData((prev) => ({
      ...prev,
      exerciseDaysCompleted: 0
    }));
    showNotification('Target Olahraga Direset 🏃', 'Target 5 hari olahraga minggu baru telah dimulai.');
  };

  const updateProfile = (fields) => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...fields
      }
    }));
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
      setData(parsed);
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
      setData(defaultState);
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
        resetExerciseWeek,
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
