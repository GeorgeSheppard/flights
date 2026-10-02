import { useCallback, useMemo, useState } from 'react';
import { MapProvider } from '@vis.gl/react-maplibre';
import { Flex } from '@radix-ui/themes';
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
import { useFlightMap, type MapArea } from '@/features/map/useFlightMap';
import { AddPinDialog } from '@/features/pins/AddPinDialog';
import { PinMarkers } from '@/features/pins/PinMarkers';
import { PinsMenu } from '@/features/pins/PinsMenu';
import { pinStore, usePins } from '@/features/pins/pinStore';
import { SearchButton } from '@/features/search/SearchButton';
import { toTrackFeature } from '@/features/tracks/trackLayer';
import { useTrack } from '@/features/tracks/trackStore';
import styles from './MapPage.module.css';

export function MapPage() {
  return (
    <MapProvider>
      <MapScreen />
    </MapProvider>
  );
}

function MapScreen() {
  const [viewport, setViewport] = useState<ViewportChange | null>(null);
  const [selected, setSelected] = useSelectedFlight();
  const focus = useSharedFlightFocus(selected);

  const tooFarOut = viewport !== null && viewport.zoom < config.minZoomForAircraft;
  const areaQuery = useMemo(
    () => (viewport && !tooFarOut ? toAreaQuery(viewport.bounds) : null),
    [viewport, tooFarOut]
  );
  const area = useAircraftInArea(areaQuery);
  const trackPoints = useTrack(selected?.icao24 ?? null);
  const track = useMemo(() => toTrackFeature(trackPoints), [trackPoints]);
  const aircraft = useMemo(() => {
    if (tooFarOut) return [];
    // The selected plane's details refresh on their own schedule, so its newest known position
    // (the end of its track) can be more recent than the area data. Draw it there, at the tip of
    // its trajectory.
    const latest = trackPoints.at(-1);
    return (area.data ?? []).map((plane) =>
      latest && plane.icao24 === selected?.icao24
        ? { ...plane, longitude: latest[0], latitude: latest[1] }
        : plane
    );
  }, [area.data, tooFarOut, trackPoints, selected?.icao24]);
  const snapshot = selected
    ? aircraft.find((plane) => plane.icao24 === selected.icao24)
    : undefined;

  const pins = usePins();
  const [pendingPin, setPendingPin] = useState<MapArea | null>(null);
  const map = useFlightMap();

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
        track={track}
        onLongPress={setPendingPin}
      >
        <PinMarkers />
      </FlightMap>
      {/* On wide screens the details panel sits top-left, so the toolbar moves aside for it. */}
      <div className={styles.toolbar} data-panel-open={selected !== null || undefined}>
        <Flex gap="2">
          <SearchButton />
          <PinsMenu onAddCurrentView={() => setPendingPin(map.currentArea())} />
        </Flex>
        <MapStatus tooFarOut={tooFarOut} error={area.error} />
      </div>
      {selected && (
        <FlightDetailsSheet
          key={selected.icao24}
          flight={selected}
          snapshot={snapshot}
          onClose={() => setSelected(null)}
        />
      )}
      {pendingPin && (
        <AddPinDialog
          defaultName={`Pin ${pins.length + 1}`}
          onCancel={() => setPendingPin(null)}
          onSave={(name) => {
            pinStore.addPin({ ...pendingPin, name });
            setPendingPin(null);
          }}
        />
      )}
    </main>
  );
}

// When the map is opened on a flight (a shared link, or a search result), centre the map on that
// flight once its position loads.
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
