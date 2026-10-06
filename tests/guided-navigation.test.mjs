import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guidedNavigation, initialGuidedState } from '../src/engine/guidedNavigation.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { computeNavigationState } from '../src/engine/navigation.ts';
import { cupModel } from '../src/models/cup.ts';

const reduce = (state, action) => guidedNavigation(state, action, 6);
function finish(state) {
  for (let n = 0; n < 40 && state.playing; n++) state = reduce(state, { type: 'tick', seconds: .1 });
  return state;
}
const positions = state => computeFoldState(cupModel, state.index + state.fraction).positions;

test('the primary action demonstrates the first fold instead of skipping its motion', () => {
  let state = reduce(initialGuidedState, { type: 'next' });
  assert.equal(state.index, 0);
  assert.equal(state.fraction, 0);
  assert.equal(state.playing, true);
  assert.equal(reduce(state, { type: 'next' }), state, 'repeated presses cannot skip a running fold');
  state = reduce(state, { type: 'tick', seconds: .1 });
  assert.ok(state.fraction > 0 && state.fraction < 1);
  state = finish(state);
  assert.equal(state.index, 0);
  assert.equal(state.fraction, 1);
  assert.equal(state.playing, false);
  assert.equal(state.complete, false);
});

test('each next action starts the following fold with no jump in the paper', () => {
  let state = finish(reduce(initialGuidedState, { type: 'next' }));
  for (let index = 1; index < 6; index++) {
    const previous = positions(state);
    state = reduce(state, { type: 'next' });
    assert.equal(state.index, index);
    assert.equal(state.fraction, 0);
    assert.deepEqual(positions(state), previous);
    assert.equal(state.playing, true);
    const mid = reduce(state, { type: 'tick', seconds: .1 });
    assert.ok(mid.fraction > 0 && mid.fraction < 1);
    assert.ok(positions(mid).some((point, vi) => point.distanceTo(previous[vi]) > 1e-6));
    state = finish(mid);
    assert.equal(state.fraction, 1);
    assert.equal(state.playing, false);
    assert.equal(state.complete, false);
  }
  state = reduce(state, { type: 'next' });
  assert.equal(state.complete, true);
  assert.equal(reduce(state, { type: 'next' }), state);
});

test('clicking either preview animates toward it without an instant pose replacement', () => {
  let state = reduce(initialGuidedState, { type: 'move', target: 1 });
  assert.equal(state.fraction, 0);
  state = reduce(state, { type: 'tick', seconds: .1 });
  const mid = state.fraction;
  state = reduce(state, { type: 'move', target: 0 });
  assert.equal(state.fraction, mid);
  state = reduce(state, { type: 'tick', seconds: .05 });
  assert.ok(state.fraction > 0 && state.fraction < mid);
  state = finish(state);
  assert.equal(state.fraction, 0);
  assert.equal(state.index, 0);
});

test('pause/resume retains the intermediate pose; only explicit replay restarts', () => {
  let state = reduce(initialGuidedState, { type: 'play' });
  state = reduce(state, { type: 'tick', seconds: .1 });
  const mid = state.fraction;
  state = reduce(state, { type: 'pause' });
  assert.equal(reduce(state, { type: 'tick', seconds: 99 }), state);
  state = reduce(state, { type: 'play' });
  assert.equal(state.fraction, mid);
  state = reduce(state, { type: 'replay' });
  assert.equal(state.fraction, 0);
  assert.equal(state.playing, true);
});

test('backward navigation passes through intermediate poses and keeps boundary geometry', () => {
  let state = finish(reduce(initialGuidedState, { type: 'next' }));
  state = finish(reduce(state, { type: 'next' }));
  const goal = positions(state);
  state = reduce(state, { type: 'back' });
  assert.deepEqual(positions(state), goal);
  state = finish(state);
  assert.equal(state.index, 1);
  assert.equal(state.fraction, 0);
  const boundary = positions(state);
  state = reduce(state, { type: 'back' });
  assert.equal(state.index, 0);
  assert.equal(state.fraction, 1);
  assert.deepEqual(positions(state), boundary);
  state = finish(state);
  assert.equal(state.fraction, 0);
});

test('slow playback changes speed without changing the fold or its destination', () => {
  const started = reduce(initialGuidedState, { type: 'play' });
  const normal = reduce(started, { type: 'tick', seconds: .1 });
  const slow = reduce(started, { type: 'tick', seconds: .1, slow: true });
  assert.equal(slow.fraction, normal.fraction / 2);
  assert.equal(finish(slow).fraction, 1);
});

test('inspect or scrub the final shape without recording completion automatically', () => {
  const state = { ...initialGuidedState, index: 5 };
  const inspected = finish(reduce(state, { type: 'move', target: 1 }));
  assert.equal(inspected.complete, false);
  const scrubbed = reduce(state, { type: 'pose', fraction: 1 });
  assert.equal(scrubbed.complete, false);
  const completed = reduce(inspected, { type: 'next' });
  assert.equal(completed.complete, true);
  const back = reduce(completed, { type: 'back' });
  assert.equal(back.complete, false);
  assert.equal(back.fraction, 1);
  assert.equal(back.playing, true);
});

test('all cup step boundaries preserve geometry and keep the selected instruction', () => {
  for (let i = 0; i < cupModel.steps.length; i++) {
    const goal = computeNavigationState(cupModel, i + 1);
    assert.equal(goal.stepIndex, i);
    assert.equal(goal.guides.length, 0);
    assert.equal(goal.movingFaces.size, 0);
    assert.equal(computeFoldState(cupModel, i).stepIndex, i);
    assert.deepEqual(goal.positions, computeFoldState(cupModel, i + 1).positions);
  }
});
