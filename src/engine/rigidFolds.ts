import { computeFoldState, foldSign } from './fold';
import type { FoldOp, OrigamiModel } from './types';

/** Compile simple flat folds into rigid panels with a consistent paper stack. */
type Pocket = number | { face: number; at: [number, number]; angle: number };
const THICKNESS = 0.00001;
export function withRigidFolds(source: OrigamiModel, tuckUnder: Record<number, Pocket> = {}, thickness = THICKNESS): OrigamiModel {
  if (!Number.isFinite(thickness) || thickness <= 0) throw new Error(`${source.id}: invalid display layer thickness`);
  const model: OrigamiModel = { ...source, vertices: source.vertices.map(p => [...p]), faces: [], steps: [] };
  model.faces = source.faces.map(face => face.map(vi => {
    model.vertices.push([...source.vertices[vi]]);
    return model.vertices.length - 1;
  }));
  for (const step of source.steps) {
    const compiled = { ...step, folds: [] as FoldOp[] };
    if (step.folds.every(op => op.type === 'unfold')) {
      const previous = model.steps.at(-1)!;
      compiled.folds = [...previous.folds].reverse().map(op => op.translate
        ? { ...op, translate: op.translate.map(n => -n) as [number, number, number] }
        : { ...op, type: 'unfold', direction: -op.direction! as 1 | -1 });
      model.steps.push(compiled);
      continue;
    }
    model.steps.push(compiled);
    const ops = step.folds.filter(op => !(op.type === 'assemble' && op.angle === 0 && !op.spinZ &&
      op.translate?.[0] === 0 && op.translate[1] === 0)).map(op => ({ ...op, moving: [...op.moving] }));
    for (let oi = 0; oi < ops.length; oi++) {
      const raw = ops[oi];
      const p = computeFoldState(model, model.steps.length).positions;
      const origin = p[raw.axis[0]], axis = p[raw.axis[1]].clone().sub(origin).normalize();
      // A few measured models store crease intersections to four decimals.
      const onAxis = (vi: number) => p[vi].clone().sub(origin).cross(axis).length() < 0.0002;
      // Older data expresses the two layers of one fold as separate rotations.
      // Combine them when their crease is the same and their moving points differ.
      if (raw.type !== 'assemble') for (let j = oi + 1; j < ops.length; j++) {
        const other = ops[j];
        if (other.type === raw.type && other.axis.every(onAxis) &&
          // Collinear creases on opposite corners are independent actions.
          // Merge only layers that actually overlap away from the hinge.
          other.moving.some(vi => !onAxis(vi) && raw.moving.some(vj => p[vi].distanceTo(p[vj]) < 0.0002)) &&
          !other.moving.some(vi => raw.moving.includes(vi) && !onAxis(vi))) {
          raw.moving = [...new Set([...raw.moving, ...other.moving])];
          ops.splice(j--, 1);
        }
      }
      const moving = new Set(raw.moving), panels: number[] = [];
      source.faces.forEach((face, fi) => {
        const off = face.filter(vi => !onAxis(vi));
        const some = off.some(vi => moving.has(vi));
        if (some && !off.every(vi => moving.has(vi))) {
          throw new Error(`${source.id}: fold crosses panel ${fi}, step ${model.steps.length}, op ${oi}`);
        }
        if (some || (raw.translate && face.every(vi => moving.has(vi)))) panels.push(fi);
      });
      const vertices = panels.flatMap(fi => model.faces[fi]);
      if (!vertices.length) throw new Error(`${source.id}: fold moves no paper at step ${model.steps.length}`);
      const op: FoldOp = { ...raw, moving: [...new Set([...raw.moving, ...vertices])],
        direction: foldSign(raw, p) as 1 | -1, angle: raw.type === 'assemble' ? raw.angle : 180 };
      compiled.folds.push(op);
      if (raw.type === 'assemble') continue;
      const heights = model.faces.flat().map(vi => p[vi].z);
      const towardFront = raw.type === 'valley' ||
        ((raw.type === 'inside-reverse' || raw.type === 'outside-reverse') && raw.sweep !== 'back');
      const hinge = towardFront ? Math.max(...heights) + thickness : Math.min(...heights) - thickness;
      const pocket = tuckUnder[model.steps.length];
      let shift = pocket === undefined ? 2 * (hinge - origin.z)
        : Math.min(...model.faces[typeof pocket === 'number' ? pocket : pocket.face].map(vi => p[vi].z)) - thickness
          - (2 * origin.z - Math.min(...vertices.map(vi => p[vi].z)));
      if (typeof pocket === 'object') {
        // Insertion crosses the pocket lip: the top of the flap lies above the
        // side folds while its tip goes below the front band. A small rigid tilt
        // approximates that bend without stretching the panel or swapping colors.
        compiled.folds.pop();
        compiled.folds.push({ ...op, moving: raw.moving, guide: false },
          { ...op, moving: vertices, angle: pocket.angle });
        const closed = computeFoldState(model, model.steps.length).positions;
        const top = panels.reduce((best, fi) => p[model.faces[fi][0]].z < p[model.faces[best][0]].z ? fi : best);
        const points = model.faces[top].map(vi => closed[vi]);
        const normal = points[0].clone().set(0, 0, 0);
        for (let j = 1; j < points.length - 1; j++) {
          normal.add(points[j].clone().sub(points[0]).cross(points[j + 1].clone().sub(points[0])));
        }
        if (Math.abs(normal.z) < 1e-9) throw new Error(`${source.id}: pocket flap has no projected area`);
        const [x, y] = pocket.at;
        const z = points[0].z - (normal.x * (x - points[0].x) + normal.y * (y - points[0].y)) / normal.z;
        shift = p[model.faces[pocket.face][0]].z - thickness - z;
      }
      compiled.folds.push({ axis: raw.axis, moving: vertices, type: 'assemble', angle: 0,
        direction: 1, translate: [0, 0, shift], guide: false });
    }
  }
  return model;
}
