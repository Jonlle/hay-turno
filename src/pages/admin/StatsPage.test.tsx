import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useAuthGuard');
vi.mock('../../hooks/useAttendStats', () => ({
  useAttendedStats: vi.fn().mockReturnValue({ data: undefined, isLoading: true, error: null }),
}));

import { AdminStatsPage } from './StatsPage';
import { useAuthGuard } from '../../hooks/useAuthGuard';

const mockUseAuthGuard = vi.mocked(useAuthGuard);

function renderPage(slug = 'demo') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/${slug}/stats`]}>
        <Routes>
          <Route path="/admin/:slug/stats" element={<AdminStatsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const authorizedGuard = {
  user: { id: 'user-123', email: 'admin@demo.com' } as any,
  membership: { id: 'mem-1', barbershop_id: 'shop-123', profile_id: 'user-123', role: 'owner' as const, created_at: '2025-01-01' },
  barbershopId: 'shop-123',
  barbershopName: 'Barbería Demo',
  isAuthorized: true,
  isLoading: false,
  needsLogin: false,
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminStatsPage', () => {
  it('renders stats page when authorized', () => {
    mockUseAuthGuard.mockReturnValue(authorizedGuard);

    renderPage();

    expect(screen.getByTestId('admin-stats-page')).toBeInTheDocument();
    expect(screen.getByText('Estadísticas')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-queue')).toBeInTheDocument();
  });

  it('shows loading state while authenticating', () => {
    mockUseAuthGuard.mockReturnValue({ ...authorizedGuard, isLoading: true, isAuthorized: false });

    renderPage();

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows access denied when not authorized', () => {
    mockUseAuthGuard.mockReturnValue({ ...authorizedGuard, isAuthorized: false, isLoading: false });

    renderPage();

    expect(screen.getByText('No tenés permisos para acceder a esta barbería.')).toBeInTheDocument();
  });

  it('has back link to queue', () => {
    mockUseAuthGuard.mockReturnValue(authorizedGuard);

    renderPage();

    expect(screen.getByTestId('back-to-queue').getAttribute('href')).toBe('/admin/demo/queue');
  });

  it('renders stats range toggle', () => {
    mockUseAuthGuard.mockReturnValue(authorizedGuard);

    renderPage();

    expect(screen.getByTestId('stats-range-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('stats-range-day')).toBeInTheDocument();
    expect(screen.getByTestId('stats-range-week')).toBeInTheDocument();
    expect(screen.getByTestId('stats-range-month')).toBeInTheDocument();
  });
});
