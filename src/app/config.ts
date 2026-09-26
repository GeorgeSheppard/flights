export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.georgesheppard.dev',
  // OpenSky rate-limits by credits, so poll gently and only once the viewport is small enough.
  areaRefreshIntervalMs: 20_000,
  detailsRefreshIntervalMs: 20_000,
  minZoomForAircraft: 5,
  initialView: { longitude: -0.4543, latitude: 51.47, zoom: 7 },
} as const;
