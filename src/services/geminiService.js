/**
 * Service untuk komunikasi dengan Google Gemini API (Multimodal: Teks & Foto)
 * Menghitung kalori, makronutrisi, serta rincian item makanan khas Indonesia maupun internasional.
 */

const LOCAL_STORAGE_KEY = 'sehat_yuk_gemini_key';

// Prioritas model Gemini: Flash cepat, hemat token, dan akurat
const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];

/**
 * Mendapatkan API key aktif (Prioritas: localStorage pengguna > .env Vite)
 */
export function getGeminiApiKey() {
  try {
    const userKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (userKey && userKey.trim()) {
      return userKey.trim();
    }
  } catch (e) {
    console.warn('Gagal membaca localStorage untuk Gemini key:', e);
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  return '';
}

/**
 * Menyimpan API key mandiri dari pengguna
 */
export function setGeminiApiKey(key) {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
    }
    return true;
  } catch (e) {
    console.error('Gagal menyimpan Gemini API Key:', e);
    return false;
  }
}

/**
 * Menghapus API key dari localStorage
 */
export function clearGeminiApiKey() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Gagal menghapus Gemini API key:', e);
  }
}

/**
 * Memeriksa apakah API Key sudah tersedia
 */
export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey());
}

/**
 * Prompt sistem terstruktur untuk nutrisi gizi Indonesia
 */
const SYSTEM_PROMPT = `
Anda adalah ahli gizi dan nutrisionis klinis terpercaya yang ramah untuk wanita/bunda di Indonesia dalam aplikasi 'SehatYuk'.
Tugas Anda adalah menganalisis makanan/minuman yang diberikan (melalui teks deskripsi porsi, foto hidangan, atau kombinasi keduanya) dan menghitung estimasi kalorinya secara akurat berdasarkan standar gizi ilmiah (Kemenkes RI / TKPI / USDA).

Aturan Analisis:
1. Hitung total kalori (kkal) serealistis mungkin berdasarkan ukuran porsi standar di Indonesia.
2. Hitung perkiraan makronutrisi: karbohidrat (gram), protein (gram), dan lemak (gram).
3. Pecah komponen makanan menjadi daftar rincian item (nama item, perkiraan porsi, dan kalori masing-masing).
4. Berikan 1-2 kalimat tips gizi atau pesan hangat ramah Bunda (healthTip).
5. Output HARUS berupa JSON murni tanpa pembungkus markdown (no backticks) dengan skema berikut:
{
  "foodName": "Nama ringkas hidangan (misal: Nasi Padang Rendang Sapi)",
  "totalCalories": 580,
  "macros": {
    "carbs": 65,
    "protein": 24,
    "fat": 26
  },
  "items": [
    { "name": "Nasi Putih", "portion": "1 centong sedang (100g)", "calories": 135 },
    { "name": "Rendang Daging Sapi", "portion": "1 potong sedang", "calories": 240 },
    { "name": "Sayur Daun Singkong & Sambal Ijo", "portion": "2 sdm", "calories": 85 },
    { "name": "Kuah Gulai Rendang", "portion": "1 sdm", "calories": 120 }
  ],
  "healthTip": "Tinggi protein dan zat besi. Sangat baik untuk energi, namun perhatikan porsi kuah santan jika sedang defisit kalori ya Bun 🌸"
}
`;

/**
 * Menganalisis makanan menggunakan Google Gemini API
 * @param {Object} params
 * @param {string} [params.text] - Deskripsi makanan dalam teks alami
 * @param {string} [params.imageBase64] - Foto makanan dalam format base64
 * @param {string} [params.imageMimeType] - MIME type gambar (misal: 'image/jpeg')
 * @returns {Promise<Object>} Data nutrisi terstruktur JSON
 */
export async function analyzeFoodWithGemini({ text = '', imageBase64 = null, imageMimeType = 'image/jpeg' }) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('KEY_MISSING');
  }

  if (!text.trim() && !imageBase64) {
    throw new Error('Harap masukkan deskripsi makanan atau unggah foto piring makanan.');
  }

  // Siapkan parts untuk Google Gemini API
  const parts = [];

  // Jika ada gambar (Vision input)
  if (imageBase64) {
    // Bersihkan header data URL jika ada (contoh: "data:image/jpeg;base64,...")
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    parts.push({
      inline_data: {
        mime_type: imageMimeType || 'image/jpeg',
        data: cleanBase64
      }
    });
  }

  // Teks deskripsi atau prompt pengguna
  let userInstruction = text.trim()
    ? `Analisis makanan berikut ini: "${text.trim()}". Berikan rincian kalori, makro, dan tips sehat.`
    : `Analisis foto makanan ini. Identifikasi makanan yang ada di piring/meja, perkirakan porsinya, lalu hitung total kalori, makronutrisi, serta rincian tiap itemnya.`;

  if (imageBase64 && text.trim()) {
    userInstruction = `Berikut adalah foto makanan beserta catatan tambahan dari pengguna: "${text.trim()}". Analisis secara akurat visual dan catatannya, lalu hitung kalori dan makronutrisinya.`;
  }

  parts.push({
    text: `${SYSTEM_PROMPT}\n\nPermintaan Pengguna:\n${userInstruction}`
  });

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

  // Coba model Gemini secara bertahap
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const errMsg = errorData.error?.message || response.statusText;

        if (status === 400 || status === 403 || errMsg.toLowerCase().includes('api key')) {
          throw new Error('KEY_INVALID');
        } else if (status === 429) {
          throw new Error('QUOTA_EXCEEDED');
        } else if (status === 404) {
          // Model mungkin belum tersedia di region/endpoint tertentu, lanjutkan coba model berikutnya
          lastError = new Error(`Model ${model} not available: ${errMsg}`);
          continue;
        } else {
          throw new Error(errMsg || `Error status ${status}`);
        }
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Tidak ada respon teks yang diterima dari Gemini AI.');
      }

      // Bersihkan kemungkinan markdown code fence jika model tetap menyertakannya
      let cleanedJson = rawText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedData = JSON.parse(cleanedJson);

      // Normalisasi & validasi fallback jika ada properti yang hilang
      return {
        foodName: parsedData.foodName || text || 'Menu Makanan',
        totalCalories: Number(parsedData.totalCalories) || 0,
        macros: {
          carbs: Number(parsedData.macros?.carbs) || 0,
          protein: Number(parsedData.macros?.protein) || 0,
          fat: Number(parsedData.macros?.fat) || 0
        },
        items: Array.isArray(parsedData.items) ? parsedData.items : [],
        healthTip: parsedData.healthTip || 'Tetap penuhi kebutuhan air mineral dan jaga ritme makan seimbang ya Bun!'
      };
    } catch (err) {
      if (err.message === 'KEY_MISSING' || err.message === 'KEY_INVALID' || err.message === 'QUOTA_EXCEEDED') {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Gagal menghubungi layanan Gemini AI.');
}
