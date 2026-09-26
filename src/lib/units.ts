const FEET_PER_METER = 3.28084;
const KNOTS_PER_METER_PER_SECOND = 1.94384;

const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

export function formatAltitude(meters: number | null, onGround = false): string {
  if (onGround) return 'Ground';
  if (meters === null) return '—';
  return `${integer.format(meters * FEET_PER_METER)} ft`;
}

export function formatSpeed(metersPerSecond: number | null): string {
  if (metersPerSecond === null) return '—';
  return `${integer.format(metersPerSecond * KNOTS_PER_METER_PER_SECOND)} kt`;
}

export function formatHeading(degrees: number | null): string {
  if (degrees === null) return '—';
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const point = compass[Math.round(degrees / 45) % 8];
  return `${integer.format(degrees)}° ${point}`;
}

export function formatVerticalRate(metersPerSecond: number | null): string {
  if (metersPerSecond === null) return '—';
  const feetPerMinute = metersPerSecond * FEET_PER_METER * 60;
  if (Math.abs(feetPerMinute) < 100) return 'Level';
  const sign = feetPerMinute > 0 ? '+' : '−';
  return `${sign}${integer.format(Math.abs(feetPerMinute))} ft/min`;
}
