import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS } from '../src/modelLibrary.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { fingerPocketPlayPoint } from '../src/engine/fingerPockets.ts';
const m=MODELS.find(m=>m.id==='fortune-teller');
const nodes=m.steps.flatMap(s=>s.folds).find(f=>f.fingerPockets).fingerPockets;
const final=computeFoldState(m,m.steps.length).positions;
function pose(q){const p=final.map(v=>v.clone());for(const [i,x,y,sx,sy,o] of nodes)p[i]=fingerPocketPlayPoint(x,y,sx,sy,o,q);return p;}
test('play starts at the exact completed folding pose',()=>{pose(0).forEach((p,i)=>assert.ok(p.distanceTo(final[i])<1e-8));});
test('both mouth directions preserve every panel without tearing or stretching',()=>{
 const initial=computeFoldState(m,0).positions;
 for(let j=-100;j<=100;j++){const p=pose(j/100);for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`stretch at ${j}`);}
 assert.ok(pose(1).some((p,i)=>p.distanceTo(pose(-1)[i])>.2));
});
test('step 10 to 11 remains continuous',()=>{
 const before=computeFoldState(m,10-1e-7).positions,after=computeFoldState(m,10+1e-7).positions;
 before.forEach((p,i)=>assert.ok(p.distanceTo(after[i])<1e-6));
});
