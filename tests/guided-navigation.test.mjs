import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guidedNavigation, initialGuidedState } from '../src/engine/guidedNavigation.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { computeNavigationState } from '../src/engine/navigation.ts';
import { cupModel } from '../src/models/cup.ts';

test('watching a fold stops at its goal without confirming or advancing', () => {
  let state = guidedNavigation(initialGuidedState, { type: 'play' }, 6);
  for (let n = 0; n < 40; n++) state = guidedNavigation(state, { type: 'tick', seconds: .1 }, 6);
  assert.deepEqual(state, { index: 0, fraction: 1, playing: false, complete: false });
  const paused = guidedNavigation(state, { type: 'tick', seconds: 999 }, 6);
  assert.equal(paused, state);
  assert.deepEqual(guidedNavigation(state, { type: 'next' }, 6), { index: 1, fraction: 0, playing: false, complete: false });
});

test('before/goal inspection and replay never change the confirmed step', () => {
  let state = guidedNavigation(initialGuidedState, { type: 'next' }, 6);
  state = guidedNavigation(state, { type: 'pose', fraction: 1 }, 6);
  state = guidedNavigation(state, { type: 'play' }, 6);
  assert.deepEqual(state, { index: 1, fraction: 0, playing: true, complete: false });
  state = guidedNavigation(state, { type: 'pause' }, 6);
  assert.equal(state.playing, false);
  assert.equal(state.index, 1);
});

test('six explicit confirmations are required; watching the final pose is not completion', () => {
  let state = initialGuidedState;
  for (let i = 0; i < 5; i++) state = guidedNavigation(state, { type: 'next' }, 6);
  state = guidedNavigation(state, { type: 'pose', fraction: 1 }, 6);
  assert.equal(state.complete, false);
  state = guidedNavigation(state, { type: 'next' }, 6);
  assert.equal(state.complete, true);
  assert.equal(state.index, 5);
  assert.equal(guidedNavigation(state, { type: 'next' }, 6), state);
  assert.deepEqual(guidedNavigation(state, { type: 'back' }, 6), { index: 5, fraction: 0, playing: false, complete: false });
});

test('reduced motion displays the goal immediately but still waits for confirmation', () => {
  const state = guidedNavigation(initialGuidedState, { type: 'play', reducedMotion: true }, 6);
  assert.deepEqual(state, { index: 0, fraction: 1, playing: false, complete: false });
});

test('all cup step boundaries preserve geometry and keep the selected instruction', () => {
  for (let i = 0; i < cupModel.steps.length; i++) {
    const goal = computeNavigationState(cupModel, i + 1);
    assert.equal(goal.stepIndex, i);
    assert.equal(goal.guides.length, 0);
    assert.equal(goal.movingFaces.size, 0);
    const start = computeFoldState(cupModel, i);
    assert.equal(start.stepIndex, i);
    const next = i + 1 < cupModel.steps.length ? computeFoldState(cupModel, i + 1) : goal;
    assert.deepEqual(goal.positions, next.positions);
  }
});
