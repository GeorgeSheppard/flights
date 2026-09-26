import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import { apiClient, unwrap } from '@/api/client';
import type { AreaQuery } from '@/api/types';
import { config } from '@/app/config';
import type { SelectedFlight } from './selection';

export const flightKeys = {
  all: ['flights'] as const,
  area: (query: AreaQuery) => [...flightKeys.all, 'area', query] as const,
  details: (flight: SelectedFlight) => [...flightKeys.all, 'details', flight] as const,
};

export function useAircraftInArea(query: AreaQuery | null) {
  return useQuery({
    queryKey: flightKeys.area(query ?? {}),
    queryFn: query
      ? async ({ signal }) =>
          unwrap(await apiClient.GET('/flights/area', { params: { query }, signal }))
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
      ? async ({ signal }) =>
          unwrap(
            await apiClient.GET('/flights/details', {
              params: { query: { icao24: flight.icao24, callsign: flight.callsign ?? undefined } },
              signal,
            })
          )
      : skipToken,
    refetchInterval: config.detailsRefreshIntervalMs,
  });
}
