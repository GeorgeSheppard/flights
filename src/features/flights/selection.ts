import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export interface SelectedFlight {
  icao24: string;
  callsign?: string | null;
}

// The selected flight lives in the URL so it can be shared, survives reloads, and the phone's back
// gesture closes the details sheet.
const FLIGHT_PARAM = 'flight';
const CALLSIGN_PARAM = 'callsign';

interface SheetHistoryState {
  openedSheet?: boolean;
}

export function parseSelection(params: URLSearchParams): SelectedFlight | null {
  const icao24 = params.get(FLIGHT_PARAM);
  return icao24 ? { icao24, callsign: params.get(CALLSIGN_PARAM) } : null;
}

export function useSelectedFlight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const selected = useMemo(() => parseSelection(searchParams), [searchParams]);
  const openedSheet = (location.state as SheetHistoryState | null)?.openedSheet === true;
  const hasSelection = selected !== null;

  const setSelected = useCallback(
    (flight: SelectedFlight | null) => {
      // Closing a sheet we opened goes back, so the history doesn't fill up with map states.
      if (!flight && openedSheet) {
        navigate(-1);
        return;
      }

      const params = new URLSearchParams(searchParams);
      params.delete(FLIGHT_PARAM);
      params.delete(CALLSIGN_PARAM);
      if (flight) {
        params.set(FLIGHT_PARAM, flight.icao24);
        if (flight.callsign) params.set(CALLSIGN_PARAM, flight.callsign);
      }

      // Opening pushes a history entry so "back" closes the sheet; switching flights replaces it.
      const opening = flight !== null && !hasSelection;
      setSearchParams(params, {
        replace: !opening,
        state: opening ? { openedSheet: true } : location.state,
      });
    },
    [openedSheet, hasSelection, searchParams, setSearchParams, navigate, location.state]
  );

  return [selected, setSelected] as const;
}
