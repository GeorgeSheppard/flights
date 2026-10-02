import type { Page } from '@playwright/test';

// Mirrors config.initialView, so an aircraft placed here is in the middle of the screen on load.
export const MAP_CENTRE = { latitude: 51.47, longitude: -0.4543 };

export const aircraft = {
  icao24: '4ca7b3',
  callsign: 'BAW123',
  latitude: MAP_CENTRE.latitude,
  longitude: MAP_CENTRE.longitude,
  onGround: false,
  altitudeMeters: 10668,
  velocityMetersPerSecond: 231.5,
  headingDegrees: 90,
  verticalRateMetersPerSecond: 0,
};

export const flightDetails = {
  icao24: aircraft.icao24,
  callsign: aircraft.callsign,
  airline: { code: 'BAW', name: 'British Airways' },
  position: {
    latitude: aircraft.latitude,
    longitude: aircraft.longitude,
    onGround: false,
    altitudeMeters: aircraft.altitudeMeters,
    velocityMetersPerSecond: aircraft.velocityMetersPerSecond,
    headingDegrees: aircraft.headingDegrees,
    verticalRateMetersPerSecond: 0,
  },
  route: {
    faFlightId: 'BAW123-1',
    operator: 'BAW',
    aircraftType: 'A320',
    registration: 'G-EUUA',
    origin: { code: 'EGLL', iataCode: 'LHR', name: 'Heathrow', city: 'London' },
    destination: { code: 'EGPH', iataCode: 'EDI', name: 'Edinburgh', city: 'Edinburgh' },
    status: 'En Route / On Time',
    scheduledOut: hoursFromNow(-1),
    estimatedOut: null,
    actualOut: hoursFromNow(-1),
    scheduledIn: hoursFromNow(0.5),
    estimatedIn: hoursFromNow(0.5),
    actualIn: null,
  },
};

export const notLocated = {
  aircraft: null,
  inboundFlight: null,
  lastKnownPosition: null,
  watchCallsigns: [] as string[],
};

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export function searchResult(id: string, times: Record<string, string | null>) {
  const { route } = flightDetails;
  return {
    ...route,
    faFlightId: id,
    ident: 'BAW123',
    status: 'Scheduled',
    actualOut: null,
    estimatedIn: null,
    ...times,
  };
}

// A blank style standing in for OpenFreeMap, so tests don't depend on a third-party CDN. The
// glyphs URL is only needed because the style has text layers; it's never fetched at test zooms.
const blankStyle = {
  version: 8,
  glyphs: 'http://127.0.0.1/fonts/{fontstack}/{range}.pbf',
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dde3ea' } }],
};

// Mocked responses answer cross-origin requests, so they need CORS headers like the real ones.
const cors = { 'access-control-allow-origin': '*' };

export async function mockBasemap(page: Page) {
  // Playwright tries the most recently registered route first, so the catch-all goes first.
  await page.route('https://tiles.openfreemap.org/**', (route) => route.abort());
  await page.route('https://tiles.openfreemap.org/styles/**', (route) =>
    route.fulfill({ json: blankStyle, headers: cors })
  );
}

interface MockResponse {
  status?: number;
  json: unknown;
}

type Handler = (url: URL) => MockResponse;

// Responds to API calls by path. Anything not mocked fails loudly rather than hitting production.
export async function mockApi(page: Page, handlers: Partial<Record<string, Handler>>) {
  await page.route('**/flights/*', async (route) => {
    const url = new URL(route.request().url());
    const handler = handlers[url.pathname];
    const response = handler?.(url) ?? {
      status: 500,
      json: { error: `Unmocked ${url.pathname}` },
    };
    await route.fulfill({ ...response, headers: cors });
  });
}
