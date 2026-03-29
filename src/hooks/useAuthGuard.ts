import { useQuery } from '@tanstack/react-query';
import { getBarbershopBySlug } from '../services/supabase/barbershops';
import {
  getCurrentUser,
  isAuthenticated,
} from '../services/supabase/auth';
import {
  getMembershipForBarbershop,
} from '../services/supabase/memberships';
import type { MembershipRow } from '../services/supabase/memberships';
import type { User } from '@supabase/supabase-js';

export interface AuthGuardResult {
  user: User | null;
  membership: MembershipRow | null;
  barbershopId: string | undefined;
  barbershopName: string | undefined;
  isAuthorized: boolean;
  isLoading: boolean;
  needsLogin: boolean;
  error: Error | null;
}

/**
 * Auth guard hook for admin routes.
 * Returns authorization state: is the current user a member (owner/manager) of this barbershop?
 */
export function useAuthGuard(slug: string): AuthGuardResult {
  // Step 1: Resolve barbershop
  const barbershopQuery = useQuery({
    queryKey: ['barbershop', slug],
    queryFn: () => getBarbershopBySlug(slug),
    retry: false,
  });

  const barbershopId = barbershopQuery.data?.id;

  // Step 2: Check auth status
  const authQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) return null;
      return getCurrentUser();
    },
    retry: false,
  });

  const userId = authQuery.data?.id;

  // Step 3: Check membership
  const membershipQuery = useQuery({
    queryKey: ['membership', barbershopId, userId],
    queryFn: () => getMembershipForBarbershop(barbershopId!, userId!),
    enabled: !!barbershopId && !!userId,
    retry: false,
  });

  const isLoading =
    barbershopQuery.isLoading ||
    authQuery.isLoading ||
    (!!barbershopId && !!userId && membershipQuery.isLoading);

  const needsLogin = !isLoading && !authQuery.data;
  const isAuthorized =
    !isLoading && !!authQuery.data && !!membershipQuery.data;

  return {
    user: authQuery.data ?? null,
    membership: membershipQuery.data ?? null,
    barbershopId,
    barbershopName: barbershopQuery.data?.name,
    isAuthorized,
    isLoading,
    needsLogin,
    error:
      barbershopQuery.error ?? authQuery.error ?? membershipQuery.error ?? null,
  };
}
