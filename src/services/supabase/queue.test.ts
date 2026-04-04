import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('./client', () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

import {
  getQueueForBarbershop,
  joinQueueRemote,
  createWalkInTurn,
  callNextTurn,
  cancelTurn,
} from './queue';

const BARBERSHOP_ID = 'shop-123';

const mockTurnRow = {
  id: 'turn-1',
  barbershop_id: BARBERSHOP_ID,
  turn_number: 1,
  client_name: 'Juan Perez',
  source: 'remote' as const,
  status: 'waiting' as const,
  joined_at: '2025-01-01T10:00:00Z',
  called_at: null,
  completed_at: null,
  cancelled_at: null,
  created_by_membership_id: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('queue service', () => {
  describe('getQueueForBarbershop', () => {
    it('returns waiting and called turns ordered by turn_number', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockTurnRow], error: null }),
      };
      mockFrom.mockReturnValue(selectChain);

      const result = await getQueueForBarbershop(BARBERSHOP_ID);

      expect(result).toEqual([mockTurnRow]);
      expect(mockFrom).toHaveBeenCalledWith('turns');
      expect(selectChain.eq).toHaveBeenCalledWith('barbershop_id', BARBERSHOP_ID);
      expect(selectChain.in).toHaveBeenCalledWith('status', ['waiting', 'called']);
      expect(selectChain.order).toHaveBeenCalledWith('turn_number', { ascending: true });
    });

    it('throws on error', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      mockFrom.mockReturnValue(selectChain);

      await expect(getQueueForBarbershop(BARBERSHOP_ID)).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('joinQueueRemote', () => {
    it('creates a remote turn with validated client name', async () => {
      const lastTurnChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { turn_number: 3 }, error: null }),
      };
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTurnRow, error: null }),
      };

      mockFrom
        .mockReturnValueOnce(lastTurnChain)
        .mockReturnValueOnce(insertChain);

      const result = await joinQueueRemote(BARBERSHOP_ID, 'Ana Rodriguez');

      expect(result).toEqual(mockTurnRow);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          barbershop_id: BARBERSHOP_ID,
          turn_number: 4,
          client_name: 'Ana Rodriguez',
          source: 'remote',
          status: 'waiting',
        })
      );
    });

    it('validates client name with Zod schema', async () => {
      await expect(joinQueueRemote(BARBERSHOP_ID, 'A')).rejects.toThrow();
    });

    it('throws when insert fails', async () => {
      const lastTurnChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      mockFrom
        .mockReturnValueOnce(lastTurnChain)
        .mockReturnValueOnce(insertChain);

      await expect(joinQueueRemote(BARBERSHOP_ID, 'Ana Rodriguez')).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('createWalkInTurn', () => {
    it('creates a walk-in turn with membership ID', async () => {
      const walkInTurn = { ...mockTurnRow, source: 'walk-in' as const, created_by_membership_id: 'mem-1' };
      const lastTurnChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { turn_number: 5 }, error: null }),
      };
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: walkInTurn, error: null }),
      };

      mockFrom
        .mockReturnValueOnce(lastTurnChain)
        .mockReturnValueOnce(insertChain);

      const result = await createWalkInTurn(BARBERSHOP_ID, 'Carlos Martinez', 'mem-1');

      expect(result).toEqual(walkInTurn);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'walk-in',
          created_by_membership_id: 'mem-1',
          turn_number: 6,
        })
      );
    });

    it('validates client name', async () => {
      await expect(createWalkInTurn(BARBERSHOP_ID, '', 'mem-1')).rejects.toThrow();
    });
  });

  describe('callNextTurn', () => {
    it('calls next_turn RPC and returns formatted result', async () => {
      const rpcResult = {
        previous_turn_id: 'turn-1',
        new_called_turn_id: 'turn-2',
        affected_turns: ['turn-1', 'turn-2'],
      };
      mockRpc.mockResolvedValue({ data: rpcResult, error: null });

      const result = await callNextTurn(BARBERSHOP_ID);

      expect(result).toEqual({
        previousTurnId: 'turn-1',
        newCalledTurnId: 'turn-2',
        affectedTurnIds: ['turn-1', 'turn-2'],
      });
      expect(mockRpc).toHaveBeenCalledWith('next_turn', { target_barbershop_id: BARBERSHOP_ID });
    });

    it('returns empty affected_turns when null', async () => {
      const rpcResult = {
        previous_turn_id: null,
        new_called_turn_id: 'turn-1',
        affected_turns: null,
      };
      mockRpc.mockResolvedValue({ data: rpcResult, error: null });

      const result = await callNextTurn(BARBERSHOP_ID);

      expect(result.affectedTurnIds).toEqual([]);
    });

    it('throws on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(callNextTurn(BARBERSHOP_ID)).rejects.toEqual({ message: 'RPC failed' });
    });
  });

  describe('cancelTurn', () => {
    it('updates turn status to cancelled', async () => {
      const cancelledTurn = { ...mockTurnRow, status: 'cancelled' as const, cancelled_at: '2025-01-01T11:00:00Z' };
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cancelledTurn, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await cancelTurn('turn-1');

      expect(result.status).toBe('cancelled');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'turn-1');
    });
  });
});
