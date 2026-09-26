import { useCallback, useEffect, useMemo, useRef } from 'react';
import Map, {
  GeolocateControl,
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './maplibre';
import type { Aircraft } from '@/api/types';
import { config } from '@/app/config';
import type { Bounds } from '@/lib/bounds';
import {
  AIRCRAFT_LAYER_ID,
  AIRCRAFT_SOURCE_ID,
  aircraftLabelLayer,
  aircraftLayer,
  selectedAircraftLayer,
  toFeatureCollection,
  type AircraftFeatureProperties,
} from './aircraftLayer';
import { addPlaneIcon } from './planeIcon';

// A colourful street map in both light and dark mode: water, parks and roads stay easy to tell apart.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Remembered across mounts so returning from another page puts the map back where it was.
let lastView: { longitude: number; latitude: number; zoom: number } = config.initialView;

// Fingertips are imprecise, so a tap anywhere near a plane should still select it.
const TAP_TOLERANCE_PX = 16;

export interface ViewportChange {
  bounds: Bounds;
  zoom: number;
}

interface FlightMapProps {
  aircraft: Aircraft[];
  selectedIcao24: string | null;
  onSelect: (aircraft: AircraftFeatureProperties | null) => void;
  onViewportChange: (viewport: ViewportChange) => void;
  // A point to move the camera to, e.g. a shared flight that may be outside the initial view.
  focus?: { longitude: number; latitude: number } | null;
}

export function FlightMap({
  aircraft,
  selectedIcao24,
  onSelect,
  onViewportChange,
  focus,
}: FlightMapProps) {
  const internalRef = useRef<MapRef>(null);
  const data = useMemo(() => toFeatureCollection(aircraft), [aircraft]);

  useEffect(() => {
    if (!focus) return;
    internalRef.current?.flyTo({
      center: [focus.longitude, focus.latitude],
      zoom: Math.max(internalRef.current.getZoom(), config.minZoomForAircraft + 2),
    });
  }, [focus]);

  const reportViewport = useCallback(() => {
    const map = internalRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const center = map.getCenter();
    lastView = { longitude: center.lng, latitude: center.lat, zoom: map.getZoom() };
    onViewportChange({
      bounds: {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      },
      zoom: map.getZoom(),
    });
  }, [onViewportChange]);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const map = internalRef.current;
      if (!map) return;
      const { x, y } = event.point;
      const features = map.queryRenderedFeatures(
        [
          [x - TAP_TOLERANCE_PX, y - TAP_TOLERANCE_PX],
          [x + TAP_TOLERANCE_PX, y + TAP_TOLERANCE_PX],
        ],
        { layers: [AIRCRAFT_LAYER_ID] }
      );

      const nearest = features
        .map((feature) => {
          const [lng, lat] =
            feature.geometry.type === 'Point' ? feature.geometry.coordinates : [0, 0];
          const point = map.project([lng ?? 0, lat ?? 0]);
          return { feature, distance: Math.hypot(point.x - x, point.y - y) };
        })
        .sort((a, b) => a.distance - b.distance)[0];

      onSelect(nearest ? (nearest.feature.properties as AircraftFeatureProperties) : null);
    },
    [onSelect]
  );

  return (
    <Map
      ref={internalRef}
      initialViewState={lastView}
      mapStyle={MAP_STYLE}
      style={{ position: 'absolute', inset: 0 }}
      attributionControl={{ compact: true }}
      dragRotate={false}
      touchPitch={false}
      onLoad={(event) => {
        const map = event.target;
        addPlaneIcon(map);
        // Switching light/dark swaps the style, which drops images added at runtime.
        map.on('styleimagemissing', () => addPlaneIcon(map));
        // The compact attribution starts expanded; collapse it so it doesn't cover the map.
        map
          .getContainer()
          .querySelector('.maplibregl-compact-show')
          ?.classList.remove('maplibregl-compact-show');
        reportViewport();
      }}
      onMoveEnd={reportViewport}
      onClick={handleClick}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <GeolocateControl position="top-right" />
      <Source id={AIRCRAFT_SOURCE_ID} type="geojson" data={data}>
        <Layer {...aircraftLabelLayer()} />
        <Layer {...aircraftLayer()} />
        <Layer {...selectedAircraftLayer(selectedIcao24)} />
      </Source>
    </Map>
  );
}
