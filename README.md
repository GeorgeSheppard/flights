# Flights

A mobile-first live flight tracker for [flights.georgesheppard.dev](https://flights.georgesheppard.dev),
backed by the `/flights/*` endpoints in
[api.georgesheppard.dev](https://github.com/GeorgeSheppard/api.georgesheppard.dev).

Pan and zoom the map to see live aircraft (via OpenSky), and tap a plane to see its details (via
OpenSky and FlightAware). The search page (`/search?q=BA123`) lists recent, current and upcoming
flights for a flight number (via FlightAware). Long-press the map (or right-click) to drop a named
pin; tapping a pin, on the map or in the pins menu, flies back to that area. Pins are saved on the
device. Selecting a plane draws its recent trajectory: positions are recorded from every poll while
the app is open and joined with a smooth curve. The selected flight is kept in the URL (`?flight=<icao24>`), so links can
be shared and the back gesture closes the details sheet.

## Stack

- **React 19 + Vite + TypeScript**
- **[Radix Themes](https://www.radix-ui.com/themes)**: the design system. Use its components and
  tokens (`var(--space-3)`, `var(--gray-9)`, …) rather than hand-rolled styles, so light and dark
  mode keep working
- **[MapLibre GL](https://maplibre.org/)** via `@vis.gl/react-maplibre`, with free
  [OpenFreeMap](https://openfreemap.org/) basemaps (no API key)
- **React Router**: pages and URL state
- **TanStack Query**: fetching, caching and polling
- **openapi-fetch + openapi-typescript**: a typed client generated from the API's OpenAPI spec

## Development

```sh
pnpm install
pnpm dev          # http://localhost:5173 (already allowed by the API's CORS config)
pnpm lint         # typecheck + eslint
pnpm format       # prettier
pnpm test         # vitest
pnpm build
```

### End-to-end tests

Playwright tests in `e2e/` drive the production build in mobile and desktop Chromium. Every API
call is mocked per test (`e2e/mocks.ts`), and the basemap is replaced with a blank style, so they
need no backend or network. They run in CI on every PR.

```sh
pnpm exec playwright install chromium   # first time only
pnpm test:e2e                           # or test:e2e:ui to watch them run
```

Set `VITE_API_BASE_URL` (see `.env.example`) to point at a local API; it defaults to production.

### Deployment

Deployed to Cloudflare Workers as static assets (`wrangler.jsonc`), with SPA fallback routing. The
build command is `pnpm build`, and the output directory is `dist`.

### Regenerating API types

When the API's endpoints change, regenerate `src/api/schema.d.ts` from its OpenAPI spec. By default
this reads a sibling checkout of `api.georgesheppard.dev`:

```sh
pnpm generate:api
API_SPEC=path/or/url/to/georgesheppard-spec.json pnpm generate:api
```

## Structure

```
src/
  app/          App shell: providers, theme, config, routes
  pages/        One component per route, composing features (map, search)
  api/          Typed API client, generated schema, and friendly type aliases
  features/
    map/        The MapLibre map, aircraft layers, and map overlays
    flights/    Data hooks (queries), URL selection state, and the flight details UI
    search/     Flight number search: query hook, result grouping, and result cards
    pins/       Saved places: device-local store, map markers, menu, and naming dialog
    tracks/     Positions recorded per aircraft from each poll, and the trajectory layer
  components/   Generic, feature-agnostic UI (bottom sheet, icons)
  lib/          Pure helpers (unit formatting, time, bounding boxes); unit tested
  test/         Unit test setup and render helpers
e2e/            Playwright end-to-end tests and API mocks
```

Adding a feature usually means a new folder under `features/`, with its own queries alongside its
components. A new page is a component in `pages/` plus an entry in `app/router.tsx`. Query keys live in each feature's `queries.ts`.
