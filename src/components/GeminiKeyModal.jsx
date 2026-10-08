import React, { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey, clearGeminiApiKey } from '../services/geminiService';

export default function GeminiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [keyInput, setKeyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getGeminiApiKey();
      setKeyInput(current || '');
      setIsSaved(false);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!keyInput.trim()) {
      clearGeminiApiKey();
      setIsSaved(true);
      if (onKeySaved) onKeySaved('');
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 800);
      return;
    }

    setGeminiApiKey(keyInput.trim());
    setIsSaved(true);
    if (onKeySaved) onKeySaved(keyInput.trim());
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleTestKey = async () => {
    if (!keyInput.trim()) {
      setTestResult({ success: false, message: 'Silakan isi API key terlebih dahulu.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyInput.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Halo, balas satu kata: OK' }] }]
        })
      });

      if (res.ok) {
        setTestResult({ success: true, message: 'Kunci API valid & terhubung dengan sukses! ✨' });
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: data.error?.message || 'Kunci API tidak valid atau belum aktif.'
        });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Gagal menghubungi server Google Gemini: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Kunci Google Gemini AI
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Gratis & paling terpercaya untuk hitung kalori
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Status Default Aktif */}
        <div className="bg-secondary-fixed/30 rounded-2xl p-3 flex items-start gap-2.5 border border-secondary/20">
          <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0 mt-0.5">
            verified
          </span>
          <div className="text-xs">
            <span className="font-bold text-on-secondary-fixed block mb-0.5">
              Gemini AI Sudah Terintegrasi & Aktif Otomatis!
            </span>
            <p className="text-on-secondary-fixed-variant leading-relaxed text-[11px]">
              Bunda tidak perlu memasukkan kunci apapun untuk menggunakan fitur hitung kalori & foto makanan. Fitur AI sudah siap pakai secara instan 🌸
            </p>
          </div>
        </div>

        {/* Petunjuk Praktis Kustom (Opsional) */}
        <div className="bg-surface-container-low rounded-2xl p-3.5 flex flex-col gap-2 border border-outline-variant/20">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>(Opsional) Sambungkan Kunci Cloud Mandiri:</span>
          </div>
          <ol className="list-decimal list-inside font-body-sm text-[11px] text-on-surface-variant space-y-1 pl-1 leading-relaxed">
            <li>
              Buka situs{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold underline inline-flex items-center gap-0.5"
              >
                Google AI Studio
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </li>
            <li>Login akun Google & klik <strong>"Create API Key"</strong></li>
            <li>Salin kodenya yang diawali dengan huruf <code>AIzaSy...</code></li>
          </ol>
          <span className="text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50">
            ⚠️ <strong>Catatan:</strong> File Google OAuth seperti <code>client_secret_....json</code> bukan API Key. Gunakan API Key yang berawalan <code>AIzaSy...</code> dari Google AI Studio.
          </span>
        </div>

        {/* Input Kunci */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-xs text-on-surface font-semibold">
            Google Gemini API Key
          </label>
          <div className="relative flex items-center">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 font-body-md text-xs text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 border border-outline-variant/20"
            />
            {keyInput && (
              <button
                type="button"
                onClick={() => setKeyInput('')}
                className="absolute right-3 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Kunci ini disimpan aman di browser lokal Anda dan hanya digunakan untuk memanggil AI Gemini.
          </p>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
              testResult.success
                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                : 'bg-error-container text-on-error-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">
              {testResult.success ? 'check_circle' : 'error'}
            </span>
            <span className="leading-snug">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing || !keyInput.trim()}
            className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 font-label-sm text-xs font-semibold text-on-surface hover:bg-surface-container active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            {testing ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Menguji...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Uji Koneksi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {isSaved ? (
              <>
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Simpan Kunci</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
