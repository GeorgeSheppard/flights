import { Card, Flex, IconButton, Spinner, Text } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { formatTime } from '@/lib/time';
import type { Watch } from './watch';

export function WatchBanner({ watch, onClose }: { watch: Watch; onClose: () => void }) {
  return (
    <Card size="1" style={{ boxShadow: 'var(--shadow-3)', maxWidth: 320 }}>
      <Flex align="start" gap="2" aria-live="polite">
        <Spinner size="1" mt="1" />
        <Text size="2">
          Waiting for the plane for <strong>{watch.flight}</strong> to switch its transponder on.
          Last seen at {formatTime(watch.seenAt)}.
        </Text>
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          onClick={onClose}
          aria-label="Stop waiting"
        >
          <Cross2Icon />
        </IconButton>
      </Flex>
    </Card>
  );
}
