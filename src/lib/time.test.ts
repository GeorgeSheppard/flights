import { flightProgress } from './time';

describe('flightProgress', () => {
  const departure = '2026-09-26T10:00:00Z';
  const arrival = '2026-09-26T12:00:00Z';

  it('returns the fraction of the flight completed', () => {
    expect(flightProgress(departure, arrival, Date.parse('2026-09-26T11:30:00Z'))).toBe(0.75);
  });

  it('clamps before departure and after arrival', () => {
    expect(flightProgress(departure, arrival, Date.parse('2026-09-26T09:00:00Z'))).toBe(0);
    expect(flightProgress(departure, arrival, Date.parse('2026-09-26T13:00:00Z'))).toBe(1);
  });

  it('returns null when times are missing or invalid', () => {
    expect(flightProgress(null, arrival)).toBeNull();
    expect(flightProgress(arrival, departure)).toBeNull();
  });
});
