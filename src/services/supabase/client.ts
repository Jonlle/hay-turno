import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export { Database };

export type TurnSource = 'walk-in' | 'remote';
export type TurnStatus = 'waiting' | 'called' | 'attended' | 'cancelled';
export type MembershipRole = 'owner' | 'manager';

export type HayTurnoSupabaseClient = SupabaseClient<Database>;

let browserClient: HayTurnoSupabaseClient | undefined;

function getSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return { url, anonKey };
}

export function createSupabaseBrowserClient(): HayTurnoSupabaseClient {
  const { url, anonKey } = getSupabaseEnv();

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseBrowserClient(): HayTurnoSupabaseClient {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }

  return browserClient;
}
