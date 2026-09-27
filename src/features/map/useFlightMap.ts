import { useMap } from '@vis.gl/react-maplibre';

export const FLIGHT_MAP_ID = 'flights';

export interface MapArea {
  longitude: number;
  latitude: number;
  zoom: number;
}

// Lets components outside the map (menus, overlays) move the camera. Needs a <MapProvider> above.
export function useFlightMap() {
  const map = useMap()[FLIGHT_MAP_ID];

  return {
    flyTo: (area: MapArea) =>
      map?.flyTo({ center: [area.longitude, area.latitude], zoom: area.zoom }),
    currentArea: (): MapArea | null => {
      if (!map) return null;
      const center = map.getCenter();
      return { longitude: center.lng, latitude: center.lat, zoom: map.getZoom() };
    },
  };
}
