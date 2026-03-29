import { getSupabaseBrowserClient } from './client';

/**
 * Membership row from the database
 */
export interface MembershipRow {
  id: string;
  barbershop_id: string;
  profile_id: string;
  role: 'owner' | 'manager';
  created_at: string;
}

/**
 * Get the user's membership for a specific barbershop.
 */
export async function getMembershipForBarbershop(
  barbershopId: string,
  profileId: string
): Promise<MembershipRow | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('barbershop_memberships')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('profile_id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as MembershipRow;
}

/**
 * Get all memberships for a specific barbershop.
 */
export async function getMembershipsForBarbershop(
  barbershopId: string
): Promise<MembershipRow[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('barbershop_memberships')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as MembershipRow[];
}

/**
 * Check if the current user is a member of a barbershop.
 */
export async function isUserMemberOfBarbershop(
  barbershopId: string
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  // Cast to any to bypass RPC type inference issues
  const { data, error } = await (supabase.rpc as any)('is_barbershop_member', {
    target_barbershop_id: barbershopId,
  });

  if (error) {
    throw error;
  }

  return (data ?? false) as boolean;
}

/**
 * Get the user's role for a specific barbershop.
 * Returns null if the user is not a member.
 */
export async function getUserRoleForBarbershop(
  barbershopId: string
): Promise<'owner' | 'manager' | null> {
  const supabase = getSupabaseBrowserClient();

  // First get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const membership = await getMembershipForBarbershop(barbershopId, user.id);
  return membership?.role ?? null;
}

/**
 * Check if user has owner role for a barbershop.
 */
export async function isUserOwnerOfBarbershop(barbershopId: string): Promise<boolean> {
  const role = await getUserRoleForBarbershop(barbershopId);
  return role === 'owner';
}

/**
 * Check if user has manager or owner role for a barbershop.
 */
export async function isUserManagerOfBarbershop(barbershopId: string): Promise<boolean> {
  const role = await getUserRoleForBarbershop(barbershopId);
  return role === 'owner' || role === 'manager';
}