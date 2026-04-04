import { getSupabaseBrowserClient } from './client';
import type { Database } from '../../types/database';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TurnRow = Database['public']['Tables']['turns']['Row'];

/**
 * Callback for queue changes
 */
export type QueueChangeCallback = (
  payload: RealtimePostgresChangesPayload<TurnRow>
) => void;

/**
 * Subscribe to queue changes for a specific barbershop.
 * This subscribes to INSERT, UPDATE, and DELETE on the turns table
 * filtered by barbershop_id.
 */
export function subscribeToQueue(
  barbershopId: string,
  onChange: QueueChangeCallback
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`queue:${barbershopId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'turns',
        filter: `barbershop_id=eq.${barbershopId}`,
      },
      onChange
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from queue changes.
 */
export function unsubscribeFromQueue(channel: RealtimeChannel): void {
  channel.unsubscribe();
}

/**
 * Callback for barbershop membership changes
 */
export type MembershipChangeCallback = (
  payload: RealtimePostgresChangesPayload<{
    id: string;
    barbershop_id: string;
    profile_id: string;
    role: string;
    created_at: string;
  }>
) => void;

/**
 * Subscribe to membership changes for a specific barbershop.
 */
export function subscribeToMemberships(
  barbershopId: string,
  onChange: MembershipChangeCallback
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`memberships:${barbershopId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'barbershop_memberships',
        filter: `barbershop_id=eq.${barbershopId}`,
      },
      onChange
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all barbershops changes (for public queue views).
 */
export function subscribeToBarbershops(
  onChange: (payload: RealtimePostgresChangesPayload<{
    id: string;
    slug: string;
    name: string;
    timezone: string;
    is_active: boolean;
  }>) => void
): RealtimeChannel {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel('barbershops:public')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'barbershops',
        filter: 'is_active=eq.true',
      },
      onChange
    )
    .subscribe();

  return channel;
}