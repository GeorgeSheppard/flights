import { Card, Flex, Spinner, Text } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { PlaneIcon } from '@/components/PlaneIcon';
import styles from './MapStatus.module.css';

interface MapStatusProps {
  count: number;
  tooFarOut: boolean;
  isFetching: boolean;
  error: Error | null;
  // On wide screens the details panel sits top-left, so the status moves aside to stay visible.
  panelOpen: boolean;
}

function message({ count, tooFarOut, error }: MapStatusProps) {
  if (tooFarOut) return 'Zoom in to see flights';
  if (error) return 'Couldn’t load flights';
  return `${count.toLocaleString()} ${count === 1 ? 'flight' : 'flights'}`;
}

export function MapStatus(props: MapStatusProps) {
  return (
    <Card size="1" className={styles.status} data-panel-open={props.panelOpen || undefined}>
      <Flex align="center" gap="2" aria-live="polite">
        {props.error && !props.tooFarOut ? (
          <ExclamationTriangleIcon color="var(--red-9)" />
        ) : (
          <PlaneIcon width={15} height={15} style={{ color: 'var(--accent-9)' }} />
        )}
        <Text size="2" weight="medium">
          {message(props)}
        </Text>
        <Spinner size="1" loading={props.isFetching && !props.tooFarOut} />
      </Flex>
    </Card>
  );
}
