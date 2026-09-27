import type { FeatureCollection, Point } from 'geojson';
import type { LayerProps } from '@vis.gl/react-maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Aircraft } from '@/api/types';

export const AIRCRAFT_SOURCE_ID = 'aircraft';
export const AIRCRAFT_LAYER_ID = 'aircraft';
export const AIRCRAFT_LABEL_LAYER_ID = `${AIRCRAFT_LAYER_ID}-labels`;
export const PLANE_ICON_ID = 'plane';

export interface AircraftFeatureProperties {
  icao24: string;
  callsign: string | null;
  heading: number;
  onGround: boolean;
}

export function toFeatureCollection(
  aircraft: Aircraft[]
): FeatureCollection<Point, AircraftFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: aircraft.map((plane) => ({
      type: 'Feature',
      id: plane.icao24,
      geometry: { type: 'Point', coordinates: [plane.longitude, plane.latitude] },
      properties: {
        icao24: plane.icao24,
        callsign: plane.callsign,
        heading: plane.headingDegrees ?? 0,
        onGround: plane.onGround,
      },
    })),
  };
}

// Radix Themes step-9 colours, so map markers match the rest of the UI.
const colors = {
  airborne: '#ffc53d',
  ground: '#8b8d98',
  selected: '#0090ff',
};

// Zoom expressions must be the top-level interpolate, so the scale is baked into each stop.
const iconSize = (scale = 1): ExpressionSpecification => [
  'interpolate',
  ['linear'],
  ['zoom'],
  4,
  0.55 * scale,
  8,
  0.8 * scale,
  12,
  1.1 * scale,
];

export function aircraftLayer(): LayerProps {
  return {
    id: AIRCRAFT_LAYER_ID,
    type: 'symbol',
    layout: {
      'icon-image': PLANE_ICON_ID,
      'icon-rotate': ['get', 'heading'],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': iconSize(),
    },
    paint: {
      'icon-color': ['case', ['get', 'onGround'], colors.ground, colors.airborne],
      'icon-halo-color': '#1c2024',
      'icon-halo-width': 1.5,
    },
  };
}

// Kept separate from the icons so that if the basemap's glyphs fail to load, planes still render.
export function aircraftLabelLayer(): LayerProps {
  return {
    id: AIRCRAFT_LABEL_LAYER_ID,
    type: 'symbol',
    minzoom: 9,
    layout: {
      'text-field': ['coalesce', ['get', 'callsign'], ''],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: {
      'text-color': '#1c2024',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  };
}

export function selectedAircraftLayer(icao24: string | null): LayerProps {
  return {
    id: `${AIRCRAFT_LAYER_ID}-selected`,
    type: 'symbol',
    filter: ['==', ['get', 'icao24'], icao24 ?? ''],
    layout: {
      'icon-image': PLANE_ICON_ID,
      'icon-rotate': ['get', 'heading'],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': iconSize(1.35),
    },
    paint: {
      'icon-color': colors.selected,
      'icon-halo-color': '#ffffff',
      'icon-halo-width': 2,
    },
  };
}
