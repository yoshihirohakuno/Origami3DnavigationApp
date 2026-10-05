import test from 'node:test';
import assert from 'node:assert/strict';
import {beetleBodyStudy as m,beetleBodyCapStart,beetleBodyOpenStart,beetleBodyPages,beetleBodyPageSeeds} from '../src/experiments/beetleBodyStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const eps=5e-7,tips=[2,4,6,8,9,10,11,12];

test('the closed back point tucks before opening without changing any appendage',()=>{
 const before=computeFoldState(m,beetleBodyCapStart).positions;
 const after=computeFoldState(m,beetleBodyOpenStart).positions;
 assert.ok(Math.abs(after[0].y+.16)<eps);
 for(const tip of tips)assert.ok(after[tip].distanceTo(before[tip])<eps);
 assert.equal(beetleBodyCapStart,102);assert.equal(beetleBodyOpenStart,103);
 assert.equal(m.steps.length,104);
});

test('opening creates opposed upper and lower body surfaces while the material spine and eight tips remain fixed',()=>{
 const before=computeFoldState(m,beetleBodyOpenStart).positions;
 for(let k=1;k<=32;k++){
  const p=computeFoldState(m,beetleBodyOpenStart+k/32).positions;
  for(const tip of [0,1,3,5,7,...tips])assert.ok(p[tip].distanceTo(before[tip])<eps,`opening moved point ${tip}`);
 }
 const p=computeFoldState(m,m.steps.length).positions;
 const [upperRight,upperLeft,lowerRight,lowerLeft]=beetleBodyPageSeeds;
 assert.ok(p[upperRight].z>.05&&p[upperLeft].z>.05);
 assert.ok(p[lowerRight].z<-.04&&p[lowerLeft].z<-.04);
 assert.ok(Math.abs(p[upperRight].x+p[upperLeft].x)<eps);
 assert.ok(Math.abs(p[lowerRight].x+p[lowerLeft].x)<eps);
 assert.ok(Math.abs(p[upperRight].z-p[upperLeft].z)<eps);
 assert.ok(Math.abs(p[lowerRight].z-p[lowerLeft].z)<eps);
 assert.ok(new Set(beetleBodyPages.flat()).size===beetleBodyPages.flat().length);
});

test('the broad front shoulders bend on real new material creases while both leg ends stay in place',()=>{
 const before=computeFoldState(m,beetleBodyOpenStart).positions;
 const after=computeFoldState(m,m.steps.length).positions;
 for(const shoulder of [39,40])assert.ok(after[shoulder].distanceTo(before[shoulder])>.05);
 for(const tip of [2,4])assert.ok(after[tip].distanceTo(before[tip])<eps);
 // A front-facing panel still uses the existing paper palette. This alone
 // does not establish which coincident layer is exposed: the browser shows
 // white on part of the back, and final front/back verification is pending.
 const face=m.faces.find(f=>f.includes(155)&&f.includes(51));
 assert.ok(face);
 const normal=after[face[1]].clone().sub(after[face[0]]).cross(after[face[2]].clone().sub(after[face[0]]));
 assert.ok(normal.z>1e-5);
 assert.deepEqual(m.sheetColors,[{front:'#805032',back:'#f3e6ca'}]);
});

test('the faceted body retains the complete square and every refined panel dimension throughout all 104 operations',()=>{
 const initial=computeFoldState(m,0).positions;let area=0;
 for(const f of m.faces)for(let j=1;j<f.length-1;j++)area+=initial[f[j]].clone().sub(initial[f[0]]).cross(initial[f[j+1]].clone().sub(initial[f[0]])).length()/2;
 assert.ok(Math.abs(area-4)<1e-8);
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<eps,`panel ${a}/${b} at ${tick/16}`);
 }
});

test('body and shoulder refinement keeps all material seams connected at every sampled pose',()=>{
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

test('the back-cap fold and coupled body opening avoid sampled transverse crossings',()=>{
 const triangles=paperTriangles(m);
 for(let tick=beetleBodyCapStart*32;tick<=m.steps.length*32;tick++)assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,tick/32).positions,1),[],`crossing at ${tick/32}`);
});

test('the body-shell comparison remains private with explicit faceting and unfinished status',()=>{
 assert.ok(!MODELS.some(model=>model.id===m.id));
 assert.ok(m.steps.every(step=>step.folds.every(op=>!op.targets&&op.type!=='unfold')));
 assert.match(m.steps.at(-1).caution.en,/unfinished.*straight folded panels/);
});
