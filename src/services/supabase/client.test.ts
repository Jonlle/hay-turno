import { afterEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

async function loadClientModule() {
  vi.resetModules();

  return import('./client');
}

afterEach(() => {
  createClientMock.mockReset();
  vi.unstubAllEnvs();
});

describe('supabase browser client', () => {
  it('throws when required Supabase env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const { createSupabaseBrowserClient } = await loadClientModule();

    expect(() => createSupabaseBrowserClient()).toThrow(
      'Missing Supabase environment variables. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  });

  it('creates a typed browser client from Vite env vars', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const fakeClient = { kind: 'supabase-client' };
    createClientMock.mockReturnValue(fakeClient);

    const { createSupabaseBrowserClient } = await loadClientModule();

    expect(createSupabaseBrowserClient()).toBe(fakeClient);
    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  });

  it('reuses the same singleton browser client', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const fakeClient = { kind: 'singleton-client' };
    createClientMock.mockReturnValue(fakeClient);

    const { getSupabaseBrowserClient } = await loadClientModule();

    const firstClient = getSupabaseBrowserClient();
    const secondClient = getSupabaseBrowserClient();

    expect(firstClient).toBe(fakeClient);
    expect(secondClient).toBe(fakeClient);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});
