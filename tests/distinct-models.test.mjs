import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS } from '../src/modelLibrary.ts';
import { computeFoldState } from '../src/engine/fold.ts';
for(const [id,area,steps] of [['jumping-frog',2,17],['fortune-teller',4,11],['folding-fan',4,13]]){
 test(`${id}: uncut material and rigid panels stay connected throughout the route`,()=>{
  const m=MODELS.find(m=>m.id===id),initial=computeFoldState(m,0).positions;
  assert.equal(m.steps.length,steps);
  let sum=0;for(const f of m.faces){let a=0;for(let i=0;i<f.length;i++){const p=m.vertices[f[i]],q=m.vertices[f[(i+1)%f.length]];a+=p[0]*q[1]-p[1]*q[0];}sum+=Math.abs(a)/2;}assert.ok(Math.abs(sum-area)<1e-9);
  for(let t=0;t<=steps;t+=.125){
   const p=computeFoldState(m,t).positions;
   for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`panel stretches at ${t}`);
   const clone=computeFoldState(JSON.parse(JSON.stringify(m)),t).positions;
   p.forEach((v,i)=>assert.ok(v.distanceTo(clone[i])<1e-10,'JSON preserves the mechanism'));
  }
  for(let i=0;i<steps;i++){
   const s=computeFoldState(m,i+.25);
   assert.equal(s.guides.length,1);
   assert.ok(s.guides[0].arrowPath.some(p=>p.distanceTo(s.guides[0].arrowPath[0])>.001),'guide must show the actual motion');
  }
 });
}
test('retired crane and crystal variants do not return to the public library',()=>{
 assert.deepEqual(MODELS.filter(m=>m.difficulty===5).map(m=>m.id),['crane','sonobe-icosahedron']);
 assert.equal(MODELS.filter(m=>m.id.startsWith('sonobe-')).length,1);
 for(const id of ['flapping-bird','pterosaur','phoenix','waterbird','crestedBird'])assert.ok(!MODELS.some(m=>m.id===id));
});
