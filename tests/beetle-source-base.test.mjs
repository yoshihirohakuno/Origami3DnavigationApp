import test from 'node:test';
import assert from 'node:assert/strict';
import {beetleSourceBase as m,beetleSourceCore as core} from '../src/experiments/beetleSourceBase.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const eps=5e-7,legs=[2,4,6,8,10,12];

test('the source-order base parks intact horn layers and restores them before shaping the shield',()=>{
 assert.equal(m.steps.length,102);
 assert.equal(core.beetleHornHalfStart,88);
 assert.equal(core.beetleHornRestoreStart,98);
 assert.equal(core.beetleShieldStart,100);
 const before=computeFoldState(m,88).positions,parked=computeFoldState(m,90).positions;
 const restored=computeFoldState(m,100).positions;
 for(const tip of [9,11]){
  assert.ok(Math.abs(before[tip].y+1)<eps);
  assert.ok(Math.abs(parked[tip].y)<eps);
  assert.ok(restored[tip].distanceTo(before[tip])<eps);
 }
 for(const start of [88,98])for(let j=0;j<2;j++){
  const t=start+j,b=computeFoldState(m,t).positions;
  for(let tick=1;tick<=16;tick++){
   const p=computeFoldState(m,t+tick/16).positions;
   for(const tip of legs)assert.ok(p[tip].distanceTo(b[tip])<eps,`horn access moved leg ${tip} at ${t+tick/16}`);
  }
 }
 assert.match(m.steps[88].caution.en,/access the legs/);
});

test('all three leg pairs remain symmetric while the two unhalved horn layers remain wide',()=>{
 const p=computeFoldState(m,100).positions;
 for(const [a,b]of [[2,4],[6,8],[10,12]]){
  assert.ok(p[a].x<-.1&&p[b].x>.1);
  assert.ok(Math.abs(p[a].x+p[b].x)<eps);
  assert.ok(Math.abs(p[a].y-p[b].y)<eps);
 }
 for(const [tip,sx,sy]of [[9,1,1],[11,-1,-1]]){
  const own=[...new Set(m.faces.filter(f=>f.includes(tip)).flat())]
   .filter(i=>m.vertices[i][0]*sx>0&&m.vertices[i][1]*sy>0);
  assert.ok(own.some(i=>p[i].x>.02)&&own.some(i=>p[i].x<-.02),'both sides of the intact horn layer remain unfolded lengthwise');
 }
});

test('the source-order preparation preserves one square sheet and every panel dimension throughout',()=>{
 const initial=computeFoldState(m,0).positions;
 let area=0;
 for(const f of m.faces)for(let j=1;j<f.length-1;j++)area+=initial[f[j]].clone().sub(initial[f[0]]).cross(initial[f[j+1]].clone().sub(initial[f[0]])).length()/2;
 assert.ok(Math.abs(area-4)<1e-8);
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<eps,`panel at ${tick/16}: ${a}/${b}`);
 }
});

test('every refined material seam stays connected through parking, leg access and restoration',()=>{
 const used=[...new Set(m.faces.flat())],edges=new Map(),seams=[];
 for(const f of m.faces)for(let j=0;j<f.length;j++){
  const a=f[j],b=f[(j+1)%f.length];edges.set([a,b].sort((x,y)=>x-y).join(','),[a,b]);
 }
 for(const [a,b]of edges.values()){
  const pa=m.vertices[a],pb=m.vertices[b],dx=pb[0]-pa[0],dy=pb[1]-pa[1],den=dx*dx+dy*dy;
  if(den<1e-16)continue;
  for(const i of used){const q=m.vertices[i],t=((q[0]-pa[0])*dx+(q[1]-pa[1])*dy)/den;
   if(t>=-1e-9&&t<=1+1e-9&&Math.hypot(q[0]-pa[0]-t*dx,q[1]-pa[1]-t*dy)<1e-9)seams.push([i,a,b,t]);}
 }
 for(let tick=0;tick<=m.steps.length*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const [i,a,b,t]of seams)assert.ok(p[i].distanceTo(p[a].clone().lerp(p[b],t))<eps,`seam at ${tick/8}`);
 }
});

test('parking and restoring the intact horns does not introduce sampled transverse panel crossings',()=>{
 const triangles=paperTriangles(m);
 for(let tick=88*16;tick<=m.steps.length*16;tick++)assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,tick/16).positions,1),[],`crossing at ${tick/16}`);
});

test('the unshaped source base stays private and does not masquerade as a completed beetle',()=>{
 assert.ok(!MODELS.some(model=>model.id===m.id));
 assert.ok(m.steps.every(step=>step.folds.length===1&&step.folds.every(op=>!op.targets&&op.type!=='unfold')));
 assert.match(m.steps.at(-1).caution.en,/unfinished/i);
});
