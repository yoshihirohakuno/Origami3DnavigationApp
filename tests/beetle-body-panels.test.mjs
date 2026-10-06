import test from 'node:test';
import assert from 'node:assert/strict';
import { beetleBodyMeshStudy as model, beetleBodyMeshPreparation as source, beetleBodyMesh as info } from '../src/experiments/beetleBodyMeshStudy.ts';
import { refineBeetleBodyPanels } from '../src/experiments/beetleBodyPanels.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
import { MODELS } from '../src/modelLibrary.ts';
const EPS = 5e-7;

test('back curvature preparation uses the folded body region and keeps all other material panels rigid', () => {
  assert.equal(source.steps.length, 100);
  assert.equal(model.steps.length, source.steps.length);
  assert.equal(model.vertices.length, 479);
  assert.equal(model.faces.length, 792);
  assert.equal(info.refinedFaceCount, 92);
  assert.equal(model.triangles, undefined, 'new hinges must be real material panels, not a render-only mesh');
  const p = computeFoldState(source, source.steps.length).positions;
  const body = source.faces.filter(face => face.every(i => p[i].y >= -.5 - 1e-9 && p[i].y <= 1e-9));
  assert.ok(body.some(face => face.some(i => Math.hypot(...source.vertices[i]) > .6)),
    'the back includes folded outer-sheet layers, which a radius-only selection misses');
  for (const face of source.faces.filter(face => !body.includes(face))) {
    assert.ok(model.faces.some(panel => face.every(i => panel.includes(i))), 'leave appendage panels rigid');
  }
  assert.equal(source.vertices.length, info.firstNewVertex);
  assert.notEqual(model.id, source.id);
});

test('the complete square, every new panel and the earlier folding motion remain intact', () => {
  const initial = computeFoldState(model, 0).positions;
  const area = paperTriangles(model).reduce((sum, [, a, b, c]) => sum +
    initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length() / 2, 0);
  assert.ok(Math.abs(area - 4) < 1e-8);
  for (let tick = 0; tick <= model.steps.length * 8; tick++) {
    const time = tick / 8;
    const p = computeFoldState(model, time).positions;
    const old = computeFoldState(source, time).positions;
    for (let i = 0; i < old.length; i++) assert.ok(p[i].distanceTo(old[i]) < EPS, `changed old material at ${time}`);
    for (const face of model.faces) for (const a of face) for (const b of face) {
      assert.ok(Math.abs(p[a].distanceTo(p[b]) - initial[a].distanceTo(initial[b])) < EPS, `panel ${a}/${b} at ${time}`);
    }
    const bindings = model.steps[0].folds[0].surfacePoints.filter(([i]) => i >= info.firstNewVertex);
    for (const [i, a, b, , u, v] of bindings) {
      assert.ok(p[i].distanceTo(p[a].clone().multiplyScalar(u).addScaledVector(p[b], v)) < EPS,
        `new material edge detached at ${time}`);
    }
  }
});

test('subdivided edges also enter neighboring polygons, leaving no unbound T junctions', () => {
  const used = [...new Set(model.faces.flat())];
  for (const face of model.faces) for (let j = 0; j < face.length; j++) {
    const a = face[j], b = face[(j + 1) % face.length];
    const A = model.vertices[a], B = model.vertices[b], dx = B[0] - A[0], dy = B[1] - A[1], den = dx * dx + dy * dy;
    for (const i of used) {
      const q = model.vertices[i], t = ((q[0] - A[0]) * dx + (q[1] - A[1]) * dy) / den;
      if (t > 1e-9 && t < 1 - 1e-9 && Math.hypot(q[0] - A[0] - t * dx, q[1] - A[1] - t * dy) < 1e-9) {
        assert.fail(`material vertex ${i} remains inside an unsplit edge ${a}/${b}`);
      }
    }
  }
});

test('new back subdivisions introduce no transverse collisions during the later preparation', () => {
  const triangles = paperTriangles(model);
  for (let tick = 82 * 8; tick <= model.steps.length * 8; tick++) {
    assert.deepEqual(intersectingPanels(triangles, computeFoldState(model, tick / 8).positions, 1), [], `crossing at ${tick / 8}`);
  }
});

test('body-panel preparation rejects incompatible input and stays out of the finished catalog', () => {
  for (const override of [{ triangles: [] }, { vertexWelds: [] }, { sheetStartSteps: [0] }, { faceSheet: source.faces.map(() => 1) }]) {
    assert.throws(() => refineBeetleBodyPanels({ ...source, ...override }), /single sheet/);
  }
  const nonflat = structuredClone(source);
  nonflat.steps = nonflat.steps.slice(0, 1);
  nonflat.steps[0].folds[0].angle = 90;
  assert.throws(() => refineBeetleBodyPanels(nonflat), /flat/);
  assert.ok(!MODELS.some(m => m.id === model.id));
  assert.match(model.steps.at(-1).caution.en, /opening motion is unfinished/);
  assert.ok(model.steps.every(step => step.folds.every(op => !op.targets && op.type !== 'unfold')));
});
