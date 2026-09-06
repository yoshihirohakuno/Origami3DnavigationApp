import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { orderPaper } from '../src/engine/painter.ts';
import { splitFacesByLine } from '../src/engine/split.ts';
import { FinalShapePreview, buildStepDiagrams } from '../src/CreasePattern.tsx';
import { coverage } from '../tools/audit-cover.mjs';

const models = [];
for (const file of readdirSync(new URL('../src/models/', import.meta.url)).filter(f => f.endsWith('.ts'))) {
  const mod = await import(`../src/models/${file}`);
  const model = Object.values(mod).find(v => v?.steps && v?.vertices);
  if (model) models.push(model);
}
const modelOf = id => models.find(m => m.id === id);
const distance = (a, b) => Math.max(...a.map((p, i) => p.distanceTo(b[i])));

for (const model of models) {
  test(`${model.id}: finite geometry at every quarter-step and exact crease/unfold return`, () => {
    if (model.faceSheet) assert.equal(model.faceSheet.length, model.faces.length);
    for (const face of model.faces) {
      assert.ok(face.length >= 3);
      for (const vi of face) assert.ok(Number.isInteger(vi) && model.vertices[vi]);
    }
    for (const step of model.steps) for (const op of step.folds) {
      for (const vi of [...op.axis, ...op.moving]) assert.ok(model.vertices[vi]);
      assert.equal(new Set(op.moving).size, op.moving.length);
      if (op.timing) assert.ok(op.timing[0] >= 0 && op.timing[0] < op.timing[1] && op.timing[1] <= 1);
    }
    for (let t = 0; t <= model.steps.length; t += .25) {
      const state = computeFoldState(model, t);
      for (const p of state.positions) assert.ok([p.x,p.y,p.z].every(Number.isFinite), `t=${t}`);
    }
    model.steps.forEach((step,i) => {
      if (i && step.folds.every(op => op.type === 'unfold')) {
        assert.ok(distance(computeFoldState(model,i-1).positions, computeFoldState(model,i+1).positions) < 1e-8);
      }
    });
    assert.equal(computeFoldState(model,model.steps.length).guides.length,0);
    assert.equal(buildStepDiagrams(model).length, model.steps.length);
  });
}

test('shuriken starts white and shows the colored front after every completed fold', async () => {
  const m = modelOf('shuriken');
  assert.equal(await coverage(m,0),100);
  for (let t=1;t<=m.steps.length;t++) assert.ok(await coverage(m,t) <= 1,`step ${t}`);
  const initial = computeFoldState(m,0).positions;
  for(let t=0;t<=m.steps.length;t+=.125){
    const p=computeFoldState(m,t).positions;
    for(const f of m.faces) for(let i=0;i<f.length;i++){
      const a=f[i],b=f[(i+1)%f.length];
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8);
    }
  }
});

test('tuck opens then closes without a full revolution or permanent shape drift', () => {
  const m=modelOf('shuriken');
  for(const t of [6,8]){
    const before=computeFoldState(m,t).positions;
    assert.ok(distance(before,computeFoldState(m,t+.45).positions)>.05);
    assert.ok(distance(before,computeFoldState(m,t+1).positions)<1e-8);
    assert.ok(m.steps[t].folds.every(op=>op.angle<=25));
  }
});

test('cup opens with its folded corners attached to the front wall', async () => {
  const m=modelOf('cup'),start=computeFoldState(m,0).positions;
  assert.ok(await coverage(m,6)<15);
  for(let t=5;t<=6;t+=.1){
    const p=computeFoldState(m,t).positions;
    for(const f of m.faces)for(let i=0;i<f.length;i++){
      const a=f[i],b=f[(i+1)%f.length];
      assert.ok(Math.abs(p[a].distanceTo(p[b])-start[a].distanceTo(start[b]))<1e-8);
    }
  }
});

test('previews derive from geometry and sheet colors, including collinear first vertices', () => {
  const m=modelOf('shuriken');
  const first=renderToStaticMarkup(createElement(FinalShapePreview,{model:m}));
  const changed={...m,sheetColors:m.sheetColors.map(c=>({...c,front:'#00ff00'}))};
  const second=renderToStaticMarkup(createElement(FinalShapePreview,{model:changed}));
  assert.notEqual(first,second);assert.match(second,/#00ff00/);
  const flat={id:'test',name:{ja:'test',en:'test'},difficulty:1,vertices:[[0,0],[0,1],[0,2],[2,2],[2,0]],faces:[[0,1,2,3,4]],steps:[]};
  const svg=renderToStaticMarkup(createElement(FinalShapePreview,{model:flat}));
  assert.match(svg,/#fbfaf7/);assert.doesNotMatch(svg,/#eda6a2/);
});

test('BSP splits crossing surfaces so the closer face wins on both sides', () => {
  const red={face:0,points:[{x:-1,y:-1,z:-1},{x:1,y:-1,z:1},{x:1,y:1,z:1},{x:-1,y:1,z:-1}]};
  const blue={face:1,points:[{x:-1,y:-1,z:0},{x:1,y:-1,z:0},{x:1,y:1,z:0},{x:-1,y:1,z:0}]};
  const sorted=orderPaper([red,blue]);
  assert.equal(sorted.length,3);
  assert.equal(sorted[0].face,1);assert.ok(sorted[0].points.every(p=>p.x>=-1e-8));
  assert.equal(sorted[1].face,0);
  assert.equal(sorted[2].face,1);assert.ok(sorted[2].points.every(p=>p.x<=1e-8));
});

test('concave faces keep their area and orientation when triangulated', () => {
  for(const reverse of [false,true]){
    const vertices=[[0,0],[2,0],[2,2],[1,1],[0,2]];
    const face=reverse?[4,3,2,1,0]:[0,1,2,3,4];
    const m={vertices,faces:[face]};let area=0;
    for(const [,a,b,c]of paperTriangles(m)){
      const p=vertices[a],q=vertices[b],r=vertices[c];
      const signed=((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]))/2;
      assert.ok(reverse?signed<=0:signed>=0);area+=signed;
    }
    assert.equal(area,reverse?-3:3);
  }
});

test('splitting a two-sheet model preserves each face palette assignment', () => {
  const model={vertices:[[-2,-1],[-1,-1],[-1,1],[-2,1],[1,-1],[2,-1],[2,1],[1,1]],faces:[[0,1,2,3],[4,5,6,7]],faceSheet:[0,1],steps:[]};
  const split=splitFacesByLine(model,[-3,0],[3,0]);
  assert.deepEqual(split.faceSheet,[0,0,1,1]);
});
