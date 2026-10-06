import { computeFoldState } from '../engine/fold';
import { paperTriangles } from '../engine/mesh';
import type { FoldOp, OrigamiModel } from '../engine/types';

const EPS = 1e-9;

/** Real triangular paper panels for a future faceted approximation of the
 * curved beetle back. This changes the material topology, unlike the render
 * mesh's `triangles`. It adds no motion and establishes no pocket-opening
 * solution. Earlier folds carry every added point on its actual material edge.
 * Select the back in its folded position: some original outer-sheet material
 * also lies on the back after the blintz and extraction folds.
 */
export function refineBeetleBodyPanels(source: OrigamiModel) {
  if (source.triangles || source.vertexWelds || source.sheetStartSteps ||
      source.faceSheet?.some(sheet => sheet !== 0)) {
    throw new Error('Beetle body refinement requires an unrefined single sheet');
  }
  const model = structuredClone(source);
  const resting = computeFoldState(source, source.steps.length).positions;
  if (source.faces.flat().some(i => Math.abs(resting[i].z) > 5e-7)) {
    throw new Error('Prepare the beetle body panels while the paper is flat');
  }
  const selected = new Set(source.faces.flatMap((face, fi) =>
    face.every(i => resting[i].y >= -.5 - EPS && resting[i].y <= EPS) ? [fi] : []));
  if (!selected.size) throw new Error('No folded back panels were found');
  const bindings: NonNullable<FoldOp['surfacePoints']> = [];
  const edgePoints = new Map<string, number>();
  const firstNewVertex = model.vertices.length;

  function midpoint(a: number, b: number) {
    const key = [a, b].sort((x, y) => x - y).join(',');
    const existing = edgePoints.get(key);
    if (existing !== undefined) return existing;
    const point: [number, number] = [
      (model.vertices[a][0] + model.vertices[b][0]) / 2,
      (model.vertices[a][1] + model.vertices[b][1]) / 2,
    ];
    // Coincident MATERIAL coordinates identify one point. Folded overlap does
    // not join layers and must never be used to weld the paper here.
    let index = model.vertices.findIndex(v => Math.hypot(v[0] - point[0], v[1] - point[1]) < 1e-10);
    if (index < 0) {
      index = model.vertices.length;
      model.vertices.push(point);
      bindings.push([index, a, b, a, .5, .5, 0]);
    }
    edgePoints.set(key, index);
    return index;
  }

  const replacements = new Map<number, number[][]>();
  for (const [fi, a, b, c] of paperTriangles(source)) {
    if (!selected.has(fi)) continue;
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
    replacements.set(fi, [...(replacements.get(fi) ?? []),
      [a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]);
  }
  const inserted = [...new Set(edgePoints.values())];
  function edgeInterior(a: number, b: number) {
    const A = model.vertices[a], B = model.vertices[b];
    const dx = B[0] - A[0], dy = B[1] - A[1], length2 = dx * dx + dy * dy;
    if (length2 < EPS * EPS) return [];
    return inserted.flatMap(i => {
      if (i === a || i === b) return [];
      const q = model.vertices[i];
      const t = ((q[0] - A[0]) * dx + (q[1] - A[1]) * dy) / length2;
      return t > EPS && t < 1 - EPS &&
        Math.hypot(q[0] - A[0] - t * dx, q[1] - A[1] - t * dy) < EPS ? [{ i, t }] : [];
    }).sort((p, q) => p.t - q.t).map(p => p.i);
  }
  const expand = (face: number[]) => face.flatMap((a, j) =>
    [a, ...edgeInterior(a, face[(j + 1) % face.length])]);
  const faceSheet: number[] = [];
  model.faces = source.faces.flatMap((face, fi) => {
    const panels = replacements.get(fi) ?? [face];
    for (let i = 0; i < panels.length; i++) faceSheet.push(source.faceSheet?.[fi] ?? 0);
    return panels.map(expand);
  });
  if (source.faceSheet) model.faceSheet = faceSheet;
  for (const step of model.steps) for (const op of step.folds) {
    op.surfacePoints = [...(op.surfacePoints ?? []), ...bindings];
  }
  return { model, firstNewVertex, refinedFaceCount: selected.size };
}
