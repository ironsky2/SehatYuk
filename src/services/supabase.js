import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Check if valid credentials are provided (not default placeholders)
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('https://ckmzckcffdrpmvpwjzcz.supabase.co') &&
  !supabaseAnonKey.includes('sb_publishable_CBmh-ctif1rfmfoj00mNUg_PQrBGzBC')
);

// Initialize client with localStorage session persistence
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

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

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) console.warn('Supabase sync profile warning:', error);
    return data;
  } catch (err) {
    console.warn('Supabase sync profile catch:', err);
    return null;
  }
}

export async function syncWaterLog(log) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('water_logs')
      .upsert({
        user_id: user.id,
        ...log,
        updated_at: new Date().toISOString()
      });

    if (error) console.warn('Supabase sync water log warning:', error);
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
      });

    if (error) console.warn('Supabase sync health log warning:', error);
    return data;
  } catch (err) {
    console.warn('Supabase sync health catch:', err);
    return null;
  }
}
