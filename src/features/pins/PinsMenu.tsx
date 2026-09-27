import { useState } from 'react';
import { Button, Flex, IconButton, Popover, Separator, Text } from '@radix-ui/themes';
import { DrawingPinIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { MapPinIcon } from '@/components/MapPinIcon';
import { useFlightMap } from '@/features/map/useFlightMap';
import { pinStore, usePins } from './pinStore';

interface PinsMenuProps {
  onAddCurrentView: () => void;
}

export function PinsMenu({ onAddCurrentView }: PinsMenuProps) {
  const pins = usePins();
  const map = useFlightMap();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <IconButton
          size="2"
          radius="full"
          variant="surface"
          color="gray"
          highContrast
          aria-label="Pins"
          style={{ boxShadow: 'var(--shadow-3)', background: 'var(--color-panel-solid)' }}
        >
          <DrawingPinIcon />
        </IconButton>
      </Popover.Trigger>
      <Popover.Content size="1" width="260px" align="start">
        <Flex direction="column" gap="1">
          {pins.length === 0 && (
            <Text size="2" color="gray" as="p">
              No pins yet. Long-press the map to drop one, or pin the current view.
            </Text>
          )}
          {pins.map((pin) => (
            <Flex key={pin.id} align="center" gap="1">
              <Button
                variant="ghost"
                color="gray"
                highContrast
                style={{ flexGrow: 1, justifyContent: 'flex-start', margin: 0 }}
                onClick={() => {
                  map.flyTo(pin);
                  setOpen(false);
                }}
              >
                <MapPinIcon width={12} height={16} style={{ color: 'var(--red-9)' }} aria-hidden />
                <Text truncate>{pin.name}</Text>
              </Button>
              <IconButton
                variant="ghost"
                color="gray"
                aria-label={`Remove ${pin.name}`}
                onClick={() => pinStore.removePin(pin.id)}
              >
                <TrashIcon />
              </IconButton>
            </Flex>
          ))}
          <Separator size="4" my="1" />
          <Button
            variant="soft"
            onClick={() => {
              setOpen(false);
              onAddCurrentView();
            }}
          >
            <PlusIcon />
            Pin this view
          </Button>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
