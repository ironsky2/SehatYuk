import React, { useState, useRef } from 'react';
import { analyzeFoodWithGemini, hasGeminiApiKey } from '../services/geminiService';
import GeminiKeyModal from './GeminiKeyModal';

export default function AiCalorieInput({ activeMealTab, onSaveMeal, selectedDate }) {
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Data URL string
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const samplePrompts = [
    'Nasi uduk telur balado & tempe orek',
    '1 mangkok soto ayam + perkedel & nasi 1/2',
    'Gado-gado lontong bumbu kacang',
    '3 butir kurma ajwa dan segelas susu almond'
  ];

  // Handle file / image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid.');
      return;
    }

    // Limit ukuran file maks 8MB
    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 8MB ya Bunda.');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSelectedImage(uploadEvent.target.result);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!description.trim() && !selectedImage) {
      setErrorMessage('Ketik nama makanan atau ambil/unggah foto piring terlebih dahulu ya Bun 🌸');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const result = await analyzeFoodWithGemini({
        text: description,
        imageBase64: selectedImage,
        imageMimeType
      });

      setAnalysisResult(result);
    } catch (err) {
      console.error('AI Analysis error:', err);
      setErrorMessage(err.message || 'Gagal menghitung kalori dengan AI. Periksa kembali input Bunda ya.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveResult = () => {
    if (!analysisResult) return;

    setIsSaving(true);
    setTimeout(() => {
      onSaveMeal({
        name: analysisResult.foodName,
        calories: Number(analysisResult.totalCalories),
        timeCategory: activeMealTab,
        portionMultiplier: 1.0,
        portionName: 'Porsi Terdeteksi AI (1.0x)',
        date: selectedDate,
        macros: analysisResult.macros,
        items: analysisResult.items,
        healthTip: analysisResult.healthTip,
        analyzedByAi: true
      });

      // Reset form setelah simpan
      setDescription('');
      setSelectedImage(null);
      setAnalysisResult(null);
      setIsSaving(false);
    }, 400);
  };

  const keyConfigured = hasGeminiApiKey();

  return (
    <div className="flex flex-col gap-3.5">
      {/* Status Bar Gemini AI Terintegrasi Langsung */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/5 border border-primary/20 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div>
            <span className="font-bold text-on-surface block leading-tight">
              Gemini AI Terintegrasi Langsung
            </span>
            <span className="text-[10px] text-on-surface-variant">
              Kalkulator kalori cerdas siap pakai tanpa perlu masukkan kunci
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Aktif
        </span>
      </div>

      {/* Input Deskripsi Bebas */}
      <div className="flex flex-col gap-1.5">
        <label className="font-label-sm text-xs text-on-surface-variant font-medium flex items-center justify-between">
          <span>Deskripsi Makanan / Menu Santap</span>
          <span className="text-[11px] text-primary font-semibold">Teks Bebas Alami</span>
        </label>
        <div className="relative">
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Nasi padang lauk rendang sapi, daun singkong 2 sdm, kerupuk putih, dan es teh tawar..."
            className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 font-body-md text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/20 resize-none placeholder-on-surface-variant/40"
          />
          {description && (
            <button
              type="button"
              onClick={() => setDescription('')}
              className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        <span className="text-[11px] text-on-surface-variant whitespace-nowrap font-medium flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[14px] text-primary">tips_and_updates</span>
          Coba:
        </span>
        {samplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setDescription(prompt)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-[11px] font-medium border border-outline-variant/20 transition-all active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Image Upload & Camera Row */}
      <div className="flex flex-col gap-2">
        <label className="font-label-sm text-xs text-on-surface-variant font-medium">
          Foto Piring Makanan (Opsional / Analisis Visual)
        </label>

        {selectedImage ? (
          <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container max-h-48 flex items-center justify-center group">
            <img
              src={selectedImage}
              alt="Piring Makanan"
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3">
              <span className="text-white text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Foto siap dianalisis
              </span>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-2.5 py-1 rounded-lg bg-error text-on-error text-xs font-bold flex items-center gap-1 shadow-md hover:bg-error/90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tombol Ambil Foto Kamera */}
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-primary-fixed/30 border border-outline-variant/30 cursor-pointer active:scale-95 transition-all text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
              <span className="font-label-sm text-xs font-semibold">Ambil Kamera</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {/* Tombol Pilih dari Galeri */}
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-primary-fixed/30 border border-outline-variant/30 cursor-pointer active:scale-95 transition-all text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-secondary">image</span>
              <span className="font-label-sm text-xs font-semibold">Buka Galeri</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs font-medium flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">warning</span>
          <div className="flex-1 leading-snug">
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Action Button: Analisis dengan AI */}
      {!analysisResult && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label-sm text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isAnalyzing ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              <span>Gemini AI sedang menghitung kalori & gizi...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              <span>Hitung Kalori Otomatis dengan AI</span>
            </>
          )}
        </button>
      )}

      {/* Hasil Analisis Kartu AI */}
      {analysisResult && (
        <div className="rounded-2xl border-2 border-primary/20 bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
          {/* Header Hasil */}
          <div className="flex items-start justify-between gap-2 border-b border-outline-variant/20 pb-3">
            <div>
              <div className="flex items-center gap-1 text-primary text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>Hasil Perhitungan AI Terpercaya</span>
              </div>
              <h4 className="font-headline-sm text-base font-extrabold text-on-surface">
                {analysisResult.foodName}
              </h4>
              <span className="font-body-sm text-xs text-on-surface-variant">
                Waktu: <strong className="text-primary">{activeMealTab}</strong>
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-headline-sm text-2xl font-black text-primary leading-none">
                {analysisResult.totalCalories}
              </span>
              <span className="font-label-sm text-xs font-bold text-on-surface-variant">
                kkal
              </span>
            </div>
          </div>

          {/* Makronutrisi Cards (Karbo, Protein, Lemak) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary-fixed/30 rounded-xl p-2.5 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-bold text-on-primary-fixed-variant tracking-wider">
                Karbohidrat
              </span>
              <span className="text-base font-black text-on-primary-fixed">
                {analysisResult.macros?.carbs || 0}g
              </span>
            </div>
            <div className="bg-secondary-fixed/40 rounded-xl p-2.5 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-bold text-on-secondary-fixed-variant tracking-wider">
                Protein
              </span>
              <span className="text-base font-black text-on-secondary-fixed">
                {analysisResult.macros?.protein || 0}g
              </span>
            </div>
            <div className="bg-tertiary-fixed/40 rounded-xl p-2.5 flex flex-col items-center text-center">
              <span className="text-[10px] uppercase font-bold text-on-tertiary-fixed-variant tracking-wider">
                Lemak
              </span>
              <span className="text-base font-black text-on-tertiary-fixed">
                {analysisResult.macros?.fat || 0}g
              </span>
            </div>
          </div>

          {/* Rincian Komponen Makanan */}
          {analysisResult.items?.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-surface-container-low rounded-xl p-3 border border-outline-variant/15">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">format_list_bulleted</span>
                Rincian Porsi & Komponen:
              </span>
              <div className="divide-y divide-outline-variant/15">
                {analysisResult.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">{item.name}</span>
                      {item.portion && (
                        <span className="text-[11px] text-on-surface-variant">{item.portion}</span>
                      )}
                    </div>
                    <span className="font-bold text-secondary text-xs">
                      {item.calories} kkal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Sehat Ramah Bunda */}
          {analysisResult.healthTip && (
            <div className="bg-secondary-fixed/20 text-on-secondary-fixed-variant rounded-xl p-3 flex items-start gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0 mt-0.5">
                favorite
              </span>
              <div className="leading-snug">
                <strong className="block text-secondary font-bold mb-0.5">Saran Nutrisi Bunda:</strong>
                <span>{analysisResult.healthTip}</span>
              </div>
            </div>
          )}

          {/* Action Buttons: Simpan atau Ulangi */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAnalysisResult(null)}
              className="py-2.5 px-3.5 rounded-xl border border-outline-variant/40 font-label-sm text-xs font-semibold text-on-surface hover:bg-surface-container active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Ulangi</span>
            </button>

            <button
              type="button"
              onClick={handleSaveResult}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Simpan ke Catatan Makan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Kunci API Gemini */}
      <GeminiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={() => {
          setErrorMessage('');
        }}
      />
    </div>
  );
}
