import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {beetleHornRootStudy as m,beetleRootCoreEnd,beetleRootLegs,beetleRootLegVertices,
 beetleHornRootReferences,beetleRootHornStart,beetleRootShoulderStart,beetleRootFootStart,
 beetleRootHookStart,beetleRootBackTuckStart,straightLegRoot} from '../src/experiments/beetleHornRootStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const eps=5e-7;

test('the new root study uses opposite paper corners for horns and retains six distinct leg tips',()=>{
 assert.deepEqual(m.vertices[9],m.vertices[11].map(x=>-x));
 assert.deepEqual(beetleRootLegs.map(([tip])=>tip),[2,4,6,8,10,12]);
 assert.equal(m.steps.length,114);assert.equal(beetleRootCoreEnd,100);
 assert.equal(beetleRootHornStart,100);assert.equal(beetleRootShoulderStart,102);
});

test('triangular horn hinges keep their material roots fixed while the connected lower leg follows the lower horn',()=>{
 for(const [j,tip,corner,height] of [[0,9,62,-.6],[1,11,78,-.65]]){
  const t=beetleRootHornStart+j,before=computeFoldState(m,t).positions;
  const {axis,weight}=beetleHornRootReferences.get(tip);
  const root=before[axis[0]].clone().lerp(before[axis[1]],weight);
  assert.ok(root.distanceTo(new Vector3(0,height,0))<eps);
  assert.ok(weight>=0&&weight<=1);
  const direction=before[axis[1]].clone().sub(before[axis[0]]).normalize();
  assert.ok(before[corner].clone().sub(root).cross(direction).length()<eps,'triangle root corner lies on the hinge');
  for(let k=1;k<=32;k++){
   const p=computeFoldState(m,t+k/32).positions;
   assert.ok(p[corner].distanceTo(before[corner])<eps);
   assert.ok(p[axis[0]].clone().lerp(p[axis[1]],weight).distanceTo(root)<eps);
   for(const other of [0,2,4,8,10,12])assert.ok(p[other].distanceTo(before[other])<eps,`horn moved unrelated point ${other}`);
  }
 }
 const a=computeFoldState(m,beetleRootHornStart+1).positions,b=computeFoldState(m,beetleRootHornStart+2).positions;
 assert.ok(a[6].distanceTo(b[6])>.02,'the attached leg must be carried, rather than detached or held at a fake target');
});

test('leg roots are the ends of their own straight material centerlines after the coupled horn motion',()=>{
 for(const [j,[tip]] of beetleRootLegs.entries()){
  const t=j<2?beetleRootShoulderStart+j:beetleRootFootStart+j;
  const prefix={...m,steps:m.steps.slice(0,t)};
  const root=straightLegRoot(prefix,tip),p=computeFoldState(m,t).positions;
  assert.equal(root,beetleRootLegVertices.get(tip));
  const anchor=tip<9?0:tip===10?5:1;
  const [x,y]=m.vertices[tip],dx=m.vertices[anchor][0]-x,dy=m.vertices[anchor][1]-y;
  assert.ok(Math.abs(dx*(m.vertices[root][1]-y)-dy*(m.vertices[root][0]-x))<1e-9);
  assert.ok(p[root].distanceTo(p[tip])>.1);
 }
 const p=computeFoldState(m,beetleRootFootStart+2).positions;
 const [, ,oldHeight]=beetleRootLegs[2];
 assert.ok(p[beetleRootLegVertices.get(6)].distanceTo(new Vector3(0,oldHeight,0))>.01,'the newly folded leg cannot use its old nominal XY root');
});

test('horn hooks use the outer quarter measured from the material hinge, not the mean of extended crease endpoints',()=>{
 for(const [j,tip] of [[0,9],[1,11]]){
  const time=beetleRootHookStart+j,p=computeFoldState(m,time).positions;
  const {axis,weight}=beetleHornRootReferences.get(tip);
  const root=p[axis[0]].clone().lerp(p[axis[1]],weight);
  const intended=root.clone().lerp(p[tip],.75);
  const op=m.steps[time].folds[0],crease=p[op.axis[1]].clone().sub(p[op.axis[0]]).normalize();
  assert.ok(intended.clone().sub(p[op.axis[0]]).cross(crease).length()<eps);
  assert.ok(Math.abs(intended.distanceTo(p[tip])*4-root.distanceTo(p[tip]))<eps);
 }
 const before=computeFoldState(m,beetleRootBackTuckStart).positions;
 for(let k=1;k<=16;k++){
  const p=computeFoldState(m,beetleRootBackTuckStart+k/16).positions;
  for(const tip of [2,4,6,8,9,10,11,12])assert.ok(p[tip].distanceTo(before[tip])<eps,'late back tuck must not disrupt a finished appendage');
 }
});

test('all root-study operations preserve one complete sheet and every panel dimension',()=>{
 const initial=computeFoldState(m,0).positions;let area=0;
 for(const f of m.faces)for(let j=1;j<f.length-1;j++)area+=initial[f[j]].clone().sub(initial[f[0]]).cross(initial[f[j+1]].clone().sub(initial[f[0]])).length()/2;
 assert.ok(Math.abs(area-4)<1e-8);
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<eps,`dimension at ${tick/16}, ${a}/${b}`);
 }
});

test('all new root, leg and back-tuck subdivisions preserve material seams',()=>{
 const used=[...new Set(m.faces.flat())],edges=new Map(),seams=[];
 for(const f of m.faces)for(let j=0;j<f.length;j++){
  const a=f[j],b=f[(j+1)%f.length];edges.set([a,b].sort((x,y)=>x-y).join(','),[a,b]);
 }
 for(const [a,b] of edges.values()){
  const pa=m.vertices[a],pb=m.vertices[b],dx=pb[0]-pa[0],dy=pb[1]-pa[1],den=dx*dx+dy*dy;
  if(den<1e-16)continue;
  for(const i of used){if(i===a||i===b)continue;const q=m.vertices[i],t=((q[0]-pa[0])*dx+(q[1]-pa[1])*dy)/den;
   if(t>=-1e-9&&t<=1+1e-9&&Math.hypot(q[0]-pa[0]-t*dx,q[1]-pa[1]-t*dy)<1e-9)seams.push([i,a,b,t]);}
 }
 for(let tick=0;tick<=m.steps.length*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const [i,a,b,t]of seams)assert.ok(p[i].distanceTo(p[a].clone().lerp(p[b],t))<eps,`seam at ${tick/8}`);
 }
});

test('opposite-face preparation and all later root motions avoid sampled transverse crossings',()=>{
 const triangles=paperTriangles(m);
 for(let tick=88*16;tick<=m.steps.length*16;tick++)assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,tick/16).positions,1),[],`crossing at ${tick/16}`);
});

test('the unresolved cone study remains private, with no target morph, guide unfolding or false dome',()=>{
 assert.ok(!MODELS.some(model=>model.id===m.id));
 assert.ok(m.steps.every(step=>step.folds.length===1&&step.folds.every(op=>!op.targets&&op.type!=='unfold')));
 assert.match(m.steps.at(-1).caution.en,/Unfinished.*dome/);
});
