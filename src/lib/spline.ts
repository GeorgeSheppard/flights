export type LngLat = [longitude: number, latitude: number];

const SAMPLES_PER_SEGMENT = 8;

// Fits a smooth curve through the points using a centripetal Catmull-Rom spline, which passes
// through every point without the loops and overshoots of a uniform spline. Positions are
// projected onto a local flat plane first, so a degree of longitude isn't treated as the same
// distance as a degree of latitude.
export function smoothPath(points: LngLat[]): LngLat[] {
  if (points.length < 3) return points;

  const scale = Math.cos((points[0]![1] * Math.PI) / 180);
  const planar = points.map(([lng, lat]) => [lng * scale, lat] as const);
  const result: LngLat[] = [points[0]!];

  for (let i = 0; i < planar.length - 1; i++) {
    // Mirror the end points so the first and last segments have neighbours on both sides.
    const p0 = planar[i - 1] ?? reflect(planar[i + 1]!, planar[i]!);
    const p1 = planar[i]!;
    const p2 = planar[i + 1]!;
    const p3 = planar[i + 2] ?? reflect(planar[i]!, planar[i + 1]!);

    for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
      const [x, y] = catmullRom(p0, p1, p2, p3, s / SAMPLES_PER_SEGMENT);
      result.push([x / scale, y]);
    }
  }

  return result;
}

type Point = readonly [number, number];

const reflect = (point: Point, about: Point): Point => [
  2 * about[0] - point[0],
  2 * about[1] - point[1],
];

// Barry–Goldman evaluation of a centripetal (alpha = 0.5) Catmull-Rom segment between p1 and p2.
function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const knot = (a: Point, b: Point) =>
    Math.max(Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])), 1e-9);
  const t0 = 0;
  const t1 = t0 + knot(p0, p1);
  const t2 = t1 + knot(p1, p2);
  const t3 = t2 + knot(p2, p3);
  const u = t1 + (t2 - t1) * t;

  const lerp = (a: Point, b: Point, ta: number, tb: number): Point => {
    const w = (u - ta) / (tb - ta);
    return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
  };

  const a1 = lerp(p0, p1, t0, t1);
  const a2 = lerp(p1, p2, t1, t2);
  const a3 = lerp(p2, p3, t2, t3);
  const b1 = lerp(a1, a2, t0, t2);
  const b2 = lerp(a2, a3, t1, t3);
  return lerp(b1, b2, t1, t2);
}
