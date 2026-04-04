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
    it('creates a remote turn via allocate_turn RPC', async () => {
      mockRpc.mockResolvedValue({ data: mockTurnRow, error: null });

      const result = await joinQueueRemote(BARBERSHOP_ID, 'Ana Rodriguez');

      expect(result).toEqual(mockTurnRow);
      expect(mockRpc).toHaveBeenCalledWith('allocate_turn', {
        target_barbershop_id: BARBERSHOP_ID,
        new_source: 'remote',
        new_client_name: 'Ana Rodriguez',
      });
    });

    it('validates client name with Zod schema', async () => {
      await expect(joinQueueRemote(BARBERSHOP_ID, 'A')).rejects.toThrow();
    });

    it('throws when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(joinQueueRemote(BARBERSHOP_ID, 'Ana Rodriguez')).rejects.toEqual({ message: 'RPC failed' });
    });
  });

  describe('createWalkInTurn', () => {
    it('creates a walk-in turn via allocate_turn RPC', async () => {
      const walkInTurn = { ...mockTurnRow, source: 'walk-in' as const, created_by_membership_id: 'mem-1' };
      mockRpc.mockResolvedValue({ data: walkInTurn, error: null });

      const result = await createWalkInTurn(BARBERSHOP_ID, 'Carlos Martinez', 'mem-1');

      expect(result).toEqual(walkInTurn);
      expect(mockRpc).toHaveBeenCalledWith('allocate_turn', {
        target_barbershop_id: BARBERSHOP_ID,
        new_source: 'walk-in',
        new_client_name: 'Carlos Martinez',
        new_membership_id: 'mem-1',
      });
    });

    it('validates client name', async () => {
      await expect(createWalkInTurn(BARBERSHOP_ID, '', 'mem-1')).rejects.toThrow();
    });

    it('throws when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(createWalkInTurn(BARBERSHOP_ID, 'Carlos Martinez', 'mem-1')).rejects.toEqual({ message: 'RPC failed' });
    });
  });

  describe('callNextTurn', () => {
    it('calls next_turn RPC and returns formatted result', async () => {
      const rpcResult = {
        previous_turn_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        new_called_turn_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        affected_turns: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'],
      };
      mockRpc.mockResolvedValue({ data: rpcResult, error: null });

      const result = await callNextTurn(BARBERSHOP_ID);

      expect(result).toEqual({
        previousTurnId: rpcResult.previous_turn_id,
        newCalledTurnId: rpcResult.new_called_turn_id,
        affectedTurnIds: rpcResult.affected_turns,
      });
      expect(mockRpc).toHaveBeenCalledWith('next_turn', { target_barbershop_id: BARBERSHOP_ID });
    });

    it('returns empty affected_turns when null', async () => {
      const rpcResult = {
        previous_turn_id: null,
        new_called_turn_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
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
    it('updates turn status to cancelled with barbershop scope', async () => {
      const cancelledTurn = { ...mockTurnRow, status: 'cancelled' as const, cancelled_at: '2025-01-01T11:00:00Z' };
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cancelledTurn, error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const result = await cancelTurn(BARBERSHOP_ID, 'turn-1');

      expect(result.status).toBe('cancelled');
      expect(chain.eq).toHaveBeenNthCalledWith(1, 'barbershop_id', BARBERSHOP_ID);
      expect(chain.eq).toHaveBeenNthCalledWith(2, 'id', 'turn-1');
    });
  });
});
