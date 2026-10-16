import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { dragonStripStudy as source } from '../src/experiments/dragonStripStudy.ts';
import { dragonCentralStudy as m } from '../src/experiments/dragonCentralStudy.ts';
import { triangularPetalStudy } from '../src/experiments/triangularPetalStudy.ts';
import { MODELS } from '../src/modelLibrary.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
const EPS=1e-9,prefix=source.steps.length,op=m.steps[prefix].folds[0];

test('new material subdivisions retain every earlier fold and original material point',()=>{
  for(let tick=0;tick<=prefix*32;tick++){
    const a=computeFoldState(source,tick/32).positions,b=computeFoldState(m,tick/32).positions;
    a.forEach((p,i)=>assert.ok(p.distanceTo(b[i])<EPS,`changed original vertex ${i} at ${tick/32}`));
  }
  assert.equal(source.steps.length,12);assert.equal(source.vertices.length,49);assert.equal(source.faces.length,48);
});

test('both sides tuck by their real edge constraints while the flap root stays fixed',()=>{
  const start=computeFoldState(m,prefix).positions,axis=start[op.axis[1]].clone().sub(start[op.axis[0]]).normalize();
  const mid=computeFoldState(m,prefix+1).positions,end=computeFoldState(m,prefix+2).positions;
  assert.ok(mid[op.petal.tip].z>.15);
  for(const[point,anchor,neighbor]of op.petal.sides){
    const rigid=start[point].clone().sub(start[op.axis[0]]).applyAxisAngle(axis,-Math.PI/2).add(start[op.axis[0]]);
    assert.ok(mid[point].distanceTo(rigid)>.001,'side pleat really moves relative to the lifting panel');
    assert.ok(Math.abs(end[point].z)<1e-12,'the side pleats close exactly in the plane for the next crease');
    assert.ok(mid[anchor].distanceTo(start[anchor])<EPS);assert.ok(mid[neighbor].distanceTo(start[neighbor])<EPS);
    for(const t of[prefix+.25,prefix+.75,prefix+1.25,prefix+1.75]){
      const p=computeFoldState(m,t).positions;
      for(const i of[anchor,neighbor,op.petal.tip])assert.ok(Math.abs(p[point].distanceTo(p[i])-start[point].distanceTo(start[i]))<EPS);
    }
  }
  assert.deepEqual(m.steps[prefix].motionRange,[0,.5]);assert.deepEqual(m.steps[prefix+1].motionRange,[.5,1]);
  assert.ok(end[op.petal.tip].distanceTo(computeFoldState(source,11).positions[5])>.04,'the new retained fold does not simply undo the previous corner fold');
});

test('all 16 operations preserve panel dimensions and avoid sampled transverse crossings',()=>{
  const initial=computeFoldState(m,0).positions,tri=paperTriangles(m);
  for(let tick=0;tick<=2048;tick++){
    const time=tick/128,p=computeFoldState(m,time).positions;
    for(const face of m.faces)for(const a of face)for(const b of face)
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`stretch at ${time}`);
    assert.deepEqual(intersectingPanels(tri,p,1),[],`crossing at ${time}`);
  }
});

test('the refined original square is connected and has no new free edge or T junction',()=>{
  const initial=computeFoldState(m,0).positions,edges=new Map(),graph=m.faces.map(()=>new Set());
  const area=paperTriangles(m).reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  for(const[fi,f]of m.faces.entries())for(let j=0;j<f.length;j++){
    const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');
    if(!edges.has(key))edges.set(key,{a,b,owners:[]});edges.get(key).owners.push(fi);
  }
  for(const{a,b,owners}of edges.values()){
    assert.ok(owners.length<=2);
    if(owners.length===1){const A=m.vertices[a],B=m.vertices[b];assert.ok([0,1].some(k=>Math.abs(Math.abs(A[k])-1)<EPS&&Math.abs(A[k]-B[k])<EPS),`internal free boundary ${a},${b}`);}
    else{graph[owners[0]].add(owners[1]);graph[owners[1]].add(owners[0]);}
  }
  const seen=new Set([0]),queue=[0];while(queue.length)for(const fi of graph[queue.pop()])if(!seen.has(fi)){seen.add(fi);queue.push(fi);}
  assert.equal(seen.size,m.faces.length);
});

test('the middle checkpoint stays continuous and the later whole-sheet turnover is rigid',()=>{
  for(let k=1;k<m.steps.length;k++){
    const a=computeFoldState(m,k-1e-6).positions,b=computeFoldState(m,k).positions,c=computeFoldState(m,k+1e-6).positions;
    const bound=k===prefix+1?1e-6:EPS;
    b.forEach((p,i)=>{assert.ok(p.distanceTo(a[i])<bound,`left jump at ${k}`);assert.ok(p.distanceTo(c[i])<bound,`right jump at ${k}`);
      assert.ok(p.distanceTo(a[i].clone().lerp(c[i],.5))<EPS,`unequal tangents at ${k}`);});
  }
  const a=computeFoldState(m,14).positions,b=computeFoldState(m,15).positions,y=a[8].y;
  a.forEach((p,i)=>assert.ok(Math.hypot(p.x-b[i].x,p.y+b[i].y-2*y,p.z+b[i].z)<EPS));
});

test('the material center crease supports the next book fold without splitting a panel',()=>{
  const a=computeFoldState(m,15).positions,b=computeFoldState(m,16).positions;
  assert.ok(m.faces.every(f=>!f.some(i=>a[i].x< -EPS)||!f.some(i=>a[i].x>EPS)));
  a.forEach((p,i)=>{
    if(p.x< -EPS)assert.ok(Math.hypot(p.x+b[i].x,p.y-b[i].y,p.z+b[i].z)<EPS);
    else assert.ok(p.distanceTo(b[i])<EPS);
  });
});

test('the upper white layer and body remain fixed throughout the coupled central fold',()=>{
  const start=computeFoldState(m,12).positions;
  for(let tick=12*32;tick<=14*32;tick++){
    const p=computeFoldState(m,tick/32).positions;
    for(const i of[0,1,2,4,8,9,38,44])assert.ok(p[i].distanceTo(start[i])<EPS,`dragged fixed point ${i}`);
  }
});

test('unverified crease placement remains a private experiment, with no added sheet or vertex morph',()=>{
  assert.ok(!MODELS.some(model=>model.id===m.id));
  assert.equal(m.faceSheet,undefined);assert.equal(m.sheetColors.length,1);
  assert.ok(m.steps.every(s=>s.folds.every(f=>!f.targets&&f.type!=='unfold')));
  assert.ok(m.steps.at(-1).caution.en.startsWith('Unfinished'));
  assert.throws(()=>triangularPetalStudy(source,5,44,38,0),/flat symmetric/);
  assert.throws(()=>triangularPetalStudy(source,5,44,38,NaN),/flat symmetric/);
  assert.throws(()=>triangularPetalStudy(source,5,5,38),/three distinct/);
});
