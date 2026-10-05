import test from 'node:test';
import assert from 'node:assert/strict';
import { beetleStudy as m, beetleNarrowStart, beetleLegRootStart,
 beetleBackStart, beetleHornStart, beetleJointStart } from '../src/experiments/beetleStudy.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { MODELS } from '../src/modelLibrary.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
const tolerance=5e-7;
const legs=[2,4,6,8,11,12],landmarks=[0,...legs,9,10];

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

test('narrowing creases keep all eight tips and the closed body point fixed',()=>{
 const before=computeFoldState(m,beetleNarrowStart).positions;
 for(let tick=beetleNarrowStart*8;tick<=beetleLegRootStart*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const i of landmarks)assert.ok(p[i].distanceTo(before[i])<tolerance,`point ${i} dragged at ${tick/8}`);
 }
});

test('each leg root and foot joint moves only its own tip',()=>{
 for(const start of [beetleLegRootStart,beetleJointStart])for(let j=0;j<legs.length;j++){
  const t=start+j,before=computeFoldState(m,t).positions;
  for(let tick=1;tick<=8;tick++){
   const p=computeFoldState(m,t+tick/8).positions;
   for(const i of landmarks.filter(i=>i!==legs[j]))assert.ok(p[i].distanceTo(before[i])<tolerance,`joint ${j} dragged ${i}`);
  }
  const after=computeFoldState(m,t+1).positions;
  assert.ok(before[legs[j]].distanceTo(after[legs[j]])>.02);
 }
});

test('rear tucks shorten the back without dragging any appendage tip',()=>{
 for(let j=0;j<2;j++){
  const before=computeFoldState(m,beetleBackStart+j).positions;
  const after=computeFoldState(m,beetleBackStart+j+1).positions;
  for(const i of landmarks)assert.ok(before[i].distanceTo(after[i])<tolerance);
  assert.ok(after[[3,7][j]].y>before[[3,7][j]].y+.1);
 }
});

test('horns open above and below the body and six distinct feet point downward',()=>{
 const before=computeFoldState(m,beetleHornStart).positions;
 const final=computeFoldState(m,m.steps.length).positions;
 assert.ok(final[9].z>before[9].z+.1,'upper horn must lift');
 assert.ok(final[10].z<before[10].z-.02,'lower jaw must open downward');
 for(const i of legs){
  assert.ok(final[i].z<-.025,`foot ${i} must bend downward`);
  for(const j of legs.filter(j=>j!==i))assert.ok(final[i].distanceTo(final[j])>.05,'feet must remain distinct');
 }
 assert.ok(m.steps.every(s=>s.folds.length===1),'one coupled or independent motion per operation');
 assert.ok(m.steps.every(s=>s.folds.every(f=>f.type!=='unfold'&&!f.targets)),'no pre-crease reversals or pose morphs');
});

test('petal panels have no transverse interior crossings at the sampled poses',()=>{
 const triangles=paperTriangles(m);
 const petals=m.steps.flatMap((step,i)=>step.folds.some(f=>f.petal?.sides.length===2)?[i]:[]);
 for(const i of petals)for(let tick=1;tick<8;tick++){
  assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,i+tick/8).positions,1),[],`crossing at ${i+tick/8}`);
 }
});
