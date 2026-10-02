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
    readonly status: number,
    // Set when an upstream provider's rate limit was hit.
    readonly retryAfterSeconds: number | null = null
  ) {
    super(message);
  }
}

export const isRateLimited = (error: Error | null): error is ApiError =>
  error instanceof ApiError && error.status === 429;

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.data === undefined) {
    const body = result.error && typeof result.error === 'object' ? result.error : {};
    const message =
      'error' in body ? String(body.error) : `Request failed with status ${result.response.status}`;
    const retryAfterSeconds =
      'retryAfterSeconds' in body && typeof body.retryAfterSeconds === 'number'
        ? body.retryAfterSeconds
        : null;
    throw new ApiError(message, result.response.status, retryAfterSeconds);
  }
  return result.data;
}
