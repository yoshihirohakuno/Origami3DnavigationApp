import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { computeFoldState } from '../src/engine/fold.ts';
import { foldSpatialFlap } from '../src/engine/foldSpatialFlap.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
import { dragonBaseStudy as dragon } from '../src/experiments/dragonBaseStudy.ts';
import { rosePetalStudy as rose, rosePetalLiftEnd } from '../src/experiments/rosePetalStudy.ts';
import { roseTwistStudy as twist } from '../src/experiments/roseTwistStudy.ts';
import { MODELS } from '../src/modelLibrary.ts';
const EPS=1e-9;

test('authoring a hinge on a coupled pose respects its spatial plane and does not mutate cached positions',()=>{
  const model={id:'callback-plane',name:{ja:'test',en:'test'},difficulty:1,
    vertices:[[-1,-1],[1,-1],[1,1],[-1,1]],faces:[[0,1,2,3]],steps:[]};
  const positions=model.vertices.map(([x,y])=>new Vector3(x,0,y)),original=positions.map(p=>p.clone());
  const cached={positions,stepIndex:0,fraction:0,guides:[],movingFaces:new Set()};
  const args=[model,2,new Vector3(.25,0,0),new Vector3(0,0,1),new Vector3(1,0,0),30,1,{description:{ja:'test',en:'test'}}];
  assert.throws(()=>foldSpatialFlap(...args),/not planar/,'flat engine pose is the wrong material plane');
  const refined=foldSpatialFlap(...args,()=>cached);
  assert.equal(refined.vertices.length,6,'cut the real material edges');
  assert.equal(positions.length,4,'cached pose must not receive new vertices');
  positions.forEach((p,i)=>assert.ok(p.distanceTo(original[i])<EPS));
  assert.equal(model.vertices.length,4);assert.equal(model.steps.length,0);
});

test('dragon starts with a retained small corner and an offset triangle, rather than a crane route',()=>{
  const first=computeFoldState(dragon,1).positions,second=computeFoldState(dragon,2).positions;
  assert.ok(first[3].distanceTo(first[3].clone().set(-.5,.5,0))<EPS);
  assert.ok(second[1].distanceTo(second[1].clone().set(-.75,.75,0))<EPS);
  assert.equal(dragon.steps.length,3);
  assert.ok(dragon.steps.slice(0,2).every(s=>s.folds[0].type==='valley'),'plain retained folds are not reverse folds');
  assert.ok(dragon.steps.every(step=>step.folds.length===1&&step.folds[0].type!=='unfold'));
  const final=computeFoldState(dragon,3).positions;
  assert.ok(Math.abs(final[1].x)<EPS);
  assert.ok(Math.abs(final[1].y-1.5/Math.SQRT2)<EPS);
  assert.ok(Math.abs(final[0].y)<EPS&&Math.abs(final[2].y)<EPS,'raw edges remain wider than the folded front triangle');
});

test('dragon offset preparation keeps one whole square and all panels throughout every fold',()=>{
  const initial=computeFoldState(dragon,0).positions,triangles=paperTriangles(dragon);
  const area=triangles.reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  for(let tick=0;tick<=192;tick++){
    const p=computeFoldState(dragon,tick/64).positions;
    for(const f of dragon.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS);
    assert.deepEqual(intersectingPanels(triangles,p,1),[],`dragon crossing at ${tick/64}`);
  }
});

test('new rose material points follow the old coupled twist instead of reverting to a flat engine pose',()=>{
  const initial=rose.stateAt(rose.model,0).positions;
  for(let tick=0;tick<=rose.model.steps.length*16;tick++){
    const t=tick/16,p=rose.stateAt(rose.model,t).positions;
    for(const f of rose.model.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`rose material stretch at ${t}`);
    if(t<=6){
      const old=twist.stateAt(twist.model,t).positions;
      for(let i=0;i<old.length;i++)assert.ok(p[i].distanceTo(old[i])<EPS,`old twist changed at ${t}`);
    }
  }
  assert.ok(rose.model.vertices.length>twist.model.vertices.length,'new creases add real material points');
  for(let k=1;k<rose.model.steps.length;k++){
    const a=rose.stateAt(rose.model,k-1e-6).positions,b=rose.stateAt(rose.model,k).positions,c=rose.stateAt(rose.model,k+1e-6).positions;
    for(let i=0;i<b.length;i++){assert.ok(a[i].distanceTo(b[i])<EPS);assert.ok(c[i].distanceTo(b[i])<EPS);}
  }
});

test('rose corner folds raise four separate free tips and curl them without dragging the central square',()=>{
  assert.equal(rosePetalLiftEnd,10);
  assert.equal(rose.model.steps.length,22);
  const base=rose.stateAt(rose.model,6).positions,lifted=rose.stateAt(rose.model,10).positions,final=rose.stateAt(rose.model,22).positions;
  for(const corner of[12,13,14,15]){
    assert.ok(lifted[corner].z>.2,'tip actually rises');
    assert.ok(final[corner].z>.1&&final[corner].z<lifted[corner].z,'curl opens the lifted tip outward');
  }
  for(let tick=96;tick<=352;tick++){
    const p=rose.stateAt(rose.model,tick/16).positions;
    for(const i of[0,1,2,3])assert.ok(p[i].distanceTo(base[i])<EPS,'petal dragged the center');
  }
});

test('rose hinge refinement retains a connected sheet with only the original paper boundary',()=>{
  const initial=rose.stateAt(rose.model,0).positions,edges=new Map(),graph=rose.model.faces.map(()=>new Set());
  const area=paperTriangles(rose.model).reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  for(const[fi,f]of rose.model.faces.entries())for(let j=0;j<f.length;j++){
    const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');
    if(!edges.has(key))edges.set(key,{a,b,owners:[]});edges.get(key).owners.push(fi);
  }
  for(const{a,b,owners}of edges.values()){
    assert.ok(owners.length<=2);
    if(owners.length===1){const A=rose.model.vertices[a],B=rose.model.vertices[b];assert.ok([0,1].some(k=>Math.abs(Math.abs(A[k])-1)<EPS&&Math.abs(A[k]-B[k])<EPS),`interior boundary ${a}/${b}`);}
    else {graph[owners[0]].add(owners[1]);graph[owners[1]].add(owners[0]);}
  }
  const visited=new Set([0]),queue=[0];while(queue.length)for(const fi of graph[queue.pop()])if(!visited.has(fi)){visited.add(fi);queue.push(fi);}
  assert.equal(visited.size,rose.model.faces.length);
});

test('rose corrected small-tip route has no sampled transverse panel intersections',()=>{
  const triangles=paperTriangles(rose.model);
  for(let tick=0;tick<=704;tick++)assert.deepEqual(intersectingPanels(triangles,rose.stateAt(rose.model,tick/32).positions,1),[],`rose crossing at ${tick/32}`);
});

test('refined rose moving faces and guides still refer to the actual material',()=>{
  assert.equal(rose.stateAt(rose.model,6.5).guides[0].type,'valley');
  assert.equal(rose.stateAt(rose.model,10.5).guides[0].type,'mountain');
  for(const t of[0,.5,2.3,5.5,6,6.5,10.5,15.5,21.5,22]){
    const state=rose.stateAt(rose.model,t);
    for(const fi of state.movingFaces)assert.ok(Number.isInteger(fi)&&fi>=0&&fi<rose.model.faces.length);
    assert.ok(!state.movingFaces.has(0),'stationary base triangle should not highlight');
    for(const guide of state.guides){
      for(const end of guide.axisLine)assert.ok(state.positions.some(p=>p.distanceTo(end)<EPS));
      assert.ok(guide.arrowPath.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
    }
  }
  assert.deepEqual(rose.stateAt(rose.model,22).guides,[]);
});

test('new rose and dragon studies remain unfinished and outside the released library',()=>{
  for(const model of[dragon,rose.model]){
    assert.ok(!MODELS.some(m=>m.id===model.id));
    assert.ok(model.steps.at(-1).caution.en.startsWith('Unfinished'));
    assert.ok(model.steps.every(s=>s.folds.every(op=>!op.targets)));
  }
});
