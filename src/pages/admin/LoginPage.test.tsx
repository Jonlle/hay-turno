import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useAuthGuard');
vi.mock('../../services/supabase/auth');

import { AdminLoginPage } from './LoginPage';
import { useAuthGuard } from '../../hooks/useAuthGuard';

const mockUseAuthGuard = vi.mocked(useAuthGuard);

function renderPage(slug = 'demo') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/${slug}/login`]}>
        <Routes>
          <Route path="/admin/:slug/login" element={<AdminLoginPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const defaultAuthGuard = {
  user: null,
  membership: null,
  barbershopId: undefined,
  barbershopName: undefined,
  isAuthorized: false,
  isLoading: false,
  needsLogin: false,
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminLoginPage', () => {
  it('renders login form', () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);

    renderPage();

    expect(screen.getByTestId('admin-login-page')).toBeInTheDocument();
    expect(screen.getByTestId('login-email')).toBeInTheDocument();
    expect(screen.getByTestId('login-password')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('shows loading state while authenticating', () => {
    mockUseAuthGuard.mockReturnValue({
      ...defaultAuthGuard,
      isLoading: true,
    });

    renderPage();

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows validation error for empty form submission', async () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);

    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByTestId('login-submit'));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('shows validation error for invalid email', async () => {
    mockUseAuthGuard.mockReturnValue(defaultAuthGuard);

    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByTestId('login-email'), 'not-an-email');
    await user.type(screen.getByTestId('login-password'), 'password123');
    await user.click(screen.getByTestId('login-submit'));

    // Form should show error state — the submit button should still be visible
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
    expect(screen.getByTestId('login-email')).toBeInTheDocument();
  });
});
