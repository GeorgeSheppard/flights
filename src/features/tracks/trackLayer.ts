import type { Feature, LineString } from 'geojson';
import type { LayerProps } from '@vis.gl/react-maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import { smoothPath, type LngLat } from '@/lib/spline';

export const TRACK_SOURCE_ID = 'selected-track';

export function toTrackFeature(points: LngLat[]): Feature<LineString> | null {
  if (points.length < 2) return null;
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: smoothPath(points) },
  };
}

// Matches the selected aircraft's blue, fading out towards the oldest part of the track. The
// gradient needs the source to be created with `lineMetrics: true`.
const trackGradient: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['line-progress'],
  0,
  'rgba(0, 144, 255, 0.15)',
  1,
  'rgba(0, 144, 255, 1)',
];

export const trackCasingLayer: LayerProps = {
  id: `${TRACK_SOURCE_ID}-casing`,
  type: 'line',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.7 },
};

export const trackLineLayer: LayerProps = {
  id: TRACK_SOURCE_ID,
  type: 'line',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 'line-width': 3, 'line-gradient': trackGradient },
};
