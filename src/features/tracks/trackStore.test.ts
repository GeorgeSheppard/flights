import { createTrackStore } from './trackStore';

const at = (icao24: string, longitude: number, latitude: number) => ({
  icao24,
  longitude,
  latitude,
});

describe('trackStore', () => {
  it('builds up a track per aircraft from successive polls', () => {
    const store = createTrackStore();
    store.record([at('a', 0, 51), at('b', 1, 52)], 0);
    store.record([at('a', 0.1, 51.1)], 20_000);

    expect(store.getTrack('a')).toEqual([
      [0, 51],
      [0.1, 51.1],
    ]);
    expect(store.getTrack('b')).toEqual([[1, 52]]);
    expect(store.getTrack('unknown')).toEqual([]);
  });

  it('ignores repeated positions and only notifies on change', () => {
    const store = createTrackStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.record([at('a', 0, 51)], 0);
    store.record([at('a', 0, 51)], 20_000);

    expect(store.getTrack('a')).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('caps track length and forgets aircraft not seen for a while', () => {
    const store = createTrackStore();
    for (let i = 0; i < 100; i++) store.record([at('a', i * 0.01, 51)], i * 1000);
    expect(store.getTrack('a')).toHaveLength(90);

    store.record([at('b', 0, 50)], 100 * 1000 + 31 * 60_000);
    expect(store.getTrack('a')).toEqual([]);
    expect(store.getTrack('b')).toHaveLength(1);
  });
});
