import type { FoldOp, OrigamiModel } from './types';

/** Transfer a coarse base route to the same sheet with finer crease intersections.
 * The extra points stay on the triangular panels during pocket motions, including
 * the existing squash approximation. Later folds use these actual positions. */
export function carrySurfacePoints(model: OrigamiModel, base: OrigamiModel, count: number): OrigamiModel {
  const surfacePoints: NonNullable<FoldOp['surfacePoints']> = [];
  model.vertices.forEach(([x, y], vi) => {
    if (vi < base.vertices.length) return;
    for (const [a, b, c] of base.faces) {
      const [ax, ay] = base.vertices[a], [bx, by] = base.vertices[b], [cx, cy] = base.vertices[c];
      const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den;
      const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den;
      const w = 1 - u - v;
      if (Math.min(u, v, w) < -1e-8) continue;
      surfacePoints.push([vi, a, b, c, u, v, w]);
      return;
    }
    throw new Error(`${model.id}: vertex ${vi} lies outside the base panels`);
  });
  return { ...model, steps: model.steps.map((step, i) => i >= count ? step : {
    ...step, folds: step.folds.map(op => ({ ...op, surfacePoints })),
  }) };
}
