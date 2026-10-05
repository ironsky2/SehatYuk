import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'sehat_yuk_app_data_v1';

const defaultState = {
  profile: {
    name: 'Bunda Sarah',
    avatar: '/avatar.png',
    age: 30,
    isNursing: true,
    height: 158,
    startWeight: 65.0,
    currentWeight: 62.8,
    targetWeight: 59.0,
    waistCircumference: 82,
    hpht: '2026-10-01',
    cycleLength: 28,
    ifStart: '11:00',
    ifEnd: '19:00',
    dailyCalorieTarget: 1300,
    bmr: 1450,
    tdee: 1800,
    city: 'Jakarta Selatan',
    coords: { lat: -6.2615, lng: 106.8106 }
  },
  meals: [
    {
      id: 1,
      name: 'Nasi merah 1 centong, telur dadar, tumis buncis',
      calories: 380,
      timeCategory: 'Sahur',
      time: '04:00',
      portion: 'Sedang (1.0x)',
      portionMultiplier: 1.0,
      icon: 'wb_twilight'
    },
    {
      id: 2,
      name: 'Oatmeal kurma & susu almond laktasi',
      calories: 200,
      timeCategory: 'Makan 1',
      time: '12:30',
      portion: 'Sedang (1.0x)',
      portionMultiplier: 1.0,
      icon: 'bakery_dining'
    },
    {
      id: 3,
      name: '3 butir kurma ajwa + 500ml air hangat',
      calories: 60,
      timeCategory: 'Takjil / Camilan',
      time: '17:52',
      portion: 'Kecil (0.5x)',
      portionMultiplier: 0.5,
      icon: 'nutrition'
    },
    {
      id: 4,
      name: 'Sup ayam jagung bening & tahu kukus',
      calories: 310,
      timeCategory: 'Buka Puasa',
      time: '18:15',
      portion: 'Sedang (1.0x)',
      portionMultiplier: 1.0,
      icon: 'soup_kitchen'
    }
  ],
  waterGlasses: 6, // 6/8 gelas (1.8 / 2.5L)
  exercises: [
    {
      id: 1,
      name: 'Jalan Santai + Baby Stroller',
      type: 'Jalan Santai',
      duration: 25,
      intensity: 'Sedang',
      caloriesBurned: 75,
      time: '16:30',
      date: '2026-10-05'
    }
  ],
  exerciseDaysCompleted: 4, // 4 dari 5 hari target
  mieTracker: {
    quota: 1,
    consumed: 0,
    period: '1 Okt - 14 Okt 2026',
    lastEaten: '28 September 2026'
  },
  weightLogs: [
    { week: 'Mg 1', weight: 65.0, waist: 86, date: '1 Okt' },
    { week: 'Mg 2', weight: 64.3, waist: 85, date: '8 Okt' },
    { week: 'Mg 3', weight: 63.5, waist: 83, date: '15 Okt' },
    { week: 'Mg 4', weight: 62.8, waist: 82, date: '22 Okt' }
  ],
  fastingMode: 'sunnah', // 'sunnah' or 'if'
  isPuasaSunnahActive: true,
  streaks: [true, true, true, true, true, false], // 6 slots: Sen1, Kam1, Sen2, Kam2, Sen3, Kam3
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
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load stored state:', e);
    }
    return defaultState;
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inAppAlert, setInAppAlert] = useState(null); // { title, body, time }
  const [activeTab, setActiveTab] = useState('beranda'); // 'beranda' | 'makan' | 'if-dan-puasa' | 'siklus' | 'progress'
  const [quickMealModalOpen, setQuickMealModalOpen] = useState(false);
  const [hasAlertedOverLimit, setHasAlertedOverLimit] = useState(false);

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

  // Check calories alert whenever meals change (single trigger, prevent spam loop)
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

  function showNotification(title, body) {
    setInAppAlert({ title, body, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/logo.png'
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          showNotification('Notifikasi Diaktifkan 🌸', 'Bunda akan menerima pengingat sahur, buka, kalori, dan IF tepat waktu.');
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
      type: exercise.type || 'Jalan Santai',
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

  return (
    <AppContext.Provider
      value={{
        data,
        isOnline,
        isSyncing,
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
