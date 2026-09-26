import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Theme>{ui}</Theme>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function mockFetch(response: Response) {
  const fetchMock = vi.fn(async (_request: Request) => response.clone());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
