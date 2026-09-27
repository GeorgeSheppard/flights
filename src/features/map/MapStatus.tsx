import { Card, Flex, Text } from '@radix-ui/themes';
import { ExclamationTriangleIcon, ZoomInIcon } from '@radix-ui/react-icons';

interface MapStatusProps {
  tooFarOut: boolean;
  error: Error | null;
}

// Only shown when the map would otherwise look empty for a reason the user can't see.
export function MapStatus({ tooFarOut, error }: MapStatusProps) {
  if (!tooFarOut && !error) return null;

  return (
    <Card size="1" style={{ boxShadow: 'var(--shadow-3)' }}>
      <Flex align="center" gap="2" aria-live="polite">
        {tooFarOut ? <ZoomInIcon /> : <ExclamationTriangleIcon color="var(--red-9)" />}
        <Text size="2" weight="medium">
          {tooFarOut ? 'Zoom in to see flights' : 'Couldn’t load flights'}
        </Text>
      </Flex>
    </Card>
  );
}
