import { createPinStore, pinZoom } from './pinStore';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const home = { name: 'Home', longitude: -0.12, latitude: 51.5, zoom: 9 };

describe('pinStore', () => {
  it('adds, persists and removes pins', () => {
    const storage = memoryStorage();
    const store = createPinStore(storage);

    const pin = store.addPin(home);
    expect(store.getPins()).toEqual([pin]);
    expect(createPinStore(storage).getPins()).toEqual([pin]);

    store.removePin(pin.id);
    expect(store.getPins()).toEqual([]);
    expect(createPinStore(storage).getPins()).toEqual([]);
  });

  it('notifies subscribers of changes', () => {
    const store = createPinStore(memoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);

    store.addPin(home);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores corrupt or malformed saved data', () => {
    expect(createPinStore(memoryStorage({ 'flights:pins:v1': '{not json' })).getPins()).toEqual([]);
    const mixed = JSON.stringify([
      { ...home, id: 'a' },
      { name: 'No coordinates', id: 'b' },
    ]);
    expect(createPinStore(memoryStorage({ 'flights:pins:v1': mixed })).getPins()).toHaveLength(1);
  });

  it('still works without storage', () => {
    const store = createPinStore(null);
    store.addPin(home);
    expect(store.getPins()).toHaveLength(1);
  });

  it('keeps pin zoom within a useful range', () => {
    expect(pinZoom(2)).toBe(7);
    expect(pinZoom(9.5)).toBe(9.5);
    expect(pinZoom(16)).toBe(11);
  });
});
