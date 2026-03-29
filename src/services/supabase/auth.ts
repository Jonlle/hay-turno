import { getSupabaseBrowserClient } from './client';
import type { Session, AuthError, User } from '@supabase/supabase-js';

export type { Session, AuthError, User };

/**
 * Get the current authenticated session.
 * Returns null if not authenticated.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * Get the current authenticated user.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Check if a user is currently authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Sign in with email and password.
 * Returns the response with session and error.
 */
export async function signInWithEmail(
  email: string,
  password: string
) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Profile row from the database
 */
export interface ProfileRow {
  id: string;
  full_name: string | null;
  created_at: string;
}

/**
 * Get the user's profile from the profiles table.
 */
export async function getUserProfile(
  userId: string
): Promise<ProfileRow | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as ProfileRow;
}

/**
 * Update the user's profile.
 */
export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string | null }
): Promise<ProfileRow> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await (supabase.from('profiles') as any)
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRow;
}