import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { faceIsVisible } from '../src/engine/sheetVisibility.ts';
import { sonobeCubeModel } from '../src/models/sonobeCube.ts';
import { sonobeOctahedronModel } from '../src/models/sonobeOctahedron.ts';
import { sonobeIcosahedronModel } from '../src/models/sonobeIcosahedron.ts';
import { sonobeTriangularBipyramidModel } from '../src/models/sonobeTriangularBipyramid.ts';
import { sonobePentagonalBipyramidModel } from '../src/models/sonobePentagonalBipyramid.ts';
import { buildStepDiagrams } from '../src/CreasePattern.tsx';
import { renderFaceOffsets } from '../src/engine/renderLayers.ts';
import { removeHiddenLayers } from '../src/engine/painter.ts';
const entries = [[sonobeCubeModel,6,54], [sonobeOctahedronModel,12,120], [sonobeIcosahedronModel,30,300],
  [sonobeTriangularBipyramidModel,9,84], [sonobePentagonalBipyramidModel,15,150]];

for (const [model,sheets,stages] of entries) {
  test(`${model.id}: all sheets retain their area, dimensions and seams throughout assembly`, () => {
    assert.equal(model.sheetColors.length,sheets);
    assert.equal(model.steps.length,stages);
    assert.ok(model.steps.every(s=>s.folds.filter(isGuideFold).length===1));
    assert.ok(model.steps.every(s=>s.folds.every(op=>!op.targets && op.type!=='unfold')));
    const initial=computeFoldState(model,0).positions, areas=Array(sheets).fill(0), groups=new Map();
    for (const [fi,face] of model.faces.entries()) {
      const sheet=model.faceSheet[fi], a=initial[face[0]];
      for(let i=1;i<face.length-1;i++)areas[sheet]+=initial[face[i]].clone().sub(a).cross(initial[face[i+1]].clone().sub(a)).length()/2;
      for(const vi of face){
        const key=[sheet,...model.vertices[vi].map(n=>n.toFixed(8))].join(',');
        if(!groups.has(key))groups.set(key,new Set());
        groups.get(key).add(vi);
      }
    }
    for(const area of areas) assert.ok(Math.abs(area-4)<1e-8,'each module starts as one intact square');
    for(let tick=0;tick<=stages*4;tick++){
      const t=tick/4, p=computeFoldState(model,t).positions;
      for(const face of model.faces)for(const a of face)for(const b of face)
        assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`rigid panel at ${t}`);
      for(const group of groups.values()){
        const first=p[group.values().next().value];
        for(const vi of group)assert.ok(p[vi].distanceTo(first)<.00003,`paper seam at ${t}`);
      }
    }
  });
  test(`${model.id}: new paper appears only when needed, including backwards navigation`,()=>{
    for(let sheet=0;sheet<sheets;sheet++){
      const face=model.faceSheet.indexOf(sheet), start=model.sheetStartSteps[sheet];
      assert.ok(faceIsVisible(model,face,computeFoldState(model,start)));
      if(sheet)assert.ok(!faceIsVisible(model,face,computeFoldState(model,start-.01)));
      assert.ok(faceIsVisible(model,face,computeFoldState(model,stages)));
    }
    const serialized=JSON.parse(JSON.stringify(model));
    for(const t of [0,8.5,stages/2,stages-.5,stages]){
      const p=computeFoldState(model,t), q=computeFoldState(serialized,t);
      assert.ok(p.positions.every((v,i)=>v.distanceTo(q.positions[i])<1e-10));
      assert.deepEqual(model.faces.map((_,fi)=>faceIsVisible(model,fi,p)),serialized.faces.map((_,fi)=>faceIsVisible(serialized,fi,q)));
    }
  });
}

test('six modules close into a cube of edge sqrt(1/2), without stray paper at the workbench',()=>{
  const p=computeFoldState(sonobeCubeModel,54).positions, limit=1/(2*Math.SQRT2);
  for(const vi of new Set(sonobeCubeModel.faces.flat()))
    for(const n of p[vi].toArray())assert.ok(Math.abs(n)<=limit+.00004);
  for(const axis of ['x','y','z'])for(const sign of [-1,1])
    assert.ok([...new Set(sonobeCubeModel.faces.flat())].some(vi=>Math.abs(p[vi][axis]-sign*limit)<.00004));
});

test('300-step route thumbnails do not overflow the JavaScript argument stack',()=>{
  assert.equal(buildStepDiagrams(sonobeIcosahedronModel).length,300);
});

test('display separation works on later sheets and does not alter folding geometry',()=>{
  const m=sonobeIcosahedronModel, plain={...m,renderLayerSeparation:undefined,assemblyFaceInsets:undefined};
  for(const t of [6,16,146,150,296,300]){
    const state=computeFoldState(m,t), expected=computeFoldState(plain,t).positions;
    const offsets=renderFaceOffsets(m,state);
    assert.ok(state.positions.every((p,i)=>p.distanceTo(expected[i])===0));
    assert.ok(offsets.every(p=>p.toArray().every(Number.isFinite)&&p.length()<.0025));
    const sheet=Math.min(29,Math.floor(t/10));
    assert.ok(offsets.some((p,fi)=>m.faceSheet[fi]===sheet&&p.length()>1e-6)||t%10===0);
  }
});

test('SVG occlusion removes covered layers but retains partially exposed paper',()=>{
  const triangle=(face,z,x=0)=>({face,points:[{x,y:0,z},{x:x+1,y:0,z},{x,y:1,z}]});
  assert.deepEqual(removeHiddenLayers([triangle(0,0),triangle(1,1)]).map(p=>p.face),[1]);
  assert.deepEqual(removeHiddenLayers([triangle(0,0),triangle(1,0)]).map(p=>p.face),[1]);
  assert.equal(removeHiddenLayers([triangle(0,0),triangle(1,1,.25)]).length,2);
  assert.equal(removeHiddenLayers([triangle(0,1),triangle(1,0,.25)]).length,2);
});
