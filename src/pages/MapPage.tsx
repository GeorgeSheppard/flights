import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { MapProvider } from '@vis.gl/react-maplibre';
import { Flex } from '@radix-ui/themes';
import type { Aircraft } from '@/api/types';
import { FlightDetailsSheet } from '@/features/flights/FlightDetailsSheet';
import { useAircraftInArea, useFlightDetails } from '@/features/flights/queries';
import {
  mapPathFor,
  parseSelection,
  useSelectedFlight,
  type SelectedFlight,
} from '@/features/flights/selection';
import type { MapAircraft } from '@/features/map/aircraftLayer';
import { FlightMap, type ViewportChange } from '@/features/map/FlightMap';
import { MapStatus } from '@/features/map/MapStatus';
import { toAreaQuery, type Bounds } from '@/lib/bounds';
import { config } from '@/app/config';
import { useFlightMap, type MapArea } from '@/features/map/useFlightMap';
import { AddPinDialog } from '@/features/pins/AddPinDialog';
import { PinMarkers } from '@/features/pins/PinMarkers';
import { PinsMenu } from '@/features/pins/PinsMenu';
import { pinStore, usePins } from '@/features/pins/pinStore';
import { SearchButton } from '@/features/search/SearchButton';
import { toTrackFeature } from '@/features/tracks/trackLayer';
import { useTrack } from '@/features/tracks/trackStore';
import { WatchBanner } from '@/features/watch/WatchBanner';
import { WatchMarker } from '@/features/watch/WatchMarker';
import { normaliseCallsign, useWatch, type Watch } from '@/features/watch/watch';
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
  const [watch, clearWatch] = useWatch();
  const sharedFocus = useSharedFlightFocus(selected);
  const watchFocus = useWatchFocus(watch);
  const focus = sharedFocus ?? watchFocus;

  const tooFarOut = viewport !== null && viewport.zoom < config.minZoomForAircraft;
  const areaQuery = useMemo(
    () => (viewport && !tooFarOut ? toAreaQuery(viewport.bounds) : null),
    [viewport, tooFarOut]
  );
  const area = useAircraftInArea(areaQuery);
  const trackPoints = useTrack(selected?.icao24 ?? null);
  const track = useMemo(() => toTrackFeature(trackPoints), [trackPoints]);
  const lastSeen = useLastSeen(selected, area.data, area.dataUpdatedAt);
  // A selected plane that's dropped out of the data while its last position is still in view has
  // gone quiet (e.g. its transponder is off), rather than flown off-screen. Keep it on the map,
  // faded, where it was last seen, so it's there to watch when it's heard from again.
  const live = area.data?.some((plane) => plane.icao24 === selected?.icao24) ?? false;
  const quiet =
    !live && lastSeen && viewport && contains(viewport.bounds, lastSeen.plane) ? lastSeen : null;
  const aircraft = useMemo(() => {
    if (tooFarOut) return [];
    const planes: MapAircraft[] = [...(area.data ?? [])];
    if (quiet) planes.push({ ...quiet.plane, stale: true });
    // The selected plane's details refresh on their own schedule, so its newest known position
    // (the end of its track) can be more recent than the area data. Draw it there, at the tip of
    // its trajectory.
    const latest = trackPoints.at(-1);
    return planes.map((plane) =>
      latest && plane.icao24 === selected?.icao24
        ? { ...plane, longitude: latest[0], latitude: latest[1] }
        : plane
    );
  }, [area.data, tooFarOut, trackPoints, selected?.icao24, quiet]);
  const snapshot = selected
    ? aircraft.find((plane) => plane.icao24 === selected.icao24)
    : undefined;

  // Once the watched plane broadcasts one of its callsigns nearby, switch to following it live.
  const navigate = useNavigate();
  useEffect(() => {
    if (!watch) return;
    const found = area.data?.find(
      (plane) => plane.callsign && watch.callsigns.includes(normaliseCallsign(plane.callsign))
    );
    if (found) navigate(mapPathFor(found), { replace: true });
  }, [watch, area.data, navigate]);

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
        {watch && <WatchMarker watch={watch} />}
      </FlightMap>
      {/* On wide screens the details panel sits top-left, so the toolbar moves aside for it. */}
      <div className={styles.toolbar} data-panel-open={selected !== null || undefined}>
        <Flex gap="2">
          <SearchButton />
          <PinsMenu onAddCurrentView={() => setPendingPin(map.currentArea())} />
        </Flex>
        <MapStatus tooFarOut={tooFarOut} error={area.error} />
        {watch && <WatchBanner watch={watch} onClose={clearWatch} />}
      </div>
      {selected && (
        <FlightDetailsSheet
          key={selected.icao24}
          flight={selected}
          snapshot={snapshot}
          lastSeenAt={quiet?.at ?? null}
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

// The selected plane as it was last seen in the area data, and when.
function useLastSeen(
  selected: SelectedFlight | null,
  planes: Aircraft[] | undefined,
  updatedAt: number
) {
  const [lastSeen, setLastSeen] = useState<{ plane: Aircraft; at: number } | null>(null);
  const plane = planes?.find((candidate) => candidate.icao24 === selected?.icao24);
  if (plane && plane !== lastSeen?.plane) setLastSeen({ plane, at: updatedAt });
  return lastSeen?.plane.icao24 === selected?.icao24 ? lastSeen : null;
}

const contains = (bounds: Bounds, { longitude, latitude }: Aircraft) =>
  longitude >= bounds.west &&
  longitude <= bounds.east &&
  latitude >= bounds.south &&
  latitude <= bounds.north;

// Close enough in to see the plane at its stand, which also keeps the area query small and cheap.
const WATCH_ZOOM = 13;

function useWatchFocus(watch: Watch | null) {
  const latitude = watch?.latitude;
  const longitude = watch?.longitude;
  return useMemo(
    () =>
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude, zoom: WATCH_ZOOM }
        : null,
    [latitude, longitude]
  );
}
