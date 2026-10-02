import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

// A plane we can't see live (e.g. parked with its transponder off), waited for at the last place
// it was seen until it broadcasts one of `callsigns`. Lives in the URL like the selected flight.
export interface Watch {
  flight: string;
  callsigns: string[];
  latitude: number;
  longitude: number;
  headingDegrees: number | null;
  seenAt: string;
}

const PARAMS = { flight: 'watch', callsigns: 'for', at: 'at', heading: 'heading', seen: 'seen' };

export const normaliseCallsign = (callsign: string) => callsign.replace(/\s+/g, '').toUpperCase();

export function parseWatch(params: URLSearchParams): Watch | null {
  const flight = params.get(PARAMS.flight);
  const callsigns = params.get(PARAMS.callsigns)?.split(',').filter(Boolean) ?? [];
  const [latitude, longitude] = (params.get(PARAMS.at) ?? '').split(',').map(Number);
  const seenAt = params.get(PARAMS.seen);
  const heading = params.get(PARAMS.heading);
  if (!flight || callsigns.length === 0 || !seenAt) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    flight,
    callsigns: callsigns.map(normaliseCallsign),
    latitude: latitude!,
    longitude: longitude!,
    headingDegrees: heading ? Number(heading) : null,
    seenAt,
  };
}

export function watchPathFor(watch: Watch): string {
  const params = new URLSearchParams({
    [PARAMS.flight]: watch.flight,
    [PARAMS.callsigns]: watch.callsigns.join(','),
    [PARAMS.at]: `${watch.latitude},${watch.longitude}`,
    [PARAMS.seen]: watch.seenAt,
  });
  if (watch.headingDegrees !== null) params.set(PARAMS.heading, String(watch.headingDegrees));
  return `/?${params}`;
}

export function useWatch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const watch = useMemo(() => parseWatch(searchParams), [searchParams]);

  const clear = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    Object.values(PARAMS).forEach((param) => params.delete(param));
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return [watch, clear] as const;
}
