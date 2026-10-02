import { Button, Callout, Flex, Separator, Skeleton, Text } from '@radix-ui/themes';
import { ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Aircraft, FlightDetails } from '@/api/types';
import { formatTime } from '@/lib/time';
import { formatAltitude, formatHeading, formatSpeed, formatVerticalRate } from '@/lib/units';
import { AircraftPhoto } from './AircraftPhoto';
import { RouteSummary } from './RouteSummary';
import { StatGrid } from './StatGrid';

interface FlightDetailsContentProps {
  icao24: string;
  details: UseQueryResult<FlightDetails>;
  snapshot: Aircraft | undefined;
  lastSeenAt?: number | null;
}

export function FlightDetailsContent({
  icao24,
  details,
  snapshot,
  lastSeenAt,
}: FlightDetailsContentProps) {
  if (details.isError) {
    return (
      <Callout.Root color="red" role="alert">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>Couldn’t load this flight. {details.error.message}</Callout.Text>
        <Button size="1" variant="soft" color="red" onClick={() => details.refetch()}>
          Try again
        </Button>
      </Callout.Root>
    );
  }

  const data = details.data;
  const position = data?.position ?? snapshot ?? null;
  const route = data?.route ?? null;

  return (
    <Flex direction="column" gap="4">
      {lastSeenAt && (
        <Callout.Root color="amber" variant="surface" size="1">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            No signal since {formatTime(new Date(lastSeenAt).toISOString())}. It’s shown where it
            was last seen and will move again once it’s heard from.
          </Callout.Text>
        </Callout.Root>
      )}
      <Skeleton loading={details.isPending} height="88px">
        {route ? (
          <RouteSummary route={route} />
        ) : (
          <Callout.Root color="gray" variant="surface" size="1">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>Route information isn’t available for this flight.</Callout.Text>
          </Callout.Root>
        )}
      </Skeleton>

      <AircraftPhoto icao24={icao24} />

      <StatGrid
        title="Live"
        loading={details.isPending && !snapshot}
        stats={[
          {
            label: 'Altitude',
            value: formatAltitude(position?.altitudeMeters ?? null, position?.onGround),
          },
          { label: 'Ground speed', value: formatSpeed(position?.velocityMetersPerSecond ?? null) },
          { label: 'Heading', value: formatHeading(position?.headingDegrees ?? null) },
          {
            label: 'Vertical rate',
            value: formatVerticalRate(position?.verticalRateMetersPerSecond ?? null),
          },
        ]}
      />

      <Separator size="4" />

      <StatGrid
        title="Aircraft"
        loading={details.isPending}
        stats={[
          { label: 'Type', value: route?.aircraftType ?? '—' },
          { label: 'Registration', value: route?.registration ?? '—' },
          { label: 'Transponder', value: (data?.icao24 ?? snapshot?.icao24 ?? '—').toUpperCase() },
          { label: 'Callsign', value: data?.callsign ?? snapshot?.callsign ?? '—' },
        ]}
      />

      {!position && !details.isPending && (
        <Text size="1" color="gray">
          No live position is currently being received for this aircraft.
        </Text>
      )}
    </Flex>
  );
}
