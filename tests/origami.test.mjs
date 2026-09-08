import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { computeNavigationState, stepPlayback } from '../src/engine/navigation.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { renderFaceOffsets } from '../src/engine/renderLayers.ts';
import { orderPaper } from '../src/engine/painter.ts';
import { splitFacesByLine } from '../src/engine/split.ts';
import { FinalShapePreview, buildStepDiagrams } from '../src/CreasePattern.tsx';
import { coverage } from '../tools/audit-cover.mjs';
import { referenceOf } from '../src/modelReferences.ts';
import { MODELS } from '../src/modelLibrary.ts';
import { withoutCreasePreparation } from '../src/engine/withoutCreasePreparation.ts';
import { categoryOf } from '../src/catalog.ts';

const models = [];
for (const file of readdirSync(new URL('../src/models/', import.meta.url)).filter(f => f.endsWith('.ts'))) {
  const mod = await import(`../src/models/${file}`);
  const model = Object.values(mod).find(v => v?.steps && v?.vertices);
  if (model) models.push(model);
}
const modelOf = id => models.find(m => m.id === id);
const distance = (a, b) => Math.max(...a.map((p, i) => p.distanceTo(b[i])));

for (const short of MODELS) test(`${short.id}: individual stages retain all shape-making folds and completed poses`, () => {
  const source = modelOf(short.id);
  assert.ok(short.steps.length > 0);
  assert.equal(short.faces,source.faces);
  assert.equal(short.sheetColors,source.sheetColors);
  assert.ok(short.steps.every(s=>s.folds.every(op=>op.type!=='unfold')));
  let lastIndex=-1;
  const seen = new Set();
  short.steps.forEach((s,i)=>{
    const originalIndex=source.steps.findIndex(old=>old.folds.includes(s.folds[0]));
    assert.ok(originalIndex>=lastIndex && originalIndex>=0);
    const original = source.steps[originalIndex];
    assert.ok(s.folds.every(op=>original.folds.includes(op)));
    lastIndex=originalIndex;
    for(const op of s.folds) if (!s.motionRange?.[0]) {
      assert.ok(!seen.has(op),'an action is not repeated'); seen.add(op);
    }
    const next=short.steps[i+1];
    if (!next || !original.folds.includes(next.folds[0])) {
      assert.ok(original.folds.every(op=>seen.has(op)),'no layer adjustment is lost');
      assert.ok(distance(computeFoldState(short,i+1).positions,
        computeFoldState(source,originalIndex+1).positions)<1e-8, `${short.id}: completed source stage ${originalIndex}`);
    }
    if(s.motionRange || s.folds===original.folds) for (const fraction of [0,.25,.5,.75,1]) {
      const [from,to]=s.motionRange??[0,1];
      assert.ok(distance(computeFoldState(short,i+fraction).positions,
        computeFoldState(source,originalIndex+from+(to-from)*fraction).positions)<1e-8, `${short.id} at ${i+fraction}`);
    }
    for(const fraction of [0,.25,.5,.75,1]) assert.ok(computeFoldState(short,i+fraction).positions
      .every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
  });
  assert.equal(seen.size,withoutCreasePreparation(source).steps.flatMap(s=>s.folds).length);
  assert.ok(distance(computeFoldState(short,short.steps.length).positions,
    computeFoldState(source,source.steps.length).positions)<1e-8);
  assert.equal(buildStepDiagrams(short).length,short.steps.length);
  assert.equal(withoutCreasePreparation(short),short,'applying the policy twice is a no-op');
});

test('all works use individual stages while crease-only round trips stay omitted', () => {
  assert.equal(MODELS.length,models.length);
  const byId=id=>MODELS.find(m=>m.id===id);
  for(const [id,n] of [['crane',18],['elephant',4],['dog',5],['acorn',6],['car',7],['piano',5],['shuriken',21],['heart',8],['bus',13]]) {
    assert.equal(byId(id).steps.length,n,id);
  }
  for(const id of ['cup']) {
    assert.equal(byId(id),modelOf(id),'do not shorten necessary openings or reverse folds');
  }
  assert.match(byId('acorn').steps[0].caution.ja,/色の面を上/);
  assert.match(byId('elephant').steps[0].caution.ja,/白い面を上/);
});

test('crane starts with two separate rigid triangle folds, carrying every fine crease point', () => {
  const m=MODELS.find(m=>m.id==='crane'), base=modelOf('square-base');
  const initial=computeFoldState(m,0).positions;
  assert.match(m.steps[0].description.ja,/対角線で三角/);
  assert.match(m.steps[1].description.ja,/小さな三角/);
  for(let t=0;t<=2;t+=.125){
    const p=computeFoldState(m,t).positions, q=computeFoldState(base,t).positions;
    assert.ok(distance(p.slice(0,9),q)<1e-8,'one base operation per Next');
    for(const face of m.faces)for(let i=0;i<face.length;i++){
      const a=face[i],b=face[(i+1)%face.length];
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,'fine points stay on rigid panels');
    }
  }
});

test('pocket checkpoints are continuous, scrub backwards, and survive JSON export', () => {
  for(const m of MODELS.filter(m=>m.steps.some(s=>s.motionRange))){
    const json=JSON.parse(JSON.stringify(m));
    m.steps.forEach((s,i)=>{
      if(!s.motionRange?.[0])return;
      assert.deepEqual(m.steps[i-1].motionRange,[0,s.motionRange[0]]);
      const boundary=computeFoldState(m,i).positions;
      for(const t of [i+.00001,i-.00001,i,i+.5,i-.5]){
        assert.ok(distance(computeFoldState(m,t).positions,computeFoldState(json,t).positions)<1e-8);
        if(Math.abs(t-i)<.001)assert.ok(distance(boundary,computeFoldState(m,t).positions)<.0001);
      }
    });
  }
});

test('selecting crane squash steps plays through to matching lower tips and keeps that step selected', () => {
  const m=MODELS.find(m=>m.id==='crane');
  for(const [step,tip] of [[4,6],[7,2]]){
    const {start,target}=stepPlayback(step-1,m.steps.length);
    assert.equal(start,step-1);
    const opened=computeNavigationState(m,start);
    assert.ok(opened.positions[tip].distanceTo(opened.positions[8])>1,'the pocket really starts open');
    let previousGap=Infinity;
    for(let t=start+.125;t<=target;t+=.125){
      const state=computeNavigationState(m,t),gap=state.positions[tip].distanceTo(state.positions[8]);
      assert.equal(state.stepIndex+1,step,'show the fold being completed');
      assert.ok(gap<previousGap,'continue closing rather than stop at the opening checkpoint');
      previousGap=gap;
    }
    const closed=computeNavigationState(m,target);
    assert.equal(target,step,'route selection must reach the end, not the start, of the selected step');
    assert.ok(closed.positions[tip].distanceTo(closed.positions[8])<1e-9,'front and back lower tips meet');
    assert.equal(closed.fraction,1);
    assert.equal(closed.guides.length,0,'do not display the following fold over the completed shape');
  }
});

test('navigation labels completed stages consistently in every model without changing paper geometry', () => {
  for(const m of MODELS){
    assert.equal(computeNavigationState(m,0).fraction,0);
    for(let step=1;step<=m.steps.length;step++){
      const completed=computeNavigationState(m,step),physical=computeFoldState(m,step);
      assert.equal(completed.stepIndex,step-1,`${m.id} completed step ${step}`);
      assert.equal(completed.fraction,1);
      assert.equal(completed.guides.length,0);
      assert.equal(completed.movingFaces.size,0);
      assert.equal(distance(completed.positions,physical.positions),0);
      assert.ok(distance(renderFaceOffsets(m,completed),renderFaceOffsets(m,physical))<1e-10);
      const during=computeNavigationState(m,step-.5);
      assert.equal(during.stepIndex,step-1);
      assert.equal(during.fraction,.5);
    }
  }
});

test('route thumbnails show the completed squash and petal poses rather than their open starting poses', () => {
  const m=MODELS.find(m=>m.id==='crane');
  const before=buildStepDiagrams(m),after=buildStepDiagrams(m,44,'after');
  const paper=element=>renderToStaticMarkup(element).replace(/<line\b[^>]*><\/line>/g,'');
  for(const i of [3,6,8,10]){
    assert.equal(paper(after[i]),paper(before[i+1]),`finished pose for step ${i+1}`);
    assert.notEqual(paper(after[i]),paper(before[i]),'do not reuse the open-pocket thumbnail');
  }
});

test('square and waterbomb pockets retain panel lengths throughout their opening checkpoints', () => {
  for(const id of ['square-base','waterbomb-base','crane','tadpole']){
    const m=MODELS.find(m=>m.id===id),q=computeFoldState(m,0).positions;
    for(let t=0;t<=(id==='tadpole'?4:7);t+=.025){
      const p=computeFoldState(m,t).positions;
      for(const f of m.faces)for(const a of f)for(const b of f)
        assert.ok(Math.abs(p[a].distanceTo(p[b])-q[a].distanceTo(q[b]))<1e-8,`${id} panel distance at ${t}`);
    }
    const half=computeFoldState(m,3).positions, flat=computeFoldState(m,4).positions;
    assert.ok(distance(half,flat)>.25,'opening is a real intermediate shape');
    const startGuide=computeFoldState(m,2).guides[0], nextGuide=computeFoldState(m,3).guides[0];
    assert.ok(startGuide.arrowPath.at(-1).distanceTo(nextGuide.arrowPath[0])<1e-8,'arrows stop at the checkpoint');
  }
});

test('separate collinear corners do not move together, but overlapping layers still do', () => {
  for(const [id,sourceStep,expected]of [['heart',4,2],['bus',2,4]]){
    const m=withoutCreasePreparation(modelOf(id)),ops=m.steps[sourceStep].folds.filter(isGuideFold);
    assert.equal(ops.length,expected,id);
  }
  const dog=MODELS.find(m=>m.id==='dog'), before=computeFoldState(dog,1).positions;
  const oneEar=computeFoldState(dog,2).positions, both=computeFoldState(dog,3).positions;
  const other=dog.steps[2].folds.find(isGuideFold).moving;
  assert.ok(other.every(vi=>before[vi].distanceTo(oneEar[vi])<1e-8),'second ear stays put');
  assert.ok(other.some(vi=>both[vi].distanceTo(oneEar[vi])>.1),'second ear moves on the next action');
});

test('crane petal folds lift opposite pages and keep adjoining corners attached', () => {
  const m=MODELS.find(m=>m.id==='crane');
  const base=computeFoldState(m,7).positions;
  for(const t of [7.25,7.5,8,8.5,9]){
    const p=computeFoldState(m,t).positions;
    for(const vi of [4,6,8]) assert.ok(p[vi].distanceTo(base[vi])<1e-8,'the other tips stay down');
  }
  const first=computeFoldState(m,9).positions, both=computeFoldState(m,11).positions;
  assert.ok(first[2].y>.5 && first[6].y< -1);
  assert.ok(both[2].y>.5 && both[6].y>.5,'opposite corners become wings');
  assert.ok(both[4].y< -1 && both[8].y< -1,'neck and tail remain below');
  for(const vi of [1,3,5,7])assert.ok(both[vi].distanceTo(both[11])<1e-8,'shared side points meet the center hinge');
});

test('crane retains every panel shape and triangle area through all 18 stages', () => {
  const m=MODELS.find(m=>m.id==='crane'),q=computeFoldState(m,0).positions;
  const triangles=paperTriangles(m);
  const area=(p,a,b,c)=>p[b].clone().sub(p[a]).cross(p[c].clone().sub(p[a])).length()/2;
  const areas=triangles.map(([,a,b,c])=>area(q,a,b,c));
  for(let t=0;t<=18;t+=.025){
    const p=computeFoldState(m,t).positions;
    for(const f of m.faces)for(const a of f)for(const b of f)
      assert.ok(Math.abs(p[a].distanceTo(p[b])-q[a].distanceTo(q[b]))<1e-8,`stretched panel at ${t}`);
    triangles.forEach(([,a,b,c],i)=>assert.ok(Math.abs(area(p,a,b,c)-areas[i])<1e-8,`collapsed panel at ${t}`));
  }
  const edges=new Map();
  for(const f of m.faces)f.forEach((a,i)=>{const b=f[(i+1)%f.length],k=[a,b].sort((x,y)=>x-y).join(',');
    edges.set(k,(edges.get(k)??0)+1);});
  const unit=modelOf('square-base').vertices[1][0];
  const onBoundary=(a,b)=>[1,-1].some(sign=>
    Math.abs(q[a].x+q[a].y-sign*2*unit)<1e-8&&Math.abs(q[b].x+q[b].y-sign*2*unit)<1e-8 ||
    Math.abs(q[a].x-q[a].y-sign*2*unit)<1e-8&&Math.abs(q[b].x-q[b].y-sign*2*unit)<1e-8);
  for(const [k,n]of edges){const [a,b]=k.split(',').map(Number);assert.equal(n,onBoundary(a,b)?1:2,`unjoined material edge ${k}`);}
  assert.ok(Math.abs(areas.reduce((a,b)=>a+b,0)-8*unit*unit)<1e-8,'one complete square');
});

test('crane outer pocket and petal layers keep the colored surface outside', async () => {
  const m=MODELS.find(m=>m.id==='crane');
  assert.equal(await coverage(m,0),100,'start white side up');
  for(const t of [1,2,4,5,7,9,11,18])assert.equal(await coverage(m,t),0,`outside color at ${t}`);
  const bird=computeFoldState(m,11).positions;
  // The two halves of each lower point lie on the same side of the body.
  assert.ok(bird[10].x<0 && bird[14].x<0,'neck packet is on the left');
  assert.ok(bird[9].x>0 && bird[12].x>0,'tail packet is on the right');
});

test('display layer spacing leaves the connected geometry untouched and turns over with the sheet', () => {
  const m=MODELS.find(m=>m.id==='crane');
  for(const t of [0,4,5,7,8.5,9,10.5,11,18]){
    const state=computeFoldState(m,t), original=state.positions.map(p=>p.clone());
    const offsets=renderFaceOffsets(m,state);
    assert.equal(distance(state.positions,original),0,'rendering cannot stretch paper');
    assert.ok(offsets.every(p=>Number.isFinite(p.length()) && p.length()<.001));
    const restored=JSON.parse(JSON.stringify(m));
    assert.ok(distance(offsets,renderFaceOffsets(restored,computeFoldState(restored,t)))<1e-10);
  }
  const before=renderFaceOffsets(m,computeFoldState(m,4)),after=renderFaceOffsets(m,computeFoldState(m,5));
  before.forEach((p,i)=>assert.ok(p.clone().add(after[i]).length()<1e-9,'turning over reverses the stack depth'));
  for(let i=1;i<m.steps.length;i++){
    const at=renderFaceOffsets(m,computeFoldState(m,i));
    for(const t of [i-.00001,i+.00001])assert.ok(distance(at,renderFaceOffsets(m,computeFoldState(m,t)))<1e-7,'no layer jump at a checkpoint');
  }
  const empty={...m,steps:[]};
  assert.ok(renderFaceOffsets(empty,computeFoldState(empty,0)).every(p=>p.length()===0));
});

test('an unfold which leaves the paper partly folded is retained', () => {
  const source={id:'partial-opening',name:{ja:'test',en:'test'},difficulty:1,
    vertices:[[0,0],[0,1],[1,0]],faces:[[0,2,1]],steps:[
      {folds:[{axis:[0,1],moving:[2],type:'valley',angle:180,direction:-1}],description:{ja:'fold',en:'fold'}},
      {folds:[{axis:[0,1],moving:[2],type:'unfold',angle:90,direction:1}],description:{ja:'open halfway',en:'open halfway'}},
    ]};
  assert.equal(withoutCreasePreparation(source),source);
});

for (const model of models) {
  test(`${model.id}: finite geometry at every quarter-step and exact crease/unfold return`, () => {
    if (model.faceSheet) assert.equal(model.faceSheet.length, model.faces.length);
    for (const face of model.faces) {
      assert.ok(face.length >= 3);
      for (const vi of face) assert.ok(Number.isInteger(vi) && model.vertices[vi]);
    }
    for (const step of model.steps) for (const op of step.folds) {
      for (const vi of [...op.axis, ...op.moving]) assert.ok(model.vertices[vi]);
      assert.equal(new Set(op.moving).size, op.moving.length);
      if (op.timing) assert.ok(op.timing[0] >= 0 && op.timing[0] < op.timing[1] && op.timing[1] <= 1);
    }
    for (let t = 0; t <= model.steps.length; t += .25) {
      const state = computeFoldState(model, t);
      for (const p of state.positions) assert.ok([p.x,p.y,p.z].every(Number.isFinite), `t=${t}`);
    }
    model.steps.forEach((step,i) => {
      const guides = step.folds.filter(isGuideFold);
      if (i && guides.length && guides.every(op => op.type === 'unfold')) {
        assert.ok(distance(computeFoldState(model,i-1).positions, computeFoldState(model,i+1).positions) < 1e-8);
      }
    });
    assert.equal(computeFoldState(model,model.steps.length).guides.length,0);
    assert.equal(buildStepDiagrams(model).length, model.steps.length);
  });
}

test('shuriken starts white and shows the colored front after every completed fold', async () => {
  const m = modelOf('shuriken');
  assert.equal(await coverage(m,0),100);
  for (let t=1;t<=m.steps.length;t++) assert.ok(await coverage(m,t) <= 1,`step ${t}`);
  const initial = computeFoldState(m,0).positions;
  for(let t=0;t<=m.steps.length;t+=.125){
    const p=computeFoldState(m,t).positions;
    for(const f of m.faces) for(let i=0;i<f.length;i++){
      const a=f[i],b=f[(i+1)%f.length];
      assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8);
    }
  }
});

test('tuck folds the outer triangles inward instead of opening and returning to the same shape', () => {
  const m=modelOf('shuriken');
  for(const t of [6,8]){
    const before=computeFoldState(m,t).positions;
    assert.ok(distance(before,computeFoldState(m,t+.45).positions)>.05);
    assert.ok(distance(before,computeFoldState(m,t+1).positions)>.5);
    const guides=m.steps[t].folds.filter(isGuideFold);
    assert.equal(guides.length,2);
    assert.ok(guides.every(op=>op.angle>179&&op.angle<181));
  }
});

test('shuriken matches the reference tips and interleaves the two colors at the center', () => {
  const m=modelOf('shuriken'),p=computeFoldState(m,9).positions;
  const h=1/(4*Math.SQRT2),used=[...new Set(m.faces.flat())];
  for(const [x,y] of [[-h,3*h],[3*h,h],[h,-3*h],[-3*h,-h]]){
    assert.ok(Math.min(...used.map(i=>Math.hypot(p[i].x-x,p[i].y-y)))<1e-5);
  }
  const sheetAt=(x,y)=>{
    let sheet=-1,z=-Infinity;
    for(const [fi,ai,bi,ci]of paperTriangles(m)){
      const a=p[ai],b=p[bi],c=p[ci];
      const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
      if(Math.abs(den)<1e-10)continue;
      const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den;
      const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
      const depth=u*a.z+v*b.z+w*c.z;
      if(Math.min(u,v,w)>=-1e-9&&depth>z){sheet=m.faceSheet[fi];z=depth;}
    }
    return sheet;
  };
  for(const d of [.02,.05,.1]){
    assert.equal(sheetAt(.001,d),0);assert.equal(sheetAt(.001,-d),0);
    assert.equal(sheetAt(d,.001),1);assert.equal(sheetAt(-d,.001),1);
  }
  const start=computeFoldState(m,0).positions;
  let area=0;
  for(const [,a,b,c] of paperTriangles(m)){
    area+=start[b].clone().sub(start[a]).cross(start[c].clone().sub(start[a])).length()/2;
  }
  assert.ok(Math.abs(area-8)<1e-8,'both complete squares survive panel merging');
});

test('cup bows its walls while retaining the white front flap and limiting strain', async () => {
  const m=modelOf('cup'),start=computeFoldState(m,0).positions;
  // Original cup diagram: the white front flap covers the colored corner folds.
  const white = await coverage(m,6);
  assert.ok(white > 45 && white < 55);
  for(let t=0;t<=6;t+=.05){
    const p=computeFoldState(m,t).positions;
    for(const [,a,b,c] of paperTriangles(m))for(const [u,v] of [[a,b],[b,c],[c,a]]){
      // A sampled flexible surface, not two rigid walls. Bound the approximation.
      assert.ok(Math.abs(p[u].distanceTo(p[v])/start[u].distanceTo(start[v])-1)<.03,`strain at ${t}`);
    }
  }
});

test('cup is one uncut sheet and every shared material edge remains joined', () => {
  const m=modelOf('cup'), edges=new Map(), start=computeFoldState(m,0).positions;
  const key=i=>m.vertices[i].map(x=>Math.round(x*1e8)).join(',');
  let area=0;
  for(const [,a,b,c] of paperTriangles(m)){
    area+=start[b].clone().sub(start[a]).cross(start[c].clone().sub(start[a])).length()/2;
    for(const [u,v] of [[a,b],[b,c],[c,a]]){
      const k=[key(u),key(v)].sort().join('/');
      edges.set(k,[...(edges.get(k)??[]),[u,v]]);
    }
  }
  assert.ok(Math.abs(area-2)<1e-8,'preserve the full original square');
  for(const e of edges.values()){
    assert.ok(e.length===1||e.length===2,'manifold sheet');
    if(e.length===1)for(const vi of e[0])assert.ok(Math.abs(Math.abs(m.vertices[vi][0])+Math.abs(m.vertices[vi][1])-1)<1e-7,'no internal cuts');
  }
  for(let t=0;t<=6;t+=.05){
    const p=computeFoldState(m,t).positions;
    for(const e of edges.values())if(e.length===2)for(const vi of e[0]){
      const other=e[1].find(v=>key(v)===key(vi));
      assert.ok(p[vi].distanceTo(p[other])<1e-9,`seam gap at ${t}`);
    }
  }
  const rim = fi => [...new Set(paperTriangles(m).filter(tr=>tr[0]===fi).flatMap(tr=>tr.slice(1)))].find(vi=>{
    const p=computeFoldState(m,5).positions[vi];return Math.abs(p.x)<1e-7&&Math.abs(p.y-(2-Math.SQRT2))<1e-7;
  });
  const front=rim(7),back=rim(3),p=computeFoldState(m,6).positions;
  assert.ok(p[front].z-p[back].z>.19,'the free mouth edges really open');
  const restored=JSON.parse(JSON.stringify(m));
  assert.ok(distance(p,computeFoldState(restored,6).positions)<1e-9,'editor JSON retains the surface');
  assert.throws(()=>splitFacesByLine(m,[-1,0],[1,0]),/曲面/,'do not discard the flexible mesh during editing');
});

test('dense BSP tiling keeps crossing surfaces in the correct visible order', () => {
  const polygons=[];
  for(let x=0;x<9;x++)for(let y=0;y<9;y++){
    polygons.push({face:0,points:[{x:x-.4,y:y-.4,z:-.4},{x:x+.4,y:y-.4,z:.4},{x:x+.4,y:y+.4,z:.4},{x:x-.4,y:y+.4,z:-.4}]},
      {face:1,points:[{x:x-.4,y:y-.4,z:0},{x:x+.4,y:y-.4,z:0},{x:x+.4,y:y+.4,z:0},{x:x-.4,y:y+.4,z:0}]});
  }
  const sorted=orderPaper(polygons);
  for(let x=0;x<9;x++)for(let y=0;y<9;y++)for(const offset of [-.2,.2]){
    const px=x+offset,py=y+.1;
    const visible=sorted.filter(poly=>poly.points.every((a,i)=>{
      const b=poly.points[(i+1)%poly.points.length];return (b.x-a.x)*(py-a.y)-(b.y-a.y)*(px-a.x)>=-1e-9;
    })).at(-1);
    assert.equal(visible?.face,offset<0?1:0);
  }
});

const rigidIds = ['acorn','pizza','bear','boots','bus','car','cat','chick','dog','envelope','fox','heart',
  'helmet','panda','penguin','piano','rabbit','riceball','rocket','ship','sinkansen','tulip','yacht'];
for (const id of rigidIds) test(`${id}: every panel keeps all pairwise distances throughout the animation`, () => {
  const m = modelOf(id), initial = computeFoldState(m,0).positions;
  for (let t = 0; t <= m.steps.length; t += .25) {
    const p = computeFoldState(m,t).positions;
    for (const f of m.faces) for (let i=0;i<f.length;i++) for (let j=i+1;j<f.length;j++) {
      assert.ok(Math.abs(p[f[i]].distanceTo(p[f[j]]) - initial[f[i]].distanceTo(initial[f[j]])) < 1e-8, `${id} at ${t}`);
    }
  }
});

function visibleAt(m, x, y, t=m.steps.length) {
  const p = computeFoldState(m,t).positions;
  let hit;
  for (const [fi,ai,bi,ci] of paperTriangles(m)) {
    const a=p[ai],b=p[bi],c=p[ci];
    const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
    if(Math.abs(den)<1e-10)continue;
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den;
    const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
    const z=u*a.z+v*b.z+w*c.z;
    if(Math.min(u,v,w)>=-1e-9 && (!hit || z>hit.z)) hit={face:fi,z,front:den>0};
  }
  return hit;
}

test('elephant ear covers its body, with the white wedge under its trunk', () => {
  const m=modelOf('elephant');
  const ear=visibleAt(m,.35,-.85),body=visibleAt(m,.8,-.85),wedge=visibleAt(m,.1,-.85);
  assert.ok(ear.front && body.front);
  assert.notEqual(ear.face,body.face);
  assert.ok(ear.z>body.z);
  assert.equal(wedge.front,false);
});

test('helmet brim folds up without a dangling lower tip; bear keeps its white chin', () => {
  const helmet=modelOf('helmet'),p=computeFoldState(helmet,helmet.steps.length).positions;
  assert.ok(Math.min(...helmet.faces.flat().map(vi=>p[vi].y))>-.50001);
  assert.equal(visibleAt(helmet,.01,-.44).front,false);
  assert.equal(visibleAt(helmet,.01,-.12).front,true);
  const bear=modelOf('bear');
  assert.equal(visibleAt(bear,.02,-.75).front,false);
});

test('new models preserve the full square and reference silhouettes and colors', async () => {
  for(const id of ['pizza','acorn']){
    const m=modelOf(id),start=computeFoldState(m,0).positions;
    const area=paperTriangles(m).reduce((sum,[,a,b,c])=>sum+start[b].clone().sub(start[a]).cross(start[c].clone().sub(start[a])).length()/2,0);
    assert.ok(Math.abs(area-2)<1e-8);
  }
  const pizza=modelOf('pizza'),p=computeFoldState(pizza,pizza.steps.length).positions;
  for(const [x,y] of [[-.35,-.15],[-.35,.15],[-.15,.35],[.15,.35],[.35,.15],[.35,-.15],[.15,-.35],[-.15,-.35]]) {
    assert.ok(Math.min(...pizza.faces.flat().map(vi=>Math.hypot(p[vi].x-x,p[vi].y-y)))<1e-8);
  }
  assert.equal(await coverage(pizza,0),100);
  assert.equal(await coverage(pizza,pizza.steps.length),0);
  const acorn=modelOf('acorn');
  assert.equal(visibleAt(acorn,.05,.4).front,true);
  assert.equal(visibleAt(acorn,.05,-.15).front,false);
  assert.equal(visibleAt(acorn,.39,-.24),undefined);
});

for (const [id, area, count] of [['house',4,2],['butterfly',4,4],['soft-cream',2,6],['watermelon',4,5],['egg',2,10]]) {
  test(`${id}: complete sheet, rigid panels, connected crease copies and individual actions`, () => {
    const m=MODELS.find(m=>m.id===id), initial=computeFoldState(m,0).positions;
    assert.equal(m.steps.length,count);
    assert.notEqual(categoryOf(id),'other');
    assert.ok(m.steps.every(s=>s.folds.filter(isGuideFold).length===1));
    const triangleArea=paperTriangles(m).reduce((sum,[,a,b,c])=>sum+initial[b].clone().sub(initial[a]).cross(initial[c].clone().sub(initial[a])).length()/2,0);
    assert.ok(Math.abs(triangleArea-area)<1e-8,'all the original paper is retained');
    const copies=new Map();
    for(const vi of new Set(m.faces.flat())){
      const key=m.vertices[vi].map(n=>Math.round(n*1e8)).join(',');
      if(!copies.has(key))copies.set(key,[]);
      copies.get(key).push(vi);
    }
    for(let tick=0;tick<=m.steps.length*20;tick++){
      const p=computeFoldState(m,tick/20).positions;
      for(const face of m.faces)for(const a of face)for(const b of face)
        assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`panel distortion at ${tick/20}`);
      for(const group of copies.values())for(const vi of group)
        assert.ok(p[vi].distanceTo(p[group[0]])<.001,`material seam exceeds display layer thickness at ${tick/20}`);
    }
  });
}

test('new works reveal the intended colored faces, white walls, cream and rind', async () => {
  for(const [id,points] of [
    ['house',[[.12,.6,true],[.12,-.6,false]]],
    ['soft-cream',[[.12,.6,false],[.12,-.25,true]]],
    ['watermelon',[[.12,.3,true],[.12,-.65,false]]],
  ])for(const [x,y,front] of points)assert.equal(visibleAt(modelOf(id),x,y)?.front,front,`${id} at ${x},${y}`);
  for(const id of ['butterfly','egg'])assert.equal(await coverage(modelOf(id),modelOf(id).steps.length),0);
  const house=modelOf('house'),p=computeFoldState(house,2).positions;
  for(const corner of [[-1,1],[1,1]]){
    const indices=house.faces.flat().filter(vi=>house.vertices[vi].every((n,j)=>Math.abs(n-corner[j])<1e-8));
    assert.ok(indices.length>0);
    for(const vi of indices)assert.ok(Math.hypot(p[vi].x,p[vi].y)<1e-8,'roof corners meet at the center');
  }
});

test('soft serve pleat folds only its small tip while the cone stays fixed', () => {
  const m=modelOf('soft-cream'),before=computeFoldState(m,4).positions;
  const body=[...new Set(m.faces.flat())].filter(vi=>before[vi].y<.4);
  assert.ok(body.length>0);
  for(const t of [4.1,4.25,4.5,4.75,5]){
    const p=computeFoldState(m,t).positions;
    for(const vi of body)assert.ok(p[vi].distanceTo(before[vi])<1e-8,'do not fold the underlying cone with the tip');
  }
  const after=computeFoldState(m,5).positions;
  assert.ok(m.faces.flat().some(vi=>after[vi].distanceTo(before[vi])>.1),'the small tip really folds');
  const vs=m.faces.flat().map(vi=>after[vi]);
  assert.ok(Math.abs(Math.max(...vs.map(p=>p.y))-.8)<1e-8);
  assert.ok(Math.abs(Math.min(...vs.map(p=>p.y))+1)<1e-8);
});

test('egg stays open during rounding and butterfly turns without flipping its face', () => {
  const egg=modelOf('egg'),flat=computeFoldState(egg,9).positions,round=computeFoldState(egg,10).positions;
  const ids=[...new Set(egg.faces.flat())];
  const width=p=>Math.max(...ids.map(vi=>p[vi].x))-Math.min(...ids.map(vi=>p[vi].x));
  assert.ok(width(round)>width(flat)*.97,'rounding must not close the egg in half');
  assert.ok(Math.max(...ids.map(vi=>Math.abs(round[vi].z)))>.1,'a shallow bend is visible');
  const butterfly=modelOf('butterfly'),a=computeFoldState(butterfly,3).positions,b=computeFoldState(butterfly,4).positions;
  for(const vi of butterfly.faces.flat()){
    assert.ok(Math.abs(b[vi].x+a[vi].y)<1e-8);
    assert.ok(Math.abs(b[vi].y-a[vi].x)<1e-8);
    assert.ok(Math.abs(b[vi].z-a[vi].z)<1e-8,'orientation change is not a turnover');
  }
});

test('render spacing retains the existing stack order through egg tucks and turnover', async () => {
  const m=modelOf('egg'),physical={...m,renderLayerSeparation:undefined};
  for(let t=0;t<=m.steps.length;t++){
    assert.deepEqual(computeFoldState(m,t).positions,computeFoldState(physical,t).positions,'display spacing never moves the folding geometry');
    const rendered=await coverage(m,t),original=await coverage(physical,t);
    assert.ok(Math.abs(rendered-original)<=1,`layer order changed at ${t}: ${original} -> ${rendered}`);
  }
});

test('every model has an explicit source and each rendered SVG owns its clips', () => {
  for(const m of models) assert.match(referenceOf(m.id),/^https:\/\/www\.origami-club\.com\//);
  const html=renderToStaticMarkup(createElement('div',{},models.slice(0,4).map(m=>createElement(FinalShapePreview,{model:m,key:m.id}))));
  const ids=[...html.matchAll(/<clipPath id="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(ids.length>4);assert.equal(new Set(ids).size,ids.length);
  assert.match(html,/clipPathUnits="userSpaceOnUse"/);
  assert.doesNotMatch(html,/clip-path:polygon/);
});

test('previews derive from geometry and sheet colors, including collinear first vertices', () => {
  const m=modelOf('shuriken');
  const first=renderToStaticMarkup(createElement(FinalShapePreview,{model:m}));
  const changed={...m,sheetColors:m.sheetColors.map(c=>({...c,front:'#00ff00'}))};
  const second=renderToStaticMarkup(createElement(FinalShapePreview,{model:changed}));
  assert.notEqual(first,second);assert.match(second,/#00ff00/);
  const flat={id:'test',name:{ja:'test',en:'test'},difficulty:1,vertices:[[0,0],[0,1],[0,2],[2,2],[2,0]],faces:[[0,1,2,3,4]],steps:[]};
  const svg=renderToStaticMarkup(createElement(FinalShapePreview,{model:flat}));
  assert.match(svg,/#fbfaf7/);assert.doesNotMatch(svg,/#eda6a2/);
});

test('BSP splits crossing surfaces so the closer face wins on both sides', () => {
  const red={face:0,points:[{x:-1,y:-1,z:-1},{x:1,y:-1,z:1},{x:1,y:1,z:1},{x:-1,y:1,z:-1}]};
  const blue={face:1,points:[{x:-1,y:-1,z:0},{x:1,y:-1,z:0},{x:1,y:1,z:0},{x:-1,y:1,z:0}]};
  const sorted=orderPaper([red,blue]);
  assert.equal(sorted.length,3);
  assert.equal(sorted[0].face,1);assert.ok(sorted[0].points.every(p=>p.x>=-1e-8));
  assert.equal(sorted[1].face,0);
  assert.equal(sorted[2].face,1);assert.ok(sorted[2].points.every(p=>p.x<=1e-8));
});

test('concave faces keep their area and orientation when triangulated', () => {
  for(const reverse of [false,true]){
    const vertices=[[0,0],[2,0],[2,2],[1,1],[0,2]];
    const face=reverse?[4,3,2,1,0]:[0,1,2,3,4];
    const m={vertices,faces:[face]};let area=0;
    for(const [,a,b,c]of paperTriangles(m)){
      const p=vertices[a],q=vertices[b],r=vertices[c];
      const signed=((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]))/2;
      assert.ok(reverse?signed<=0:signed>=0);area+=signed;
    }
    assert.equal(area,reverse?-3:3);
  }
});

test('splitting a two-sheet model preserves each face palette assignment', () => {
  const model={vertices:[[-2,-1],[-1,-1],[-1,1],[-2,1],[1,-1],[2,-1],[2,1],[1,1]],faces:[[0,1,2,3],[4,5,6,7]],faceSheet:[0,1],steps:[]};
  const split=splitFacesByLine(model,[-3,0],[3,0]);
  assert.deepEqual(split.faceSheet,[0,0,1,1]);
});
