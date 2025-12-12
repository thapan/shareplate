import { supabase } from './supabaseClient';

export async function sendOtp(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
}

export async function verifyOtp({ email, token }) {
  return supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return { session: data?.session || null };
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signOut() {
  return supabase.auth.signOut();
}
