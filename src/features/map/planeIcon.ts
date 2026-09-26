import type { Map as MaplibreMap } from 'maplibre-gl';
import { PLANE_PATH } from '@/lib/planePath';
import { PLANE_ICON_ID } from './aircraftLayer';

const SIZE = 48;
const PADDING = 4;

// Pointing north so `icon-rotate` can use the true track directly. Drawn as an SDF so the same image can be recoloured per state (airborne, ground, selected).
export function addPlaneIcon(map: MaplibreMap) {
  if (map.hasImage(PLANE_ICON_ID)) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE * pixelRatio;
  const context = canvas.getContext('2d');
  if (!context) return;

  const scale = ((SIZE - PADDING * 2) / 24) * pixelRatio;
  context.translate(PADDING * pixelRatio, PADDING * pixelRatio);
  context.scale(scale, scale);
  context.fillStyle = '#000';
  context.fill(new Path2D(PLANE_PATH));

  map.addImage(PLANE_ICON_ID, context.getImageData(0, 0, canvas.width, canvas.height), {
    sdf: true,
    pixelRatio: pixelRatio * 2,
  });
}
