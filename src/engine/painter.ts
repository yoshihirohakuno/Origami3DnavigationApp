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
  // Localize BSP splitting for finely tessellated curved paper. Disjoint screen
  // tiles cannot occlude each other; interpolated cut points keep exact depths.
  if (polygons.length <= 128) return orderNode(polygons);
  const points = polygons.flatMap(p => p.points);
  const minX = Math.min(...points.map(p => p.x)), minY = Math.min(...points.map(p => p.y));
  const dx = (Math.max(...points.map(p => p.x)) - minX) / 8;
  const dy = (Math.max(...points.map(p => p.y)) - minY) / 8;
  if (dx < EPS || dy < EPS) return orderNode(polygons);
  const tiles: PaperPolygon[][] = Array.from({ length: 64 }, () => []);
  for (const polygon of polygons) {
    const xs = polygon.points.map(p => p.x), ys = polygon.points.map(p => p.y);
    const ix = Math.max(0, Math.floor((Math.min(...xs) - minX) / dx));
    const iy = Math.max(0, Math.floor((Math.min(...ys) - minY) / dy));
    const jx = Math.min(7, Math.floor((Math.max(...xs) - minX) / dx));
    const jy = Math.min(7, Math.floor((Math.max(...ys) - minY) / dy));
    for (let i = ix; i <= jx; i++) for (let j = iy; j <= jy; j++) {
      let clipped = polygon.points;
      for (const [axis, value, sign] of [['x', minX + i * dx, 1], ['x', minX + (i + 1) * dx, -1],
        ['y', minY + j * dy, 1], ['y', minY + (j + 1) * dy, -1]] as const) {
        clipped = clipped.flatMap((a, k, ps) => {
          const b = ps[(k + 1) % ps.length], da = (a[axis] - value) * sign, db = (b[axis] - value) * sign;
          const insideA = da >= 0, insideB = db >= 0;
          const out = insideA ? [a] : [];
          if (insideA !== insideB) {
            const t = da / (da - db);
            out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) });
          }
          return out;
        });
      }
      if (clipped.length >= 3) tiles[j * 8 + i].push({ face: polygon.face, points: clipped });
    }
  }
  return tiles.flatMap(orderNode);
}

function orderNode(polygons: PaperPolygon[]): PaperPolygon[] {
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
    ? [...orderNode(back), ...coplanar, ...orderNode(front)]
    : [...orderNode(front), ...coplanar, ...orderNode(back)];
}
