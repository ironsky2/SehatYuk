import React from 'react';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: 'cottage' },
    { id: 'makan', label: 'Makan', icon: 'restaurant' },
    { id: 'if-dan-puasa', label: 'IF & Puasa', icon: 'timer' },
    { id: 'siklus', label: 'Siklus', icon: 'spa' },
    { id: 'progress', label: 'Progress', icon: 'analytics' }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-8px_24px_-4px_rgba(244,63,94,0.06)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center min-w-[58px] py-1 px-1.5 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-primary font-semibold bg-primary-fixed/30'
                  : 'text-on-surface-variant hover:text-primary font-normal'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] transition-transform"
                style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 600" } : {}}
              >
                {item.icon}
              </span>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
