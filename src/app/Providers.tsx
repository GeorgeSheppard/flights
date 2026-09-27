import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { useColorScheme } from './useColorScheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000, refetchOnWindowFocus: true },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const appearance = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      {/* Solid panels, since overlays float over a light map even in dark mode. */}
      <Theme
        appearance={appearance}
        accentColor="blue"
        grayColor="slate"
        radius="large"
        panelBackground="solid"
      >
        {children}
      </Theme>
    </QueryClientProvider>
  );
}
