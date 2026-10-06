import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Check if valid credentials are provided (not default placeholders)
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your_supabase_anon_key')
);

// Initialize client with localStorage session persistence
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sehat_yuk_auth_token'
      }
    })
  : null;

/**
 * Mengambil sesi autentikasi aktif yang tersimpan
 */
export async function getStoredSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch (err) {
    console.warn('Supabase getSession warning:', err);
    return null;
  }
}

// ==========================================
// Authentication Helpers
// ==========================================

export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error('Supabase not configured') };
  try {
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error('Supabase not configured') };
  try {
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error('Supabase not configured') };
  try {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) return { error: null };
  try {
    return await supabase.auth.signOut();
  } catch (err) {
    return { error: err };
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  } catch (err) {
    console.warn('Supabase getUser warning:', err);
    return null;
  }
}

// ==========================================
// Data Sync Helpers (Protected by RLS)
// ==========================================

export async function syncUserProfile(profileData) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Filter fields to match profiles table schema
    const cleanPayload = {
      id: user.id,
      name: profileData?.name || null,
      gender: 'female',
      is_nursing: Boolean(profileData?.isNursing),
      period_start: profileData?.hpht || null,
      period_end: profileData?.periodEnd || null,
      daily_water_target: 2000,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(cleanPayload)
      .select()
      .maybeSingle();

    if (error) console.warn('Supabase sync profile warning:', error.message);
    return data;
  } catch (err) {
    console.warn('Supabase sync profile catch:', err);
    return null;
  }
}

export async function fetchUserProfile() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export async function syncWaterLog(waterGlasses, dateStr) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const row = {
      user_id: user.id,
      date: dateStr || new Date().toISOString().split('T')[0],
      total_ml: (Number(waterGlasses) || 0) * 250,
      entries: [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('water_logs')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .maybeSingle();

    if (error) console.warn('Supabase sync water log warning:', error.message);
    return data;
  } catch (err) {
    console.warn('Supabase sync water catch:', err);
    return null;
  }
}

export async function syncHealthLog(log) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('health_logs')
      .upsert({
        user_id: user.id,
        ...log,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' });

    if (error) console.warn('Supabase sync health log warning:', error.message);
    return data;
  } catch (err) {
    console.warn('Supabase sync health catch:', err);
    return null;
  }
}

// Complete App State Sync (Meals, Weights, Exercises, Profile, Settings)
export async function syncAppState(state) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_state')
      .upsert({
        user_id: user.id,
        state: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      // Table might not exist yet if SQL migration is pending
      console.warn('Supabase user_state sync notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase sync user_state catch:', err);
    return null;
  }
}

export async function fetchAppState() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_state')
      .select('state, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data.state;
  } catch (err) {
    console.warn('Supabase fetch user_state catch:', err);
    return null;
  }
}
