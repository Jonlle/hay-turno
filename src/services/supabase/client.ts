import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TurnSource = 'walk-in' | 'remote';
export type TurnStatus = 'waiting' | 'called' | 'attended' | 'cancelled';
export type MembershipRole = 'owner' | 'manager';

export interface Database {
  public: {
    Tables: {
      barbershops: {
        Row: {
          id: string;
          slug: string;
          name: string;
          timezone: string;
          theme_settings: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          timezone?: string;
          theme_settings?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['barbershops']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
        };
      };
      barbershop_memberships: {
        Row: {
          id: string;
          barbershop_id: string;
          profile_id: string;
          role: MembershipRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          profile_id: string;
          role: MembershipRole;
          created_at?: string;
        };
        Update: {
          role?: MembershipRole;
        };
      };
      turns: {
        Row: {
          id: string;
          barbershop_id: string;
          turn_number: number;
          client_name: string;
          source: TurnSource;
          status: TurnStatus;
          joined_at: string;
          called_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_by_membership_id: string | null;
        };
        Insert: {
          id?: string;
          barbershop_id: string;
          turn_number: number;
          client_name: string;
          source: TurnSource;
          status?: TurnStatus;
          joined_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_by_membership_id?: string | null;
        };
        Update: {
          turn_number?: number;
          client_name?: string;
          source?: TurnSource;
          status?: TurnStatus;
          joined_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_by_membership_id?: string | null;
        };
      };
    };
  };
}

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
