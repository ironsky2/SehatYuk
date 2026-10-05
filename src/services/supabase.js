import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here'
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
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return { error: null };
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ==========================================
// Data Sync Helpers (Protected by RLS)
// ==========================================

export async function syncUserProfile(profileData) {
  if (!isSupabaseConfigured) return null;
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

  if (error) console.error('Error syncing profile:', error);
  return data;
}

export async function syncWaterLog(log) {
  if (!isSupabaseConfigured) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('water_logs')
    .upsert({
      user_id: user.id,
      ...log,
      updated_at: new Date().toISOString()
    });

  if (error) console.error('Error syncing water log:', error);
  return data;
}

export async function syncHealthLog(log) {
  if (!isSupabaseConfigured) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('health_logs')
    .upsert({
      user_id: user.id,
      ...log,
      updated_at: new Date().toISOString()
    });

  if (error) console.error('Error syncing health log:', error);
  return data;
}
