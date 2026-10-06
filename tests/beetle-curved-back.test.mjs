import test from 'node:test';
import assert from 'node:assert/strict';
import {beetleCurvedBody as bodyInfo} from '../src/experiments/beetleCurvedBodyStudy.ts';
import {beetleCurvedPoseStudy as model,beetleCurvedPose as poseInfo} from '../src/experiments/beetleCurvedPoseStudy.ts';
import {beetlePoseStudy as previous} from '../src/experiments/beetlePoseStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const EPS=5e-7,feet=[2,4,6,8,10,12],tips=[0,...feet,9,11];

test('twenty material hinges round four body layers without moving the eight appendage tips',()=>{
  assert.equal(model.steps.length,144);
  assert.equal(bodyInfo.curveStart,111);
  assert.equal(poseInfo.beetlePoseCoreEnd,131);
  const start=computeFoldState(model,bodyInfo.curveStart).positions;
  for(let page=0;page<4;page++){
    const operations=model.steps.slice(bodyInfo.curveStart+page*5,bodyInfo.curveStart+(page+1)*5);
    assert.equal(operations.length,5);
    for(const step of operations){
      assert.equal(step.folds.length,1);
      assert.equal(step.folds[0].angle,8);
      assert.ok(step.folds[0].moving.length>0);
    }
    const outer=operations[0].folds[0].moving;
    assert.ok(outer.some(i=>computeFoldState(model,131).positions[i].distanceTo(start[i])>.01));
  }
  for(let tick=111*16;tick<=131*16;tick++){
    const p=computeFoldState(model,tick/16).positions;
    for(const tip of tips)assert.ok(p[tip].distanceTo(start[tip])<EPS,`curvature dragged appendage ${tip}`);
  }
  assert.equal(model.triangles,undefined);
});

test('new back creases keep the original preparation and all panel dimensions throughout 144 operations',()=>{
  const initial=computeFoldState(model,0).positions;
  const material=bodyInfo.body.model.vertices.length;
  const area=paperTriangles(model).reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<1e-8);
  for(let tick=0;tick<=model.steps.length*8;tick++){
    const time=tick/8,p=computeFoldState(model,time).positions;
    for(const face of model.faces)for(const a of face)for(const b of face){
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`panel ${a}/${b} at ${time}`);
    }
    if(time<=111){
      const old=computeFoldState(previous,time).positions;
      for(let i=0;i<material;i++)assert.ok(p[i].distanceTo(old[i])<EPS,`earlier motion changed at ${time}`);
    }
  }
});

test('new back and finishing hinges form one connected sheet with no internal free boundary',()=>{
  const used=[...new Set(model.faces.flat())],edges=new Map(),neighbors=model.faces.map(()=>new Set());
  const coincident=[];
  for(const [j,a]of used.entries())for(const b of used.slice(j+1)){
    if(Math.hypot(model.vertices[a][0]-model.vertices[b][0],model.vertices[a][1]-model.vertices[b][1])<1e-10)coincident.push([a,b]);
  }
  let fi=0;
  for(const f of model.faces)for(let j=0;j<f.length;j++){
    const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');
    if(!edges.has(key))edges.set(key,{a,b,owners:[]});
    edges.get(key).owners.push(fi);
    if(j===f.length-1)fi++;
  }
  let hingeCount=0;
  for(const {a,b,owners}of edges.values()){
    const A=model.vertices[a],B=model.vertices[b],dx=B[0]-A[0],dy=B[1]-A[1],den=dx*dx+dy*dy;
    assert.ok(den>1e-16,'no degenerate material edge');
    assert.ok(owners.length<=2,'paper cannot branch into extra faces');
    if(owners.length===1){
      assert.ok([0,1].some(k=>Math.abs(Math.abs(A[k])-1)<1e-9&&Math.abs(A[k]-B[k])<1e-9),`open interior boundary ${a}/${b}`);
    } else {
      neighbors[owners[0]].add(owners[1]);neighbors[owners[1]].add(owners[0]);hingeCount++;
    }
    for(const i of used){
      if(i===a||i===b)continue;
      const q=model.vertices[i],t=((q[0]-A[0])*dx+(q[1]-A[1])*dy)/den;
      assert.ok(!(t>1e-9&&t<1-1e-9&&Math.hypot(q[0]-A[0]-t*dx,q[1]-A[1]-t*dy)<1e-9),`unsplit material edge ${a}/${b}`);
    }
  }
  assert.ok(hingeCount>model.faces.length);
  const reached=new Set([0]),queue=[0];
  while(queue.length)for(const neighbor of neighbors[queue.pop()])if(!reached.has(neighbor)){reached.add(neighbor);queue.push(neighbor);}
  assert.equal(reached.size,model.faces.length,'all panels belong to the same sheet');
  for(let tick=0;tick<=model.steps.length*8;tick++){
    const p=computeFoldState(model,tick/8).positions;
    for(const[a,b]of coincident)assert.ok(p[a].distanceTo(p[b])<EPS,`detached material at ${tick/8}`);
  }
});

test('curved back and subsequent horns, knees and feet avoid sampled transverse intersections',()=>{
  const triangles=paperTriangles(model);
  for(let tick=111*8;tick<=model.steps.length*8;tick++){
    assert.deepEqual(intersectingPanels(triangles,computeFoldState(model,tick/8).positions,1),[],`crossing at ${tick/8}`);
  }
});

test('six feet support the curved-back pose without paper extending below their common plane',()=>{
  const p=computeFoldState(model,model.steps.length).positions,plane=poseInfo.beetleFootPlane;
  for(const tip of feet)assert.ok(Math.abs(p[tip].z-plane)<EPS,`foot ${tip} is off the floor`);
  for(const i of new Set(model.faces.flat()))assert.ok(p[i].z>=plane-EPS,`paper ${i} passes below the floor`);
  for(let tick=poseInfo.beetlePoseHookStart*8;tick<=model.steps.length*8;tick++){
    const q=computeFoldState(model,tick/8).positions;
    for(const tip of feet)assert.ok(Math.abs(q[tip].z-plane)<EPS);
  }
});

test('curvature is not presented as a verified pocket or a released beetle',()=>{
  assert.ok(!MODELS.some(m=>m.id===model.id));
  assert.match(model.steps.at(-1).caution.en,/unfinished.*opening.*unverified/i);
  assert.ok(model.steps.every(s=>s.folds.length===1&&s.folds.every(op=>!op.targets&&op.type!=='unfold')));
  for(const face of model.faces){
    const signed=face.reduce((sum,a,j)=>{const b=face[(j+1)%face.length];return sum+model.vertices[a][0]*model.vertices[b][1]-model.vertices[b][0]*model.vertices[a][1];},0);
    assert.ok(signed>0,'use one consistent original paper side');
  }
  assert.deepEqual(model.sheetColors,[{front:'#805032',back:'#f3e6ca'}]);
});
