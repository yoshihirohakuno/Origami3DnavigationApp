/** Orthographic painter ordering. Split intersecting faces before sorting them. */
export interface PaperPoint { x: number; y: number; z: number }
export interface PaperPolygon { face: number; points: PaperPoint[] }
interface Plane { x: number; y: number; z: number; d: number }
const EPS = 1e-8;

function planeOf(points: PaperPoint[]): Plane | null {
  const a = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const b = points[i], c = points[i + 1];
    const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
    const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
    const length = Math.hypot(x, y, z);
    if (length > EPS) return { x: x / length, y: y / length, z: z / length,
      d: (x * a.x + y * a.y + z * a.z) / length };
  }
  return null;
}

export function orderPaper(polygons: PaperPolygon[]): PaperPolygon[] {
  if (polygons.length < 2) return polygons;
  const pivot = polygons.find(p => planeOf(p.points));
  if (!pivot) return [];
  const plane = planeOf(pivot.points)!;
  const front: PaperPolygon[] = [], back: PaperPolygon[] = [], coplanar: PaperPolygon[] = [];
  for (const polygon of polygons) {
    const distances = polygon.points.map(p => plane.x * p.x + plane.y * p.y + plane.z * p.z - plane.d);
    const positive = distances.some(d => d > EPS), negative = distances.some(d => d < -EPS);
    if (!positive && !negative) { coplanar.push(polygon); continue; }
    if (!negative) { front.push(polygon); continue; }
    if (!positive) { back.push(polygon); continue; }
    const fp: PaperPoint[] = [], bp: PaperPoint[] = [];
    polygon.points.forEach((a, i) => {
      const j = (i + 1) % polygon.points.length, b = polygon.points[j];
      const da = distances[i], db = distances[j];
      if (da >= -EPS) fp.push(a);
      if (da <= EPS) bp.push(a);
      if ((da > EPS && db < -EPS) || (da < -EPS && db > EPS)) {
        const t = da / (da - db);
        const cut = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
        fp.push(cut); bp.push(cut);
      }
    });
    if (fp.length >= 3) front.push({ face: polygon.face, points: fp });
    if (bp.length >= 3) back.push({ face: polygon.face, points: bp });
  }
  return plane.z >= 0
    ? [...orderPaper(back), ...coplanar, ...orderPaper(front)]
    : [...orderPaper(front), ...coplanar, ...orderPaper(back)];
}
