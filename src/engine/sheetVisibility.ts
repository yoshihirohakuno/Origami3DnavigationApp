import type { FoldState } from './fold';
import type { OrigamiModel } from './types';

/** Visibility is presentation only: never remove material from the fold state. */
export function faceIsVisible(model: OrigamiModel, face: number, state: Pick<FoldState, 'stepIndex' | 'fraction'>): boolean {
  const sheet = model.faceSheet?.[face] ?? 0;
  return (model.sheetStartSteps?.[sheet] ?? 0) <= Math.max(0, state.stepIndex + state.fraction);
}
