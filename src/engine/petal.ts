import { Vector3 } from 'three';

/** Trilaterate a shared side point. Each distance is a real paper edge, so
 * lifting one page also tucks the adjoining page without stretching either.
 * The solution nearest the original side selects the continuous outer branch. */
export function petalSide(point: Vector3, anchor: Vector3, neighbor: Vector3,
  beforeTip: Vector3, tip: Vector3): Vector3 {
  const r = point.distanceTo(anchor), rb = point.distanceTo(neighbor), rt = point.distanceTo(beforeTip);
  const ex = neighbor.clone().sub(anchor), d = ex.length();
  ex.divideScalar(d);
  const c = tip.clone().sub(anchor), i = ex.dot(c);
  const ey = c.clone().addScaledVector(ex, -i), j = ey.length();
  if (j < 1e-10) return point.clone();
  ey.divideScalar(j);
  const ez = ex.clone().cross(ey);
  const x = (r * r - rb * rb + d * d) / (2 * d);
  const y = (r * r - rt * rt + i * i + j * j - 2 * i * x) / (2 * j);
  const height2 = r * r - x * x - y * y;
  if (height2 < -1e-8) throw new Error('Petal crease distances cannot meet');
  const sign = point.clone().sub(anchor).dot(ez) < 0 ? -1 : 1;
  return anchor.clone().addScaledVector(ex, x).addScaledVector(ey, y)
    .addScaledVector(ez, sign * Math.sqrt(Math.max(0, height2)));
}
