import { useQuery } from '@tanstack/react-query';
import { getBarbershopBySlug } from '../services/supabase/barbershops';
import { getQueueForBarbershop } from '../services/supabase/queue';
import type { QueueState } from '../types';
import { mapTurnRow } from '../utils/mappers';

export const queueKeys = {
  all: ['queue'] as const,
  bySlug: (slug: string) => [...queueKeys.all, 'slug', slug] as const,
};

/**
 * Public queue hook - fetches barbershop by slug and its active queue.
 * Returns notFound=true when slug doesn't match an active barbershop.
 */
export function usePublicQueue(slug: string) {
  const barbershopQuery = useQuery({
    queryKey: ['barbershop', slug],
    queryFn: () => getBarbershopBySlug(slug),
    retry: false,
  });

  const barbershopId = barbershopQuery.data?.id;

  const queueQuery = useQuery({
    queryKey: queueKeys.bySlug(slug),
    queryFn: () => getQueueForBarbershop(barbershopId!),
    enabled: !!barbershopId,
    refetchInterval: 30_000, // fallback poll, realtime overrides
  });

  const turns = (queueQuery.data ?? []).map(mapTurnRow);
  const currentCalled = turns.find((t) => t.status === 'called') ?? null;
  const waitingTurns = turns.filter((t) => t.status === 'waiting');

  const queueState: QueueState | null = barbershopQuery.data
    ? {
        barbershopName: barbershopQuery.data.name,
        barbershopSlug: barbershopQuery.data.slug,
        currentCalled,
        waitingTurns,
      }
    : null;

  return {
    barbershopId,
    queueState,
    isLoading: barbershopQuery.isLoading || queueQuery.isLoading,
    notFound: !barbershopQuery.isLoading && !barbershopQuery.data,
    error: barbershopQuery.error ?? queueQuery.error,
    refetch: () => {
      barbershopQuery.refetch();
      queueQuery.refetch();
    },
  };
}
