import type { FlightSearchResult } from '@/api/types';

export interface ResultGroup {
  title: string;
  flights: FlightSearchResult[];
}

const departure = (flight: FlightSearchResult) =>
  flight.actualOut ?? flight.estimatedOut ?? flight.scheduledOut ?? '';

// AeroAPI returns a couple of weeks of past and scheduled flights for a flight number, so split
// them into what's flying now, what's next, and what's already happened.
export function groupResults(flights: FlightSearchResult[]): ResultGroup[] {
  const inTheAir = flights.filter((flight) => flight.actualOut && !flight.actualIn);
  const upcoming = flights
    .filter((flight) => !flight.actualOut && !flight.actualIn)
    .sort((a, b) => departure(a).localeCompare(departure(b)));
  const earlier = flights
    .filter((flight) => flight.actualIn)
    .sort((a, b) => departure(b).localeCompare(departure(a)));

  return [
    { title: 'In the air', flights: inTheAir },
    { title: 'Upcoming', flights: upcoming },
    { title: 'Earlier', flights: earlier },
  ].filter((group) => group.flights.length > 0);
}
