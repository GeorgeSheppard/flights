import { smoothPath, type LngLat } from './spline';

describe('smoothPath', () => {
  it('returns short paths unchanged', () => {
    const points: LngLat[] = [
      [0, 51],
      [0.1, 51.1],
    ];
    expect(smoothPath(points)).toEqual(points);
  });

  it('passes through every original point, in order', () => {
    const points: LngLat[] = [
      [-0.5, 51.4],
      [-0.3, 51.5],
      [-0.1, 51.45],
      [0.1, 51.6],
    ];
    const smoothed = smoothPath(points);

    let searchFrom = 0;
    for (const [lng, lat] of points) {
      const index = smoothed.findIndex(
        ([x, y], i) => i >= searchFrom && Math.abs(x - lng) < 1e-9 && Math.abs(y - lat) < 1e-9
      );
      expect(index).toBeGreaterThanOrEqual(searchFrom);
      searchFrom = index;
    }
    expect(smoothed.length).toBeGreaterThan(points.length);
  });

  it('keeps a straight path straight', () => {
    const points: LngLat[] = [
      [0, 51],
      [0.1, 51.1],
      [0.2, 51.2],
      [0.3, 51.3],
    ];
    for (const [lng, lat] of smoothPath(points)) {
      expect(lat - 51).toBeCloseTo(lng, 9);
    }
  });
});
