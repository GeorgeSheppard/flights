import { toAreaQuery } from './bounds';

describe('toAreaQuery', () => {
  it('snaps outward to a half-degree grid', () => {
    expect(toAreaQuery({ west: -1.3, south: 50.8, east: 0.2, north: 52.1 })).toEqual({
      minLongitude: -1.5,
      minLatitude: 50.5,
      maxLongitude: 0.5,
      maxLatitude: 52.5,
    });
  });

  it('uses the full longitude range when the viewport wraps the antimeridian', () => {
    const query = toAreaQuery({ west: 170, south: -10, east: 190, north: 10 });
    expect(query.minLongitude).toBe(-180);
    expect(query.maxLongitude).toBe(180);
  });

  it('clamps latitudes to valid values', () => {
    const query = toAreaQuery({ west: 0, south: -89.9, east: 1, north: 89.9 });
    expect(query.minLatitude).toBe(-90);
    expect(query.maxLatitude).toBe(90);
  });
});
