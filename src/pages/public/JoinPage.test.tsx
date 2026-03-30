import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useQueueRealtime');
vi.mock('../../services/supabase/barbershops');

import { JoinPage } from './JoinPage';
import { getBarbershopBySlug } from '../../services/supabase/barbershops';
import { useQueueRealtime } from '../../hooks/useQueueRealtime';

const mockGetBarbershopBySlug = vi.mocked(getBarbershopBySlug);

function renderPage(slug = 'demo') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/b/${slug}/join`]}>
        <Routes>
          <Route path="/b/:slug/join" element={<JoinPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useQueueRealtime).mockReturnValue(undefined);
});

describe('JoinPage', () => {
  it('renders join form when barbershop exists', async () => {
    mockGetBarbershopBySlug.mockResolvedValue({
      id: 'shop-123',
      slug: 'demo',
      name: 'Barbería Demo',
      timezone: 'America/Bogota',
      theme_settings: {},
      is_active: true,
      created_at: '2025-01-01',
    });

    renderPage();

    expect(await screen.findByTestId('join-page')).toBeInTheDocument();
    expect(screen.getByText('Barbería Demo')).toBeInTheDocument();
    expect(screen.getByTestId('join-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('join-submit')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-queue')).toBeInTheDocument();
  });

  it('shows not found when barbershop does not exist', async () => {
    mockGetBarbershopBySlug.mockResolvedValue(null);

    renderPage('invalid');

    expect(await screen.findByTestId('not-found-page')).toBeInTheDocument();
  });

  it('shows validation error for short name', async () => {
    mockGetBarbershopBySlug.mockResolvedValue({
      id: 'shop-123',
      slug: 'demo',
      name: 'Barbería Demo',
      timezone: 'America/Bogota',
      theme_settings: {},
      is_active: true,
      created_at: '2025-01-01',
    });

    renderPage();
    const user = userEvent.setup();

    const input = await screen.findByTestId('join-name-input');
    const submit = screen.getByTestId('join-submit');

    await user.type(input, 'A');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('has back link pointing to queue', async () => {
    mockGetBarbershopBySlug.mockResolvedValue({
      id: 'shop-123',
      slug: 'demo',
      name: 'Barbería Demo',
      timezone: 'America/Bogota',
      theme_settings: {},
      is_active: true,
      created_at: '2025-01-01',
    });

    renderPage();

    const backLink = await screen.findByTestId('back-to-queue');
    expect(backLink.getAttribute('href')).toBe('/b/demo');
  });
});
