import { Badge, Card, Flex, Text } from '@radix-ui/themes';
import type { FlightSearchResult } from '@/api/types';
import { RouteSummary } from '@/features/flights/RouteSummary';
import { statusColor } from '@/features/flights/status';
import { formatDate } from '@/lib/time';

export function SearchResultCard({ flight }: { flight: FlightSearchResult }) {
  const aircraft = [flight.aircraftType, flight.registration].filter(Boolean).join(' · ');

  return (
    <Card size="2" asChild>
      <article>
        <Flex direction="column" gap="3">
          <Flex align="start" justify="between" gap="3">
            <Flex direction="column" minWidth="0">
              <Text size="4" weight="bold">
                {flight.ident}
              </Text>
              <Text size="2" color="gray" truncate>
                {[flight.operator, formatDate(flight.scheduledOut)].filter(Boolean).join(' · ')}
              </Text>
            </Flex>
            <Badge color={statusColor(flight.status)} variant="soft" radius="full">
              {flight.status}
            </Badge>
          </Flex>
          <RouteSummary route={flight} variant="inline" />
          {aircraft && (
            <Text size="1" color="gray">
              {aircraft}
            </Text>
          )}
        </Flex>
      </article>
    </Card>
  );
}
