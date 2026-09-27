import { useSyncExternalStore } from 'react';
import { config } from '@/app/config';
import type { MapArea } from '@/features/map/useFlightMap';

export interface Pin extends MapArea {
  id: string;
  name: string;
}

const STORAGE_KEY = 'flights:pins:v1';

// Flying to a pin should land somewhere useful: close enough to show flights, far enough out to
// see the surrounding area.
const MIN_PIN_ZOOM = config.minZoomForAircraft + 2;
const MAX_PIN_ZOOM = 11;

export const pinZoom = (zoom: number) => Math.min(MAX_PIN_ZOOM, Math.max(MIN_PIN_ZOOM, zoom));

const isPin = (value: unknown): value is Pin => {
  if (!value || typeof value !== 'object') return false;
  const pin = value as Record<string, unknown>;
  return (
    typeof pin.id === 'string' &&
    typeof pin.name === 'string' &&
    typeof pin.longitude === 'number' &&
    typeof pin.latitude === 'number' &&
    typeof pin.zoom === 'number'
  );
};

// Pins are saved on the device. The store is a factory so tests can give it its own storage.
export function createPinStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null) {
  const listeners = new Set<() => void>();

  const read = (): Pin[] => {
    try {
      const parsed: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter(isPin) : [];
    } catch {
      return [];
    }
  };

  let pins = read();

  const write = (next: Pin[]) => {
    pins = next;
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be full or disabled (e.g. private browsing); pins then last for the session.
    }
    listeners.forEach((listener) => listener());
  };

  return {
    getPins: () => pins,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Picks up pins added in another tab.
    reload: () => {
      pins = read();
      listeners.forEach((listener) => listener());
    },
    addPin: (pin: Omit<Pin, 'id'>): Pin => {
      const created = { ...pin, zoom: pinZoom(pin.zoom), id: crypto.randomUUID() };
      write([...pins, created]);
      return created;
    },
    removePin: (id: string) => write(pins.filter((pin) => pin.id !== id)),
  };
}

const safeLocalStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const pinStore = createPinStore(safeLocalStorage());

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) pinStore.reload();
});

export function usePins() {
  return useSyncExternalStore(pinStore.subscribe, pinStore.getPins);
}
