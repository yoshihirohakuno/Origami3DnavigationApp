import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { orderPaper } from '../src/engine/painter.ts';
import { splitFacesByLine } from '../src/engine/split.ts';
import { FinalShapePreview, buildStepDiagrams } from '../src/CreasePattern.tsx';
import { coverage } from '../tools/audit-cover.mjs';
import { referenceOf } from '../src/modelReferences.ts';

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
      const guides = step.folds.filter(isGuideFold);
      if (i && guides.length && guides.every(op => op.type === 'unfold')) {
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

test('tuck folds the outer triangles inward instead of opening and returning to the same shape', () => {
  const m=modelOf('shuriken');
  for(const t of [6,8]){
    const before=computeFoldState(m,t).positions;
    assert.ok(distance(before,computeFoldState(m,t+.45).positions)>.05);
    assert.ok(distance(before,computeFoldState(m,t+1).positions)>.5);
    const guides=m.steps[t].folds.filter(isGuideFold);
    assert.equal(guides.length,2);
    assert.ok(guides.every(op=>op.angle>179&&op.angle<181));
  }
});

test('shuriken matches the reference tips and interleaves the two colors at the center', () => {
  const m=modelOf('shuriken'),p=computeFoldState(m,9).positions;
  const h=1/(4*Math.SQRT2),used=[...new Set(m.faces.flat())];
  for(const [x,y] of [[-h,3*h],[3*h,h],[h,-3*h],[-3*h,-h]]){
    assert.ok(Math.min(...used.map(i=>Math.hypot(p[i].x-x,p[i].y-y)))<1e-5);
  }
  const sheetAt=(x,y)=>{
    let sheet=-1,z=-Infinity;
    for(const [fi,ai,bi,ci]of paperTriangles(m)){
      const a=p[ai],b=p[bi],c=p[ci];
      const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
      if(Math.abs(den)<1e-10)continue;
      const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den;
      const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
      const depth=u*a.z+v*b.z+w*c.z;
      if(Math.min(u,v,w)>=-1e-9&&depth>z){sheet=m.faceSheet[fi];z=depth;}
    }
    return sheet;
  };
  for(const d of [.02,.05,.1]){
    assert.equal(sheetAt(.001,d),0);assert.equal(sheetAt(.001,-d),0);
    assert.equal(sheetAt(d,.001),1);assert.equal(sheetAt(-d,.001),1);
  }
  const start=computeFoldState(m,0).positions;
  let area=0;
  for(const [,a,b,c] of paperTriangles(m)){
    area+=start[b].clone().sub(start[a]).cross(start[c].clone().sub(start[a])).length()/2;
  }
  assert.ok(Math.abs(area-8)<1e-8,'both complete squares survive panel merging');
});

test('cup opens with its folded corners attached to the front wall', async () => {
  const m=modelOf('cup'),start=computeFoldState(m,0).positions;
  // Original cup diagram: the white front flap covers the colored corner folds.
  const white = await coverage(m,6);
  assert.ok(white > 45 && white < 55);
  for(let t=5;t<=6;t+=.1){
    const p=computeFoldState(m,t).positions;
    for(const f of m.faces)for(let i=0;i<f.length;i++){
      const a=f[i],b=f[(i+1)%f.length];
      assert.ok(Math.abs(p[a].distanceTo(p[b])-start[a].distanceTo(start[b]))<1e-8);
    }
  }
});

const rigidIds = ['acorn','pizza','bear','boots','bus','car','cat','chick','dog','envelope','fox','heart',
  'helmet','panda','penguin','piano','rabbit','riceball','rocket','ship','sinkansen','tulip','yacht'];
for (const id of rigidIds) test(`${id}: every panel keeps all pairwise distances throughout the animation`, () => {
  const m = modelOf(id), initial = computeFoldState(m,0).positions;
  for (let t = 0; t <= m.steps.length; t += .25) {
    const p = computeFoldState(m,t).positions;
    for (const f of m.faces) for (let i=0;i<f.length;i++) for (let j=i+1;j<f.length;j++) {
      assert.ok(Math.abs(p[f[i]].distanceTo(p[f[j]]) - initial[f[i]].distanceTo(initial[f[j]])) < 1e-8, `${id} at ${t}`);
    }
  }
});

function visibleAt(m, x, y, t=m.steps.length) {
  const p = computeFoldState(m,t).positions;
  let hit;
  for (const [fi,ai,bi,ci] of paperTriangles(m)) {
    const a=p[ai],b=p[bi],c=p[ci];
    const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
    if(Math.abs(den)<1e-10)continue;
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den;
    const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
    const z=u*a.z+v*b.z+w*c.z;
    if(Math.min(u,v,w)>=-1e-9 && (!hit || z>hit.z)) hit={face:fi,z,front:den>0};
  }
  return hit;
}

test('elephant ear covers its body, with the white wedge under its trunk', () => {
  const m=modelOf('elephant');
  const ear=visibleAt(m,.35,-.85),body=visibleAt(m,.8,-.85),wedge=visibleAt(m,.1,-.85);
  assert.ok(ear.front && body.front);
  assert.notEqual(ear.face,body.face);
  assert.ok(ear.z>body.z);
  assert.equal(wedge.front,false);
});

test('helmet brim folds up without a dangling lower tip; bear keeps its white chin', () => {
  const helmet=modelOf('helmet'),p=computeFoldState(helmet,helmet.steps.length).positions;
  assert.ok(Math.min(...helmet.faces.flat().map(vi=>p[vi].y))>-.50001);
  assert.equal(visibleAt(helmet,.01,-.44).front,false);
  assert.equal(visibleAt(helmet,.01,-.12).front,true);
  const bear=modelOf('bear');
  assert.equal(visibleAt(bear,.02,-.75).front,false);
});

test('new models preserve the full square and reference silhouettes and colors', async () => {
  for(const id of ['pizza','acorn']){
    const m=modelOf(id),start=computeFoldState(m,0).positions;
    const area=paperTriangles(m).reduce((sum,[,a,b,c])=>sum+start[b].clone().sub(start[a]).cross(start[c].clone().sub(start[a])).length()/2,0);
    assert.ok(Math.abs(area-2)<1e-8);
  }
  const pizza=modelOf('pizza'),p=computeFoldState(pizza,pizza.steps.length).positions;
  for(const [x,y] of [[-.35,-.15],[-.35,.15],[-.15,.35],[.15,.35],[.35,.15],[.35,-.15],[.15,-.35],[-.15,-.35]]) {
    assert.ok(Math.min(...pizza.faces.flat().map(vi=>Math.hypot(p[vi].x-x,p[vi].y-y)))<1e-8);
  }
  assert.equal(await coverage(pizza,0),100);
  assert.equal(await coverage(pizza,pizza.steps.length),0);
  const acorn=modelOf('acorn');
  assert.equal(visibleAt(acorn,.05,.4).front,true);
  assert.equal(visibleAt(acorn,.05,-.15).front,false);
  assert.equal(visibleAt(acorn,.39,-.24),undefined);
});

test('every model has an explicit source and each rendered SVG owns its clips', () => {
  for(const m of models) assert.match(referenceOf(m.id),/^https:\/\/www\.origami-club\.com\//);
  const html=renderToStaticMarkup(createElement('div',{},models.slice(0,4).map(m=>createElement(FinalShapePreview,{model:m,key:m.id}))));
  const ids=[...html.matchAll(/<clipPath id="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(ids.length>4);assert.equal(new Set(ids).size,ids.length);
  assert.match(html,/clipPathUnits="userSpaceOnUse"/);
  assert.doesNotMatch(html,/clip-path:polygon/);
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
