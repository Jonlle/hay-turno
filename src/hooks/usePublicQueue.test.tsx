import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

vi.mock('../services/supabase/barbershops');
vi.mock('../services/supabase/queue');

import { usePublicQueue } from './usePublicQueue';
import { getBarbershopBySlug } from '../services/supabase/barbershops';
import { getQueueForBarbershop } from '../services/supabase/queue';

const mockGetBarbershop = vi.mocked(getBarbershopBySlug);
const mockGetQueue = vi.mocked(getQueueForBarbershop);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockBarbershop = {
  id: 'shop-123',
  slug: 'demo',
  name: 'Barbería Demo',
  timezone: 'America/Bogota',
  theme_settings: {},
  is_active: true,
  created_at: '2025-01-01',
};

const mockTurns = [
  {
    id: 'turn-1',
    barbershop_id: 'shop-123',
    turn_number: 1,
    client_name: 'Juan Perez',
    source: 'remote' as const,
    status: 'called' as const,
    joined_at: '2025-01-01T10:00:00Z',
    called_at: '2025-01-01T10:05:00Z',
    completed_at: null,
    cancelled_at: null,
    created_by_membership_id: null,
  },
  {
    id: 'turn-2',
    barbershop_id: 'shop-123',
    turn_number: 2,
    client_name: 'Ana Rodriguez',
    source: 'walk-in' as const,
    status: 'waiting' as const,
    joined_at: '2025-01-01T10:10:00Z',
    called_at: null,
    completed_at: null,
    cancelled_at: null,
    created_by_membership_id: 'mem-1',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePublicQueue', () => {
  it('returns loading state initially', () => {
    mockGetBarbershop.mockResolvedValue(mockBarbershop);
    mockGetQueue.mockResolvedValue(mockTurns);

    const { result } = renderHook(() => usePublicQueue('demo'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns queue state with barbershop name and turns', async () => {
    mockGetBarbershop.mockResolvedValue(mockBarbershop);
    mockGetQueue.mockResolvedValue(mockTurns);

    const { result } = renderHook(() => usePublicQueue('demo'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.queueState?.barbershopName).toBe('Barbería Demo');
    expect(result.current.queueState?.currentCalled?.clientName).toBe('Juan Perez');
    expect(result.current.queueState?.waitingTurns).toHaveLength(1);
    expect(result.current.queueState?.waitingTurns[0].clientName).toBe('Ana Rodriguez');
    expect(result.current.barbershopId).toBe('shop-123');
  });

  it('returns notFound when barbershop does not exist', async () => {
    mockGetBarbershop.mockResolvedValue(null);

    const { result } = renderHook(() => usePublicQueue('invalid'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notFound).toBe(true);
    expect(result.current.queueState).toBeNull();
  });

  it('exposes barbershopId for realtime subscription', async () => {
    mockGetBarbershop.mockResolvedValue(mockBarbershop);
    mockGetQueue.mockResolvedValue(mockTurns);

    const { result } = renderHook(() => usePublicQueue('demo'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.barbershopId).toBe('shop-123');
    });
  });

  it('maps TurnRow to TurnItem correctly', async () => {
    mockGetBarbershop.mockResolvedValue(mockBarbershop);
    mockGetQueue.mockResolvedValue(mockTurns);

    const { result } = renderHook(() => usePublicQueue('demo'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const called = result.current.queueState?.currentCalled;
    expect(called?.id).toBe('turn-1');
    expect(called?.turnNumber).toBe(1);
    expect(called?.status).toBe('called');
    expect(called?.source).toBe('remote');
  });
});
