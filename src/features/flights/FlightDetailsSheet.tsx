import { Badge, Flex, Heading, IconButton, Skeleton, Text } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import type { Aircraft } from '@/api/types';
import { BottomSheet } from '@/components/BottomSheet';
import { FlightDetailsContent } from './FlightDetailsContent';
import { useFlightDetails } from './queries';
import type { SelectedFlight } from './selection';

interface FlightDetailsSheetProps {
  flight: SelectedFlight;
  // The last position seen on the map, shown instantly while full details load.
  snapshot: Aircraft | undefined;
  onClose: () => void;
}

export function FlightDetailsSheet({ flight, snapshot, onClose }: FlightDetailsSheetProps) {
  const details = useFlightDetails(flight);
  const route = details.data?.route;
  const callsign = details.data?.callsign ?? flight.callsign ?? snapshot?.callsign;

  const header = (
    <Flex align="start" justify="between" gap="3">
      <Flex direction="column" gap="1" minWidth="0">
        <Flex align="center" gap="2">
          <Heading size="6" trim="start" truncate>
            {callsign ?? flight.icao24.toUpperCase()}
          </Heading>
          {route?.status && (
            <Badge color="blue" variant="soft" radius="full">
              {route.status}
            </Badge>
          )}
        </Flex>
        <Skeleton loading={details.isPending}>
          <Text size="2" color="gray" truncate>
            {route?.operator ?? (details.isPending ? 'Loading airline' : 'Airline unknown')}
          </Text>
        </Skeleton>
      </Flex>
      <IconButton variant="soft" color="gray" radius="full" onClick={onClose} aria-label="Close">
        <Cross2Icon />
      </IconButton>
    </Flex>
  );

  return (
    <BottomSheet header={header} onClose={onClose}>
      <FlightDetailsContent details={details} snapshot={snapshot} />
    </BottomSheet>
  );
}
