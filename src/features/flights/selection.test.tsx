import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { parseSelection, useSelectedFlight } from './selection';

describe('parseSelection', () => {
  it('reads the flight and callsign from the query string', () => {
    expect(parseSelection(new URLSearchParams('?flight=4ca7b3&callsign=BAW123'))).toEqual({
      icao24: '4ca7b3',
      callsign: 'BAW123',
    });
    expect(parseSelection(new URLSearchParams('?callsign=BAW123'))).toBeNull();
  });
});

describe('useSelectedFlight', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
  );

  it('syncs the selection to the URL and closes via history', () => {
    const { result } = renderHook(() => [useSelectedFlight(), useLocation()] as const, {
      wrapper,
    });
    const select = (flight: Parameters<(typeof result.current)[0][1]>[0]) =>
      act(() => result.current[0][1](flight));

    select({ icao24: '4ca7b3', callsign: 'BAW123' });
    expect(result.current[1].search).toBe('?flight=4ca7b3&callsign=BAW123');
    expect(result.current[0][0]).toEqual({ icao24: '4ca7b3', callsign: 'BAW123' });

    select({ icao24: '400abc', callsign: null });
    expect(result.current[1].search).toBe('?flight=400abc');

    select(null);
    expect(result.current[1].search).toBe('');
    expect(result.current[0][0]).toBeNull();
  });
});
