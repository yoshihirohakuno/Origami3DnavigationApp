import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { dragonBaseStudy as base } from '../src/experiments/dragonBaseStudy.ts';
import { dragonWingStudy as model, dragonWingPleatRanges } from '../src/experiments/dragonWingStudy.ts';
import { MODELS } from '../src/modelLibrary.ts';
import { intersectingPanels } from '../tools/panel-intersections.mjs';
const EPS=1e-9,inner=1.5/Math.SQRT2,width=.5/Math.SQRT2;

test('both wing strips have four retained folds, each in its own operation',()=>{
  assert.equal(model.steps.length,11);
  assert.deepEqual(dragonWingPleatRanges,[[3,7],[7,11]]);
  for(const step of model.steps.slice(3)){
    assert.equal(step.folds.length,1);
    assert.equal(step.folds[0].angle,180);
    assert.equal(step.folds[0].type,'valley');
    assert.ok(!step.folds[0].targets&&!step.folds[0].translate);
  }
});

test('wing refinement preserves the earlier offset preparation',()=>{
  for(let tick=0;tick<=96;tick++){
    const t=tick/32,a=computeFoldState(base,t).positions,b=computeFoldState(model,t).positions;
    a.forEach((p,i)=>assert.ok(p.distanceTo(b[i])<EPS,`base changed at ${t}/${i}`));
  }
});

test('all coincident quarter-panels join the next fold and close to a quarter-width band',()=>{
  const p=computeFoldState(model,11).positions;
  // A free corner sits ON the second hinge. It must rejoin the third fold:
  // selecting just the previous hinge leaves this layer stranded.
  assert.ok(model.steps[5].folds[0].moving.includes(0));
  assert.ok(model.steps[9].folds[0].moving.includes(2));
  for(const side of[0,1]){
    const distances=model.vertices.flatMap(([x,y],i)=>{
      if((side===0?x>-.75+EPS:y<.75-EPS)||x-y< -1.5-EPS)return [];
      return [p[i].y+(side===0?-p[i].x:p[i].x)-inner];
    });
    assert.ok(distances.length>8);
    assert.ok(Math.abs(Math.min(...distances)+width/4)<EPS);
    assert.ok(Math.abs(Math.max(...distances))<EPS);
  }
});

test('the opposite strip and large triangle stay still during each wing sequence',()=>{
  for(const [start,end]of dragonWingPleatRanges){
    const initial=computeFoldState(model,start).positions;
    for(let tick=start*32;tick<=end*32;tick++){
      const p=computeFoldState(model,tick/32).positions;
      for(const i of[start===3?2:0,1,3,4])assert.ok(p[i].distanceTo(initial[i])<EPS,`dragged other material at ${tick/32}/${i}`);
    }
  }
});

test('wing pleats keep panel dimensions, continuous boundaries and no sampled transverse crossings',()=>{
  const initial=computeFoldState(model,0).positions,triangles=paperTriangles(model);
  for(let tick=0;tick<=704;tick++){
    const t=tick/64,state=computeFoldState(model,t),p=state.positions;
    for(const face of model.faces)for(const a of face)for(const b of face)
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<EPS,`stretch at ${t}/${a}/${b}`);
    assert.deepEqual(intersectingPanels(triangles,p,1),[],`crossing at ${t}`);
    for(const fi of state.movingFaces)assert.ok(fi>=0&&fi<model.faces.length);
  }
  for(let k=1;k<model.steps.length;k++){
    const before=computeFoldState(model,k-1e-6).positions,at=computeFoldState(model,k).positions,after=computeFoldState(model,k+1e-6).positions;
    at.forEach((p,i)=>{assert.ok(p.distanceTo(before[i])<EPS);assert.ok(p.distanceTo(after[i])<EPS);});
  }
});

test('wing subdivision retains a connected square with no new free interior edges',()=>{
  const initial=computeFoldState(model,0).positions,edges=new Map(),graph=model.faces.map(()=>new Set());
  const area=paperTriangles(model).reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
  assert.ok(Math.abs(area-4)<EPS);
  for(const[fi,f]of model.faces.entries())for(let j=0;j<f.length;j++){
    const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((x,y)=>x-y).join(',');
    if(!edges.has(key))edges.set(key,{a,b,owners:[]});edges.get(key).owners.push(fi);
  }
  for(const{a,b,owners}of edges.values()){
    assert.ok(owners.length<=2);
    if(owners.length===1){const A=model.vertices[a],B=model.vertices[b];assert.ok([0,1].some(k=>Math.abs(Math.abs(A[k])-1)<EPS&&Math.abs(A[k]-B[k])<EPS),`interior boundary ${a}/${b}`);}
    else{graph[owners[0]].add(owners[1]);graph[owners[1]].add(owners[0]);}
  }
  const seen=new Set([0]),queue=[0];while(queue.length)for(const fi of graph[queue.pop()])if(!seen.has(fi)){seen.add(fi);queue.push(fi);}
  assert.equal(seen.size,model.faces.length);
});

test('wing-strip comparison does not claim a finished or released dragon',()=>{
  assert.ok(!MODELS.some(m=>m.id===model.id));
  assert.ok(model.steps.at(-1).caution.en.startsWith('Unfinished'));
  assert.ok(model.steps.at(-1).caution.en.includes('Upper-corner layer order'));
});
