import test from 'node:test';
import assert from 'node:assert/strict';
import { foldConnectedFlap } from '../src/engine/foldConnectedFlap.ts';
import { computeFoldState } from '../src/engine/fold.ts';

const caption={description:{ja:'右側を折ります。',en:'Fold the right flap.'}};
const material={id:'connected-test',name:{ja:'試験',en:'Test'},difficulty:1,
 vertices:[[-1,-1],[1,-1],[1,1],[-1,1],[.5,0]],
 faces:[[0,1,4],[1,2,4],[2,3,4],[3,0,4]],steps:[]};

test('connected selection carries subdivided faces beyond the seed corner',()=>{
 const m=foldConnectedFlap(material,1,[0,0],90,caption,'front',60);
 const initial=computeFoldState(m,0).positions;
 for(let tick=1;tick<=16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const face of m.faces)for(const a of face)for(const b of face){
   assert.ok(Math.abs(initial[a].distanceTo(initial[b])-p[a].distanceTo(p[b]))<1e-9);
  }
  assert.ok(p[0].distanceTo(initial[0])<1e-9);
  assert.ok(p[3].distanceTo(initial[3])<1e-9);
  assert.ok(p[2].distanceTo(initial[2])>0,'the distant part of the flap must also move');
 }
 assert.equal(material.steps.length,0,'do not mutate the source route');
});

test('coincident, disconnected sheets are not selected by spatial overlap',()=>{
 const m={...material,vertices:[...material.vertices,...material.vertices],
  faces:[...material.faces,...material.faces.map(f=>f.map(i=>i+5))],
  faceSheet:[0,0,0,0,1,1,1,1]};
 const folded=foldConnectedFlap(m,1,[0,0],90,caption);
 const before=computeFoldState(folded,0).positions,after=computeFoldState(folded,1).positions;
 for(let i=5;i<10;i++)assert.ok(before[i].distanceTo(after[i])<1e-9,'another sheet must remain fixed');
});

test('XY authoring rejects a nonplanar flap rather than stretching it',()=>{
 const tilted={...material,steps:[{...caption,folds:[{axis:[0,1],moving:[2,3,4],type:'assemble',angle:30,direction:1}]}]};
 assert.throws(()=>foldConnectedFlap(tilted,1,[0,0],90,caption),/not flat/);
});

test('invalid seeds, a seed on the crease, and invalid angles fail clearly',()=>{
 assert.throws(()=>foldConnectedFlap(material,[],[0,0],90,caption),/invalid flap seeds/);
 assert.throws(()=>foldConnectedFlap(material,-1,[0,0],90,caption),/invalid flap seeds/);
 assert.throws(()=>foldConnectedFlap(material,4,[.5,0],90,caption),/same side/);
 assert.throws(()=>foldConnectedFlap(material,[0,1],[0,0],90,caption),/same side/);
 assert.throws(()=>foldConnectedFlap(material,1,[0,0],90,caption,'front',NaN),/invalid flap crease or angle/);
});
