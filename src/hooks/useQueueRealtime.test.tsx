import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

vi.mock('../services/supabase/realtime');
vi.mock('../services/supabase/barbershops');
vi.mock('../services/supabase/queue');

import { useQueueRealtime } from './useQueueRealtime';
import { subscribeToQueue, unsubscribeFromQueue } from '../services/supabase/realtime';

const mockSubscribe = vi.mocked(subscribeToQueue);
const mockUnsubscribe = vi.mocked(unsubscribeFromQueue);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscribe.mockReturnValue({} as any);
});

describe('useQueueRealtime', () => {
  it('subscribes to queue changes with barbershopId', () => {
    const { unmount } = renderHook(
      () => useQueueRealtime({ barbershopId: 'shop-123', slug: 'demo' }),
      { wrapper: createWrapper() }
    );

    expect(mockSubscribe).toHaveBeenCalledWith('shop-123', expect.any(Function));
    unmount();
  });

  it('does not subscribe when barbershopId is undefined', () => {
    renderHook(
      () => useQueueRealtime({ barbershopId: undefined, slug: 'demo' }),
      { wrapper: createWrapper() }
    );

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const mockChannel = { topic: 'test' } as any;
    mockSubscribe.mockReturnValue(mockChannel);

    const { unmount } = renderHook(
      () => useQueueRealtime({ barbershopId: 'shop-123', slug: 'demo' }),
      { wrapper: createWrapper() }
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledWith(mockChannel);
  });
});
