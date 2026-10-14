import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { renderFaceOffsets } from '../src/engine/renderLayers.ts';
import { dragonCornerStudy as m } from '../src/experiments/dragonCornerStudy.ts';
import { MODELS } from '../src/modelLibrary.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
const EPS=1e-9,h=1.5/Math.SQRT2;
const corners=m.faces.flatMap((face,fi)=>face.every(i=>m.vertices[i][0]<=-.75+EPS&&m.vertices[i][1]>=.75-EPS)?[fi]:[]);

test('the preparation corner stays open and the opposite corner meets the real inner mark',()=>{
  const p=computeFoldState(m,1).positions;
  assert.ok(p[1].distanceTo(p[5])<EPS);
  assert.ok(p[3].distanceTo(p[3].clone().set(-1,1,0))<EPS);
  assert.equal(m.steps.length,6);
  assert.ok(m.steps.every(s=>s.folds.length===1&&s.folds[0].type!=='unfold'&&!s.folds[0].targets));
});

test('the strip roots carry the connected square corner, producing a white diamond',()=>{
  const p=computeFoldState(m,4).positions;
  for(const [i,x,y]of[[5,0,h],[3,0,1/Math.SQRT2],[6,.25/Math.SQRT2,1.25/Math.SQRT2],[7,-.25/Math.SQRT2,1.25/Math.SQRT2]])
    assert.ok(p[i].distanceTo(p[i].clone().set(x,y,0))<EPS,`corner ${i}`);
  assert.ok(m.steps[2].folds[0].moving.includes(3));
  assert.ok(m.steps[3].folds[0].moving.includes(3));
  assert.equal(m.steps[2].folds[0].type,'mountain');
  assert.equal(m.steps[3].folds[0].type,'valley');
  assert.equal(m.sheetColors.length,1);
  assert.equal(m.faceSheet,undefined,'no separately colored cap');
  assert.equal(corners.length,4);
  for(const fi of corners){const [a,b,c]=m.faces[fi];assert.ok(p[b].clone().sub(p[a]).cross(p[c].clone().sub(p[a])).z<0,'the physical back face points toward the viewer');}
});

test('coherent display keeps the subdivided diamond on one layer',()=>{
  const offsets=renderFaceOffsets(m,computeFoldState(m,4));
  for(const fi of corners)assert.ok(offsets[fi].distanceTo(offsets[corners[0]])<EPS);
});

test('opening the front corner leaves the rear apex and both strips fixed',()=>{
  const before=computeFoldState(m,4).positions,half=computeFoldState(m,5).positions,end=computeFoldState(m,6).positions;
  assert.ok(half[3].z>.17&&Math.abs(half[3].y-1.25/Math.SQRT2)<EPS);
  assert.ok(end[3].distanceTo(before[5])<EPS);
  for(let tick=256;tick<=384;tick++){
    const p=computeFoldState(m,tick/64).positions;
    for(const i of[0,1,2,4,5,6,7,8,9])assert.ok(p[i].distanceTo(before[i])<EPS,`dragged fixed point ${i}`);
  }
  assert.deepEqual(m.steps[4].motionRange,[0,.5]);
  assert.deepEqual(m.steps[5].motionRange,[.5,1]);
});

test('the complete corner route preserves dimensions and has no sampled transverse crossings',()=>{
  const initial=computeFoldState(m,0).positions,triangles=paperTriangles(m);
  for(let tick=0;tick<=768;tick++){
    const t=tick/128,p=computeFoldState(m,t).positions;
    for(const face of m.faces)for(const a of face)for(const b of face)
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`stretch at ${t}`);
    assert.deepEqual(intersectingPanels(triangles,p,1),[],`crossing at ${t}`);
  }
  for(let k=1;k<m.steps.length;k++){
    const a=computeFoldState(m,k-1e-6).positions,b=computeFoldState(m,k).positions,c=computeFoldState(m,k+1e-6).positions;
    // The 90-degree checkpoint is inside ONE continuous motion. Its tangent
    // is nonzero, so do not demand zero displacement across nearby times.
    // Its radius is .25/sqrt(2), and d(angle)/dt at the slice boundary is pi.
    const bound=EPS+(k===5?Math.PI*.25/Math.SQRT2*1e-6:0);
    b.forEach((p,i)=>{assert.ok(p.distanceTo(a[i])<bound);assert.ok(p.distanceTo(c[i])<bound);
      assert.ok(p.distanceTo(a[i].clone().lerp(c[i],.5))<EPS,'no jump at the checkpoint');});
  }
});

test('the corner is one connected square with no added internal paper boundary',()=>{
  const initial=computeFoldState(m,0).positions,edges=new Map(),graph=m.faces.map(()=>new Set());
  const area=paperTriangles(m).reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  for(const[fi,f]of m.faces.entries())for(let j=0;j<f.length;j++){
    const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');
    if(!edges.has(key))edges.set(key,{a,b,owners:[]});edges.get(key).owners.push(fi);
  }
  for(const{a,b,owners}of edges.values()){
    assert.ok(owners.length<=2);
    if(owners.length===1){const A=m.vertices[a],B=m.vertices[b];assert.ok([0,1].some(k=>Math.abs(Math.abs(A[k])-1)<EPS&&Math.abs(A[k]-B[k])<EPS));}
    else{graph[owners[0]].add(owners[1]);graph[owners[1]].add(owners[0]);}
  }
  const seen=new Set([0]),queue=[0];while(queue.length)for(const fi of graph[queue.pop()])if(!seen.has(fi)){seen.add(fi);queue.push(fi);}
  assert.equal(seen.size,m.faces.length);
  assert.ok(!MODELS.some(model=>model.id===m.id));
  assert.ok(m.steps.at(-1).caution.en.startsWith('Unfinished'));
});
