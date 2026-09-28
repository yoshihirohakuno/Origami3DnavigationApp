import test from 'node:test';
import assert from 'node:assert/strict';
import { beetleStudy as m } from '../src/experiments/beetleStudy.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { MODELS } from '../src/modelLibrary.ts';
const tolerance=5e-7;

test('beetle research model retains the area of its original square',()=>{
 let area=0;
 for(const f of m.faces){let signed=0;for(let i=0;i<f.length;i++){const p=m.vertices[f[i]],q=m.vertices[f[(i+1)%f.length]];signed+=p[0]*q[1]-p[1]*q[0];}assert.ok(signed<0,'start white side up');area-=signed/2;}
 assert.ok(Math.abs(area-4)<1e-9);
});

test('research mechanism preserves panel dimensions during every fold',()=>{
 const initial=computeFoldState(m,0).positions;
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const face of m.faces)for(const a of face)for(const b of face)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<tolerance,`deformation at ${tick/16}`);
 }
 for(let t=1;t<m.steps.length;t++){
  const before=computeFoldState(m,t-1e-7).positions,after=computeFoldState(m,t+1e-7).positions;
  before.forEach((v,i)=>assert.ok(v.distanceTo(after[i])<1e-5));
 }
});

test('subdivided material seams do not separate during the research sequence',()=>{
 const constraints=[];
 const used=[...new Set(m.faces.flat())];
 for(const f of m.faces)for(let j=0;j<f.length;j++){
  const a=f[j],b=f[(j+1)%f.length],pa=m.vertices[a],pb=m.vertices[b],dx=pb[0]-pa[0],dy=pb[1]-pa[1],den=dx*dx+dy*dy;if(den<1e-16)continue;
  for(const vi of used){if(vi===a||vi===b)continue;const q=m.vertices[vi],t=((q[0]-pa[0])*dx+(q[1]-pa[1])*dy)/den;
   if(t>=-1e-9&&t<=1+1e-9&&Math.hypot(q[0]-pa[0]-t*dx,q[1]-pa[1]-t*dy)<1e-9)constraints.push([vi,a,b,t]);
  }
 }
 for(let tick=0;tick<=m.steps.length*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const [vi,a,b,t]of constraints)assert.ok(p[vi].distanceTo(p[a].clone().lerp(p[b],t))<tolerance,`seam ${vi}/${a}-${b} at ${tick/8}`);
 }
});

test('research model stays outside the finished public library',()=>{
 assert.ok(!MODELS.some(model=>model.id===m.id));
 assert.match(m.steps.at(-1).caution.en,/not ready/);
});
