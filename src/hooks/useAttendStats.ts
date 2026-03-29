import { useQuery } from '@tanstack/react-query';
import { getAttendedStats } from '../services/supabase/stats';
import type { TimeGroupingRange } from '../utils/time';
import type { AttendedStats } from '../services/supabase/stats';

export const statsKeys = {
  all: ['stats'] as const,
  byRange: (barbershopId: string, range: TimeGroupingRange) =>
    [...statsKeys.all, barbershopId, range] as const,
};

/**
 * Attended stats hook - fetches stats for day/week/month range.
 * Uses Colombia timezone grouping from the stats service.
 */
export function useAttendedStats(
  barbershopId: string | undefined,
  range: TimeGroupingRange
) {
  return useQuery<AttendedStats>({
    queryKey: statsKeys.byRange(barbershopId ?? '', range),
    queryFn: () => getAttendedStats(barbershopId!, range),
    enabled: !!barbershopId,
    refetchInterval: 60_000,
  });
}
