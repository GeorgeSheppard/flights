import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import { apiClient, unwrap } from '@/api/client';
import type { AreaQuery } from '@/api/types';
import { config } from '@/app/config';
import { trackStore } from '@/features/tracks/trackStore';
import type { SelectedFlight } from './selection';

export const flightKeys = {
  all: ['flights'] as const,
  area: (query: AreaQuery) => [...flightKeys.all, 'area', query] as const,
  details: (flight: SelectedFlight) => [...flightKeys.all, 'details', flight] as const,
  photo: (icao24: string) => [...flightKeys.all, 'photo', icao24] as const,
};

export function useAircraftInArea(query: AreaQuery | null) {
  return useQuery({
    queryKey: flightKeys.area(query ?? {}),
    queryFn: query
      ? async ({ signal }) => {
          const requestedAt = Date.now();
          const data = unwrap(await apiClient.GET('/flights/area', { params: { query }, signal }));
          trackStore.record(data.aircraft, requestedAt);
          return data;
        }
      : skipToken,
    select: (data) => data.aircraft,
    // Keep showing the old aircraft while the new viewport loads, rather than blanking the map.
    placeholderData: keepPreviousData,
    refetchInterval: config.areaRefreshIntervalMs,
  });
}

export function useFlightDetails(flight: SelectedFlight | null) {
  return useQuery({
    queryKey: flightKeys.details(flight ?? { icao24: '' }),
    queryFn: flight
      ? async ({ signal }) => {
          const requestedAt = Date.now();
          const data = unwrap(
            await apiClient.GET('/flights/details', {
              params: { query: { icao24: flight.icao24, callsign: flight.callsign ?? undefined } },
              signal,
            })
          );
          if (data.position)
            trackStore.record([{ ...data.position, icao24: data.icao24 }], requestedAt);
          return data;
        }
      : skipToken,
    refetchInterval: config.detailsRefreshIntervalMs,
  });
}

export function useAircraftPhoto(icao24: string) {
  return useQuery({
    queryKey: flightKeys.photo(icao24),
    queryFn: async ({ signal }) =>
      unwrap(await apiClient.GET('/flights/photo', { params: { query: { icao24 } }, signal }))
        .photo,
    // An airframe's photo doesn't change, so fetch it once per session.
    staleTime: Infinity,
  });
}
