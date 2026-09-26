const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

export function formatTime(iso: string | null): string {
  return iso ? timeFormat.format(new Date(iso)) : '—';
}

// Fraction (0–1) of the way between departure and arrival, or null when the times are unknown.
export function flightProgress(
  departure: string | null,
  arrival: string | null,
  now: number = Date.now()
): number | null {
  if (!departure || !arrival) return null;
  const start = Date.parse(departure);
  const end = Date.parse(arrival);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}
