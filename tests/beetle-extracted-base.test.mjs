import test from 'node:test';
import assert from 'node:assert/strict';
import { beetleExtractedBase as m, extractedBaseStart, extractedKiteSteps, extractedLayerFlipSteps, extractedKitePoints, extractedBaseLowerStart } from '../src/experiments/beetleExtractedBase.ts';
import { beetlePetalBase } from '../src/experiments/beetleStudy.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
import { MODELS } from '../src/modelLibrary.ts';
const eps=5e-7;

test('the blintz is turned as one intact sheet before the smaller square base is folded',()=>{
 const turn=m.steps[4].folds[0];
 assert.equal(turn.type,'assemble');assert.equal(turn.angle,180);
 const before=computeFoldState(m,4).positions,after=computeFoldState(m,5).positions;
 const central=m.faces.find(f=>f.includes(0)&&f.every(i=>Math.abs(m.vertices[i][0])+Math.abs(m.vertices[i][1])<=1+eps));
 const normal=p=>p[central[1]].clone().sub(p[central[0]]).cross(p[central[2]].clone().sub(p[central[0]])).normalize();
 assert.ok(normal(before).z<-.99);assert.ok(normal(after).z>.99);
 for(let tick=0;tick<=16;tick++){
  const p=computeFoldState(m,4+tick/16).positions;
  for(let a=0;a<p.length;a++)for(let b=0;b<p.length;b++)assert.ok(Math.abs(p[a].distanceTo(p[b])-before[a].distanceTo(before[b]))<eps);
 }
 assert.ok(turn.moving.includes(9)&&turn.moving.includes(12),'the corner layers turn with the sheet');
});

test('extracted insect base preserves an intact square and every panel through its 50 operations',()=>{
 const initial=computeFoldState(m,0).positions;
 let area=0;for(const f of m.faces)for(let i=1;i<f.length-1;i++)area+=initial[f[i]].clone().sub(initial[f[0]]).cross(initial[f[i+1]].clone().sub(initial[f[0]])).length()/2;
 assert.ok(Math.abs(area-4)<1e-9);assert.equal(m.steps.length,50);
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<eps,`panel at ${tick/16}`);
 }
 assert.equal(beetlePetalBase.steps.length,17,'authoring must not mutate the original base');
});

test('the eight outer half-layers reverse on their real material edges before point extraction',()=>{
 assert.equal(extractedLayerFlipSteps.length,8);
 for(const time of extractedLayerFlipSteps){
  const op=m.steps[time].folds[0],rim=op.moving[0],before=computeFoldState(m,time).positions,after=computeFoldState(m,time+1).positions;
  assert.ok(Math.abs(before[rim].x+after[rim].x)<eps);
  assert.ok(Math.abs(before[rim].y-after[rim].y)<eps);
  assert.ok(Math.abs(after[rim].x)>.2);
  for(let tick=1;tick<=16;tick++){
   const p=computeFoldState(m,time+tick/16).positions;
   for(let i=0;i<13;i++)assert.ok(p[i].distanceTo(before[i])<eps,`layer flip dragged ${i}`);
  }
 }
});

test('coupled extraction moves the selected inner corner and shoulder, keeping every other tip fixed',()=>{
 for(let j=0;j<4;j++){
  const t=extractedKiteSteps[j],[corner,joint]=extractedKitePoints[j],before=computeFoldState(m,t).positions;
  for(let tick=1;tick<=16;tick++){
   const p=computeFoldState(m,t+tick/16).positions;
   for(let i=0;i<13;i++)if(i!==corner&&i!==joint)assert.ok(p[i].distanceTo(before[i])<eps,`extraction ${j} dragged point ${i}`);
  }
  const after=computeFoldState(m,t+1).positions;
  assert.ok(after[corner].y<-.99);assert.ok(Math.abs(after[joint].y-(Math.SQRT1_2-1))<eps);
 }
 const before=computeFoldState(m,extractedBaseLowerStart).positions;
 for(const i of [2,4,6,8])assert.ok(Math.abs(before[i].y)<eps,'petal tips stay raised until extraction finishes');
 const final=computeFoldState(m,m.steps.length).positions;
 for(const i of [2,4,6,8,9,10,11,12])assert.ok(final[i].distanceTo(final[9])<eps,'all eight tips meet at the same open end');
});

test('layer parking, extraction and restacking have no sampled transverse panel crossings',()=>{
 const triangles=paperTriangles(m);
 for(let tick=extractedBaseStart*8;tick<=m.steps.length*8;tick++)assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,tick/8).positions,1),[],`crossing at ${tick/8}`);
});

test('the new subdivisions keep material seams joined throughout extraction',()=>{
 const used=[...new Set(m.faces.flat())],constraints=[];
 for(const f of m.faces)for(let j=0;j<f.length;j++){
  const a=f[j],b=f[(j+1)%f.length],pa=m.vertices[a],pb=m.vertices[b],dx=pb[0]-pa[0],dy=pb[1]-pa[1],den=dx*dx+dy*dy;if(den<1e-16)continue;
  for(const i of used){if(i===a||i===b)continue;const v=m.vertices[i],t=((v[0]-pa[0])*dx+(v[1]-pa[1])*dy)/den;
   if(t>=-1e-9&&t<=1+1e-9&&Math.hypot(v[0]-pa[0]-t*dx,v[1]-pa[1]-t*dy)<1e-9)constraints.push([i,a,b,t]);}
 }
 for(let tick=0;tick<=m.steps.length*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const [i,a,b,t]of constraints)assert.ok(p[i].distanceTo(p[a].clone().lerp(p[b],t))<eps,`seam at ${tick/8}`);
 }
});

test('an unfinished insect base never enters the finished catalog or uses crease-preparation reversals',()=>{
 assert.ok(!MODELS.some(model=>model.id===m.id));
 assert.match(m.steps.at(-1).caution.en,/unfinished/i);
 assert.ok(m.steps.every(s=>s.folds.length===1&&s.folds.every(op=>!op.targets&&op.type!=='unfold')));
});
