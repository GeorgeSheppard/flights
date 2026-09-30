const KMH_PER_METER_PER_SECOND = 3.6;
// Roughly 100 ft/min, below which an aircraft is effectively holding its altitude.
const LEVEL_THRESHOLD_METERS_PER_SECOND = 0.5;

const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatAltitude(meters: number | null, onGround = false): string {
  if (onGround) return 'Ground';
  if (meters === null) return '—';
  return `${integer.format(meters)} m`;
}

export function formatSpeed(metersPerSecond: number | null): string {
  if (metersPerSecond === null) return '—';
  return `${integer.format(metersPerSecond * KMH_PER_METER_PER_SECOND)} km/h`;
}

export function formatHeading(degrees: number | null): string {
  if (degrees === null) return '—';
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const point = compass[Math.round(degrees / 45) % 8];
  return `${integer.format(degrees)}° ${point}`;
}

export function formatVerticalRate(metersPerSecond: number | null): string {
  if (metersPerSecond === null) return '—';
  if (Math.abs(metersPerSecond) < LEVEL_THRESHOLD_METERS_PER_SECOND) return 'Level';
  const sign = metersPerSecond > 0 ? '+' : '−';
  return `${sign}${oneDecimal.format(Math.abs(metersPerSecond))} m/s`;
}
