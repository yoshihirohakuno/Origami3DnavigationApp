/** Animation progress is separate from the learner's explicit confirmation. */
export interface GuidedState { index: number; fraction: number; target: 0 | 1; playing: boolean; sequence: boolean; complete: boolean }
export type GuidedAction =
  | { type: 'play' }
  | { type: 'watchAll'; restart?: boolean }
  | { type: 'replay' }
  | { type: 'pause' }
  | { type: 'tick'; seconds: number; slow?: boolean }
  | { type: 'move'; target: 0 | 1 }
  | { type: 'pose'; fraction: number }
  | { type: 'seekAll'; progress: number }
  | { type: 'next' }
  | { type: 'back' };
export const initialGuidedState: GuidedState = { index: 0, fraction: 0, target: 1, playing: false, sequence: false, complete: false };

export function guidedNavigation(state: GuidedState, action: GuidedAction, total: number): GuidedState {
  if (action.type === 'back') {
    if (state.fraction > 0 || state.complete) return { ...state, target: 0, playing: true, sequence: false, complete: false };
    if (state.index === 0) return state;
    return { index: state.index - 1, fraction: 1, target: 0, playing: true, sequence: false, complete: false };
  }
  if (action.type === 'watchAll') {
    const resume = !action.restart && state.sequence && !state.complete && !(state.index === total - 1 && state.fraction === 1);
    return resume ? { ...state, target: 1, playing: true } : { ...initialGuidedState, sequence: true, playing: true };
  }
  if (action.type === 'seekAll') {
    const progress = Math.max(0, Math.min(total, action.progress));
    const index = Math.min(total - 1, Math.floor(progress));
    return { index, fraction: progress - index, target: 1, playing: false, sequence: true, complete: false };
  }
  if (state.complete) return state;
  switch (action.type) {
    case 'next': {
      if (state.playing) return state;
      // Demonstrate an unfinished fold rather than jumping over its motion.
      if (state.fraction < 1) return { ...state, target: 1, playing: true, sequence: false };
      return state.index + 1 >= total
      ? { ...state, fraction: 1, playing: false, sequence: false, complete: true }
      : { index: state.index + 1, fraction: 0, target: 1, playing: true, sequence: false, complete: false };
    }
    case 'pause': return { ...state, playing: false };
    case 'play': return { ...state, fraction: state.fraction === 1 ? 0 : state.fraction, target: 1, playing: true, sequence: false };
    case 'replay': return { ...state, fraction: 0, target: 1, playing: true, sequence: false };
    case 'move': return { ...state, target: action.target, playing: state.fraction !== action.target, sequence: false };
    case 'pose': return { ...state, fraction: Math.max(0, Math.min(1, action.fraction)), playing: false, sequence: false };
    case 'tick': {
      if (!state.playing) return state;
      const delta = Math.max(0, Math.min(action.seconds, 0.1)) * (action.slow ? .45 : .9);
      if (state.sequence) {
        const progress = Math.min(total, state.index + state.fraction + delta);
        const index = Math.min(total - 1, Math.floor(progress));
        return { ...state, index, fraction: progress - index, playing: progress < total };
      }
      const difference = state.target - state.fraction;
      const fraction = Math.abs(difference) <= delta ? state.target : state.fraction + Math.sign(difference) * delta;
      return { ...state, fraction, playing: fraction !== state.target };
    }
  }
}
