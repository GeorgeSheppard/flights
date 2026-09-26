import { screen } from '@testing-library/react';
import type { FlightSearchResult } from '@/api/types';
import { mockFetch, renderWithProviders } from '@/test/render';
import { SearchPage } from './SearchPage';

const result: FlightSearchResult = {
  faFlightId: 'BAW123-1',
  ident: 'BAW123',
  operator: 'BAW',
  aircraftType: 'A320',
  registration: 'G-EUUA',
  origin: { code: 'LHR', name: 'Heathrow', city: 'London' },
  destination: { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh' },
  status: 'En Route / On Time',
  scheduledOut: '2026-09-26T10:00:00Z',
  estimatedOut: null,
  actualOut: '2026-09-26T10:05:00Z',
  scheduledIn: '2026-09-26T11:20:00Z',
  estimatedIn: '2026-09-26T11:22:00Z',
  actualIn: null,
};

describe('SearchPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prompts for a flight number before searching', () => {
    const fetchMock = mockFetch(Response.json({ flights: [] }));
    renderWithProviders(<SearchPage />, { route: '/search' });

    expect(screen.getByText(/Search for a flight by its number/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches for the normalised flight number in the URL and lists results', async () => {
    const fetchMock = mockFetch(Response.json({ flights: [result] }));
    renderWithProviders(<SearchPage />, { route: '/search?q=ba 123' });

    expect(await screen.findByText('BAW123')).toBeInTheDocument();
    expect(screen.getByText('In the air')).toBeInTheDocument();
    expect(screen.getByText('LHR')).toBeInTheDocument();
    expect(screen.getByText('A320 · G-EUUA')).toBeInTheDocument();
    expect(new URL(fetchMock.mock.calls[0]![0].url).searchParams.get('flightNumber')).toBe('BA123');
  });

  it('says so when nothing matches', async () => {
    mockFetch(Response.json({ flights: [] }));
    renderWithProviders(<SearchPage />, { route: '/search?q=XX1' });

    expect(await screen.findByText('No flights found for XX1.')).toBeInTheDocument();
  });

  it('explains when search is not configured on the API', async () => {
    mockFetch(Response.json({ error: 'FlightAware is not configured yet' }, { status: 501 }));
    renderWithProviders(<SearchPage />, { route: '/search?q=BA123' });

    expect(await screen.findByText(/Flight search isn’t available yet/)).toBeInTheDocument();
  });
});
