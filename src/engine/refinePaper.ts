import type { FoldOp, OrigamiModel } from './types';
import { paperTriangles } from './mesh';
import { computeFoldState } from './fold';

type Point = [number, number];
const key = (p: Point) => p.map(x => Math.round(x * 1e9)).join(',');
const cross = (a: Point, b: Point, p: Point) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

/** Refine a flat stack on one common grid so bent overlapping layers cannot cross
 * because of different tessellations. Keep face IDs and real crease outlines.
 * Weld equal material coordinates, never merely overlapping folded positions.
 */
export function refinePaper(source: OrigamiModel, step: number, divisions: number) {
  const folded = computeFoldState(source, step).positions;
  const xy = folded.map(p => [p.x, p.y] as Point);
  const used = source.faces.flat();
  const minX = Math.min(...used.map(i => xy[i][0])), minY = Math.min(...used.map(i => xy[i][1]));
  const dx = (Math.max(...used.map(i => xy[i][0])) - minX) / divisions;
  const dy = (Math.max(...used.map(i => xy[i][1])) - minY) / divisions;
  const gridPoint = (i: number, j: number): Point => [minX + dx * i, minY + dy * j];
  function sample(p: Point, transform: (p: Point) => number[]): number[] {
    const u = Math.max(0, Math.min(divisions - 1e-10, (p[0] - minX) / dx));
    const v = Math.max(0, Math.min(divisions - 1e-10, (p[1] - minY) / dy));
    const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
    const points = a + b <= 1 ? [gridPoint(i, j), gridPoint(i + 1, j), gridPoint(i, j + 1)]
      : [gridPoint(i + 1, j + 1), gridPoint(i, j + 1), gridPoint(i + 1, j)];
    const weights = a + b <= 1 ? [1 - a - b, a, b] : [a + b - 1, 1 - a, 1 - b];
    const values = points.map(transform);
    return values[0].map((_, k) => values.reduce((sum, value, n) => sum + value[k] * weights[n], 0));
  }
  const vertices = source.vertices.map(p => [...p] as Point);
  const bindings: { vi: number; parents: number[]; weights: number[] }[] = [];
  const maps = source.faces.map(face => new Map(face.map(vi => [key(xy[vi]), vi])));
  const baseTriangles = paperTriangles(source);
  function point(fi: number, p: Point): number {
    const found = maps[fi].get(key(p));
    if (found !== undefined) return found;
    for (const [face, a, b, c] of baseTriangles) {
      if (face !== fi) continue;
      const area = cross(xy[a], xy[b], xy[c]);
      const weights = [cross(xy[b], xy[c], p), cross(xy[c], xy[a], p), cross(xy[a], xy[b], p)].map(n => n / area);
      if (Math.min(...weights) < -1e-7) continue;
      const parents = [a, b, c], vi = vertices.length;
      vertices.push([0, 1].map(k => parents.reduce((s, v, n) => s + source.vertices[v][k] * weights[n], 0)) as Point);
      xy.push(p); maps[fi].set(key(p), vi); bindings.push({ vi, parents, weights });
      return vi;
    }
    throw new Error(`${source.id}: refined point is outside panel ${fi}`);
  }
  const triangles: NonNullable<OrigamiModel['triangles']> = [];
  source.faces.forEach((face, fi) => {
    const orientation = Math.sign(face.reduce((sum, vi, j) => sum + cross([0, 0], xy[vi], xy[face[(j + 1) % face.length]]), 0));
    for (let i = 0; i < divisions; i++) for (let j = 0; j < divisions; j++) {
      for (const cell of [[gridPoint(i, j), gridPoint(i + 1, j), gridPoint(i, j + 1)],
        [gridPoint(i + 1, j + 1), gridPoint(i, j + 1), gridPoint(i + 1, j)]]) {
        let polygon = cell;
        face.forEach((vi, n) => {
          const a = xy[vi], b = xy[face[(n + 1) % face.length]];
          polygon = polygon.flatMap((p, k, ps) => {
            const q = ps[(k + 1) % ps.length], d = orientation * cross(a, b, p), e = orientation * cross(a, b, q);
            const insideP = d >= -1e-10, insideQ = e >= -1e-10;
            const out = insideP ? [p] : [];
            if (insideP !== insideQ) {
              const t = d / (d - e);
              out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
            }
            return out;
          });
        });
        for (let n = 1; n < polygon.length - 1; n++) {
          if (Math.abs(cross(polygon[0], polygon[n], polygon[n + 1])) < 1e-10) continue;
          const ids = [polygon[0], polygon[n], polygon[n + 1]].map(p => point(fi, p));
          triangles.push(orientation > 0 ? [fi, ids[0], ids[1], ids[2]] : [fi, ids[0], ids[2], ids[1]]);
        }
      }
    }
  });
  const faces = source.faces.map((face, fi) => face.flatMap((vi, n) => {
    const a = xy[vi], b = xy[face[(n + 1) % face.length]];
    const length2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
    return [...maps[fi].values()].map(v => ({ vi: v, t: ((xy[v][0] - a[0]) * (b[0] - a[0]) + (xy[v][1] - a[1]) * (b[1] - a[1])) / length2 }))
      .filter(p => Math.abs(cross(a, b, xy[p.vi])) < 1e-8 && p.t >= -1e-8 && p.t < 1 - 1e-8)
      .sort((p, q) => p.t - q.t).map(p => p.vi);
  }));
  const material = new Map<string, number[]>();
  for (const vi of new Set(triangles.flatMap(([, a, b, c]) => [a, b, c]))) {
    const k = key(vertices[vi]); material.set(k, [...(material.get(k) ?? []), vi]);
  }
  const vertexWelds = [...material.values()].filter(ids => ids.length > 1);
  const welded = new Set(vertexWelds.flat());
  // A triangle bounded entirely by creases still has its own layer inside.
  // One interior sample prevents a welded corner from flattening onto another layer.
  const surface = triangles.flatMap(([fi, a, b, c]): typeof triangles => {
    if (![a, b, c].every(v => welded.has(v))) return [[fi, a, b, c]];
    const mid = point(fi, [(xy[a][0] + xy[b][0] + xy[c][0]) / 3, (xy[a][1] + xy[b][1] + xy[c][1]) / 3]);
    return [[fi, a, b, mid], [fi, b, c, mid], [fi, c, a, mid]];
  });
  const steps = source.steps.map(s => ({ ...s, folds: s.folds.flatMap(op => {
    const moving = new Set(op.moving);
    const whole = bindings.filter(b => b.parents.every((p, i) => b.weights[i] < 1e-8 || moving.has(p)));
    if (!op.translate) return [{ ...op, moving: [...op.moving, ...whole.map(b => b.vi)] }];
    const groups = new Map<number, number[]>();
    for (const b of bindings) {
      const weight = b.parents.reduce((sum, p, i) => sum + (moving.has(p) ? b.weights[i] : 0), 0);
      if (weight < 1e-10) continue;
      const k = Math.round(weight * 1e9) / 1e9;
      groups.set(k, [...(groups.get(k) ?? []), b.vi]);
    }
    return [op, ...[...groups].map(([weight, ids]): FoldOp => ({ ...op, moving: ids,
      translate: op.translate!.map(x => x * weight) as [number, number, number] }))];
  }) }));
  const model: OrigamiModel = { ...source, vertices, faces, steps, triangles: surface, vertexWelds };
  return { model, sample };
}
