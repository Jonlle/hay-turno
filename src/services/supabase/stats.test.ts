import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();

vi.mock('./client', () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}));

import { getAttendedStats, getTodayAttendedCount, getAverageWaitTime } from './stats';

const BARBERSHOP_ID = 'shop-123';

const attendedTurns = [
  {
    id: 'turn-1',
    barbershop_id: BARBERSHOP_ID,
    turn_number: 1,
    client_name: 'Carlos Martinez',
    source: 'walk-in',
    status: 'attended',
    joined_at: '2025-06-15T14:00:00-05:00',
    called_at: '2025-06-15T14:05:00-05:00',
    completed_at: '2025-06-15T14:30:00-05:00',
    cancelled_at: null,
    created_by_membership_id: 'mem-1',
  },
  {
    id: 'turn-2',
    barbershop_id: BARBERSHOP_ID,
    turn_number: 2,
    client_name: 'Ana Rodriguez',
    source: 'remote',
    status: 'attended',
    joined_at: '2025-06-15T15:00:00-05:00',
    called_at: '2025-06-15T15:10:00-05:00',
    completed_at: '2025-06-15T15:45:00-05:00',
    cancelled_at: null,
    created_by_membership_id: null,
  },
  {
    id: 'turn-3',
    barbershop_id: BARBERSHOP_ID,
    turn_number: 3,
    client_name: 'Luis Perez',
    source: 'walk-in',
    status: 'attended',
    joined_at: '2025-06-15T16:00:00-05:00',
    called_at: '2025-06-15T16:05:00-05:00',
    completed_at: '2025-06-15T16:20:00-05:00',
    cancelled_at: null,
    created_by_membership_id: 'mem-1',
  },
];

function createAttendedChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockResolvedValue(result),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stats service', () => {
  describe('getAttendedStats', () => {
    it('returns total, by source, and time grouping for day range', async () => {
      const chain = createAttendedChain({ data: attendedTurns, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getAttendedStats(BARBERSHOP_ID, 'day');

      expect(result.total).toBe(3);
      expect(result.bySource.walkIn).toBe(2);
      expect(result.bySource.remote).toBe(1);
      expect(result.byTimeGroup).toBeInstanceOf(Array);
      expect(chain.eq).toHaveBeenCalledWith('barbershop_id', BARBERSHOP_ID);
      expect(chain.eq).toHaveBeenCalledWith('status', 'attended');
    });

    it('returns empty stats when no attended turns', async () => {
      const chain = createAttendedChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getAttendedStats(BARBERSHOP_ID, 'week');

      expect(result.total).toBe(0);
      expect(result.bySource.walkIn).toBe(0);
      expect(result.bySource.remote).toBe(0);
      expect(result.byTimeGroup).toEqual([]);
    });

    it('throws on error', async () => {
      const chain = createAttendedChain({ data: null, error: { message: 'Query failed' } });
      mockFrom.mockReturnValue(chain);

      await expect(getAttendedStats(BARBERSHOP_ID, 'month')).rejects.toEqual({ message: 'Query failed' });
    });
  });

  describe('getTodayAttendedCount', () => {
    it('returns count of attended turns today', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getTodayAttendedCount(BARBERSHOP_ID);

      expect(result).toBe(5);
      expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('returns 0 when no turns', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getTodayAttendedCount(BARBERSHOP_ID);

      expect(result).toBe(0);
    });
  });

  describe('getAverageWaitTime', () => {
    it('calculates average wait time in minutes', async () => {
      const turns = [
        { joined_at: '2025-06-15T14:00:00Z', completed_at: '2025-06-15T14:30:00Z' },
        { joined_at: '2025-06-15T15:00:00Z', completed_at: '2025-06-15T15:20:00Z' },
      ];
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: turns, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await getAverageWaitTime(BARBERSHOP_ID);

      expect(result).toBe(25);
      expect(chain.select).toHaveBeenCalledWith('joined_at, completed_at');
      expect(chain.eq).toHaveBeenCalledWith('barbershop_id', BARBERSHOP_ID);
      expect(chain.eq).toHaveBeenCalledWith('status', 'attended');
    });

    it('returns 0 when no data', async () => {
      const chain = createAttendedChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getAverageWaitTime(BARBERSHOP_ID);

      expect(result).toBe(0);
    });
  });
});
