import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../hooks/usePublicQueue');
vi.mock('../../hooks/useQueueRealtime');

import { PublicQueuePage } from './QueuePage';
import { usePublicQueue } from '../../hooks/usePublicQueue';
import { useQueueRealtime } from '../../hooks/useQueueRealtime';

const mockUsePublicQueue = vi.mocked(usePublicQueue);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useQueueRealtime).mockReturnValue(undefined);
});

function renderPage(slug = 'demo') {
  return render(
    <MemoryRouter initialEntries={[`/b/${slug}`]}>
      <Routes>
        <Route path="/b/:slug" element={<PublicQueuePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicQueuePage', () => {
  it('renders loading state while fetching', () => {
    mockUsePublicQueue.mockReturnValue({
      barbershopId: undefined,
      queueState: null,
      isLoading: true,
      notFound: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('renders not found page when slug is invalid', () => {
    mockUsePublicQueue.mockReturnValue({
      barbershopId: undefined,
      queueState: null,
      isLoading: false,
      notFound: true,
      error: null,
      refetch: vi.fn(),
    });

    renderPage('invalid-slug');

    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  it('renders queue board with barbershop name', () => {
    mockUsePublicQueue.mockReturnValue({
      barbershopId: 'shop-123',
      queueState: {
        barbershopName: 'Barbería Demo',
        barbershopSlug: 'demo',
        currentCalled: {
          id: 'turn-1',
          barbershopId: 'shop-123',
          turnNumber: 1,
          clientName: 'Juan Perez',
          source: 'walk-in',
          status: 'called',
          joinedAt: '2025-01-01T10:00:00Z',
          calledAt: '2025-01-01T10:05:00Z',
        },
        waitingTurns: [
          {
            id: 'turn-2',
            barbershopId: 'shop-123',
            turnNumber: 2,
            clientName: 'Ana Rodriguez',
            source: 'remote',
            status: 'waiting',
            joinedAt: '2025-01-01T10:10:00Z',
            calledAt: null,
          },
        ],
      },
      isLoading: false,
      notFound: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('public-queue-page')).toBeInTheDocument();
    expect(screen.getByText('Barbería Demo')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Ana Rodriguez')).toBeInTheDocument();
    expect(screen.getByTestId('join-queue-link')).toBeInTheDocument();
    expect(screen.getByTestId('join-queue-link').getAttribute('href')).toBe('/b/demo/join');
  });

  it('shows empty state when no waiting turns', () => {
    mockUsePublicQueue.mockReturnValue({
      barbershopId: 'shop-123',
      queueState: {
        barbershopName: 'Barbería Demo',
        barbershopSlug: 'demo',
        currentCalled: null,
        waitingTurns: [],
      },
      isLoading: false,
      notFound: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Nadie siendo atendido')).toBeInTheDocument();
    expect(screen.getByText('Cola vacía')).toBeInTheDocument();
  });
});
