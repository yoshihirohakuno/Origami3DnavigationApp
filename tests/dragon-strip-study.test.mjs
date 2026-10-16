import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { dragonStripStudy as m } from '../src/experiments/dragonStripStudy.ts';
import { MODELS } from '../src/modelLibrary.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
import { frontSide } from './helpers/front-side.mjs';
const EPS=1e-9,h=1.5/Math.SQRT2,w=.5/Math.SQRT2;

test('omitting precreases retains the required whole-sheet turnover before the strip roots',()=>{
  assert.equal(m.steps.length,12);
  const turn=m.steps[2].folds[0];
  assert.equal(turn.type,'assemble');assert.equal(turn.angle,180);
  const a=computeFoldState(m,2).positions,b=computeFoldState(m,3).positions;
  a.forEach((p,i)=>assert.ok(Math.hypot(p.x+b[i].x,p.y-b[i].y,p.z+b[i].z)<EPS));
  assert.ok(m.steps.every(s=>s.folds.length===1&&!s.folds[0].targets&&s.folds[0].type!=='unfold'));
});

test('each long strip narrows to one quarter of its retained root width',()=>{
  const p=computeFoldState(m,11).positions;
  for(const side of [0,1]){
    const ids=m.vertices.flatMap(([x,y],i)=>
      (side===0?y>=.75-EPS&&x<=-.75-EPS:x<=-.75+EPS&&y<=.75-EPS)?[i]:[]);
    const distances=ids.map(i=>p[i].y+(side===0?-p[i].x:p[i].x));
    assert.ok(ids.length>3);
    assert.ok(Math.abs(Math.max(...distances)-h)<EPS);
    assert.ok(Math.abs(Math.max(...distances)-Math.min(...distances)-w/4)<EPS);
  }
});

test('the final white diamond and colored strips come from physical sides and retained stack order',()=>{
  const center=1.25/Math.SQRT2;
  for(const x of[-.03,.03])for(const y of[center-.1,center,center+.1])
    assert.equal(frontSide(m,12,x,y),-1,`white diamond at ${x},${y}`);
  for(const x of[-.61,.61])assert.equal(frontSide(m,12,x,.41),1,'colored narrow strip');
  assert.equal(frontSide(m,12,.17,.3),1,'colored body');
  assert.equal(m.sheetColors.length,1);assert.equal(m.faceSheet,undefined);
});

test('the connected route retains panel dimensions and has no sampled transverse crossings',()=>{
  const initial=computeFoldState(m,0).positions,tri=paperTriangles(m);
  for(let tick=0;tick<=1536;tick++){
    const time=tick/128,p=computeFoldState(m,time).positions;
    for(const face of m.faces)for(const a of face)for(const b of face)
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`stretch at ${time}`);
    assert.deepEqual(intersectingPanels(tri,p,1),[],`crossing at ${time}`);
  }
  for(let k=1;k<m.steps.length;k++){
    const a=computeFoldState(m,k-1e-6).positions,b=computeFoldState(m,k).positions,c=computeFoldState(m,k+1e-6).positions;
    b.forEach((p,i)=>{assert.ok(p.distanceTo(a[i])<EPS);assert.ok(p.distanceTo(c[i])<EPS);});
  }
});

test('the original square remains one connected sheet with no internal free boundary',()=>{
  const p=computeFoldState(m,0).positions,edges=new Map(),graph=m.faces.map(()=>new Set());
  const area=paperTriangles(m).reduce((sum,[,a,b,c])=>sum+p[b].clone().sub(p[a]).cross(p[c].clone().sub(p[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  for(const[fi,face]of m.faces.entries())for(let j=0;j<face.length;j++){
    const a=face[j],b=face[(j+1)%face.length],key=[a,b].sort((x,y)=>x-y).join(',');
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
