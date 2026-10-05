import { computeFoldState } from './fold';
import { foldFlap } from './foldFlap';
import type { FoldStep, OrigamiModel } from './types';

/** Fold one connected material flap, including faces beyond the seed vertex.
 * Traversal stops at the crease, rather than including coincident paper layers.
 * This is opt-in: selecting a tip is not sufficient to identify every existing
 * model's intended layer. The selected material must be flat in the XY plane. */
export function foldConnectedFlap(
  model: OrigamiModel,
  seed: number | readonly number[],
  origin: [number, number],
  degrees: number,
  caption: Pick<FoldStep, 'description' | 'caution'>,
  sweep: 'front' | 'back' = 'front',
  angle = 180,
): OrigamiModel {
  if (![...origin, degrees, angle].every(Number.isFinite) || angle <= 0 || angle > 180) {
    throw new Error(`${model.id}: invalid flap crease or angle`);
  }
  const seeds = typeof seed === 'number' ? [seed] : [...seed];
  if (!seeds.length || seeds.some(i => !Number.isInteger(i) || i < 0 || i >= model.vertices.length)) {
    throw new Error(`${model.id}: invalid flap seeds`);
  }
  const p = computeFoldState(model, model.steps.length).positions;
  const radians = degrees * Math.PI / 180;
  const signed = (i: number) => Math.cos(radians) * (p[i].y - origin[1])
    - Math.sin(radians) * (p[i].x - origin[0]);
  const sign = Math.sign(signed(seeds[0])) as 1 | -1;
  if (!sign || seeds.some(i => signed(i) * sign <= 1e-8)) {
    throw new Error(`${model.id}: flap seeds must lie on the same side of the crease`);
  }
  const moving = new Set(seeds);
  const selected = new Set<number[]>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const face of model.faces) {
      if (selected.has(face) || !face.some(i => moving.has(i))) continue;
      selected.add(face);
      for (const i of face) if (signed(i) * sign > 1e-8) moving.add(i);
      changed = true;
    }
  }
  const depths = [...new Set([...selected].flat())].map(i => p[i].z);
  if (Math.max(...depths) - Math.min(...depths) > 5e-7) {
    throw new Error(`${model.id}: selected flap is not flat in the XY plane`);
  }
  const folded = foldFlap(model, seeds[0], origin, degrees, caption, sweep,
    false, sign, face => selected.has(face));
  folded.steps.at(-1)!.folds[0].angle = angle;
  return folded;
}
