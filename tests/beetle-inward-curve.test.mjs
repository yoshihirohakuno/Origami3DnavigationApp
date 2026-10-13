import test from 'node:test';
import assert from 'node:assert/strict';
import {beetleArchedPoseStudy as model,beetleArchedBody as body} from '../src/experiments/beetleArchedPoseStudy.ts';
import {beetleCurvedBody as oldBody} from '../src/experiments/beetleCurvedBodyStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const EPS=5e-7;

test('inward beetle curvature reduces the outward-curling rims while preserving all appendage tips',()=>{
  const before=computeFoldState(model,111).positions,curved=computeFoldState(body.model,131).positions,old=computeFoldState(oldBody.model,131).positions;
  for(const page of body.body.beetleBodyPages){
    const seed=page.reduce((best,i)=>Math.abs(before[i].x)>Math.abs(before[best].x)?i:best,page[0]);
    assert.ok(Math.abs(curved[seed].z)<Math.abs(old[seed].z)-1e-5,'outer rim should curl less away from the spine');
  }
  for(let tick=111*8;tick<=131*8;tick++){
    const p=computeFoldState(model,tick/8).positions;
    for(const tip of[0,2,4,6,8,9,10,11,12])assert.ok(p[tip].distanceTo(before[tip])<EPS);
  }
});

test('corrected beetle curvature keeps panel dimensions, sampled clearance and six ground contacts',()=>{
  const initial=computeFoldState(model,0).positions,triangles=paperTriangles(model);
  for(let tick=0;tick<=model.steps.length*4;tick++){
    const t=tick/4,p=computeFoldState(model,t).positions;
    for(const face of model.faces)for(const a of face)for(const b of face)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`panel at ${t}`);
    if(t>=111)assert.deepEqual(intersectingPanels(triangles,p,1),[],`inward crossing at ${t}`);
  }
  const final=computeFoldState(model,144).positions;
  for(const tip of[2,4,6,8,10,12])assert.ok(Math.abs(final[tip].z+.1)<EPS);
  for(const i of new Set(model.faces.flat()))assert.ok(final[i].z>=-.1-EPS);
});

test('corrected curvature does not pretend to solve the coincident material mouth or release a beetle',()=>{
  const final=computeFoldState(model,model.steps.length).positions;
  for(const i of[38,51,41,54,44,57,47,60])assert.ok(final[i].distanceTo(final[38])<EPS,'the unresolved mouth must stay documented');
  assert.ok(!MODELS.some(m=>m.id===model.id));
  assert.match(model.steps.at(-1).caution.en,/gap.*pocket opening.*unresolved/i);
});
