import { ShapeUtils, Vector2 } from 'three';
import type { OrigamiModel } from './types';

export type PaperTriangle = [face: number, a: number, b: number, c: number];
const cache = new WeakMap<OrigamiModel, PaperTriangle[]>();

/** Share the same triangulation between WebGL, SVG and geometry audits. */
export function paperTriangles(model: OrigamiModel): PaperTriangle[] {
  const cached = cache.get(model);
  if (cached) return cached;
  const triangles: PaperTriangle[] = [];
  model.faces.forEach((face, fi) => {
    const contour = face.map(vi => new Vector2(...model.vertices[vi]));
    const area = ShapeUtils.area(contour);
    const fan = face.slice(1, -1).map((_, i): PaperTriangle => [fi, face[0], face[i + 1], face[i + 2]]);
    const convexFan = fan.every(([, a, b, c]) => {
      const p = model.vertices[a], q = model.vertices[b], r = model.vertices[c];
      return ((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) * area >= -1e-10;
    });
    if (convexFan) triangles.push(...fan);
    else for (const [a, b, c] of ShapeUtils.triangulateShape(contour, [])) {
      triangles.push(area >= 0 ? [fi, face[a], face[b], face[c]] : [fi, face[c], face[b], face[a]]);
    }
  });
  cache.set(model, triangles);
  return triangles;
}
