import type { BadgeProps } from '@radix-ui/themes';

// FlightAware statuses are free text ("En Route / On Time", "Arrived / Gate Arrival", …), so match
// on the keywords that matter.
export function statusColor(status: string): BadgeProps['color'] {
  const text = status.toLowerCase();
  if (text.includes('cancel') || text.includes('divert')) return 'red';
  if (text.includes('delay')) return 'orange';
  if (text.includes('en route') || text.includes('departed')) return 'green';
  if (text.includes('arrived') || text.includes('landed')) return 'gray';
  return 'blue';
}
