import { Box, Card, Flex, Progress, Text } from '@radix-ui/themes';
import type { Airport, FlightRoute } from '@/api/types';
import { PlaneIcon } from '@/components/PlaneIcon';
import { flightProgress, formatTime } from '@/lib/time';

function AirportColumn({
  airport,
  time,
  scheduled,
  align,
}: {
  airport: Airport | null;
  time: string | null;
  scheduled: string | null;
  align: 'left' | 'right';
}) {
  const delayed = time && scheduled && Date.parse(time) - Date.parse(scheduled) > 15 * 60_000;
  return (
    <Flex
      direction="column"
      align={align === 'left' ? 'start' : 'end'}
      minWidth="0"
      flexBasis="0"
      flexGrow="1"
    >
      <Text size="7" weight="bold" style={{ lineHeight: 1 }}>
        {airport?.code ?? '???'}
      </Text>
      <Text size="1" color="gray" truncate style={{ maxWidth: '100%' }}>
        {airport?.city ?? airport?.name ?? 'Unknown'}
      </Text>
      <Text size="2" weight="medium" color={delayed ? 'orange' : undefined} mt="1">
        {formatTime(time ?? scheduled)}
      </Text>
    </Flex>
  );
}

export function RouteSummary({ route }: { route: FlightRoute }) {
  const departure = route.actualOut ?? route.estimatedOut ?? route.scheduledOut;
  const arrival = route.actualIn ?? route.estimatedIn ?? route.scheduledIn;
  const progress = flightProgress(departure, arrival);

  return (
    <Card size="2">
      <Flex align="start" gap="3">
        <AirportColumn
          airport={route.origin}
          time={departure}
          scheduled={route.scheduledOut}
          align="left"
        />
        <Flex pt="2" justify="center" flexGrow="1" flexBasis="0" aria-hidden>
          <PlaneIcon width={20} height={20} style={{ color: 'var(--gray-9)', rotate: '90deg' }} />
        </Flex>
        <AirportColumn
          airport={route.destination}
          time={arrival}
          scheduled={route.scheduledIn}
          align="right"
        />
      </Flex>
      {progress !== null && (
        <Box mt="3">
          <Progress value={progress * 100} size="1" aria-label="Flight progress" />
        </Box>
      )}
    </Card>
  );
}
