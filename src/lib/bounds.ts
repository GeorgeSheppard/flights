import type { AreaQuery } from '@/api/types';

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Snapping outward to a grid keeps query keys stable while the user makes small pans, so each
// nudge of the map doesn't trigger a fresh request.
const GRID_DEGREES = 0.5;
const snapDown = (value: number) => Math.floor(value / GRID_DEGREES) * GRID_DEGREES;
const snapUp = (value: number) => Math.ceil(value / GRID_DEGREES) * GRID_DEGREES;

export function toAreaQuery(bounds: Bounds): AreaQuery {
  // A viewport wider than the world, or one crossing the antimeridian, can't be expressed as a
  // single box, so fall back to the full longitude range.
  const wraps = bounds.east - bounds.west >= 360 || bounds.west < -180 || bounds.east > 180;
  return {
    minLatitude: clamp(snapDown(bounds.south), -90, 90),
    maxLatitude: clamp(snapUp(bounds.north), -90, 90),
    minLongitude: wraps ? -180 : clamp(snapDown(bounds.west), -180, 180),
    maxLongitude: wraps ? 180 : clamp(snapUp(bounds.east), -180, 180),
  };
}
