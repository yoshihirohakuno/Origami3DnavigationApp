/** Animation progress is separate from the learner's explicit confirmation. */
export interface GuidedState { index: number; fraction: number; playing: boolean; complete: boolean }
export type GuidedAction =
  | { type: 'play'; reducedMotion?: boolean }
  | { type: 'pause' }
  | { type: 'tick'; seconds: number }
  | { type: 'pose'; fraction: number }
  | { type: 'next' }
  | { type: 'back' };
export const initialGuidedState: GuidedState = { index: 0, fraction: 0, playing: false, complete: false };

export function guidedNavigation(state: GuidedState, action: GuidedAction, total: number): GuidedState {
  if (action.type === 'back') return { index: Math.max(0, state.index - (state.complete ? 0 : 1)), fraction: 0, playing: false, complete: false };
  if (state.complete) return state;
  switch (action.type) {
    case 'next': return state.index + 1 >= total
      ? { ...state, fraction: 1, playing: false, complete: true }
      : { index: state.index + 1, fraction: 0, playing: false, complete: false };
    case 'pause': return { ...state, playing: false };
    case 'play': return { ...state, fraction: action.reducedMotion ? 1 : 0, playing: !action.reducedMotion };
    case 'pose': return { ...state, fraction: Math.max(0, Math.min(1, action.fraction)), playing: false };
    case 'tick': {
      if (!state.playing) return state;
      const fraction = Math.min(1, state.fraction + Math.max(0, Math.min(action.seconds, 0.1)) / 2.6);
      return { ...state, fraction, playing: fraction < 1 };
    }
  }
}
