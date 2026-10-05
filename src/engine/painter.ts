/** Orthographic painter ordering. Split intersecting faces before sorting them. */
export interface PaperPoint { x: number; y: number; z: number }
export interface PaperPolygon { face: number; points: PaperPoint[] }
interface Plane { x: number; y: number; z: number; d: number }
const EPS = 1e-8;

/** Prune fully covered panels before BSP subdivision. Modular sheets contain
 * many stacked triangles; splitting their invisible layers can otherwise
 * produce tens of thousands of SVG fragments. Only whole coverage qualifies. */
export function removeHiddenLayers(polygons: PaperPolygon[], tolerance = 1e-8): PaperPolygon[] {
  const items = polygons.map(p => {
    const plane = planeOf(p.points);
    const xs = p.points.map(q => q.x), ys = p.points.map(q => q.y);
    const area = p.points.reduce((s,a,i) => { const b=p.points[(i+1)%p.points.length]; return s+a.x*b.y-a.y*b.x; },0);
    return { p, plane, sign: Math.sign(area), minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys) };
  });
  return items.filter((item,i) => !items.some((cover,j) => {
    if(i===j || !cover.plane || Math.abs(cover.plane.z)<1e-8 || !cover.sign) return false;
    if(item.minX<cover.minX-tolerance || item.maxX>cover.maxX+tolerance || item.minY<cover.minY-tolerance || item.maxY>cover.maxY+tolerance)return false;
    let inFront=false;
    for(const point of item.p.points){
      for(let k=0;k<cover.p.points.length;k++){
        const a=cover.p.points[k],b=cover.p.points[(k+1)%cover.p.points.length];
        if(cover.sign*((b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x))< -tolerance*Math.hypot(b.x-a.x,b.y-a.y))return false;
      }
      const depth=(cover.plane.d-cover.plane.x*point.x-cover.plane.y*point.y)/cover.plane.z-point.z;
      if(depth< -1e-8)return false;
      if(depth>1e-8)inFront=true;
    }
    return inFront || j>i;
  })).map(item=>item.p);
}

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
  // A panel may be only partially covered globally but completely hidden in
  // an individual tile. Pruning here prevents invisible stacked layers from
  // generating thousands of BSP fragments inside finely folded bases.
  return tiles.flatMap(tile => orderNode(removeHiddenLayers(tile)));
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
