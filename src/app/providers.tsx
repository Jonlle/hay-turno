import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions,
} from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  getSupabaseBrowserClient,
  type HayTurnoSupabaseClient,
} from '../services/supabase/client';

const queryClientOptions: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 0,
  },
};

const SupabaseClientContext = createContext<HayTurnoSupabaseClient | null>(null);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: queryClientOptions,
  });
}

interface AppProvidersProps extends PropsWithChildren {
  supabaseClient?: HayTurnoSupabaseClient;
}

export function AppProviders({
  children,
  supabaseClient = getSupabaseBrowserClient(),
}: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SupabaseClientContext.Provider value={supabaseClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SupabaseClientContext.Provider>
  );
}

export function useSupabaseClient() {
  const supabaseClient = useContext(SupabaseClientContext);

  if (!supabaseClient) {
    throw new Error('useSupabaseClient must be used inside AppProviders.');
  }

  return supabaseClient;
}

export { createQueryClient };
