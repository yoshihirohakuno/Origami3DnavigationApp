import test from 'node:test';
import assert from 'node:assert/strict';
import {beetlePleatedStudy as m,beetleSquareOpenStart,beetleSquareCorners,beetlePleatStart,
 beetleFlatNarrowStart,beetleHornHalfStart,beetleLegSpreadStart,beetleLegRoots,
 beetleBackTuckStart,beetleFrontTuckStart,beetleShieldStart,beetleShieldCreases,beetleSpatialHornStart,beetleFrontShoulderStart,beetleFrontShoulderFraction,
 beetleFrontKneeFraction,beetleOtherLegBendFraction,beetleSpatialFootStart,beetleSpatialHookStart} from '../src/experiments/beetlePleatedStudy.ts';
import {Vector3} from 'three';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const eps=5e-7,tips=[0,2,4,6,8,9,10,11,12];

test('partial-square opening restores four actual squares with no displaced tip',()=>{
 const p=computeFoldState(m,beetlePleatStart).positions;
 for(const [tip,joint,left,right]of beetleSquareCorners){
  const square=[joint,left,tip,right];
  for(let i=0;i<4;i++)assert.ok(Math.abs(p[square[i]].distanceTo(p[square[(i+1)%4]])-.5)<eps);
  assert.ok(Math.abs(p[left].y-p[right].y)<eps);
  assert.ok(Math.abs(Math.abs(p[left].x)-Math.SQRT1_2/2)<eps);
 }
 for(let t=beetleSquareOpenStart*16;t<=beetleBackTuckStart*16;t++){
  if(t>=beetleLegSpreadStart*16)break;
  const pose=computeFoldState(m,t/16).positions;
  assert.ok(pose[0].length()<eps);
  for(const i of tips.slice(1))assert.ok(pose[i].distanceTo(p[9])<eps,`tip ${i} at ${t/16}`);
 }
 assert.equal(beetleFlatNarrowStart-beetlePleatStart,24);
 assert.equal(beetleHornHalfStart-beetleFlatNarrowStart,6);
});

test('six root folds spread symmetric legs without dragging any other leg or horn',()=>{
 for(let j=0;j<6;j++){
  const time=beetleLegSpreadStart+j,tip=beetleLegRoots[j][0],before=computeFoldState(m,time).positions;
  for(let tick=1;tick<=16;tick++){
   const p=computeFoldState(m,time+tick/16).positions;
   for(const i of tips)if(i!==tip)assert.ok(p[i].distanceTo(before[i])<eps,`root ${tip} dragged ${i}`);
  }
 }
 const p=computeFoldState(m,beetleBackTuckStart).positions;
 for(const [left,right]of [[2,4],[6,8],[11,12]]){
  assert.ok(Math.abs(p[left].x+p[right].x)<eps);assert.ok(Math.abs(p[left].y-p[right].y)<eps);
 }
});

test('the retained wide front-leg layers tuck across their own centerline without moving the shield or other tips',()=>{
 for(let j=0;j<2;j++){
  const time=beetleFrontTuckStart+j,op=m.steps[time].folds[0];
  const before=computeFoldState(m,time).positions,after=computeFoldState(m,time+1).positions;
  const a=before[op.axis[0]],along=before[op.axis[1]].clone().sub(a).normalize();
  const signed=p=>along.x*(p.y-a.y)-along.y*(p.x-a.x);
  assert.equal(op.type,'mountain');assert.ok(op.moving.length>0);
  for(const vi of op.moving){
   assert.ok(Math.abs(signed(before[vi])+signed(after[vi]))<eps,'the wide half reflects into the leg');
   assert.ok(Math.abs(after[vi].clone().sub(a).dot(along)-before[vi].clone().sub(a).dot(along))<eps);
  }
  for(let tick=1;tick<=16;tick++){
   const p=computeFoldState(m,time+tick/16).positions;
   for(const vi of tips)assert.ok(p[vi].distanceTo(before[vi])<eps,`tuck ${j} dragged tip ${vi}`);
   for(const vi of [1,3,5,7])assert.ok(p[vi].distanceTo(before[vi])<eps,'the shoulder points remain in place');
  }
 }
});

test('all 116 operations preserve the intact sheet and the dimensions of every panel',()=>{
 assert.equal(m.steps.length,116);const initial=computeFoldState(m,0).positions;
 let area=0;for(const f of m.faces)for(let i=1;i<f.length-1;i++)area+=initial[f[i]].clone().sub(initial[f[0]]).cross(initial[f[i+1]].clone().sub(initial[f[0]])).length()/2;
 assert.ok(Math.abs(area-4)<1e-8);
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<eps,`panel at ${tick/16}`);
 }
});

test('added pleats and spatial hinges leave every material seam joined',()=>{
 const used=[...new Set(m.faces.flat())],edges=new Map(),constraints=[];
 for(const f of m.faces)for(let j=0;j<f.length;j++){
  const a=f[j],b=f[(j+1)%f.length];edges.set([a,b].sort((x,y)=>x-y).join(','),[a,b]);
 }
 for(const [a,b]of edges.values()){
  const pa=m.vertices[a],pb=m.vertices[b],dx=pb[0]-pa[0],dy=pb[1]-pa[1],den=dx*dx+dy*dy;if(den<1e-16)continue;
  for(const i of used){if(i===a||i===b)continue;const v=m.vertices[i],t=((v[0]-pa[0])*dx+(v[1]-pa[1])*dy)/den;
   if(t>=-1e-9&&t<=1+1e-9&&Math.hypot(v[0]-pa[0]-t*dx,v[1]-pa[1]-t*dy)<1e-9)constraints.push([i,a,b,t]);}
 }
 for(let tick=0;tick<=m.steps.length*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const [i,a,b,t]of constraints)assert.ok(p[i].distanceTo(p[a].clone().lerp(p[b],t))<eps,`seam at ${tick/8}`);
 }
});

test('the opened squares, pleats, legs and spatial hinges have no sampled transverse intersections',()=>{
 const triangles=paperTriangles(m);
 for(let tick=beetleSquareOpenStart*8;tick<=m.steps.length*8;tick++)assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,tick/8).positions,1),[],`cross at ${tick/8}`);
});

test('spatial horn, foot and hook folds only move their selected appendage',()=>{
 for(const [start,selected]of [[beetleSpatialHornStart,[9,10]],[beetleFrontShoulderStart,[2,4]],[beetleSpatialFootStart,beetleLegRoots.map(v=>v[0])],[beetleSpatialHookStart,[9,10]]]){
  for(let j=0;j<selected.length;j++){
   const t=start+j,before=computeFoldState(m,t).positions;
   for(let tick=1;tick<=8;tick++){
    const p=computeFoldState(m,t+tick/8).positions;
    for(const tip of tips)if(tip!==selected[j])assert.ok(p[tip].distanceTo(before[tip])<eps,`appendage ${selected[j]} dragged ${tip}`);
   }
  }
 }
});

test('front legs rise before bending down, with stationary knees one third along the free leg',()=>{
 const start=computeFoldState(m,beetleFrontShoulderStart).positions;
 const raised=computeFoldState(m,beetleSpatialFootStart).positions;
 const finished=computeFoldState(m,beetleSpatialFootStart+2).positions;
 const knees=[];
 for(let j=0;j<2;j++){
  const [tip,,height]=beetleLegRoots[j];
  const shoulder=new Vector3(0,height,0).lerp(start[tip],beetleFrontShoulderFraction);
  const knee=shoulder.clone().lerp(raised[tip],beetleFrontKneeFraction);
  knees.push(knee);
  assert.ok(knee.z>shoulder.z+.025,'knee must rise above its shoulder');
  assert.ok(finished[tip].z<knee.z-.1,'lower leg must descend below its knee');
  const op=m.steps[beetleSpatialFootStart+j].folds[0];
  for(let tick=0;tick<=16;tick++){
   const p=computeFoldState(m,beetleSpatialFootStart+j+tick/16).positions;
   const a=p[op.axis[0]],d=p[op.axis[1]].clone().sub(a).normalize();
   assert.ok(knee.clone().sub(a).cross(d).length()<eps,'actual knee remains on the material hinge');
  }
  const upper=knee.clone().sub(shoulder),lower=finished[tip].clone().sub(knee);
  assert.ok(Math.abs(upper.angleTo(lower)*180/Math.PI-65)<1e-4);
  assert.ok(Math.abs(upper.length()+lower.length()-start[tip].distanceTo(shoulder))<eps);
 }
 assert.ok(Math.abs(knees[0].x+knees[1].x)<eps);
 assert.ok(Math.abs(knees[0].y-knees[1].y)<eps&&Math.abs(knees[0].z-knees[1].z)<eps);
 assert.ok(Math.abs(finished[2].x+finished[4].x)<eps);
 assert.ok(Math.abs(finished[2].y-finished[4].y)<eps&&Math.abs(finished[2].z-finished[4].z)<eps);
});

test('the four other legs bend near their free roots rather than ending in short bent feet',()=>{
 const finished=computeFoldState(m,beetleSpatialFootStart+6).positions;
 for(let j=2;j<6;j++){
  const time=beetleSpatialFootStart+j,[tip,,height]=beetleLegRoots[j];
  const before=computeFoldState(m,time).positions,root=new Vector3(0,height,0);
  const hinge=root.clone().lerp(before[tip],beetleOtherLegBendFraction);
  const op=m.steps[time].folds[0];
  const axis=before[op.axis[1]].clone().sub(before[op.axis[0]]).normalize();
  assert.ok(hinge.clone().sub(before[op.axis[0]]).cross(axis).length()<eps);
  assert.ok(hinge.distanceTo(before[tip])>3*root.distanceTo(hinge)-eps,'most of the leg stays beyond its hinge');
  for(let tick=0;tick<=16;tick++){
   const p=computeFoldState(m,time+tick/16).positions;
   assert.ok(p[op.axis[0]].distanceTo(before[op.axis[0]])<eps);
   assert.ok(p[op.axis[1]].distanceTo(before[op.axis[1]])<eps);
   assert.ok(Math.abs(p[tip].distanceTo(hinge)-before[tip].distanceTo(hinge))<eps);
  }
  assert.ok(finished[tip].z<hinge.z-.15,'the long leg extends downward');
 }
 for(const [left,right]of [[6,8],[11,12]]){
  assert.ok(Math.abs(finished[left].x+finished[right].x)<eps);
  assert.ok(Math.abs(finished[left].y-finished[right].y)<eps&&Math.abs(finished[left].z-finished[right].z)<eps);
 }
});

test('the shield tip forms a lasting pleat without dragging the back, horns, legs or neighboring shield layers',()=>{
 const before=computeFoldState(m,beetleShieldStart).positions;
 const first=computeFoldState(m,beetleShieldStart+1).positions;
 const after=computeFoldState(m,beetleBackTuckStart).positions;
 assert.equal(beetleBackTuckStart-beetleShieldStart,2);
 assert.equal(m.steps[beetleShieldStart].folds[0].type,'mountain');
 assert.equal(m.steps[beetleShieldStart+1].folds[0].type,'valley');
 assert.ok(Math.abs(first[3].y-(2*beetleShieldCreases[0]-before[3].y))<eps);
 assert.ok(first[3].y>-.5+eps,'the tucked tip stays clear of the horn root');
 assert.ok(Math.abs(after[3].y-before[3].y+2*(beetleShieldCreases[0]-beetleShieldCreases[1]))<eps);
 assert.ok(after[3].distanceTo(before[3])>.019,'the return fold leaves a pleat rather than undoing the first fold');
 for(let tick=0;tick<=64;tick++){
  const p=computeFoldState(m,beetleShieldStart+tick/32).positions;
  for(const i of [...tips,1,5,7])assert.ok(p[i].distanceTo(before[i])<eps,`shield pleat dragged ${i}`);
 }
 for(let j=0;j<2;j++){
  const time=beetleShieldStart+j,op=m.steps[time].folds[0],p=computeFoldState(m,time).positions;
  for(const i of op.axis)assert.ok(Math.abs(p[i].y-beetleShieldCreases[j])<eps);
 }
});

test('this unresolved beetle study stays private and never uses a position morph',()=>{
 assert.ok(!MODELS.some(v=>v.id===m.id));assert.match(m.steps.at(-1).caution.en,/Unfinished/);
 assert.ok(m.steps.every(s=>s.folds.length===1&&s.folds.every(op=>!op.targets&&op.type!=='unfold')));
});
