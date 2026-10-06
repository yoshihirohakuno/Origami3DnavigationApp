import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoseTwistStudy, roseTwistStudy as study } from '../src/experiments/roseTwistStudy.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
import { MODELS } from '../src/modelLibrary.ts';

const EPS=1e-9;

test('rose twist uses one complete square and shared material edges, including the central diagonal',()=>{
  const {model}=study,p=study.poseAt(0);
  const area=paperTriangles(model).reduce((sum,[,a,b,c])=>sum+p[b].clone().sub(p[a]).cross(p[c].clone().sub(p[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  const edges=new Map(),graph=model.faces.map(()=>new Set());
  for(const[fi,f]of model.faces.entries())for(let j=0;j<f.length;j++){
    const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');
    if(!edges.has(key))edges.set(key,{a,b,owners:[]});
    edges.get(key).owners.push(fi);
  }
  for(const{a,b,owners}of edges.values()){
    assert.ok(owners.length<=2);
    if(owners.length===1){
      const A=model.vertices[a],B=model.vertices[b];
      assert.ok([0,1].some(k=>Math.abs(Math.abs(A[k])-1)<EPS&&Math.abs(A[k]-B[k])<EPS),`interior free boundary ${a}/${b}`);
    }else{graph[owners[0]].add(owners[1]);graph[owners[1]].add(owners[0]);}
  }
  const seen=new Set([0]),queue=[0];
  while(queue.length)for(const fi of graph[queue.pop()])if(!seen.has(fi)){seen.add(fi);queue.push(fi);}
  assert.equal(seen.size,model.faces.length);
  assert.equal(edges.get('2,3').owners.length,2,'added diagonal is an intact material hinge');
  for(const f of model.faces){
    const signed=f.reduce((sum,a,j)=>{const b=f[(j+1)%f.length];return sum+p[a].x*p[b].y-p[b].x*p[a].y;},0);
    assert.ok(signed>0,'consistent colored paper face');
  }
});

test('coupled twist and center opening preserve every full panel dimension throughout the route',()=>{
  for(const h of[.1,.25,.4]){
    const s=createRoseTwistStudy(h),initial=s.poseAt(0);
    for(let tick=0;tick<=1536;tick++){
      const time=tick/256,p=s.poseAt(time);
      for(const face of s.model.faces)for(const a of face)for(const b of face){
        assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`stretch at h=${h}, time=${time}, points=${a}/${b}`);
      }
      for(const i of[0,2,3])assert.ok(p[i].distanceTo(initial[i])<EPS,'fixed central triangle');
    }
  }
});

test('all four outer rectangular closures remain perpendicular rather than interpolating corners',()=>{
  for(let tick=0;tick<=768;tick++){
    const p=study.poseAt(tick/128);
    for(const[corner,a,b,c]of[[12,4,5,1],[13,6,7,3],[14,8,9,0],[15,10,11,2]]){
      assert.ok(Math.abs(p[a].clone().sub(p[c]).dot(p[b].clone().sub(p[c])))<EPS);
      assert.ok(p[corner].distanceTo(p[a].clone().add(p[b]).sub(p[c]))<EPS);
    }
  }
});

test('twist and center release avoid sampled transverse panel crossings',()=>{
  for(const h of[.1,.25,.4]){
    const s=createRoseTwistStudy(h),triangles=paperTriangles(s.model);
    for(let tick=0;tick<=768;tick++)assert.deepEqual(intersectingPanels(triangles,s.poseAt(tick/128),1),[],`crossing at ${tick/128} h=${h}`);
  }
});

test('six pauses preserve a continuous coupled motion and the flat square-twist endpoint',()=>{
  for(let boundary=1;boundary<6;boundary++){
    const before=study.poseAt(boundary-1e-6),at=study.poseAt(boundary),after=study.poseAt(boundary+1e-6);
    for(let i=0;i<at.length;i++){
      assert.ok(before[i].distanceTo(at[i])<1e-9);
      assert.ok(after[i].distanceTo(at[i])<1e-9);
    }
  }
  const final=study.poseAt(6);
  for(const p of final)assert.ok(Math.abs(p.z)<EPS,'flat endpoint');
  const corners=[[.75,-.75],[-.75,-.75],[-.75,.75],[.75,.75]];
  for(const[at,xy]of corners.entries())assert.ok(Math.hypot(final[12+at].x-xy[0],final[12+at].y-xy[1])<EPS);
  const expectedCenterHeight=.25*Math.sin(2*Math.atan(2-Math.SQRT2));
  assert.ok(Math.abs(study.poseAt(2)[1].z-expectedCenterHeight)<EPS,'center follows the added diagonal during the twist');
  assert.ok(study.poseAt(4)[1].z<EPS);
  assert.ok(study.poseAt(5)[1].z>.24,'center opens while the outer folds remain closed');
});

test('coupled poses provide continuous guides, completion and input bounds',()=>{
  for(const time of[0,.5,1,2.4,3.5,4,4.5,5.5,6]){
    const state=study.stateAt(study.model,time),p=study.poseAt(time);
    assert.ok(state.positions.every((v,i)=>v.distanceTo(p[i])<EPS));
    assert.equal(state.guides.length,time<4?5:time<6?1:0);
    for(const guide of state.guides)for(const point of guide.arrowPath)assert.ok([point.x,point.y,point.z].every(Number.isFinite));
    assert.ok(!state.movingFaces.has(0));
  }
  assert.deepEqual(study.poseAt(-10),study.poseAt(0));
  assert.deepEqual(study.poseAt(NaN),study.poseAt(0));
  assert.deepEqual(study.poseAt(Infinity),study.poseAt(6));
  for(const bad of[0,-.1,.5,NaN,Infinity])assert.throws(()=>createRoseTwistStudy(bad));
});

test('a twist mechanism is not published or counted as a finished rose',()=>{
  assert.ok(!MODELS.some(m=>m.id===study.model.id||m.id==='rose'));
  assert.ok(study.model.steps.every(s=>/unfinished.*petals.*bottom/i.test(s.caution.en)));
  assert.equal(study.model.triangles,undefined);
  assert.equal(study.model.vertexWelds,undefined);
  assert.deepEqual(study.model.sheetColors,[{front:'#d96b89',back:'#fff3ee'}]);
});
