import { toTrackFeature } from './trackLayer';

describe('toTrackFeature', () => {
  it('needs at least two positions to draw a line', () => {
    expect(toTrackFeature([])).toBeNull();
    expect(toTrackFeature([[0, 51]])).toBeNull();
  });

  it('draws a smoothed line that starts and ends at the recorded positions', () => {
    const feature = toTrackFeature([
      [0, 51],
      [0.2, 51.1],
      [0.3, 51.3],
    ]);
    const coordinates = feature!.geometry.coordinates;
    expect(coordinates[0]).toEqual([0, 51]);
    expect(coordinates.at(-1)![0]).toBeCloseTo(0.3, 9);
    expect(coordinates.at(-1)![1]).toBeCloseTo(51.3, 9);
    expect(coordinates.length).toBeGreaterThan(3);
  });
});
