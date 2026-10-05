import { Vector3 } from 'three';
import { computeFoldState, easeInOut, type FoldState } from './fold';
import type { OrigamiModel } from './types';

const cache = new WeakMap<OrigamiModel, number[][]>();

/** Material neighbors, including subdivisions that create a T junction.
 * Spatial overlap alone never joins different pieces of paper. */
function materialNeighbors(model: OrigamiModel): [number, number][] {
  const edges = model.faces.flatMap((face, fi) => face.map((a, i) => ({
    fi, a: model.vertices[a], b: model.vertices[face[(i + 1) % face.length]],
  })));
  const pairs = new Set<string>();
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const a = edges[i], b = edges[j];
    if (a.fi === b.fi || (model.faceSheet?.[a.fi] ?? 0) !== (model.faceSheet?.[b.fi] ?? 0)) continue;
    const dx = a.b[0] - a.a[0], dy = a.b[1] - a.a[1], length = Math.hypot(dx, dy);
    if (length < 1e-10) continue;
    const distance = (p: number[]) => Math.abs(dx * (p[1] - a.a[1]) - dy * (p[0] - a.a[0])) / length;
    if (distance(b.a) > 1e-9 || distance(b.b) > 1e-9) continue;
    const project = (p: number[]) => ((p[0] - a.a[0]) * dx + (p[1] - a.a[1]) * dy) / length;
    const t = [project(b.a), project(b.b)];
    if (Math.min(length, Math.max(...t)) - Math.max(0, Math.min(...t)) <= 1e-9) continue;
    pairs.add([a.fi, b.fi].sort((x, y) => x - y).join(','));
  }
  return [...pairs].map(pair => pair.split(',').map(Number) as [number, number]);
}

/** Area weighting makes the display order independent of triangulation. */
function faceDepths(model: OrigamiModel, positions: Vector3[]): { area: number; depth: number }[] {
  return model.faces.map(face => {
    let area = 0, moment = 0;
    const a = model.vertices[face[0]];
    for (let i = 1; i < face.length - 1; i++) {
      const b = model.vertices[face[i]], c = model.vertices[face[i + 1]];
      const weight = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
      area += weight;
      moment += weight * (positions[face[0]].z + positions[face[i]].z + positions[face[i + 1]].z) / 3;
    }
    return { area, depth: area ? moment / area : positions[face[0]].z };
  });
}

function coherentOffsets(model: OrigamiModel, neighbors: [number, number][], end: Vector3[], near: Vector3[],
  normal: Vector3[], nearNormals: Vector3[], previous: number[], thickness: number): number[] {
  const ends = faceDepths(model, end), approaches = faceDepths(model, near);
  const tolerance = model.renderLayerDepthTolerance ?? 1e-8;
  const parent = model.faces.map((_, i) => i);
  const root = (i: number): number => parent[i] === i ? i : (parent[i] = root(parent[i]));
  for (const [a, b] of neighbors) {
    if (normal[a].dot(normal[b]) > 1 - 1e-8 && Math.abs(ends[a].depth - ends[b].depth) <= tolerance) parent[root(b)] = root(a);
  }
  const groups = new Map<number, number[]>();
  model.faces.forEach((_, fi) => { const r = root(fi); groups.set(r, [...(groups.get(r) ?? []), fi]); });
  const separated = Math.max(...ends.map(f => f.depth)) - Math.min(...ends.map(f => f.depth)) > tolerance;
  const panels = [...groups.values()].map(ids => {
    const area = ids.reduce((sum, fi) => sum + ends[fi].area, 0);
    const depth = ids.reduce((sum, fi) => sum + ends[fi].area * (separated ? ends[fi].depth
      : approaches[fi].depth - ends[fi].depth + nearNormals[fi].z * previous[fi] * 1e-6), 0) / (area || 1);
    return { ids, depth };
  }).sort((a, b) => a.depth - b.depth || a.ids[0] - b.ids[0]);
  const next = [...previous];
  panels.forEach((panel, rank) => panel.ids.forEach(fi => {
    next[fi] = (rank - (panels.length - 1) / 2) * thickness * Math.sign(normal[fi].z);
  }));
  return next;
}

/** Each sheet is folded on the workbench independently of already assembled,
 * non-planar sheets. A global coplanarity check would freeze all later stacks. */
function modularLayers(model: OrigamiModel, thickness: number): number[][] {
  const layers = [model.faces.map(() => 0)];
  for (let step = 0; step < model.steps.length; step++) {
    const next = [...layers[step]];
    const sheet = model.sheetStartSteps!.findLastIndex(start => start <= step);
    const ids = model.faces.flatMap((_, fi) => model.faceSheet?.[fi] === sheet ? [fi] : []);
    if (model.steps[step].folds.some(op => op.type !== 'assemble')) {
      const positions = computeFoldState(model, step + 1).positions;
      const normal = normals(model, positions);
      if (ids.every(fi => Math.abs(normal[fi].z) > 1 - 1e-8)) {
        const depth = (fi: number) => model.faces[fi].reduce((sum, vi) => sum + positions[vi].z, 0) / model.faces[fi].length;
        ids.sort((a,b) => depth(a) - depth(b) || a - b);
        ids.forEach((fi, rank) => { next[fi] = (rank - (ids.length - 1) / 2) * thickness * Math.sign(normal[fi].z); });
      }
    }
    layers.push(next);
  }
  return layers;
}

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
  if (!layers && model.sheetStartSteps) {
    layers = modularLayers(model, thickness);
    cache.set(model, layers);
  }
  if (!layers) {
    const neighbors = model.renderCoherentPanels ? materialNeighbors(model) : undefined;
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
      if (neighbors) {
        layers.push(coherentOffsets(model, neighbors, end, near, normal, nearNormals, previous, thickness));
        continue;
      }
      const endDepth = model.faces.map(face => face.reduce((sum, vi) => sum + end[vi].z, 0) / face.length);
      // Compiled flat folds already have a real stack order. Expand that order
      // for depth-buffer precision; an approach-based order would invert tucks.
      // Exactly coplanar connected mechanisms still need the approach heuristic.
      const separated = Math.max(...endDepth) - Math.min(...endDepth) > (model.renderLayerDepthTolerance ?? 1e-8);
      const depth = separated ? endDepth : model.faces.map((face, fi) => face.reduce((sum, vi) => sum + near[vi].z - end[vi].z, 0) / face.length
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
  return normals(model, state.positions).map((normal, fi) => {
    const sheet = model.faceSheet?.[fi] ?? 0;
    const placed = model.sheetStartSteps?.[sheet + 1] ?? model.steps.length;
    const insertion = easeInOut(Math.max(0, Math.min(1, state.stepIndex + state.fraction - placed + 1)));
    const inset = (model.assemblyFaceInsets?.[fi] ?? 0) * insertion;
    return normal.multiplyScalar(from[fi] + (to[fi] - from[fi]) * progress + inset);
  });
}
