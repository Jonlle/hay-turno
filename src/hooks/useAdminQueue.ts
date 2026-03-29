import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQueueForBarbershop,
  createWalkInTurn,
  callNextTurn,
  cancelTurn,
} from '../services/supabase/queue';
import type { TurnRow } from '../services/supabase/queue';
import type { TurnItem } from '../types';
import { queueKeys } from './usePublicQueue';

function mapTurnRow(row: TurnRow): TurnItem {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    turnNumber: row.turn_number,
    clientName: row.client_name,
    source: row.source,
    status: row.status,
    joinedAt: row.joined_at,
    calledAt: row.called_at,
  };
}

export const adminQueueKeys = {
  all: ['admin-queue'] as const,
  byBarbershop: (barbershopId: string) =>
    [...adminQueueKeys.all, barbershopId] as const,
};

/**
 * Admin queue hook - fetches active queue with mutations for Walk-in, Next, and Cancel.
 */
export function useAdminQueue(barbershopId: string | undefined) {
  const queryClient = useQueryClient();

  const queueQuery = useQuery({
    queryKey: adminQueueKeys.byBarbershop(barbershopId ?? ''),
    queryFn: () => getQueueForBarbershop(barbershopId!),
    enabled: !!barbershopId,
    refetchInterval: 30_000,
  });

  const walkInMutation = useMutation({
    mutationFn: ({
      clientName,
      membershipId,
    }: {
      clientName: string;
      membershipId: string;
    }) => createWalkInTurn(barbershopId!, clientName, membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueueKeys.byBarbershop(barbershopId!),
      });
      queryClient.invalidateQueries({
        queryKey: queueKeys.all,
      });
    },
  });

  const nextMutation = useMutation({
    mutationFn: () => callNextTurn(barbershopId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueueKeys.byBarbershop(barbershopId!),
      });
      queryClient.invalidateQueries({
        queryKey: queueKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ['stats'],
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (turnId: string) => cancelTurn(turnId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueueKeys.byBarbershop(barbershopId!),
      });
      queryClient.invalidateQueries({
        queryKey: queueKeys.all,
      });
    },
  });

  const turns = (queueQuery.data ?? []).map(mapTurnRow);
  const currentCalled = turns.find((t) => t.status === 'called') ?? null;
  const waitingTurns = turns.filter((t) => t.status === 'waiting');

  return {
    turns,
    currentCalled,
    waitingTurns,
    isLoading: queueQuery.isLoading,
    error: queueQuery.error,
    refetch: () => queueQuery.refetch(),
    // Mutations
    addWalkIn: walkInMutation.mutate,
    isAddingWalkIn: walkInMutation.isPending,
    walkInError: walkInMutation.error,
    callNext: nextMutation.mutate,
    isCallingNext: nextMutation.isPending,
    nextError: nextMutation.error,
    cancelTurn: cancelMutation.mutate,
    isCancellingTurn: cancelMutation.isPending,
    cancelError: cancelMutation.error,
  };
}
