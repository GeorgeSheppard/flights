export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api.georgesheppard.dev',
  // OpenSky allows 4,000 credits a day across every visitor (1–4 per area poll, 1 per details
  // poll), so poll gently and only once the viewport is small enough.
  areaRefreshIntervalMs: 30_000,
  detailsRefreshIntervalMs: 30_000,
  minZoomForAircraft: 5,
  initialView: { longitude: -0.4543, latitude: 51.47, zoom: 7 },
} as const;
