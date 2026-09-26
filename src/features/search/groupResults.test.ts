import type { FlightSearchResult } from '@/api/types';
import { groupResults } from './groupResults';

const flight = (id: string, times: Partial<FlightSearchResult>): FlightSearchResult => ({
  faFlightId: id,
  ident: 'BAW123',
  operator: 'BAW',
  aircraftType: 'A320',
  registration: null,
  origin: null,
  destination: null,
  status: 'Scheduled',
  scheduledOut: null,
  estimatedOut: null,
  actualOut: null,
  scheduledIn: null,
  estimatedIn: null,
  actualIn: null,
  ...times,
});

describe('groupResults', () => {
  it('splits flights into in the air, upcoming (soonest first) and earlier (latest first)', () => {
    const groups = groupResults([
      flight('old', { actualOut: '2026-09-24T10:00:00Z', actualIn: '2026-09-24T11:00:00Z' }),
      flight('later', { scheduledOut: '2026-09-28T10:00:00Z' }),
      flight('flying', { actualOut: '2026-09-26T10:00:00Z' }),
      flight('newer', { actualOut: '2026-09-25T10:00:00Z', actualIn: '2026-09-25T11:00:00Z' }),
      flight('soon', { scheduledOut: '2026-09-27T10:00:00Z' }),
    ]);

    expect(groups.map((g) => [g.title, g.flights.map((f) => f.faFlightId)])).toEqual([
      ['In the air', ['flying']],
      ['Upcoming', ['soon', 'later']],
      ['Earlier', ['newer', 'old']],
    ]);
  });

  it('omits empty groups', () => {
    expect(groupResults([])).toEqual([]);
  });
});
