import { useMemo, useSyncExternalStore } from 'react';
import type { LngLat } from '@/lib/spline';

export interface TrackPoint {
  longitude: number;
  latitude: number;
  time: number;
}

interface Position {
  icao24: string;
  longitude: number;
  latitude: number;
}

// Enough for roughly the last half hour at the area refresh rate.
const MAX_POINTS = 90;
// Forget aircraft that haven't been seen for a while, e.g. ones the user panned away from.
const FORGET_AFTER_MS = 30 * 60_000;

// Positions seen for each aircraft since the page loaded, built up from every poll. Kept outside
// React so recording from query functions doesn't cause renders until someone is listening.
export function createTrackStore() {
  const tracks = new Map<string, TrackPoint[]>();
  const listeners = new Set<() => void>();
  let version = 0;

  return {
    record(positions: Position[], time: number) {
      let changed = false;
      for (const { icao24, longitude, latitude } of positions) {
        const track = tracks.get(icao24) ?? [];
        const last = track.at(-1);
        // OpenSky repeats the last known position until it hears from the aircraft again.
        if (last && last.longitude === longitude && last.latitude === latitude) continue;
        track.push({ longitude, latitude, time });
        if (track.length > MAX_POINTS) track.shift();
        tracks.set(icao24, track);
        changed = true;
      }

      for (const [icao24, track] of tracks) {
        if (time - track.at(-1)!.time > FORGET_AFTER_MS) tracks.delete(icao24);
      }

      if (changed) {
        version++;
        listeners.forEach((listener) => listener());
      }
    },
    getTrack: (icao24: string): LngLat[] =>
      (tracks.get(icao24) ?? []).map((point) => [point.longitude, point.latitude]),
    getVersion: () => version,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const trackStore = createTrackStore();

// Returns a new array only when the tracks change, so it's safe to memoise on.
export function useTrack(icao24: string | null): LngLat[] {
  const version = useSyncExternalStore(trackStore.subscribe, trackStore.getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` stands in for the store's contents
  return useMemo(() => (icao24 ? trackStore.getTrack(icao24) : []), [icao24, version]);
}
