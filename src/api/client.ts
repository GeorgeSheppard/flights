import createClient from 'openapi-fetch';
import { config } from '@/app/config';
import type { paths } from './schema';

export const apiClient = createClient<paths>({
  baseUrl: config.apiBaseUrl,
  // Resolved per call rather than captured at startup, so tests can stub the global fetch.
  fetch: (request) => globalThis.fetch(request),
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.data === undefined) {
    const message =
      result.error && typeof result.error === 'object' && 'error' in result.error
        ? String(result.error.error)
        : `Request failed with status ${result.response.status}`;
    throw new ApiError(message, result.response.status);
  }
  return result.data;
}
