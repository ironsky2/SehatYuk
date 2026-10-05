import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CalorieAlertBanner from '../components/CalorieAlertBanner';

export default function LogMakanScreen() {
  const {
    data,
    totalCalories,
    calorieTarget,
    isOverCalorieLimit,
    addMeal,
    deleteMeal,
    editMeal
  } = useApp();

  const [activeMealTab, setActiveMealTab] = useState('Buka Puasa');
  const [foodName, setFoodName] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('320');
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);
  const [portionName, setPortionName] = useState('Sedang (1.0x)');
  const [saveStatus, setSaveStatus] = useState('idle');

  // Edit modal state
  const [editingMeal, setEditingMeal] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const mealTabs = ['Sahur', 'Makan 1', 'Snack Siang', 'Buka Puasa', 'Makan Malam'];
  const portions = [
    { name: 'Kecil', mult: 0.5, label: 'Kecil (0.5x)' },
    { name: 'Sedang', mult: 1.0, label: 'Sedang (1.0x)' },
    { name: 'Besar', mult: 1.5, label: 'Besar (1.5x)' }
  ];

  const caloriePercent = Math.round((totalCalories / calorieTarget) * 100);
  const remainingCalories = Math.max(calorieTarget - totalCalories, 0);

  const handleSaveMeal = (e) => {
    e.preventDefault();
    if (!foodName.trim()) {
      alert('Tuliskan nama makanan atau menu terlebih dahulu ya Bun 🌸');
      return;
    }

    setSaveStatus('saving');
    setTimeout(() => {
      addMeal({
        name: foodName.trim(),
        calories: Number(caloriesInput),
        timeCategory: activeMealTab,
        portionMultiplier,
        portionName
      });
      setSaveStatus('saved');
      setFoodName('');
      setTimeout(() => setSaveStatus('idle'), 1600);
    }, 450);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingMeal) return;
    editMeal(editingMeal.id, {
      name: editingMeal.name,
      calories: Number(editingMeal.calories)
    });
    setEditingMeal(null);
  };

  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Calorie Alert Banner if over limit */}
      <CalorieAlertBanner />

      {/* Status & Quick Reassurance Pill */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/20">
          <span className="material-symbols-outlined text-tertiary text-[16px]">cloud_done</span>
          <span className="font-label-sm text-xs text-on-surface-variant font-medium">
            Auto-sync aktif
          </span>
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          <span className="font-label-sm text-xs font-semibold">{todayDate}</span>
        </div>
      </div>

      {/* Header & Ringkasan Kalori Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-xs">
              <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
            </div>
            <div>
              <span className="font-label-sm text-[11px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                Target Energi Harian
              </span>
              <h2 className="font-headline-sm text-xl text-on-surface font-extrabold">
                {totalCalories.toLocaleString()}{' '}
                <span className="font-body-sm text-xs text-on-surface-variant font-normal">
                  / {calorieTarget.toLocaleString()} kkal
                </span>
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-xs font-bold ${
                isOverCalorieLimit
                  ? 'bg-error-container text-on-error-container'
                  : caloriePercent >= 80
                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                  : 'bg-tertiary-fixed text-on-tertiary-fixed'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOverCalorieLimit
                    ? 'bg-error'
                    : caloriePercent >= 80
                    ? 'bg-secondary'
                    : 'bg-tertiary'
                }`}
              />
              {caloriePercent}% Kuota
            </span>
            <span
              className={`font-label-sm text-xs font-semibold mt-1 ${
                isOverCalorieLimit ? 'text-error font-bold' : 'text-secondary'
              }`}
            >
              {isOverCalorieLimit
                ? `Lebih ${(totalCalories - calorieTarget).toLocaleString()} kkal`
                : `Sisa ${remainingCalories.toLocaleString()} kkal`}
            </span>
          </div>
        </div>

        {/* Dual Segment Visual Track */}
        <div className="space-y-1.5">
          <div className="w-full bg-surface-container-high rounded-full h-3 p-0.5 overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isOverCalorieLimit
                  ? 'bg-error'
                  : caloriePercent >= 80
                  ? 'bg-secondary-container'
                  : 'bg-tertiary-container'
              }`}
              style={{ width: `${Math.min(caloriePercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-[11px] px-0.5">
            <span>0 kkal</span>
            <span className="text-secondary font-bold">
              {caloriePercent}% ({caloriePercent > 100 ? 'Over Limit' : caloriePercent >= 80 ? 'Hampir Penuh' : 'Aman'})
            </span>
            <span>{calorieTarget.toLocaleString()} kkal</span>
          </div>
        </div>

        {/* Mini Banner Alert */}
        <div
          className={`rounded-xl p-3 flex items-start gap-2.5 ${
            isOverCalorieLimit
              ? 'bg-error-container text-on-error-container'
              : caloriePercent >= 80
              ? 'bg-secondary-fixed/50 text-on-secondary-container'
              : 'bg-tertiary-fixed/30 text-on-tertiary-fixed'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">
            {isOverCalorieLimit ? 'warning' : 'lightbulb'}
          </span>
          <div className="flex-1">
            <p className="font-body-sm text-xs leading-snug">
              {isOverCalorieLimit ? (
                <span>
                  <strong>Perhatian:</strong> Kalori harian sudah melampaui target. Istirahatkan pencernaan ya Bunda 🌸
                </span>
              ) : caloriePercent >= 80 ? (
                <span>
                  <strong>Perhatian:</strong> Sisa <strong>{remainingCalories} kkal</strong> untuk hari ini ya Bun! Rekomendasi: buah potong segar atau teh hangat tanpa gula.
                </span>
              ) : (
                <span>
                  <strong>Aman & Terjaga:</strong> Ritme asupan nutrisi seimbang untuk pemulihan & menyusui.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Kalori Alert System Guide (Collapsible Details) */}
      <section className="bg-surface-container-low rounded-2xl p-3.5 shadow-sm border border-outline-variant/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label-sm text-xs font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">info</span>
            Panduan Kalori Alert 'Sehat Yuk!'
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Otomatis</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container-lowest p-2 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary mb-1" />
            <span className="font-label-sm text-xs font-bold text-tertiary">0 - 80%</span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">Aman & Terjaga</span>
          </div>
          <div className="bg-surface-container-lowest p-2 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary mb-1 animate-pulse" />
            <span className="font-label-sm text-xs font-bold text-secondary">80 - 95%</span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">Hati-hati</span>
          </div>
          <div className="bg-surface-container-lowest p-2 rounded-xl flex flex-col items-center text-center shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-error mb-1" />
            <span className="font-label-sm text-xs font-bold text-error">&gt; 100%</span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">Over Limit</span>
          </div>
        </div>
      </section>

      {/* Form Input Makan Baru */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(244,63,94,0.06)] border border-outline-variant/30 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">add_circle</span>
            <h3 className="font-headline-sm text-base text-on-surface font-bold">
              Catat Makanan Baru
            </h3>
          </div>
          <span
            onClick={() => {
              setFoodName('Ayam Ungkep + Nasi Merah 1 centong');
              setCaloriesInput('320');
            }}
            className="font-label-sm text-xs text-primary font-bold cursor-pointer flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span> Rekomendasi
          </span>
        </div>

        {/* Meal Timing Selector (Tabs) */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-xs text-on-surface-variant font-medium">
            Waktu Makan
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {mealTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMealTab(tab)}
                className={`meal-tab-btn flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-sm text-xs transition-all active:scale-95 ${
                  activeMealTab === tab
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Input Nama Makanan */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-xs text-on-surface-variant font-medium">
            Nama Menu / Hidangan
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 placeholder-on-surface-variant/50 border border-outline-variant/20"
              placeholder="Ketik nama makanan..."
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
          </div>
        </div>

        {/* Calorie & Portion Multiplier Grid */}
        <div className="grid grid-cols-2 gap-3 items-end">
          {/* Input Kalori */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-xs text-on-surface-variant font-medium">
              Estimasi Energi
            </label>
            <div className="relative flex items-center">
              <input
                className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 font-headline-sm text-base font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 pr-12 border border-outline-variant/20"
                type="number"
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
              />
              <span className="absolute right-3 font-label-sm text-xs text-on-surface-variant font-bold">
                kkal
              </span>
            </div>
          </div>

          {/* Quick Estimation Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label-sm text-xs text-on-surface-variant font-medium">
              Estimasi Cepat
            </span>
            <div className="flex gap-1.5">
              {['150', '320', '500'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCaloriesInput(val)}
                  className={`flex-1 py-2 rounded-xl font-label-sm text-xs font-bold transition-all active:scale-95 ${
                    caloriesInput === val
                      ? 'bg-primary-fixed text-on-primary-fixed shadow-xs'
                      : 'bg-surface-container-low hover:bg-primary-fixed text-on-surface border border-outline-variant/20'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pilihan Porsi (Multiplier Chip) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-label-sm text-xs text-on-surface-variant font-medium">
              Ukuran Porsi
            </label>
            <span className="font-label-sm text-xs text-primary font-bold">
              {portionName} • {Math.round((Number(caloriesInput) || 0) * portionMultiplier)} kkal
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {portions.map((p) => {
              const isSelected = portionMultiplier === p.mult;
              return (
                <button
                  key={p.mult}
                  type="button"
                  onClick={() => {
                    setPortionMultiplier(p.mult);
                    setPortionName(p.label);
                  }}
                  className={`py-2 px-3 rounded-xl font-label-md text-xs flex flex-col items-center transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container shadow-xs font-bold'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="font-label-sm text-[10px] opacity-80">{p.mult}x</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Simpan */}
        <button
          onClick={handleSaveMeal}
          disabled={saveStatus === 'saving'}
          className="w-full mt-1 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-sm py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_10px_25px_-4px_rgba(244,63,94,0.22)] active:scale-98 transition-all font-bold"
        >
          {saveStatus === 'saving' ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
              <span>Menyimpan Offline...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Berhasil Disimpan!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Simpan Catatan Makan</span>
            </>
          )}
        </button>
      </section>

      {/* Riwayat Makanan Hari Ini Header */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">history_edu</span>
          <h3 className="font-headline-sm text-base text-on-surface font-bold">
            Riwayat Makan Hari Ini
          </h3>
        </div>
        <span className="font-label-sm text-xs bg-surface-container px-2.5 py-0.5 rounded-full text-on-surface-variant font-medium">
          {data.meals.length} Sesi Tercatat
        </span>
      </div>

      {/* Riwayat Food List Cards */}
      <div className="flex flex-col space-y-2.5">
        {data.meals.map((meal) => (
          <article
            key={meal.id}
            className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30 flex items-start gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">
              <span className="material-symbols-outlined text-[22px]">
                {meal.icon || 'restaurant'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-label-md text-xs font-bold text-on-surface truncate">
                    {meal.timeCategory}
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant font-normal">
                    {meal.time}
                  </span>
                </div>
                <span className="font-label-md text-xs font-bold text-primary flex-shrink-0">
                  {meal.calories} kkal
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant line-clamp-1">
                {meal.name}
              </p>
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-surface-container-low">
                <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                  {meal.portion || 'Porsi Sedang (1.0x)'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingMeal(meal)}
                    aria-label="Edit Makanan"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(meal.id)}
                    aria-label="Hapus Makanan"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 active:scale-90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {data.meals.length === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-on-surface-variant shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-[36px] text-outline-variant mb-2">
              lunch_dining
            </span>
            <p className="font-label-md text-sm font-bold text-on-surface">Belum ada makanan dicatat</p>
            <p className="font-body-sm text-xs mt-1 text-on-surface-variant">
              Gunakan formulir di atas untuk mencatat hidangan sahur, takjil, atau makan malam Bunda.
            </p>
          </div>
        )}
      </div>

      {/* Inline Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-xs w-full shadow-2xl flex flex-col gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <div>
              <h4 className="font-headline-sm font-bold text-base text-on-surface">Hapus Catatan Makan?</h4>
              <p className="text-xs text-on-surface-variant mt-1">Data kalori akan otomatis dihitung ulang.</p>
            </div>
            <div className="flex gap-2 justify-center pt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-full font-label-md text-xs bg-surface-container text-on-surface font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteMeal(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 rounded-full font-label-md text-xs bg-error text-on-error font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-outline-variant/30">
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              Edit Catatan Makan
            </h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={editingMeal.name}
                  onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 border border-outline-variant/20"
                />
              </div>
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant">
                  Kalori (kkal)
                </label>
                <input
                  type="number"
                  required
                  value={editingMeal.calories}
                  onChange={(e) => setEditingMeal({ ...editingMeal, calories: e.target.value })}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 border border-outline-variant/20"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="px-4 py-2 rounded-full font-label-md text-xs bg-surface-container text-on-surface font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full font-label-md text-xs bg-primary text-on-primary font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offline Status & Persistence Reassurance Card */}
      <footer className="bg-surface-container-low rounded-2xl p-3.5 flex items-center gap-3 border border-outline-variant/20">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">save_as</span>
        </div>
        <div className="flex-1">
          <p className="font-label-sm text-xs text-on-surface-variant leading-tight">
            Data tersimpan aman di HP & otomatis tersinkron ke cloud saat Bunda terhubung ke internet.
          </p>
        </div>
      </footer>
    </div>
  );
}
