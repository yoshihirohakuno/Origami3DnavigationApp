import { computeFoldState, type FoldState } from './fold';
import type { OrigamiModel } from './types';

/** Selecting a route item plays that action through to its completed pose. */
export function stepPlayback(index: number, total: number): { start: number; target: number } {
  const start = Math.max(0, Math.min(index, total - 1));
  return { start, target: Math.min(start + 1, total) };
}

/** The geometry engine previews the NEXT fold at integer times. Navigation
 * instead keeps the just-completed action selected, with no next-fold guides. */
export function computeNavigationState(model: OrigamiModel, time: number): FoldState {
  const t = Math.max(0, Math.min(Number.isNaN(time) ? 0 : time, model.steps.length));
  const state = computeFoldState(model, t);
  if (t === 0 || !Number.isInteger(t)) return state;
  return { ...state, stepIndex: t - 1, fraction: 1, guides: [], movingFaces: new Set() };
}
