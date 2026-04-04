import { getSupabaseBrowserClient } from './client';
import { groupRecordsByRange, startOfColombiaDayUTC, type TimeGroupingRange } from '../../utils/time';

/**
 * Stats result for attended turns
 */
export interface AttendedStats {
  total: number;
  bySource: {
    walkIn: number;
    remote: number;
  };
  byTimeGroup: Array<{
    key: string;
    count: number;
  }>;
}

/**
 * Turn record from database
 */
interface TurnRecord {
  id: string;
  barbershop_id: string;
  turn_number: number;
  client_name: string;
  source: 'walk-in' | 'remote';
  status: 'waiting' | 'called' | 'attended' | 'cancelled';
  joined_at: string;
  called_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_by_membership_id: string | null;
}

/**
 * Get attended turns for a barbershop within a date range.
 */
async function getAttendedTurns(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<TurnRecord[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('turns')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'attended')
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  if (error) {
    throw error;
  }

  return (data ?? []) as TurnRecord[];
}

/**
 * Calculate attended turn statistics for a barbershop.
 */
export async function getAttendedStats(
  barbershopId: string,
  timeRange: TimeGroupingRange
): Promise<AttendedStats> {
  const now = new Date();
  let startDate: Date;

  // Calculate start date based on time range using Colombia timezone
  switch (timeRange) {
    case 'day':
      startDate = startOfColombiaDayUTC(now);
      break;
    case 'week': {
      const todayStart = startOfColombiaDayUTC(now);
      todayStart.setUTCDate(todayStart.getUTCDate() - 7);
      startDate = todayStart;
      break;
    }
    case 'month': {
      const todayStart = startOfColombiaDayUTC(now);
      todayStart.setUTCMonth(todayStart.getUTCMonth() - 1);
      startDate = todayStart;
      break;
    }
    default:
      startDate = startOfColombiaDayUTC(now);
  }

  const endDate = now;
  const turns = await getAttendedTurns(barbershopId, startDate, endDate);

  // Calculate totals and by source
  let total = 0;
  let walkIn = 0;
  let remote = 0;

  for (const turn of turns) {
    total++;
    if (turn.source === 'walk-in') {
      walkIn++;
    } else {
      remote++;
    }
  }

  // Group by time range using Colombia timezone
  const grouped = groupRecordsByRange(
    turns,
    (turn) => turn.completed_at,
    timeRange
  );

  return {
    total,
    bySource: {
      walkIn,
      remote,
    },
    byTimeGroup: grouped,
  };
}

/**
 * Get simple attendance count for today.
 */
export async function getTodayAttendedCount(barbershopId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();

  const todayStart = startOfColombiaDayUTC();

  const { count, error } = await supabase
    .from('turns')
    .select('*', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)
    .eq('status', 'attended')
    .gte('completed_at', todayStart.toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Get average wait time in minutes.
 */
export async function getAverageWaitTime(barbershopId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();

  // Get all attended turns from today (Colombia timezone)
  const todayStart = startOfColombiaDayUTC();

  // TODO: Replace with generated types from `supabase gen types typescript`
  const { data, error } = await (supabase.from('turns') as any)
    .select('joined_at, completed_at')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'attended')
    .gte('completed_at', todayStart.toISOString());

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  let totalWaitMinutes = 0;
  let count = 0;

  for (const turn of data as TurnRecord[]) {
    const joined = new Date(turn.joined_at ?? todayStart);
    const completed = new Date(turn.completed_at ?? new Date());
    const waitMs = completed.getTime() - joined.getTime();
    const waitMinutes = waitMs / (1000 * 60);
    totalWaitMinutes += waitMinutes;
    count++;
  }

  return count > 0 ? Math.round(totalWaitMinutes / count) : 0;
}