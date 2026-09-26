import { useCallback, useMemo, useState } from 'react';
import { FlightDetailsSheet } from '@/features/flights/FlightDetailsSheet';
import { useAircraftInArea, useFlightDetails } from '@/features/flights/queries';
import {
  parseSelection,
  useSelectedFlight,
  type SelectedFlight,
} from '@/features/flights/selection';
import { FlightMap, type ViewportChange } from '@/features/map/FlightMap';
import { MapStatus } from '@/features/map/MapStatus';
import { toAreaQuery } from '@/lib/bounds';
import { config } from '@/app/config';
import { SearchButton } from '@/features/search/SearchButton';
import styles from './MapPage.module.css';

export function MapPage() {
  const [viewport, setViewport] = useState<ViewportChange | null>(null);
  const [selected, setSelected] = useSelectedFlight();
  const focus = useSharedFlightFocus(selected);

  const tooFarOut = viewport !== null && viewport.zoom < config.minZoomForAircraft;
  const areaQuery = useMemo(
    () => (viewport && !tooFarOut ? toAreaQuery(viewport.bounds) : null),
    [viewport, tooFarOut]
  );
  const area = useAircraftInArea(areaQuery);
  const aircraft = useMemo(() => (tooFarOut ? [] : (area.data ?? [])), [area.data, tooFarOut]);
  const snapshot = selected
    ? aircraft.find((plane) => plane.icao24 === selected.icao24)
    : undefined;

  const handleSelect = useCallback(
    (plane: { icao24: string; callsign: string | null } | null) =>
      setSelected(plane && { icao24: plane.icao24, callsign: plane.callsign }),
    [setSelected]
  );

  return (
    <main style={{ position: 'fixed', inset: 0 }}>
      <FlightMap
        aircraft={aircraft}
        selectedIcao24={selected?.icao24 ?? null}
        onSelect={handleSelect}
        onViewportChange={setViewport}
        focus={focus}
      />
      {/* On wide screens the details panel sits top-left, so the toolbar moves aside for it. */}
      <div className={styles.toolbar} data-panel-open={selected !== null || undefined}>
        <SearchButton />
        <MapStatus
          count={aircraft.length}
          tooFarOut={tooFarOut}
          isFetching={area.isFetching}
          error={area.error}
        />
      </div>
      {selected && (
        <FlightDetailsSheet
          key={selected.icao24}
          flight={selected}
          snapshot={snapshot}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

// When the app is opened from a shared link, centre the map on that flight once its position loads.
function useSharedFlightFocus(selected: SelectedFlight | null) {
  const [sharedFlight] = useState(() =>
    parseSelection(new URLSearchParams(window.location.search))
  );
  const stillSelected = sharedFlight && selected?.icao24 === sharedFlight.icao24;
  const position = useFlightDetails(stillSelected ? selected : null).data?.position;
  const hasPosition = position != null;
  return useMemo(
    () => (hasPosition ? { longitude: position.longitude, latitude: position.latitude } : null),
    // Only the first position matters; later refreshes shouldn't keep dragging the camera back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPosition]
  );
}
