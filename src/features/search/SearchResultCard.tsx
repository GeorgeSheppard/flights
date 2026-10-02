import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Badge, Card, Flex, Spinner, Text } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import type { FlightSearchResult } from '@/api/types';
import { RouteSummary } from '@/features/flights/RouteSummary';
import { mapPathFor } from '@/features/flights/selection';
import { statusColor } from '@/features/flights/status';
import { formatDate } from '@/lib/time';
import { useLocateFlight } from './queries';

// 'flight' finds the flight itself in the air; 'plane' finds the plane due to operate it.
export type FindOnMap = 'flight' | 'plane';

const labels: Record<FindOnMap, { action: string; notFound: string }> = {
  flight: { action: 'Show on map', notFound: 'It isn’t being tracked on the map right now.' },
  plane: {
    action: 'Find my plane',
    notFound: 'Its plane isn’t on the map yet. Try again closer to departure.',
  },
};

interface SearchResultCardProps {
  flight: FlightSearchResult;
  findOnMap?: FindOnMap;
}

export function SearchResultCard({ flight, findOnMap }: SearchResultCardProps) {
  const aircraft = [flight.aircraftType, flight.registration].filter(Boolean).join(' · ');

  const content = (
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
  );

  if (findOnMap) {
    return (
      <ShowOnMapCard flight={flight} findOnMap={findOnMap}>
        {content}
      </ShowOnMapCard>
    );
  }

  return (
    <Card size="2" asChild>
      <article>{content}</article>
    </Card>
  );
}

function ShowOnMapCard({
  flight,
  findOnMap,
  children,
}: Required<SearchResultCardProps> & { children: ReactNode }) {
  const navigate = useNavigate();
  const locate = useLocateFlight();

  const onClick = () => {
    if (locate.isPending) return;
    locate.mutate(flight.faFlightId, {
      onSuccess: ({ aircraft }) => {
        if (aircraft) navigate(mapPathFor(aircraft));
      },
    });
  };

  return (
    <Card size="2" asChild>
      <button type="button" onClick={onClick} style={{ width: '100%', textAlign: 'start' }}>
        <Flex direction="column" gap="3">
          {children}
          <LocateStatus locate={locate} text={labels[findOnMap]} />
        </Flex>
      </button>
    </Card>
  );
}

interface LocateStatusProps {
  locate: ReturnType<typeof useLocateFlight>;
  text: (typeof labels)[FindOnMap];
}

function LocateStatus({ locate, text }: LocateStatusProps) {
  if (locate.isPending) {
    return (
      <Flex align="center" gap="2">
        <Spinner size="1" />
        <Text size="2" color="gray">
          Finding it…
        </Text>
      </Flex>
    );
  }

  if (locate.isError) {
    return (
      <Text size="2" color="red">
        Couldn’t find it on the map. Tap to try again.
      </Text>
    );
  }

  if (locate.isSuccess && !locate.data.aircraft) {
    return (
      <Text size="2" color="gray">
        {text.notFound}
      </Text>
    );
  }

  return (
    <Flex align="center" gap="1" style={{ color: 'var(--accent-11)' }}>
      <Text size="2" weight="medium">
        {text.action}
      </Text>
      <ChevronRightIcon />
    </Flex>
  );
}
