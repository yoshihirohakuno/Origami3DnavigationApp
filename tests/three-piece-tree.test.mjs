import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS } from '../src/modelLibrary.ts';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { coverage } from '../tools/audit-cover.mjs';

const model=()=>MODELS.find(m=>m.id==='three-piece-tree');
const used=(m,sheet)=>[...new Set(m.faces.filter((_,i)=>m.faceSheet[i]===sheet).flat())];
test('three-piece tree: equal squares take distinct folding routes, without scaling or disconnected seams',()=>{
  const m=model(), initial=computeFoldState(m,0).positions;
  assert.equal(m.steps.length,12);
  assert.equal(m.sheetColors.length,3);
  assert.ok(m.steps.every(s=>s.folds.filter(isGuideFold).length===1));
  assert.ok(m.steps.every(s=>s.folds.every(f=>!f.targets && f.type!=='unfold')));
  for(let sheet=0;sheet<3;sheet++){
    const faces=m.faces.filter((_,i)=>m.faceSheet[i]===sheet);
    let area=0;
    for(const f of faces){let a=0;f.forEach((v,i)=>{const p=m.vertices[v],q=m.vertices[f[(i+1)%f.length]];a+=p[0]*q[1]-q[0]*p[1];});area+=Math.abs(a)/2;}
    assert.ok(Math.abs(area-4)<1e-9,'each sheet has the same uncut area');
  }
  const seams=new Map();
  for(const v of new Set(m.faces.flat())){const key=m.vertices[v].map(x=>x.toFixed(9)).join();if(!seams.has(key))seams.set(key,[]);seams.get(key).push(v);}
  for(let t=0;t<=12;t+=.125){const p=computeFoldState(m,t).positions;
    for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`stretched panel at ${t}`);
    for(const group of seams.values())for(const v of group)assert.ok(p[v].distanceTo(p[group[0]])<1e-6,`open material seam at ${t}`);
  }
});

test('three-piece tree: assembly preserves the two glued tiers and covers both lower tips', async()=>{
  const m=model(), before=computeFoldState(m,11).positions, p=computeFoldState(m,12).positions;
  const small=used(m,0),middle=used(m,1),large=used(m,2);
  for(const a of small)for(const b of middle)assert.ok(Math.abs(p[a].distanceTo(p[b])-before[a].distanceTo(before[b]))<1e-8,'the first glue joint must stay fixed');
  const box=ids=>({x0:Math.min(...ids.map(v=>p[v].x)),x1:Math.max(...ids.map(v=>p[v].x)),y0:Math.min(...ids.map(v=>p[v].y)),y1:Math.max(...ids.map(v=>p[v].y)),z:Math.min(...ids.map(v=>p[v].z))});
  const boxes=[small,middle,large].map(box);
  for(let i=0;i<3;i++){
    assert.ok(Math.abs((boxes[i].x1-boxes[i].x0)-Math.SQRT2*[1,1.5,2][i])<1e-7);
    assert.ok(Math.abs((boxes[i].x0+boxes[i].x1)/2-3)<1e-7);
  }
  for(let i=0;i<2;i++){
    assert.ok(boxes[i].y0<boxes[i+1].y1,'tiers must actually overlap');
    assert.ok(boxes[i].y1>boxes[i+1].y1);
    assert.ok(boxes[i].z>boxes[i+1].z,'upper tiers sit in front of glued tips');
  }
  const ratio=(boxes[2].x1-boxes[2].x0)/(boxes[0].y1-boxes[2].y0);
  assert.ok(Math.abs(ratio/(424/364)-1)<.05,'reference silhouette proportions');
  assert.equal(await coverage(m,12),0,'all three exposed tiers should show their colored sides');
});
