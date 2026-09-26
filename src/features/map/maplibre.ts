import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// MapLibre locates its worker relative to its own module, which breaks once Vite bundles it, so
// have Vite build the worker and point MapLibre at the result.
setWorkerUrl(workerUrl);
