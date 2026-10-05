import React from 'react';
import { useApp } from '../context/AppContext';

export default function CalorieAlertBanner() {
  const { totalCalories, calorieTarget, isOverCalorieLimit, inAppAlert, setInAppAlert } = useApp();

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 1. Over limit warning banner */}
      {isOverCalorieLimit && (
        <div className="relative overflow-hidden rounded-xl bg-error text-on-error p-3.5 shadow-md animate-bounce duration-1000 flex items-start gap-3">
          <span className="material-symbols-outlined text-[24px] flex-shrink-0 mt-0.5">
            warning
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-label-lg text-label-lg font-bold">
              Kalori Hari Ini Melebihi Batas!
            </h4>
            <p className="font-body-sm text-body-sm mt-0.5 leading-snug opacity-95">
              ⚠️ Total energi tercatat: <strong>{totalCalories.toLocaleString()} kkal</strong> dari target <strong>{calorieTarget.toLocaleString()} kkal</strong>. Hindari makan berlebih lagi ya Bunda 🌸
            </p>
          </div>
        </div>
      )}

      {/* 2. Dismissable In-app Alert / Toast */}
      {inAppAlert && (
        <div className="relative overflow-hidden rounded-xl bg-primary-container text-on-primary-container p-3 shadow-md flex items-start gap-2.5 transition-all">
          <span className="material-symbols-outlined text-primary-fixed text-[20px] flex-shrink-0 mt-0.5">
            notifications_active
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className="font-label-md text-label-md font-bold">{inAppAlert.title}</h5>
              <span className="text-[10px] opacity-80">{inAppAlert.time}</span>
            </div>
            <p className="font-body-sm text-body-sm mt-0.5 opacity-90 leading-snug">
              {inAppAlert.body}
            </p>
          </div>
          <button
            onClick={() => setInAppAlert(null)}
            className="text-on-primary-container/80 hover:text-on-primary-container p-1 rounded-full active:scale-95"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
