-- =========================================================================
-- Sehat Yuk! - Supabase Database Schema with Row Level Security (RLS)
-- Jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda
-- =========================================================================

-- 1. Tabel Profil Pengguna
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  gender TEXT DEFAULT 'female',
  is_nursing BOOLEAN DEFAULT false,
  period_start DATE,
  period_end DATE,
  daily_water_target INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Catatan Minum Air Harian
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_ml INTEGER DEFAULT 0,
  entries JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- 3. Tabel Catatan Kesehatan Harian
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  sleep_hours NUMERIC(4, 2) DEFAULT 0,
  mood TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- 4. Tabel Siklus Menstruasi
CREATE TABLE IF NOT EXISTS public.period_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  cycle_length INTEGER DEFAULT 28,
  period_length INTEGER DEFAULT 7,
  symptoms TEXT[],
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- KEAMANAN: AKTIFKAN ROW LEVEL SECURITY (RLS)
-- Hanya pemilik data (auth.uid()) yang dapat melihat, menambah, mengubah, dan menghapus!
-- =========================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk Profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy untuk Water Logs
CREATE POLICY "Users can view own water logs" 
  ON public.water_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" 
  ON public.water_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs" 
  ON public.water_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs" 
  ON public.water_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Policy untuk Health Logs
CREATE POLICY "Users can view own health logs" 
  ON public.health_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health logs" 
  ON public.health_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health logs" 
  ON public.health_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health logs" 
  ON public.health_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Policy untuk Period Logs
CREATE POLICY "Users can view own period logs" 
  ON public.period_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own period logs" 
  ON public.period_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own period logs" 
  ON public.period_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own period logs" 
  ON public.period_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger Otomatis: Buat Profil saat User Baru Mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, is_nursing, period_start, period_end)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    false,
    '2026-09-23',
    '2026-10-01'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 5. Tabel Sinkronisasi Komprehensif Aplikasi (user_state)
-- Menyimpan seluruh riwayat makanan, berat badan, olahraga, dan target kalori
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_state (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own state"
  ON public.user_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own state"
  ON public.user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own state"
  ON public.user_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own state"
  ON public.user_state FOR DELETE
  USING (auth.uid() = user_id);

