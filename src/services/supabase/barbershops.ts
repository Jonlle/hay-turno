import { getSupabaseBrowserClient } from './client';
import type { Database } from './client';

export type Barbershop = Database['public']['Tables']['barbershops']['Row'];

/**
 * Lookup a barbershop by its slug.
 * Used for public queue routes (/b/:slug) and admin routes (/admin/:slug).
 */
export async function getBarbershopBySlug(slug: string): Promise<Barbershop | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 = "could not be found" (single() returns no rows)
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get a barbershop by its ID.
 */
export async function getBarbershopById(id: string): Promise<Barbershop | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get all active barbershops (for admin selection).
 */
export async function getActiveBarbershops(): Promise<Barbershop[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}