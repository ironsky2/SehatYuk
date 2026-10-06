import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { triggerSystemNotification, playNotificationSound } from '../utils/notificationSound';
import {
  supabase,
  isSupabaseConfigured,
  signInWithGoogle,
  signOutUser,
  getCurrentUser,
  getStoredSession,
  syncAppState,
  fetchAppState,
  syncUserProfile,
  syncWaterLog,
  clearCloudUserData
} from '../services/supabase';
import { localDateStr, startOfWeekStr, formatDateLabel } from '../utils/dateUtils';

const STORAGE_KEY = 'sehat_yuk_app_data_v3';

const defaultState = {
  profile: {
    name: '', // Bersih tanpa data dummy
    avatar: '/avatar.png',
    age: '',
    isNursing: false,
    height: '',
    startWeight: '',
    currentWeight: '',
    targetWeight: '',
    waistCircumference: '',
    hpht: '',
    periodEnd: '',
    periodDuration: 7,
    cycleLength: 28,
    ifStart: '12:00',
    ifEnd: '20:00',
    dailyCalorieTarget: 1500,
    bmr: 1300,
    tdee: 1600,
    city: 'Lokasi Otomatis (GPS)',
    coords: { lat: -6.2, lng: 106.8 }
  },
  meals: [], // Bersih tanpa data dummy
  waterGlasses: 0,
  waterDate: localDateStr(),
  exercises: [],
  exerciseDaysCompleted: 0,
  mieTracker: {
    quota: 1,
    consumed: 0,
    period: 'Periode Berjalan',
    lastEaten: null
  },
  weightLogs: [],
  fastingMode: 'sunnah', // 'sunnah' or 'if'
  isFastingActive: true, // Puasa dapat diaktifkan / dinonaktifkan
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
  const meals = (Array.isArray(parsed?.meals) ? parsed.meals : []).map((m) => ({
    ...m,
    date: m.date || localDateStr(new Date(Number(m.id) || Date.now()))
  }));
  const sameDayWater = parsed?.waterDate === today;
  return {
    ...defaultState,
    ...parsed,
    profile: {
      ...defaultState.profile,
      ...(parsed?.profile || {}),
      name: parsed?.profile?.name || '',
      coords: {
        lat: parsed?.profile?.coords?.lat ?? defaultState.profile.coords.lat,
        lng: parsed?.profile?.coords?.lng ?? defaultState.profile.coords.lng
      },
      isNursing: Boolean(parsed?.profile?.isNursing),
      hpht: parsed?.profile?.hpht || '',
      periodEnd: parsed?.profile?.periodEnd || '',
      periodDuration: Number(parsed?.profile?.periodDuration) || 7,
      cycleLength: Number(parsed?.profile?.cycleLength) || 28
    },
    mieTracker: { ...defaultState.mieTracker, ...(parsed?.mieTracker || {}) },
    notifications: { ...defaultState.notifications, ...(parsed?.notifications || {}) },
    meals,
    exercises: Array.isArray(parsed?.exercises) ? parsed.exercises : [],
    weightLogs: Array.isArray(parsed?.weightLogs) ? parsed.weightLogs : [],
    waterGlasses: sameDayWater ? Number(parsed.waterGlasses) || 0 : 0,
    waterDate: today,
    isFastingActive: parsed?.isFastingActive !== false
  };
}

// Hitung ulang BMR (Mifflin-St Jeor, wanita) & TDEE (aktivitas ringan-rendah)
function computeEnergy(profile) {
  const w = Number(profile.currentWeight);
  const h = Number(profile.height);
  const a = Number(profile.age);
  if (!(w > 0 && h > 0 && a > 0)) {
    return { bmr: 1300, tdee: 1600 };
  }
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
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [inAppAlert, setInAppAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('beranda');
  const [quickMealModalOpen, setQuickMealModalOpen] = useState(false);
  const [hasAlertedOverLimit, setHasAlertedOverLimit] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(isSupabaseConfigured));
  const [isGuestMode, setIsGuestMode] = useState(() => {
    try {
      return sessionStorage.getItem('sehat_yuk_guest_session') === 'true';
    } catch {
      return false;
    }
  });
  const isInitialSyncDone = useRef(false);

  const continueAsGuest = () => {
    setIsGuestMode(true);
    try {
      sessionStorage.setItem('sehat_yuk_guest_session', 'true');
    } catch (e) {
      console.warn('SessionStorage error:', e);
    }
  };

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

  // Sinkronisasi data ke Cloud Supabase (user_state, profiles, water_logs)
  const syncToCloud = async (stateToSync, user = authUser) => {
    if (!isSupabaseConfigured || !user || !navigator.onLine) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      await Promise.allSettled([
        syncAppState(stateToSync),
        syncUserProfile(stateToSync.profile),
        syncWaterLog(
          stateToSync.waterDate === today ? stateToSync.waterGlasses : 0,
          stateToSync.waterDate || today
        )
      ]);
      setSyncStatus('synced');
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(timeStr);
    } catch (err) {
      console.warn('Sync to cloud error:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Ambil data dari Cloud Supabase saat login pertama kali
  const loadCloudData = async (user) => {
    if (!isSupabaseConfigured || !user) return;
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      const remoteState = await fetchAppState();
      if (
        remoteState &&
        (remoteState.meals?.length ||
          remoteState.weightLogs?.length ||
          remoteState.exercises?.length ||
          remoteState.profile?.nameCustom)
      ) {
        setData((local) => {
          const localMealIds = new Set(local.meals.map((m) => m.id));
          const remoteMeals = Array.isArray(remoteState.meals) ? remoteState.meals : [];
          const mergedMeals = [
            ...local.meals,
            ...remoteMeals.filter((m) => !localMealIds.has(m.id))
          ].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

          const localWeightDates = new Set(local.weightLogs.map((w) => w.dateISO));
          const remoteWeights = Array.isArray(remoteState.weightLogs) ? remoteState.weightLogs : [];
          const mergedWeights = [
            ...local.weightLogs,
            ...remoteWeights.filter((w) => !localWeightDates.has(w.dateISO))
          ].sort((a, b) => String(a.dateISO || '').localeCompare(String(b.dateISO || '')));

          const localExIds = new Set(local.exercises.map((e) => e.id));
          const remoteEx = Array.isArray(remoteState.exercises) ? remoteState.exercises : [];
          const mergedExercises = [
            ...local.exercises,
            ...remoteEx.filter((e) => !localExIds.has(e.id))
          ];

          return normalizeData({
            ...defaultState,
            ...remoteState,
            ...local,
            profile: {
              ...defaultState.profile,
              ...remoteState.profile,
              ...local.profile
            },
            meals: mergedMeals,
            weightLogs: mergedWeights,
            exercises: mergedExercises
          });
        });
        showNotification('Data Cloud Terhubung ☁️', 'Catatan kalori, berat badan, dan profil Bunda berhasil disinkronkan.');
      } else {
        // Upload initial local data to cloud
        await syncToCloud(rawData, user);
      }
      setSyncStatus('synced');
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(timeStr);
    } catch (err) {
      console.warn('Load cloud data error:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sinkronisasi manual dari tombol antarmuka
  const triggerManualSync = async () => {
    if (!authUser) {
      showNotification('Masuk Akun Diperlukan 🌸', 'Silakan masuk dengan Google untuk sinkronisasi data cloud.');
      return;
    }
    await syncToCloud(rawData, authUser);
    showNotification('Sinkronisasi Selesai ☁️', 'Catatan kesehatan Bunda berhasil disinkronkan ke Cloud!');
  };

  // Check Supabase Auth state, restore session, and listen to login changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    try {
      getStoredSession()
        .then((session) => {
          const user = session?.user || null;
          if (user) {
            setAuthUser(user);
            applyAuthProfile(user);
            if (!isInitialSyncDone.current) {
              isInitialSyncDone.current = true;
              loadCloudData(user);
            }
          }
        })
        .catch((err) => {
          console.warn('Auth get session error:', err);
        })
        .finally(() => {
          setIsAuthLoading(false);
        });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        setIsAuthLoading(false);
        if (user) {
          applyAuthProfile(user);
          if (!isInitialSyncDone.current) {
            isInitialSyncDone.current = true;
            loadCloudData(user);
          }
        } else if (event === 'SIGNED_OUT') {
          isInitialSyncDone.current = false;
          setIsGuestMode(false);
          try {
            sessionStorage.removeItem('sehat_yuk_guest_session');
          } catch {}
          setSyncStatus('idle');
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch (err) {
      console.warn('Supabase auth listener initialization error:', err);
      setIsAuthLoading(false);
    }
  }, []);

  // Otomatisasi Waktu Sholat & Buka Puasa via GPS tanpa deteksi manual
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setData((prev) => {
            // Jika koordinat belum disetel atau berbeda
            const prevLat = prev.profile?.coords?.lat;
            const prevLng = prev.profile?.coords?.lng;
            if (prevLat && prevLng && Math.abs(prevLat - latitude) < 0.005 && Math.abs(prevLng - longitude) < 0.005) {
              return prev;
            }
            return {
              ...prev,
              profile: {
                ...prev.profile,
                city: 'Lokasi Otomatis (GPS)',
                coords: { lat: latitude, lng: longitude }
              }
            };
          });
        },
        (err) => {
          console.log('GPS otomatis background: menggunakan lokasi default.', err.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 }
      );
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

  // Debounced Auto-sync ke Cloud Supabase saat data lokal berubah
  useEffect(() => {
    if (!authUser || !isOnline || !isInitialSyncDone.current) return;
    const timer = setTimeout(() => {
      syncToCloud(rawData, authUser);
    }, 1800);
    return () => clearTimeout(timer);
  }, [rawData, authUser, isOnline]);

  // Service Worker Background Sync event listener
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMsg = (e) => {
        if (e.data?.type === 'TRIGGER_DATA_SYNC' && authUser && isOnline) {
          syncToCloud(rawData, authUser);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMsg);
      return () => navigator.serviceWorker.removeEventListener('message', handleMsg);
    }
  }, [authUser, isOnline, rawData]);

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSyncToast('Koneksi pulih. Data otomatis tersinkron!');
      if (authUser) {
        syncToCloud(rawData, authUser);
      }
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
  }, [authUser, rawData]);

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
      icon: getIconForCategory(newMeal.timeCategory),
      macros: newMeal.macros || null,
      items: newMeal.items || null,
      healthTip: newMeal.healthTip || null,
      analyzedByAi: Boolean(newMeal.analyzedByAi)
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
    setIsGuestMode(false);
    try {
      sessionStorage.removeItem('sehat_yuk_guest_session');
    } catch {}
    await signOutUser();
    setAuthUser(null);
    showNotification('Berhasil Keluar', 'Sesi akun telah diakhiri.');
  };

  const toggleFastingActive = (forcedValue) => {
    setData((prev) => {
      const next = typeof forcedValue === 'boolean' ? forcedValue : !prev.isFastingActive;
      showNotification(
        next ? 'Mode Puasa Aktif 🌙' : 'Mode Puasa Non-Aktif 🍽️',
        next
          ? 'Pelacak puasa aktif. Jadwal sahur & buka puasa siap menemani Bunda.'
          : 'Puasa dinonaktifkan untuk hari ini. Jadwal makan normal diterapkan.'
      );
      return {
        ...prev,
        isFastingActive: next
      };
    });
  };

  const clearAllData = async (skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Apakah Anda yakin ingin mengosongkan seluruh data catatan? Seluruh riwayat akan dibersihkan tanpa data dummy.')) {
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      const cleanState = {
        ...defaultState,
        waterDate: localDateStr(),
        meals: [],
        exercises: [],
        weightLogs: [],
        waterGlasses: 0,
        profile: {
          ...defaultState.profile,
          name: authUser?.user_metadata?.full_name || '',
          avatar: authUser?.user_metadata?.avatar_url || '/avatar.png',
          age: '',
          height: '',
          startWeight: '',
          currentWeight: '',
          targetWeight: '',
          waistCircumference: '',
          hpht: '',
          periodEnd: '',
          isNursing: false
        }
      };
      setData(cleanState);
      // Hapus & reset data di Cloud Supabase jika pengguna sedang terhubung
      if (authUser && isSupabaseConfigured) {
        await clearCloudUserData();
        await syncAppState(cleanState);
      }
      showNotification('Data Bersih 🧹', 'Seluruh data catatan dummy telah dihapus. Aplikasi kini bersih untuk data pribadi Anda!');
    } catch (err) {
      console.warn('Notice saat membersihkan data:', err);
      showNotification('Data Dihapus', 'Data lokal berhasil di-reset.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        isOnline,
        isSyncing,
        syncStatus,
        lastSyncedAt,
        triggerManualSync,
        authUser,
        isAuthLoading,
        isGuestMode,
        continueAsGuest,
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
        isFastingActive: data.isFastingActive !== false,
        toggleFastingActive,
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
