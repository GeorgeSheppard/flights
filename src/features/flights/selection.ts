import { useCallback, useMemo, useSyncExternalStore } from 'react';

export interface SelectedFlight {
  icao24: string;
  callsign?: string | null;
}

// The selected flight lives in the URL so it can be shared, survives reloads, and the phone's back
// gesture closes the details sheet.
const FLIGHT_PARAM = 'flight';
const CALLSIGN_PARAM = 'callsign';
const SHEET_HISTORY_STATE = 'flight-sheet';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

const getSearch = () => window.location.search;

export function parseSelection(search: string): SelectedFlight | null {
  const params = new URLSearchParams(search);
  const icao24 = params.get(FLIGHT_PARAM);
  return icao24 ? { icao24, callsign: params.get(CALLSIGN_PARAM) } : null;
}

export function useSelectedFlight() {
  const search = useSyncExternalStore(subscribe, getSearch);
  const selected = useMemo(() => parseSelection(search), [search]);

  const setSelected = useCallback((flight: SelectedFlight | null) => {
    const pushedByUs = window.history.state === SHEET_HISTORY_STATE;
    if (!flight && pushedByUs) {
      window.history.back();
      return;
    }

    const hadSelection = parseSelection(window.location.search) !== null;
    const url = new URL(window.location.href);
    url.searchParams.delete(FLIGHT_PARAM);
    url.searchParams.delete(CALLSIGN_PARAM);
    if (flight) {
      url.searchParams.set(FLIGHT_PARAM, flight.icao24);
      if (flight.callsign) url.searchParams.set(CALLSIGN_PARAM, flight.callsign);
    }

    // Opening pushes a history entry so "back" closes the sheet; switching flights replaces it.
    if (flight && !hadSelection) {
      window.history.pushState(SHEET_HISTORY_STATE, '', url);
    } else {
      window.history.replaceState(window.history.state, '', url);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return [selected, setSelected] as const;
}
