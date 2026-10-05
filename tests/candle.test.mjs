import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS } from '../src/modelLibrary.ts';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { coverage } from '../tools/audit-cover.mjs';

test('candle: six separate actions keep the square uncut and every material seam closed',()=>{
  const m=MODELS.find(m=>m.id==='candle'), initial=computeFoldState(m,0).positions;
  assert.equal(m.steps.length,6);
  assert.ok(m.steps.every(s=>s.folds.filter(isGuideFold).length===1));
  assert.ok(m.steps.every(s=>s.folds.every(f=>f.type!=='unfold' && !f.targets)));
  let area=0;
  for(const f of m.faces){let a=0;f.forEach((v,i)=>{const p=m.vertices[v],q=m.vertices[f[(i+1)%f.length]];a+=p[0]*q[1]-q[0]*p[1];});area+=Math.abs(a)/2;}
  assert.ok(Math.abs(area-2)<1e-9);
  const seams=new Map();
  for(const v of new Set(m.faces.flat())){const key=m.vertices[v].map(x=>x.toFixed(9)).join();if(!seams.has(key))seams.set(key,[]);seams.get(key).push(v);}
  for(let t=0;t<=6;t+=.125){const p=computeFoldState(m,t).positions;
    for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`stretched panel at ${t}`);
    for(const group of seams.values())for(const v of group)assert.ok(p[v].distanceTo(p[group[0]])<1e-6,`open seam at ${t}`);
  }
  const p=computeFoldState(m,6).positions,ids=[...new Set(m.faces.flat())];
  const width=Math.max(...ids.map(v=>p[v].x))-Math.min(...ids.map(v=>p[v].x));
  const height=Math.max(...ids.map(v=>p[v].y))-Math.min(...ids.map(v=>p[v].y));
  assert.ok(Math.abs(width-.5)<1e-8);
  assert.ok(Math.abs(height-.815)<1e-8);
  assert.ok(Math.abs((width/height)/(119/201)-1)<.05,'compare the reference silhouette, including the flame');
});

test('candle: the exposed flame remains colored and most of the body is the reverse side', async()=>{
  const m=MODELS.find(m=>m.id==='candle');
  assert.equal(await coverage(m,0),0);
  const back=await coverage(m,6);
  assert.ok(back>=93 && back<=97,`small flame above white candle body: ${back}% white`);
});
