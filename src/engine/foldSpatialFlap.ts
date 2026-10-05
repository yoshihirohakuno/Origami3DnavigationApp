import { Vector3 } from 'three';
import { computeFoldState } from './fold';
import type { FoldOp, FoldStep, OrigamiModel } from './types';

/** Cut and rotate a connected, planar flap in its current 3D plane.
 * `towardTip` lies in that plane and is perpendicular to the crease.
 * Direction is a right-hand rotation about the ordered crease axis.
 * Coincident layers with different material IDs remain independent. */
export function foldSpatialFlap(
  model: OrigamiModel, seed: number, origin: Vector3, crease: Vector3,
  towardTip: Vector3, angle: number, direction: 1 | -1,
  caption: Pick<FoldStep, 'description' | 'caution'>,
): OrigamiModel {
  if (!Number.isInteger(seed) || seed < 0 || seed >= model.vertices.length ||
    ![...origin.toArray(), ...crease.toArray(), ...towardTip.toArray(), angle].every(Number.isFinite) ||
    crease.length() < 1e-8 || towardTip.length() < 1e-8 || angle <= 0 || angle > 180 ||
    (direction !== 1 && direction !== -1)) throw new Error(`${model.id}: invalid spatial crease`);
  const axisDirection = crease.clone().normalize(), across = towardTip.clone().normalize();
  if (Math.abs(axisDirection.dot(across)) > 1e-8) throw new Error(`${model.id}: crease frame must be perpendicular`);
  const normal = axisDirection.clone().cross(across);
  const p = computeFoldState(model, model.steps.length).positions;
  const side = (i: number) => p[i].clone().sub(origin).dot(across);
  if (side(seed) <= 1e-8) throw new Error(`${model.id}: seed must be on the moving side`);
  const reached = new Set([seed]), selected = new Set<number[]>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const face of model.faces) {
      if (selected.has(face) || !face.some(i => reached.has(i))) continue;
      selected.add(face);
      for (const i of face) if (side(i) > 1e-8) reached.add(i);
      changed = true;
    }
  }
  for (const face of selected) for (const i of face) {
    const distance = Math.abs(p[i].clone().sub(origin).dot(normal));
    if (distance > 5e-7) {
      throw new Error(`${model.id}: selected spatial flap is not planar (vertex ${i}, distance ${distance})`);
    }
  }
  const vertices = [...model.vertices], faces: number[][] = [], faceSheet: number[] = [];
  const moving = new Set<number>(), hinges = new Set<number>(), edgePoints = new Map<string, number>();
  const bindings: NonNullable<FoldOp['surfacePoints']> = [];
  function intersect(a: number, b: number) {
    if (Math.abs(side(a)) < 1e-9) { hinges.add(a); return a; }
    if (Math.abs(side(b)) < 1e-9) { hinges.add(b); return b; }
    const key = [a, b].sort((x, y) => x - y).join(',');
    if (edgePoints.has(key)) return edgePoints.get(key)!;
    const t = side(a) / (side(a) - side(b)), i = vertices.length;
    vertices.push([model.vertices[a][0] * (1-t) + model.vertices[b][0] * t,
      model.vertices[a][1] * (1-t) + model.vertices[b][1] * t]);
    p.push(p[a].clone().lerp(p[b], t));
    bindings.push([i, a, b, a, 1-t, t, 0]);
    edgePoints.set(key, i); hinges.add(i); return i;
  }
  model.faces.forEach((face, fi) => {
    const add = (f: number[]) => { if (f.length >= 3) { faces.push(f); faceSheet.push(model.faceSheet?.[fi] ?? 0); } };
    if (!selected.has(face)) { add(face); return; }
    for (const i of face) {
      if (Math.abs(side(i)) < 1e-9) hinges.add(i);
      else if (side(i) > 1e-9) moving.add(i);
    }
    for (const sign of [1, -1]) {
      const polygon: number[] = [];
      face.forEach((a, j) => {
        const b = face[(j+1) % face.length], sa = side(a)*sign, sb = side(b)*sign;
        if (sa >= -1e-9) polygon.push(a);
        if ((sa > 1e-9 && sb < -1e-9) || (sa < -1e-9 && sb > 1e-9)) polygon.push(intersect(a, b));
      });
      add([...new Set(polygon)]);
    }
  });
  const ordered = [...hinges].sort((a, b) => p[a].dot(axisDirection) - p[b].dot(axisDirection));
  const axis: [number, number] = [ordered[0], ordered.at(-1)!];
  if (ordered.length < 2 || p[axis[0]].distanceTo(p[axis[1]]) < 1e-8) throw new Error(`${model.id}: spatial crease misses flap`);
  return { ...model, vertices, faces, ...(model.faceSheet ? { faceSheet } : {}), steps: [
    ...model.steps.map(s => ({ ...s, folds: s.folds.map(op => ({ ...op,
      surfacePoints: [...(op.surfacePoints ?? []), ...bindings] })) })),
    { ...caption, folds: [{ axis, moving: [...moving], angle, direction, type: 'inside-reverse' }] },
  ] };
}
