import test from 'node:test';
import assert from 'node:assert/strict';
import {computeFoldState} from '../src/engine/fold.ts';
import {renderFaceOffsets} from '../src/engine/renderLayers.ts';

function foldWithDrift(noise,tolerance){
 return {id:'flat-drift',name:{ja:'検査',en:'test'},difficulty:1,
  vertices:[[-1,-1],[0,-1],[1,-1],[1,1],[0,1],[-1,1]],
  faces:[[0,1,4],[0,4,5],[1,2,3],[1,3,4]],
  renderLayerSeparation:.0001,...(tolerance!==undefined?{renderLayerDepthTolerance:tolerance}:{}),
  steps:[{description:{ja:'右側を折る',en:'Fold the right half'},folds:[{axis:[1,4],moving:[2,3],type:'valley',direction:-1,angle:180,translate:[0,0,noise]}]}],
 };
}
function frontDepths(model){
 const state=computeFoldState(model,1),offsets=renderFaceOffsets(model,state);
 return model.faces.map((f,i)=>f.reduce((z,v)=>z+state.positions[v].z,0)/f.length+offsets[i].z);
}
test('coplanar-mechanism tolerance preserves the approached layer for either sign of tiny depth drift',()=>{
 for(const noise of[-4e-8,0,4e-8]){
  const depth=frontDepths(foldWithDrift(noise,5e-7));
  assert.ok(Math.min(...depth.slice(2))>Math.max(...depth.slice(0,2)),'the folded half should stay in front');
 }
});
test('the default still honors actual separated depth and the opt-in never changes folding geometry',()=>{
 const defaultModel=foldWithDrift(-4e-8),tolerantModel=foldWithDrift(-4e-8,5e-7);
 const depth=frontDepths(defaultModel);
 assert.ok(Math.max(...depth.slice(2))<Math.min(...depth.slice(0,2)));
 assert.deepEqual(computeFoldState(defaultModel,.5).positions,computeFoldState(tolerantModel,.5).positions);
 const actual=frontDepths(foldWithDrift(-.001,5e-7));
 assert.ok(Math.max(...actual.slice(2))<Math.min(...actual.slice(0,2)),'larger physical layer depth must still be honored');
});
