import { screen } from '@testing-library/react';
import type { FlightDetails } from '@/api/types';
import { mockFetch, renderWithProviders } from '@/test/render';
import { FlightDetailsSheet } from './FlightDetailsSheet';

const details: FlightDetails = {
  icao24: '4ca7b3',
  callsign: 'BAW123',
  position: {
    latitude: 51.47,
    longitude: -0.45,
    onGround: false,
    altitudeMeters: 10668,
    velocityMetersPerSecond: 231.5,
    headingDegrees: 90,
    verticalRateMetersPerSecond: 0,
  },
  route: {
    faFlightId: 'BAW123-1',
    operator: 'British Airways',
    aircraftType: 'A320',
    registration: 'G-EUUA',
    origin: { code: 'LHR', name: 'Heathrow', city: 'London' },
    destination: { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh' },
    status: 'En Route',
    scheduledOut: '2026-09-26T10:00:00Z',
    estimatedOut: null,
    actualOut: '2026-09-26T10:05:00Z',
    scheduledIn: '2026-09-26T11:20:00Z',
    estimatedIn: '2026-09-26T11:22:00Z',
    actualIn: null,
  },
};

describe('FlightDetailsSheet', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests details for the selected flight and shows them', async () => {
    const fetchMock = mockFetch(Response.json(details));

    renderWithProviders(
      <FlightDetailsSheet
        flight={{ icao24: '4ca7b3', callsign: 'BAW123' }}
        snapshot={undefined}
        onClose={() => {}}
      />
    );

    expect(await screen.findByText('British Airways')).toBeInTheDocument();
    expect(screen.getByText('LHR')).toBeInTheDocument();
    expect(screen.getByText('EDI')).toBeInTheDocument();
    expect(screen.getByText('35,000 ft')).toBeInTheDocument();
    expect(screen.getByText('G-EUUA')).toBeInTheDocument();

    const url = new URL(fetchMock.mock.calls[0]![0].url);
    expect(url.pathname).toBe('/flights/details');
    expect(url.searchParams.get('icao24')).toBe('4ca7b3');
    expect(url.searchParams.get('callsign')).toBe('BAW123');
  });

  it('explains when no route information is available', async () => {
    mockFetch(Response.json({ ...details, route: null }));

    renderWithProviders(
      <FlightDetailsSheet flight={{ icao24: '4ca7b3' }} snapshot={undefined} onClose={() => {}} />
    );

    expect(await screen.findByText(/Route information isn’t available/)).toBeInTheDocument();
  });

  it('shows an error with a retry when the request fails', async () => {
    mockFetch(Response.json({ error: 'Upstream failure' }, { status: 500 }));

    renderWithProviders(
      <FlightDetailsSheet flight={{ icao24: '4ca7b3' }} snapshot={undefined} onClose={() => {}} />
    );

    expect(await screen.findByText(/Upstream failure/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
