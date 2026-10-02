import { skipToken, useMutation, useQuery } from '@tanstack/react-query';
import { ApiError, apiClient, unwrap } from '@/api/client';

export const searchKeys = {
  all: ['search'] as const,
  flightNumber: (flightNumber: string) => [...searchKeys.all, flightNumber] as const,
};

export function normaliseFlightNumber(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

// Client errors and "not configured" won't change on retry, so fail fast on those.
const isPermanent = (error: Error) =>
  error instanceof ApiError && error.status >= 400 && error.status !== 429;

export function useFlightSearch(flightNumber: string) {
  return useQuery({
    queryKey: searchKeys.flightNumber(flightNumber),
    queryFn: flightNumber
      ? async ({ signal }) =>
          unwrap(
            await apiClient.GET('/flights/search', { params: { query: { flightNumber } }, signal })
          )
      : skipToken,
    select: (data) => data.flights,
    retry: (failureCount, error) => !isPermanent(error) && failureCount < 1,
  });
}

export const isSearchUnavailable = (error: Error | null) =>
  error instanceof ApiError && error.status === 501;

// Finds the live aircraft flying a searched flight, so it can be shown on the map.
export function useLocateFlight() {
  return useMutation({
    mutationFn: async (callsign: string) =>
      unwrap(await apiClient.GET('/flights/locate', { params: { query: { callsign } } })).aircraft,
  });
}
