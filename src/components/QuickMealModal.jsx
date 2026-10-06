import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function QuickMealModal() {
  const { quickMealModalOpen, setQuickMealModalOpen, addMeal, setActiveTab } = useApp();

  const [timeCategory, setTimeCategory] = useState('Buka Puasa');
  const [foodName, setFoodName] = useState('');
  const [baseCalories, setBaseCalories] = useState(320);
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);
  const [portionName, setPortionName] = useState('Sedang (1.0x)');
  const [isSaving, setIsSaving] = useState(false);

  if (!quickMealModalOpen) return null;

  const categories = ['Sahur', 'Makan 1', 'Snack Siang', 'Buka Puasa', 'Makan Malam'];
  const portions = [
    { name: 'Kecil', mult: 0.5, label: 'Kecil (0.5x)' },
    { name: 'Sedang', mult: 1.0, label: 'Sedang (1.0x)' },
    { name: 'Besar', mult: 1.5, label: 'Besar (1.5x)' }
  ];

  const quickFoods = [
    { name: 'Nasi Merah + Telur Dadar & Buncis', cal: 350, cat: 'Sahur' },
    { name: '3 Butir Kurma Ajwa + Air Hangat', cal: 60, cat: 'Buka Puasa' },
    { name: 'Sup Ayam Jagung & Tahu Kukus', cal: 310, cat: 'Buka Puasa' },
    { name: 'Oatmeal Pisang & Susu Almond', cal: 220, cat: 'Makan 1' },
    { name: 'Pepes Ikan & Sayur Bening Bayam', cal: 280, cat: 'Makan Malam' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!foodName.trim()) {
      alert('Silakan masukkan nama hidangan terlebih dahulu ya Bunda 🌸');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      addMeal({
        name: foodName.trim(),
        calories: Number(baseCalories),
        timeCategory,
        portionMultiplier,
        portionName
      });
      setIsSaving(false);
      setFoodName('');
      setQuickMealModalOpen(false);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={() => setQuickMealModalOpen(false)}
    >
      <div 
        className="w-full max-w-sm bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto border border-outline-variant/30 pb-10 sm:pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">restaurant_menu</span>
            <h3 className="font-headline-sm text-base text-on-surface font-bold">
              Catat Makanan Cepat
            </h3>
          </div>
          <button
            onClick={() => setQuickMealModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 1. Meal Category */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs text-on-surface-variant font-medium">
              Waktu Makan
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTimeCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full font-label-sm text-xs transition-all active:scale-95 ${
                    timeCategory === cat
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick food suggestions */}
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">Saran Menu Cepat:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quickFoods.map((qf, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFoodName(qf.name);
                    setBaseCalories(qf.cal);
                    setTimeCategory(qf.cat);
                  }}
                  className="flex-shrink-0 text-left px-2.5 py-1 rounded-xl bg-surface-container text-on-surface font-label-sm text-[11px] hover:bg-secondary-fixed transition-colors active:scale-95 border border-outline-variant/10"
                >
                  + {qf.name} ({qf.cal} kkal)
                </button>
              ))}
            </div>
          </div>

          {/* 2. Food Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs text-on-surface-variant font-medium">
              Nama Menu / Hidangan
            </label>
            <input
              type="text"
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="Contoh: Sayur Bayam + Telur Rebus"
              className="w-full bg-surface-container-low rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20"
            />
          </div>

          {/* 3. Calories Input & Quick Chips */}
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                Estimasi Energi
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="3000"
                  value={baseCalories}
                  onChange={(e) => setBaseCalories(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2 font-headline-sm text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 border border-outline-variant/20"
                />
                <span className="absolute right-2.5 font-label-sm text-xs text-on-surface-variant font-bold">
                  kkal
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-xs text-on-surface-variant font-medium">
                Pilihan Cepat
              </span>
              <div className="flex gap-1">
                {[150, 320, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBaseCalories(val)}
                    className={`flex-1 py-1.5 rounded-xl font-label-sm text-xs font-bold transition-all active:scale-95 ${
                      baseCalories === val
                        ? 'bg-primary-fixed text-on-primary-fixed shadow-xs'
                        : 'bg-surface-container text-on-surface border border-outline-variant/20'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Portion Multiplier */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-xs text-on-surface-variant font-medium">
                Ukuran Porsi
              </label>
              <span className="font-label-sm text-xs text-primary font-bold">
                {portionName} • {Math.round(baseCalories * portionMultiplier)} kkal
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
                    className={`py-2 px-2 rounded-xl font-label-md text-xs flex flex-col items-center transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container shadow-xs font-bold'
                        : 'bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="font-bold">{p.name}</span>
                    <span className="font-label-sm text-[10px] opacity-80">{p.mult}x</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-1 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-xs py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_10px_25px_-4px_rgba(244,63,94,0.22)] active:scale-98 transition-all font-bold"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Simpan Catatan Makan</span>
              </>
            )}
          </button>

          {/* AI Shortcut button */}
          <button
            type="button"
            onClick={() => {
              setQuickMealModalOpen(false);
              setActiveTab('makan');
            }}
            className="w-full py-2 px-3 rounded-xl bg-primary-fixed/30 hover:bg-primary-fixed/50 text-on-primary-fixed font-label-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-primary/20"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
            <span>Mau analisis otomatis? Pakai AI Gemini 🪄</span>
          </button>
        </form>
      </div>
    </div>
  );
}
