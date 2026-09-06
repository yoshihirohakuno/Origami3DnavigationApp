import { computeFoldState } from './fold';
import type { FoldOp, OrigamiModel } from './types';

/**
 * Explicit paper stacks for models whose folds close flat. Original vertices
 * remain ideal crease references; each rendered panel owns its thickness.
 * Groups run from the back to the front. Undefined steps are spatial folds.
 * This fixes layer order, not the kinematics of a squash-fold linkage.
 */
export function withPanelLayers(source: OrigamiModel, stacks: (number[][] | undefined)[]): OrigamiModel {
  if (stacks.length !== source.steps.length) throw new Error(`${source.id}: one stack entry is required per step`);
  for (const stack of stacks) if (stack) {
    const ids = stack.flat();
    if (ids.length !== source.faces.length || new Set(ids).size !== ids.length ||
      ids.some(fi => !Number.isInteger(fi) || !source.faces[fi])) throw new Error(`${source.id}: invalid panel stack`);
  }
  const model: OrigamiModel = { ...source, vertices: source.vertices.map(p => [...p]), faces: [], steps: [] };
  model.faces = source.faces.map(face => face.map(vi => {
    model.vertices.push([...source.vertices[vi]]);
    return model.vertices.length - 1;
  }));
  source.steps.forEach((step, si) => {
    const compiled = { ...step, folds: [] as FoldOp[] };
    model.steps.push(compiled);
    for (const raw of step.folds) {
      // Replace the previous large, ad-hoc depth displacements with paper stacks.
      if (raw.type === 'assemble' && raw.angle === 0 && !raw.spinZ && raw.translate?.[0] === 0 && raw.translate[1] === 0) continue;
      const op = { ...raw, moving: [...raw.moving] };
      if (stacks[si] && op.type !== 'assemble') op.angle = 180;
      const p = computeFoldState(model, model.steps.length).positions;
      const origin = p[op.axis[0]], axis = p[op.axis[1]].clone().sub(origin).normalize();
      const moving = new Set(op.moving);
      source.faces.forEach((face, fi) => {
        const offAxis = face.filter(vi => p[vi].clone().sub(origin).cross(axis).length() > 1e-7);
        const whole = offAxis.length > 0 && offAxis.every(vi => moving.has(vi));
        face.forEach((vi, j) => {
          if (whole || moving.has(vi)) op.moving.push(model.faces[fi][j]);
        });
      });
      compiled.folds.push(op);
    }
    const stack = stacks[si];
    if (!stack) return;
    const p = computeFoldState(model, model.steps.length).positions;
    stack.forEach((group, layer) => group.forEach(fi => {
      for (const vi of model.faces[fi]) {
        const dz = layer * 0.001 - p[vi].z;
        if (Math.abs(dz) < 1e-10) continue;
        compiled.folds.push({ axis: [0, 1], moving: [vi], type: 'assemble', angle: 0,
          direction: 1, translate: [0, 0, dz], guide: false });
      }
    }));
  });
  return model;
}
