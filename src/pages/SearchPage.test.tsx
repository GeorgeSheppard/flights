import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import type { FlightSearchResult } from '@/api/types';
import { mockFetch, renderWithProviders } from '@/test/render';
import { SearchPage } from './SearchPage';

const result: FlightSearchResult = {
  faFlightId: 'BAW123-1',
  ident: 'BAW123',
  operator: 'BAW',
  aircraftType: 'A320',
  registration: 'G-EUUA',
  origin: { code: 'EGLL', iataCode: 'LHR', name: 'Heathrow', city: 'London' },
  destination: { code: 'EGPH', iataCode: 'EDI', name: 'Edinburgh', city: 'Edinburgh' },
  status: 'En Route / On Time',
  scheduledOut: '2026-09-26T10:00:00Z',
  estimatedOut: null,
  actualOut: '2026-09-26T10:05:00Z',
  scheduledIn: '2026-09-26T11:20:00Z',
  estimatedIn: '2026-09-26T11:22:00Z',
  actualIn: null,
};

// Answers search and locate requests separately, since clicking a result makes a second request.
function mockApi(locateResponse: Response) {
  const fetchMock = vi.fn(async (request: Request) =>
    new URL(request.url).pathname === '/flights/locate'
      ? locateResponse.clone()
      : Response.json({ flights: [result] })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function MapLocation() {
  const location = useLocation();
  return <p>Map at {location.pathname + location.search}</p>;
}

const renderSearchAndMap = () =>
  renderWithProviders(
    <Routes>
      <Route path="/search" element={<SearchPage />} />
      <Route path="/" element={<MapLocation />} />
    </Routes>,
    { route: '/search?q=BA123' }
  );

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

  it('opens the map on a flight that is in the air when it is clicked', async () => {
    const fetchMock = mockApi(
      Response.json({
        inboundFlight: null,
        aircraft: {
          icao24: '4ca7b3',
          callsign: 'BAW123',
          latitude: 55,
          longitude: -3,
          onGround: false,
          altitudeMeters: 10000,
          velocityMetersPerSecond: 230,
          headingDegrees: 0,
          verticalRateMetersPerSecond: 0,
        },
      })
    );
    renderSearchAndMap();

    fireEvent.click(await screen.findByRole('button', { name: /Show on map/ }));

    expect(await screen.findByText('Map at /?flight=4ca7b3&callsign=BAW123')).toBeInTheDocument();
    const locateUrl = new URL(fetchMock.mock.calls[1]![0].url);
    expect(locateUrl.pathname).toBe('/flights/locate');
    expect(locateUrl.searchParams.get('faFlightId')).toBe('BAW123-1');
  });

  it('says so when a flight in the air is not on the map', async () => {
    mockApi(Response.json({ aircraft: null, inboundFlight: null }));
    renderSearchAndMap();

    fireEvent.click(await screen.findByRole('button', { name: /Show on map/ }));

    expect(await screen.findByText(/isn’t being tracked on the map/)).toBeInTheDocument();
  });

  it('offers to find the plane for the next upcoming flight only', async () => {
    const upcoming = (faFlightId: string, scheduledOut: string): FlightSearchResult => ({
      ...result,
      faFlightId,
      status: 'Scheduled',
      scheduledOut,
      actualOut: null,
    });
    mockFetch(
      Response.json({
        flights: [
          upcoming('BAW123-3', '2026-09-28T10:00:00Z'),
          upcoming('BAW123-2', '2026-09-27T10:00:00Z'),
          { ...result, faFlightId: 'BAW123-0', actualIn: '2026-09-26T11:20:00Z' },
        ],
      })
    );
    renderWithProviders(<SearchPage />, { route: '/search?q=BA123' });

    expect(await screen.findByRole('button', { name: /Find my plane/ })).toHaveTextContent(
      'Sun, Sep 27'
    );
    expect(screen.getAllByRole('button', { name: /Find my plane|Show on map/ })).toHaveLength(1);
  });

  it('says so when the plane for an upcoming flight is not known yet', async () => {
    const fetchMock = vi.fn(async (request: Request) =>
      new URL(request.url).pathname === '/flights/locate'
        ? Response.json({ aircraft: null, inboundFlight: null })
        : Response.json({ flights: [{ ...result, actualOut: null }] })
    );
    vi.stubGlobal('fetch', fetchMock);
    renderWithProviders(<SearchPage />, { route: '/search?q=BA123' });

    fireEvent.click(await screen.findByRole('button', { name: /Find my plane/ }));

    expect(await screen.findByText(/Its plane isn’t on the map yet/)).toBeInTheDocument();
  });
});
