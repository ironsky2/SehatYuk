# 📋 PRD — Health Tracker PWA "Sehat Yuk!"
**Product Requirements Document v1.0**
**Dibuat:** 4 Oktober 2026 | **Status:** Disetujui (Final v1.0)

---

## 1. Overview Produk

### Visi
Aplikasi PWA personal untuk perempuan Indonesia yang ingin menurunkan berat badan dengan pendekatan **holistik** — menggabungkan defisit kalori, Intermittent Fasting, puasa Senin-Kamis, dan siklus hormon bulanan — dalam satu platform yang mudah dipakai dari HP.

### Target User
**Persona:** Perempuan / Ibu usia 30 tahun, **TIDAK MENYUSUI (Non-Laktasi / Umum)**, fokus pada defisit kalori seimbang & penurunan berat badan sehat, ekonomi menengah, memasak mengikuti keluarga, tidak punya banyak waktu, akses HP setiap saat.
- **Kondisi Khusus:** **Tidak Menyusui.** Tidak ada alokasi kalori tambahan untuk laktasi; target kalori dihitung murni dari defisit BMR/TDEE standar untuk penurunan berat badan optimal (1.300 kkal/hari).

### Tujuan Utama
- Bantu user mencapai target turun BB 3 kg/bulan
- Beri alert real-time jika kalori melebihi batas
- Track IF timer, puasa Senin-Kamis, dan fase hormon secara otomatis (Siklus: Haid 23 Sept - 1 Okt 2026)
- Waktu Maghrib akurat otomatis berdasarkan lokasi GPS
- Full offline support (tetap bisa log & cek timer tanpa internet, auto-sync ke Supabase saat online)
- Google Authentication aman dengan proteksi data Row Level Security (RLS)
- Kondisi Awal Bersih (Clean State): Tanpa data dummy sehingga user langsung menginput catatan makan, air, dan timbangan riil mereka sendiri.

---

## 2. Tech Stack & Arsitektur Keamanan

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (pink/rose theme) |
| State Management | React Context + LocalStorage Offline Persistence |
| Backend & DB | Supabase (PostgreSQL with Row Level Security / RLS) |
| Auth | Google Sign-In (OAuth 2.0 via Supabase Auth) |
| Keamanan Data | Row Level Security (RLS) — Setiap baris data terkunci spesifik hanya untuk `auth.uid()` user |
| Offline Storage | LocalStorage + Service Worker Cache-First (PWA) |
| Waktu Sholat/Maghrib | Geolocation API + `adhan` (kalkulasi astronomi offline presisi lokal) |
| Push Notifications | Web Audio API (Pleasant Chime) + Web Notification API (Background OS) |
| PWA Engine | `vite-plugin-pwa` (Workbox Service Worker, Web App Manifest) |
| Hosting | Supabase / Vercel / Netlify / PWA Hosting |
| Charts | Dynamic SVG Data Visualization |


---

## 3. Fitur Lengkap

### F1 — Dashboard Harian 🏠
**Halaman utama yang muncul saat buka app.**

Komponen:
- **Header:** Nama user + status profil ("Program Defisit Terarah", Tidak Menyusui) + tanggal hari ini
- **Fase Hormon Card:** Ikon + nama fase (saat ini Hari ke-13, Fase Folikuler akhir) + tips energi prima hari ini
- **IF Timer Card:** Countdown timer eating window / puasa aktif
- **Kalori Ring:** Donut chart kalori terpakai vs target 1.300 kkal (warna berubah merah jika >90%)
- **Quick Log Button:** Tombol besar "➕ Tambah Makan" di tengah bawah
- **Summary Bar:** Ringkasan olahraga mingguan + target hidrasi 8 gelas (2 L) air
- **Puasa Senin-Kamis Badge:** Muncul di hari Senin & Kamis

---

### F2 — Log Makan & Kalori Alert 🍽️

**Input Makan:**
- Ketik nama makanan (free text)
- Input kalori manual (angka)
- Pilih waktu makan: Sahur / Makan 1 / Snack / Makan 2 / Buka Puasa / Makan 3
- Pilih porsi: Kecil / Sedang / Besar (multiplier ×0,5 / ×1 / ×1,5)
- Tombol "Simpan"

**Kalori Alert System:**
| Kondisi | Tampilan |
|---|---|
| 0–80% target | ✅ Hijau — aman |
| 80–95% target | 🟡 Kuning — hampir penuh |
| 95–100% target | 🟠 Oranye — peringatan |
| >100% target | 🔴 MERAH — alert muncul! |

**Alert saat melebihi target:**
- **In-app banner merah** di bagian atas screen: *"⚠️ Kalori hari ini sudah melebihi target! (1.350/1.300 kkal)"*
- **Push notification** ke HP: *"Kalori harianmu sudah penuh! Hindari makan lagi ya 🌸"*

**Riwayat Makan:**
- List makan hari ini per waktu (bisa tap untuk edit/hapus)
- Total kalori real-time terupdate

---

### F3 — IF Timer ⏱️

**Mode hari biasa (Selasa, Rabu, Jumat, Sabtu, Minggu):**
- Eating window: 11:00 – 19:00 (bisa dikustomisasi)
- Timer countdown: sisa waktu eating window / sisa waktu puasa IF
- Status visual: 🟢 Boleh makan / 🔴 Sedang puasa

**Mode hari puasa Senin-Kamis:**
- Otomatis switch ke mode puasa (lihat F4)

**Push notification:**
- 11:00 → *"Eating window dimulai! Boleh makan sekarang 🍽️"*
- 18:30 → *"30 menit lagi eating window tutup!"*
- 19:00 → *"Eating window tutup. Mulai puasa IF sampai jam 11 besok 💪"*

---

### F4 — Tracker Puasa Senin-Kamis 🕌

**Fitur:**
- Deteksi otomatis hari Senin & Kamis
- Toggle: "Saya puasa hari ini" → aktifkan mode puasa
- **Deteksi Waktu Maghrib & Imsak Otomatis (GPS + Offline Calculation):**
  - Menggunakan browser Geolocation API untuk mendeteksi koordinat lintang/bujur pengguna secara otomatis.
  - Perhitungan waktu Imsak & Maghrib dihitung secara lokal di perangkat via pustaka `adhan` (parameter Kemenag/MABIMS). Bekerja 100% akurat tanpa membutuhkan koneksi internet.
  - *Fallback:* Jika izin lokasi ditolak, pengguna dapat memilih kota secara manual.
- Mode puasa aktif:
  - Waktu sahur: sebelum waktu Imsak otomatis (sekitar 04:15–04:30)
  - Waktu buka: tepat saat masuk waktu Maghrib otomatis (sekitar 17:45–18:00 tergantung koordinat lokal)
  - Timer countdown buka puasa real-time
- History puasa: kalender bulan, tandai ✅ hari yang berhasil puasa
- Streak counter: berapa minggu berturut-turut puasa penuh

**Push notification hari Senin & Kamis:**
- 03:45 → *"⏰ Sahur! Bangun sekarang ya 🌙"*
- 10 menit sebelum Imsak → *"Imsak 10 menit lagi. Segera selesaikan makan & minum!"*
- 5 menit sebelum Maghrib → *"5 menit lagi buka puasa 🌅 Alhamdulillah!"*
- Tepat waktu Maghrib → *"Waktunya berbuka puasa! Awali dengan air putih & kurma/buah 🌸"*


---

### F5 — Kalender Fase Hormon 🌸

**Fitur:**
- Input: HPHT (Hari Pertama Haid Terakhir) + Tanggal Selesai Haid + panjang siklus
- **Data Siklus Terkini Pengguna:**
  - Mulai Haid (HPHT): **23 September 2026**
  - Selesai Haid: **1 Oktober 2026** (durasi menstruasi: 9 hari)
  - Panjang Siklus Rata-rata: **28 hari**
  - Posisi saat ini (5 Oktober 2026): **Hari ke-13 Siklus** (Fase Folikuler akhir / transisi Ovulasi — energi prima, fokus defisit kalori & latihan aktif)
- Auto-hitung fase per hari: Menstruasi (hari 1–9) / Folikuler (hari 10–13) / Ovulasi (hari 14–16) / Luteal (hari 17–28)
- Kalender bulanan dengan warna per fase:
  - 🔴 Merah: Menstruasi (23 Sept – 1 Okt)
  - 🌱 Hijau muda: Folikuler (Hari 10–13)
  - ⚡ Kuning: Ovulasi (Hari 14–16)
  - 🌙 Ungu muda: Luteal (Hari 17–28)
- Tap tanggal → lihat tips makan, olahraga, & mood untuk fase tersebut
- Auto-reminder ganti strategi saat berganti fase

**Rekomendasi per fase (muncul di Dashboard):**
| Fase | Tips yang ditampilkan |
|---|---|
| Folikuler | "Energi tinggi! Ideal untuk defisit agresif & cardio" |
| Ovulasi | "Puncak performa. HIIT & defisit sedang" |
| Luteal | "Antisipasi craving. Perbanyak protein" |
| Menstruasi | "Istirahat cukup. Defisit minimal. Perkaya zat besi" |

---

### F6 — Grafik Berat Badan & Lingkar Perut 📊

**Input:**
- Berat badan (kg) — input setiap Senin
- Lingkar perut (cm) — input setiap Senin
- Waktu input: setelah menekan tombol di reminder push notif

**Visualisasi:**
- Line chart berat badan: minggu 1–4 vs target
- Line chart lingkar perut: minggu 1–4
- Persentase progress menuju target
- Motivational message: *"Kamu sudah turun X kg! Tinggal Y kg lagi 🎉"*

**Push notification setiap Senin jam 06:30:**
*"⚖️ Hari timbang! Timbang sekarang sebelum makan ya 🌸"*

---

### F7 — Tracker Olahraga 🏃

**Input:**
- Jenis olahraga (free text atau pilih dari daftar: Jalan kaki / Senam / Yoga / HIIT / Lainnya)
- Durasi (menit)
- Intensitas: Ringan / Sedang / Tinggi
- Estimasi kalori terbakar (otomatis dari durasi + intensitas)
- Catatan bebas

**Tampilan:**
- Log olahraga hari ini di Dashboard
- History mingguan: berapa hari berolahraga dari target

---

### F8 — Tracker Mie 🍜

**Fitur:**
- Periode 2 minggu otomatis dihitung
- Status jatah tersisa: "1 jatah tersisa" / "Jatah habis ⛔"
- Tombol "Saya makan mie hari ini" → kurangi jatah 1
- History: tanggal kapan makan mie per periode
- Alert jika mencoba log mie padahal jatah habis:
  - In-app: *"⛔ Jatah mie periode ini sudah habis! Tahan dulu ya 💪"*
  - Tidak ada push notif (hanya in-app alert)

---

### F9 — Notifikasi & Reminder 🔔

Semua push notification bisa dikustomisasi on/off per kategori:

| Kategori | Notifikasi |
|---|---|
| IF Harian | Eating window buka/tutup |
| Puasa Senin-Kamis | Sahur, imsak, buka puasa |
| Kalori | Alert jika melebihi target |
| Timbang BB | Setiap Senin pagi |
| Fase Hormon | Notif saat berganti fase |
| Olahraga | Reminder olahraga (jam bisa dikustomisasi) |

---

### F10 — Profil & Pengaturan ⚙️

**Data Profil:**
- Nama, foto (dari Google / custom avatar)
- Status Laktasi: **Tidak Menyusui (Non-Laktasi)** — perhitungan kalori berfokus pada defisit fat loss murni tanpa buffer laktasi.
- Tinggi badan, berat badan awal (65 kg), target berat (59 kg)
- Usia (30 tahun) → auto-hitung BMR (~1.380 kkal) & TDEE (~1.650 kkal)
- HPHT: **23 September 2026** | Selesai Haid: **1 Oktober 2026** (panjang siklus 28 hari)
- Eating window IF (default 11:00–19:00)
- Waktu Maghrib kota (untuk buka puasa via GPS offline)

**Target Kalori:**
- Target harian: **1.300 kkal/hari** (defisit terarah, aman, dan berenergi)
- Bisa di-override manual oleh pengguna

---

### F11 — Autentikasi Google & Sinkronisasi Cloud 🔐

**Fitur:**
- **Google Sign-In (OAuth 2.0 via Supabase):** Login praktis sekali klik dengan akun Google pengguna.
- **Profil Otomatis:** Nama, foto profil, dan email otomatis tersinkronisasi dari Google.
- **Row Level Security (RLS):** Seluruh data kesehatan (makanan, minum, siklus, timbangan) dienkripsi & dilindungi di level database PostgreSQL. Hanya pemilik akun yang diizinkan melakukan operasi `SELECT`, `INSERT`, `UPDATE`, atau `DELETE`.
- **Mode Tamu / Offline-First:** Pengguna tetap dapat memakai seluruh fitur secara instan tanpa login (data tersimpan di HP/LocalStorage). Saat login Google dilakukan, data langsung tersinkronkan ke cloud.

---

## 4. Arsitektur Data (Supabase PostgreSQL + RLS) & Status Data Bersih (Clean State)

### Kebijakan Data Bersih (No Dummy Data)
- **Tanpa Data Dummy:** Seluruh data simulasi/dummy bawaan (makan, minum air, olahraga, dan timbangan awal) **dibersihkan sepenuhnya**.
- **Fresh Start:** Pengguna memulai aplikasi dengan riwayat bersih (*0 makanan, 0 air, 0 olahraga, 0 timbangan log*) agar siap diisi dengan data aktual dan akurat dari keseharian pengguna sendiri.

### Skema Database Relasional (Supabase)
```sql
-- 1. profiles: data profil pengguna terlindungi RLS (auth.uid() = id)
profiles (id UUID PRIMARY KEY, name TEXT, is_nursing BOOLEAN, period_start DATE, period_end DATE, daily_water_target INT)

-- 2. water_logs: catatan hidrasi harian terlindungi RLS (auth.uid() = user_id)
water_logs (id UUID PRIMARY KEY, user_id UUID, date DATE, total_ml INT, entries JSONB)

-- 3. health_logs: catatan kalori, langkah, tidur terlindungi RLS (auth.uid() = user_id)
health_logs (id UUID PRIMARY KEY, user_id UUID, date DATE, steps INT, sleep_hours NUMERIC, notes TEXT)

-- 4. period_logs: siklus hormon dan menstruasi terlindungi RLS (auth.uid() = user_id)
period_logs (id UUID PRIMARY KEY, user_id UUID, start_date DATE, end_date DATE, cycle_length INT)
```

---

## 5. Halaman / Screen

| Screen | Deskripsi |
|---|---|
| **Splash / Onboarding** | Login Google + isi data profil (sekali saja) |
| **Dashboard** | Halaman utama harian |
| **Log Makan** | Form tambah makan + list makan hari ini |
| **IF Timer** | Timer besar + status eating window |
| **Puasa Senin-Kamis** | Toggle + timer + history kalender |
| **Fase Hormon** | Kalender bulanan + detail per fase |
| **Grafik Progress** | BB + lingkar perut chart |
| **Olahraga** | Log olahraga hari ini + history |
| **Tracker Mie** | Status jatah + history |
| **Notifikasi** | Pengaturan on/off per kategori |
| **Profil & Pengaturan** | Edit data diri + target kalori |

---

## 6. Desain & UI/UX

- **Tema warna:** Pink/Rose (`rose-400`, `rose-500`, `rose-100`)
- **Font:** Inter atau Poppins (modern, mudah dibaca)
- **Gaya:** Mobile-first, clean, card-based layout
- **Bottom navigation:** 5 tab — 🏠 Dashboard / 🍽️ Makan / ⏱️ IF Timer / 📊 Progress / ⚙️ Pengaturan
- **Dark mode:** Tidak diperlukan (fase 1)
- **Bahasa:** Indonesia

---

## 7. Milestone Development

| Fase | Fitur | Estimasi |
|---|---|---|
| **MVP (v1.0)** | F1 Dashboard, F2 Log Makan + Alert, F3 IF Timer, F10 Profil | 1–2 minggu |
| **v1.1** | F4 Puasa Senin-Kamis, F9 Notifikasi, F8 Tracker Mie | +1 minggu |
| **v1.2** | F5 Fase Hormon, F6 Grafik Progress, F7 Olahraga | +1–2 minggu |
| **v1.3** | Polish, bug fix, deploy ke Firebase Hosting | +3–5 hari |

---

## 8. Success Metrics

- ✅ User bisa log makan < 1 menit per entry
- ✅ Alert kalori muncul dalam < 2 detik setelah input melebihi batas
- ✅ Push notif terkirim tepat waktu (toleransi ±1 menit)
- ✅ App bisa diinstall di HP Android sebagai PWA (Add to Home Screen)
- ✅ Data tersinkron di Supabase PostgreSQL (tidak hilang jika ganti HP)
- ✅ **Google Authentication & Keamanan RLS:** Pengguna dapat login dengan akun Google dan data dijamin privat hanya untuk user tersebut via Row Level Security (RLS).
- ✅ **Kondisi Awal Bersih (Clean State):** Aplikasi siap digunakan tanpa data dummy bawaan (user menginput data riil sendiri).
- ✅ **Full Offline Functionality:**
  - Pengguna tetap bisa mencatat log makan, melihat timer IF, status puasa, dan kalender saat tanpa internet (LocalStorage + PWA cache).
  - Waktu sholat/Maghrib dihitung offline secara presisi.
  - Data yang diinput saat offline otomatis di-sinkronisasi (background sync) ke cloud Supabase begitu koneksi internet pulih.

---

## 9. Keputusan Desain & Spesifikasi Final (Decisions Log)

Semua pertanyaan desain telah diputuskan dan disetujui:

| Aspek | Keputusan Final | Keterangan Implementasi |
|---|---|---|
| **Nama Aplikasi** | **"Sehat Yuk!"** | Ditampilkan di PWA manifest, header aplikasi, dan notifikasi. |
| **Autentikasi Pengguna** | **Google Sign-In (OAuth via Supabase)** | Login satu klik dengan akun Google, otomatis mengambil nama dan foto profil, dengan sesi tersimpan otomatis di perangkat. |
| **Keamanan Data** | **Supabase Row Level Security (RLS)** | Kebijakan akses level baris database PostgreSQL (`auth.uid() = user_id`) memastikan data kesehatan 100% terlindungi dan tidak bisa diakses orang lain. |
| **Status Data Awal** | **Clean State (Tanpa Data Dummy)** | Seluruh data dummy/mock (makanan, minuman, timbangan) dihilangkan. User memulai dari riwayat bersih untuk menginput data riil. |
| **Waktu Maghrib & Imsak** | **Deteksi Lokasi Otomatis (GPS) + Kalkulasi Offline** | Menggunakan Geolocation API sekali saat setup, koordinat disimpan di perangkat, dan waktu dihitung secara astronomis memakai pustaka `adhan` (tanpa perlu API external atau kuota). Disertakan fallback pemilihan kota manual jika izin GPS ditolak. |
| **Dukungan Offline** | **Full Offline Mode** | Log makan, timer, dan status harian dapat dicatat saat offline. Memanfaatkan LocalStorage persistence + Service Worker Cache-First untuk aset statis. Auto-sync saat kembali online. |
| **Status Pengguna & Laktasi** | **Tidak Menyusui (Non-Laktasi)** | Formula kalori difokuskan pada defisit fat loss murni (1.300 kkal/hari) tanpa kebutuhan tambahan kalori menyusui. |
| **Data Siklus Menstruasi Aktual** | **Mulai 23 Sept — Selesai 1 Okt 2026** | Durasi haid 9 hari, siklus 28 hari, fase otomatis dihitung dinamis (per 5 Okt berada pada hari ke-13, Fase Folikuler akhir). |
| **Sistem Notifikasi & Bunyi Bel** | **Web Audio API Chime + Service Worker Push** | Notifikasi berbunyi bel alami (*pleasant harmonic chime*) 100% offline dan muncul di luar aplikasi (*system tray / lockscreen* perangkat). |
| **Cakupan Proyek** | **Pengembangan PWA Berkelanjutan** | Dokumen PRD dan implementasi aplikasi disinkronkan secara konsisten. |

