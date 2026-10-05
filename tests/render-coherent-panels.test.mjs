import test from 'node:test';
import assert from 'node:assert/strict';
import {computeFoldState} from '../src/engine/fold.ts';
import {renderFaceOffsets} from '../src/engine/renderLayers.ts';

function model(refined=false){
 const vertices=refined?[[-1,-1],[0,-1],[1,-1],[1,0],[0,0],[1,1],[0,1],[-1,1]]
  :[[-1,-1],[0,-1],[1,-1],[1,1],[0,1],[-1,1]];
 return {id:'coherent-test',name:{ja:'検査',en:'test'},difficulty:1,vertices,
  faces:refined?[[0,1,6,7],[1,2,3,4],[4,3,5,6]]:[[0,1,4],[0,4,5],[1,2,3],[1,3,4]],
  renderLayerSeparation:.0001,renderCoherentPanels:true,
  steps:[{description:{ja:'右側を折る',en:'Fold the right half'},folds:[{
   axis:refined?[1,6]:[1,4],moving:refined?[2,3,5]:[2,3],type:'valley',direction:-1,angle:180,
  }]}],
 };
}
function offsets(m){return renderFaceOffsets(m,computeFoldState(m,1)).map(v=>v.z);}

test('a continuous planar surface has one display depth, while the folded layer stays separate',()=>{
 const m=model(),z=offsets(m);
 assert.equal(z[0],z[1]);assert.equal(z[2],z[3]);
 assert.ok(z[2]>z[0]);
 const legacy={...m,renderCoherentPanels:undefined};
 assert.notEqual(offsets(legacy)[0],offsets(legacy)[1],'this reproduces the old subdivision-dependent offsets');
 assert.deepEqual(computeFoldState(m,.5).positions,computeFoldState(legacy,.5).positions);
});

test('T-junction subdivisions preserve both the connected surface and its layer order',()=>{
 const coarse=offsets(model()),fine=offsets(model(true));
 assert.equal(fine[1],fine[2]);
 assert.equal(coarse[0],fine[0]);assert.equal(coarse[2],fine[1]);
});

test('point contact and coincident edges of separate sheets never merge display layers',()=>{
 const point=model();
 point.vertices.push([-2,1],[-1,2]);point.faces.push([5,6,7]);
 const z=offsets(point);assert.notEqual(z[0],z[4]);
 const sheets=model();sheets.faces=[[0,1,4,5],[1,2,3,4],[1,2,3,4]];sheets.faceSheet=[0,1,2];
 const separate=offsets(sheets);assert.notEqual(separate[1],separate[2]);
});

test('a real physical depth gap is preserved despite a shared material edge',()=>{
 const m=model(true);
 m.steps[0].folds[0].translate=[0,0,-.001];
 const state=computeFoldState(m,1),z=renderFaceOffsets(m,state).map(v=>v.z);
 assert.equal(z[1],z[2]);
 assert.ok(state.positions[2].z+z[1]<state.positions[0].z+z[0]);
});
