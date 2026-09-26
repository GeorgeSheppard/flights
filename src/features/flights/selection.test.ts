import { act, renderHook } from '@testing-library/react';
import { parseSelection, useSelectedFlight } from './selection';

describe('parseSelection', () => {
  it('reads the flight and callsign from the query string', () => {
    expect(parseSelection('?flight=4ca7b3&callsign=BAW123')).toEqual({
      icao24: '4ca7b3',
      callsign: 'BAW123',
    });
    expect(parseSelection('?callsign=BAW123')).toBeNull();
  });
});

describe('useSelectedFlight', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));

  it('syncs the selection to the URL and closes via history', async () => {
    const { result } = renderHook(() => useSelectedFlight());

    act(() => result.current[1]({ icao24: '4ca7b3', callsign: 'BAW123' }));
    expect(window.location.search).toBe('?flight=4ca7b3&callsign=BAW123');
    expect(result.current[0]).toEqual({ icao24: '4ca7b3', callsign: 'BAW123' });

    act(() => result.current[1]({ icao24: '400abc', callsign: null }));
    expect(window.location.search).toBe('?flight=400abc');

    const popped = new Promise((resolve) =>
      window.addEventListener('popstate', resolve, { once: true })
    );
    act(() => result.current[1](null));
    await act(() => popped);
    expect(window.location.search).toBe('');
    expect(result.current[0]).toBeNull();
  });
});
