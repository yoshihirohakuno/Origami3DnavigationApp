import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS } from '../src/modelLibrary.ts';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { coverage } from '../tools/audit-cover.mjs';

test('pudding: one square keeps its panel dimensions and joined material during every fold', () => {
  const m=MODELS.find(m=>m.id==='pudding'), initial=computeFoldState(m,0).positions;
  assert.equal(m.steps.length,3);
  assert.ok(m.steps.every(s=>s.folds.filter(isGuideFold).length===1));
  let area=0;
  for(const f of m.faces){let a=0;f.forEach((v,i)=>{const p=m.vertices[v],q=m.vertices[f[(i+1)%f.length]];a+=p[0]*q[1]-q[0]*p[1];});area+=Math.abs(a)/2;}
  assert.ok(Math.abs(area-4)<1e-9);
  const seams=new Map();
  for(const v of new Set(m.faces.flat())){const key=m.vertices[v].map(x=>x.toFixed(9)).join();if(!seams.has(key))seams.set(key,[]);seams.get(key).push(v);}
  for(let t=0;t<=3;t+=.125){const p=computeFoldState(m,t).positions;
    for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`stretched panel at ${t}`);
    for(const group of seams.values())for(const v of group)assert.ok(p[v].distanceTo(p[group[0]])<1e-6,`open seam at ${t}`);
  }
  const p=computeFoldState(m,3).positions, used=[...new Set(m.faces.flat())];
  const xs=used.map(v=>p[v].x), ys=used.map(v=>p[v].y);
  assert.ok(Math.abs((Math.max(...xs)-Math.min(...xs))/(Math.max(...ys)-Math.min(...ys))-2/1.35)<1e-7);
  // Final diagram: about 366x242. Reject an overly narrow or short pudding.
  assert.ok(Math.abs((2/1.35)/(366/242)-1)<.05);
});

test('pudding: caramel stays colored and the reverse side makes the custard', async () => {
  const m=MODELS.find(m=>m.id==='pudding');
  assert.equal(await coverage(m,0),0);
  const back=await coverage(m,3);
  assert.ok(back>50 && back<70,`custard should be the larger light area: ${back}%`);
});
