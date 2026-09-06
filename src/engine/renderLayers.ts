import { Vector3 } from 'three';
import { computeFoldState, easeInOut, type FoldState } from './fold';
import type { OrigamiModel } from './types';

const cache = new WeakMap<OrigamiModel, number[][]>();

function normals(model: OrigamiModel, positions: Vector3[]): Vector3[] {
  return model.faces.map(face => {
    const origin = positions[face[0]], normal = new Vector3();
    for (let i = 1; i < face.length - 1; i++) {
      normal.crossVectors(positions[face[i]].clone().sub(origin), positions[face[i + 1]].clone().sub(origin));
      if (normal.lengthSq() > 1e-16) return normal.normalize();
    }
    return normal;
  });
}

/** Tiny display offsets for zero-thickness, connected paper. Determine the
 * order as panels approach a flat pose, retaining the preceding order for a
 * rigid stack. This never modifies the physical vertices or fold constraints. */
export function renderFaceOffsets(model: OrigamiModel, state: FoldState): Vector3[] {
  const thickness = model.renderLayerSeparation;
  if (!thickness || !model.steps.length) return model.faces.map(() => new Vector3());
  let layers = cache.get(model);
  if (!layers) {
    layers = [model.faces.map(() => 0)];
    for (let step = 0; step < model.steps.length; step++) {
      const end = computeFoldState(model, step + 1).positions;
      const before = computeFoldState(model, step).positions;
      const normal = normals(model, end);
      const previous = layers[step];
      if (!normal.every(n => Math.abs(n.z) > 1 - 1e-8)) {
        layers.push([...previous]);
        continue;
      }
      const near = computeFoldState(model, step + .99).positions;
      // Turning the entire sheet over transports the existing layer offsets;
      // its approach height depends on x/y and must not reorder the stack.
      const rigid = before.every((a, i) => before.every((b, j) =>
        Math.abs(a.distanceToSquared(b) - near[i].distanceToSquared(near[j])) < 1e-10));
      if (rigid) { layers.push([...previous]); continue; }
      const nearNormals = normals(model, near);
      const depth = model.faces.map((face, fi) => face.reduce((sum, vi) => sum + near[vi].z - end[vi].z, 0) / face.length
        + nearNormals[fi].z * previous[fi] * 1e-6);
      const order = model.faces.map((_, fi) => fi).sort((a, b) => depth[a] - depth[b] || a - b);
      const next = [...previous];
      order.forEach((fi, rank) => { next[fi] = (rank - (order.length - 1) / 2) * thickness * Math.sign(normal[fi].z); });
      layers.push(next);
    }
    cache.set(model, layers);
  }
  const from = layers[state.stepIndex], to = layers[state.stepIndex + 1];
  const progress = easeInOut(state.fraction);
  return normals(model, state.positions).map((normal, fi) => normal.multiplyScalar(from[fi] + (to[fi] - from[fi]) * progress));
}
