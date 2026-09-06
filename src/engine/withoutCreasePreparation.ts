import { computeFoldState, isGuideFold } from './fold';
import type { FoldStep, OrigamiModel } from './types';

/** Omit only a fold/unfold pair that returns every vertex to its starting point.
 * Apply after layer compilation: thickness adjustments must cancel as well.
 * Necessary openings, reverse folds and pocket operations remain in the route.
 */
export function withoutCreasePreparation(model: OrigamiModel): OrigamiModel {
  const steps: FoldStep[] = [];
  for (let i = 0; i < model.steps.length; i++) {
    const fold = model.steps[i].folds.filter(isGuideFold);
    const unfold = model.steps[i + 1]?.folds.filter(isGuideFold);
    if (fold.length && fold.every(op => op.type === 'valley' || op.type === 'mountain') &&
      unfold?.length && unfold.every(op => op.type === 'unfold')) {
      const before = computeFoldState(model, i).positions;
      const after = computeFoldState(model, i + 2).positions;
      if (before.every((p, vi) => p.distanceTo(after[vi]) < 1e-8)) {
        i++;
        continue;
      }
    }
    steps.push(model.steps[i]);
  }
  return steps.length === model.steps.length ? model : { ...model, steps };
}
