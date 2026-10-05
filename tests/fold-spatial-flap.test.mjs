import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { foldSpatialFlap } from '../src/engine/foldSpatialFlap.ts';
import { computeFoldState } from '../src/engine/fold.ts';

const caption = { description: { ja: '先端を曲げます。', en: 'Bend the tip.' } };
const material = { id: 'spatial-test', name: {ja:'試験',en:'Test'}, difficulty:1,
  vertices:[[-1,-1],[1,-1],[1,1],[-1,1],[.5,0]],
  faces:[[0,1,4],[1,2,4],[2,3,4],[3,0,4]], steps:[] };
const tilted = { ...material, steps:[{...caption, folds:[{axis:[0,1],moving:[2,3,4],type:'assemble',angle:65,direction:1}]}] };
function frame(m) {
  const p=computeFoldState(m,m.steps.length).positions;
  return {origin:p[0].clone().lerp(p[3],.5).add(new Vector3(1,0,0)),
    crease:p[3].clone().sub(p[0]), toward:new Vector3(1,0,0)};
}
function folded(m=tilted) {
  const {origin,crease,toward}=frame(m);
  return foldSpatialFlap(m,1,origin,crease,toward,55,1,caption);
}

test('a tilted flap rotates on its actual crease and preserves every panel throughout the route',()=>{
  const m=folded(), initial=computeFoldState(m,0).positions;
  const op=m.steps.at(-1).folds[0], before=computeFoldState(m,1).positions;
  for(let tick=0;tick<=32;tick++){
    const p=computeFoldState(m,tick/16).positions;
    for(const face of m.faces)for(const a of face)for(const b of face)
      assert.ok(Math.abs(initial[a].distanceTo(initial[b])-p[a].distanceTo(p[b]))<1e-9,`panel at ${tick/16}`);
    if(tick>=16)for(const i of [0,3,...op.axis])assert.ok(p[i].distanceTo(before[i])<1e-9,'stationary material and crease stay fixed');
  }
  assert.ok(computeFoldState(m,2).positions[2].distanceTo(before[2])>.1,'connected remote tip moves');
  assert.equal(tilted.vertices.length,5); assert.equal(tilted.steps.length,1);
});

test('spatial authoring keeps a coincident independent sheet fixed',()=>{
  const m={...tilted,vertices:[...material.vertices,...material.vertices],
    faces:[...material.faces,...material.faces.map(f=>f.map(i=>i+5))],
    faceSheet:[0,0,0,0,1,1,1,1],steps:tilted.steps.map(s=>({...s,folds:s.folds.map(op=>({...op,moving:[...op.moving,...op.moving.map(i=>i+5)]}))}))};
  const f=folded(m), before=computeFoldState(f,1).positions;
  for(let tick=1;tick<=16;tick++)for(let i=5;i<10;i++)assert.ok(computeFoldState(f,1+tick/16).positions[i].distanceTo(before[i])<1e-9);
  assert.equal(f.faceSheet.filter(s=>s===1).length,4);
});

test('new material points remain on their parent edges through earlier tilted poses',()=>{
  const m=folded(), bindings=m.steps[0].folds[0].surfacePoints;
  assert.ok(bindings.length>0);
  for(let tick=0;tick<=16;tick++){
    const p=computeFoldState(m,tick/16).positions;
    for(const [i,a,b,,u,v]of bindings)assert.ok(p[i].distanceTo(p[a].clone().multiplyScalar(u).addScaledVector(p[b],v))<1e-9);
  }
});

test('nonplanar material is rejected instead of flattened or stretched',()=>{
  const bent={...material,steps:[{...caption,folds:[{axis:[0,4],moving:[1],angle:35,direction:1,type:'valley'}]}]};
  assert.throws(()=>foldSpatialFlap(bent,2,new Vector3(),new Vector3(0,1,0),new Vector3(1,0,0),30,1,caption),/not planar/);
});

test('spatial creases reject invalid frames, seeds and angles',()=>{
  const o=new Vector3(),a=new Vector3(0,1,0),b=new Vector3(1,0,0);
  assert.throws(()=>foldSpatialFlap(material,-1,o,a,b,30,1,caption),/invalid spatial/);
  assert.throws(()=>foldSpatialFlap(material,1,o,a,a,30,1,caption),/perpendicular/);
  assert.throws(()=>foldSpatialFlap(material,0,o,a,b,30,1,caption),/moving side/);
  assert.throws(()=>foldSpatialFlap(material,1,o,a,b,NaN,1,caption),/invalid spatial/);
});
