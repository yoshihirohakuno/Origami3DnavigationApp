import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState } from '../src/engine/fold.ts';
import { foldConnectedFlap } from '../src/engine/foldConnectedFlap.ts';
import { renderFaceOffsets } from '../src/engine/renderLayers.ts';
import { frontSide } from './helpers/front-side.mjs';

const caption={description:{ja:'折る',en:'Fold'}};
function fixture(sweep='front'){
  let m={id:'unequal-overlapping-panels',name:caption.description,difficulty:1,
    vertices:[[-1,-1],[1,-1],[1,1],[-1,1],[0,0]],
    faces:[[0,1,4],[1,2,4],[2,3,4],[3,0,4]],steps:[],
    renderLayerSeparation:.00004,renderCoherentPanels:true,renderFoldStack:true};
  m=foldConnectedFlap(m,3,[-.75,.75],45,caption);
  return foldConnectedFlap(m,[0,3],[.5,0],90,caption,sweep);
}

test('turning an unequal stack over reverses its layers, regardless of panel centroid distance',()=>{
  const m=fixture();
  assert.equal(frontSide(m,1,-.7,.71),-1,'the small folded corner starts above the body');
  assert.equal(frontSide(m,2,1.7,.71),-1,'the body turns over to lie above the small corner');
  // This point reproduced the old approach-centroid ordering defect.
  assert.equal(frontSide({...m,renderFoldStack:false},2,1.7,.71),1);
});

test('a whole-sheet turnover transports the existing stack without sorting it again',()=>{
  const m=fixture(),a=computeFoldState(m,2);
  // Vertex 4 is on x=1 after the second fold; vertex 1 is on x=1 too.
  const turned={...m,steps:[...m.steps,{...caption,folds:[{
    axis:[4,1],moving:m.vertices.map((_,i)=>i),type:'assemble',angle:180,direction:1,
  }]}]};
  const b=computeFoldState(turned,3),oa=renderFaceOffsets(m,a),ob=renderFaceOffsets(turned,b);
  oa.forEach((offset,i)=>assert.ok(Math.abs(offset.z+ob[i].z)<1e-9));
  assert.equal(frontSide(turned,3,.8,.11),1,'the previously rear body side faces forward');
  assert.equal(frontSide(turned,3,.3,.71),-1,'the reverse of the small corner is exposed');
});

test('stack display does not change any physical paper position',()=>{
  const m=fixture(),plain={...m,renderFoldStack:false};
  for(let tick=0;tick<=128;tick++){
    const a=computeFoldState(m,tick/64),b=computeFoldState(plain,tick/64);
    renderFaceOffsets(m,a);
    a.positions.forEach((p,i)=>assert.ok(p.distanceTo(b.positions[i])<1e-12));
  }
});

test('front and back sweeps place the reversed stack on the correct side of stationary paper',()=>{
  assert.equal(frontSide(fixture('front'),2,.75,-.31),-1,'front sweep lies above the stationary blue face');
  assert.equal(frontSide(fixture('back'),2,.75,-.31),1,'back sweep lies beneath the stationary blue face');
});
