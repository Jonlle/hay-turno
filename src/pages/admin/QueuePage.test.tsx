import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useAuthGuard');
vi.mock('../../hooks/useAdminQueue');
vi.mock('../../hooks/useQueueRealtime');

import { AdminQueuePage } from './QueuePage';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { useQueueRealtime } from '../../hooks/useQueueRealtime';

const mockUseAuthGuard = vi.mocked(useAuthGuard);
const mockUseAdminQueue = vi.mocked(useAdminQueue);

function renderPage(slug = 'demo') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/${slug}/queue`]}>
        <Routes>
          <Route path="/admin/:slug/queue" element={<AdminQueuePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const defaultAuthGuard = {
  user: { id: 'user-123', email: 'admin@demo.com' } as any,
  membership: { id: 'mem-1', barbershop_id: 'shop-123', profile_id: 'user-123', role: 'owner' as const, created_at: '2025-01-01' },
  barbershopId: 'shop-123',
  barbershopName: 'Barbería Demo',
  themeSettings: undefined,
  isAuthorized: true,
  isLoading: false,
  needsLogin: false,
  error: null,
};

const defaultAdminQueue = {
  turns: [],
  currentCalled: null,
  waitingTurns: [],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  addWalkIn: vi.fn(),
  isAddingWalkIn: false,
  walkInError: null,
  callNext: vi.fn(),
  isCallingNext: false,
  nextError: null,
  cancelTurn: vi.fn(),
  isCancellingTurn: false,
  cancelError: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useQueueRealtime).mockReturnValue(undefined);
});

describe('AdminQueuePage', () => {
  it('renders queue board when authorized', () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);
    mockUseAdminQueue.mockReturnValue(defaultAdminQueue);

    renderPage();

    expect(screen.getByTestId('admin-queue-page')).toBeInTheDocument();
    expect(screen.getByText('Barbería Demo')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.getByTestId('walk-in-form')).toBeInTheDocument();
    expect(screen.getByTestId('stats-link')).toBeInTheDocument();
  });

  it('shows loading state while authenticating', () => {
    mockUseAuthGuard.mockReturnValue({ ...defaultAuthGuard, isLoading: true, isAuthorized: false });
    mockUseAdminQueue.mockReturnValue(defaultAdminQueue);

    renderPage();

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows access denied when not authorized', () => {
    mockUseAuthGuard.mockReturnValue({ ...defaultAuthGuard, isAuthorized: false, isLoading: false });
    mockUseAdminQueue.mockReturnValue(defaultAdminQueue);

    renderPage();

    expect(screen.getByText('No tenés permisos para acceder a esta barbería.')).toBeInTheDocument();
  });

  it('renders turns in the queue', () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);
    mockUseAdminQueue.mockReturnValue({
      ...defaultAdminQueue,
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
    });

    renderPage();

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Ana Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Llamando')).toBeInTheDocument();
    expect(screen.getByText('En espera')).toBeInTheDocument();
  });

  it('has stats link and logout button', () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);
    mockUseAdminQueue.mockReturnValue(defaultAdminQueue);

    renderPage();

    expect(screen.getByTestId('stats-link').getAttribute('href')).toBe('/admin/demo/stats');
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('enables Next button when current turn exists but queue is empty', () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);
    mockUseAdminQueue.mockReturnValue({
      ...defaultAdminQueue,
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
      waitingTurns: [],
    });

    renderPage();

    expect(screen.getByTestId('next-button')).not.toBeDisabled();
    expect(screen.getByText('Finalizar turno')).toBeInTheDocument();
  });

  it('shows cancel button on waiting turns', () => {
    const mockCancelTurn = vi.fn();
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);
    mockUseAdminQueue.mockReturnValue({
      ...defaultAdminQueue,
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
      cancelTurn: mockCancelTurn,
    });

    renderPage();

    const cancelButton = screen.getByTestId('cancel-turn-turn-2');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton.getAttribute('aria-label')).toBe('Cancelar turno 2');
  });
});
