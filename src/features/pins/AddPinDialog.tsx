import { useState, type FormEvent } from 'react';
import { Button, Dialog, Flex, TextField } from '@radix-ui/themes';

interface AddPinDialogProps {
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function AddPinDialog({ defaultName, onSave, onCancel }: AddPinDialogProps) {
  const [name, setName] = useState(defaultName);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave(name.trim() || defaultName);
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Content maxWidth="360px" size="2">
        <Dialog.Title size="4">Add pin</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          Name this place so you can find your way back to it.
        </Dialog.Description>
        <form onSubmit={onSubmit}>
          <TextField.Root
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.target.select()}
            maxLength={40}
            aria-label="Pin name"
          />
          <Flex gap="2" justify="end" mt="4">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit">Save pin</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
