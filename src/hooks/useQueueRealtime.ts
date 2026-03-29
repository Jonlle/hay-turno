import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  subscribeToQueue,
  unsubscribeFromQueue,
} from '../services/supabase/realtime';
import { queueKeys } from './usePublicQueue';
import { adminQueueKeys } from './useAdminQueue';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseQueueRealtimeOptions {
  barbershopId: string | undefined;
  slug?: string;
}

/**
 * Realtime hook - subscribes to queue changes for a barbershop.
 * Invalidates Query caches when changes arrive so components re-fetch.
 *
 * Subscriptions belong in hooks, not components.
 */
export function useQueueRealtime({
  barbershopId,
  slug,
}: UseQueueRealtimeOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!barbershopId) return;

    const channel = subscribeToQueue(barbershopId, (_payload) => {
      // Invalidate public queue cache (slug-keyed when available)
      if (slug) {
        queryClient.invalidateQueries({
          queryKey: queueKeys.bySlug(slug),
        });
      }

      // Invalidate admin queue cache (always barbershop-scoped)
      queryClient.invalidateQueries({
        queryKey: adminQueueKeys.byBarbershop(barbershopId),
      });
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromQueue(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [barbershopId, slug, queryClient]);
}
