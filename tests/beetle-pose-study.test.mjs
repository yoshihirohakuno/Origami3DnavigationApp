import test from 'node:test';
import assert from 'node:assert/strict';
import {beetlePoseStudy as m,beetleFootPlane,beetleFootAngles,beetlePoseBody,
 beetlePoseFootStart,beetlePoseHookStart,beetlePoseCoreEnd,beetlePoseCore} from '../src/experiments/beetlePoseStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {paperTriangles} from '../src/engine/mesh.ts';
import {intersectingPanels} from '../tools/panel-intersections.mjs';
import {MODELS} from '../src/modelLibrary.ts';
const eps=5e-7,feet=[2,4,6,8,10,12];

test('the integrated study uses a consistently colored-side-up sheet and opens one body page per operation',()=>{
 assert.equal(m.steps.length,124);assert.equal(beetlePoseCoreEnd,111);
 for(const f of m.faces){
  let area=0;for(let j=0;j<f.length;j++){const a=m.vertices[f[j]],b=m.vertices[f[(j+1)%f.length]];area+=a[0]*b[1]-b[0]*a[1];}
  assert.ok(area>0,'every panel must use the same starting paper face');
 }
 const start=beetlePoseBody.beetleBodyOpenStart;
 for(let j=0;j<4;j++)assert.equal(m.steps[start+j].folds.length,1);
 assert.ok(m.steps.every(s=>s.folds.length===1&&s.folds.every(f=>!f.targets&&f.type!=='unfold')));
 assert.match(m.steps[0].caution.en,/colored side/);
});

test('six independently folded feet reach the same support plane through material hinge rotations',()=>{
 const p=computeFoldState(m,beetlePoseHookStart).positions;
 for(const tip of feet){
  assert.ok(Math.abs(p[tip].z-beetleFootPlane)<eps,`foot ${tip} does not reach the floor`);
  const angle=beetleFootAngles.get(tip);
  assert.ok(angle>0&&angle<180);
 }
 assert.ok(Math.max(...beetleFootAngles.values())-Math.min(...beetleFootAngles.values())>80,'different initial leg elevations need different angles');
 const initial=computeFoldState(m,0).positions;
 for(let j=0;j<feet.length;j++){
  const t=beetlePoseFootStart+j,op=m.steps[t].folds[0],before=computeFoldState(m,t).positions;
  assert.ok(op.moving.includes(feet[j]));
  for(let k=1;k<=16;k++){
   const current=computeFoldState(m,t+k/16).positions;
   for(const axis of op.axis)assert.ok(current[axis].distanceTo(before[axis])<eps);
   for(const other of feet.filter(tip=>tip!==feet[j]))assert.ok(current[other].distanceTo(before[other])<eps);
   for(const vertex of op.moving)assert.ok(Math.abs(current[vertex].distanceTo(current[op.axis[0]])-before[vertex].distanceTo(before[op.axis[0]]))<eps);
  }
  assert.ok(initial[feet[j]]);
 }
});

test('additional narrowing reduces four leg widths without shifting any other appendage tip',()=>{
 const start=beetlePoseCore.beetleLegNarrowStart,end=beetlePoseCore.beetleHornHalfStart;
 const before=computeFoldState(m,start).positions,after=computeFoldState(m,end).positions;
 for(const tip of [6,8,10,12]){
  const points=beetlePoseCore.model.faces.filter(f=>f.includes(tip)).flat();
  const width=p=>Math.max(...points.map(i=>Math.abs(p[i].x-p[tip].x)));
  assert.ok(width(after)<width(before)*.7,`leg ${tip} stayed too broad`);
 }
 for(let tick=start*16;tick<=end*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const tip of [0,...feet,9,11])assert.ok(p[tip].distanceTo(before[tip])<eps);
 }
});

test('the completed support pose leaves no paper below the feet and puts the sheet mass above their support polygon',()=>{
 const p=computeFoldState(m,m.steps.length).positions;
 for(const i of new Set(m.faces.flat()))assert.ok(p[i].z>=beetleFootPlane-eps,`paper ${i} extends below the feet`);
 let area=0,x=0,y=0;
 for(const f of m.faces)for(let j=1;j<f.length-1;j++){
  const[a,b,c]=[m.vertices[f[0]],m.vertices[f[j]],m.vertices[f[j+1]]];
  const weight=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
  area+=weight;x+=weight*(p[f[0]].x+p[f[j]].x+p[f[j+1]].x)/3;y+=weight*(p[f[0]].y+p[f[j]].y+p[f[j+1]].y)/3;
 }
 const center=[x/area,y/area],points=feet.map(i=>[p[i].x,p[i].y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=values=>{const hull=[];for(const point of values){while(hull.length>1&&cross(hull.at(-2),hull.at(-1),point)<=0)hull.pop();hull.push(point);}return hull.slice(0,-1);};
 const hull=[...half(points),...half([...points].reverse())];
 for(let j=0;j<hull.length;j++)assert.ok(cross(hull[j],hull[(j+1)%hull.length],center)>0,'uniform-sheet mass projection falls outside the supporting feet');
});

test('finishing the two horn tips and turning the whole beetle preserve all six contacts',()=>{
 const before=computeFoldState(m,beetlePoseHookStart).positions;
 for(let tick=beetlePoseHookStart*16;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const tip of feet)assert.ok(Math.abs(p[tip].z-beetleFootPlane)<eps);
  if(tick/16<=m.steps.length-1)for(const tip of feet)assert.ok(p[tip].distanceTo(before[tip])<eps);
 }
});

test('every refined panel keeps its full dimensions throughout the integrated route',()=>{
 const initial=computeFoldState(m,0).positions;let area=0;
 for(const f of m.faces)for(let j=1;j<f.length-1;j++)area+=initial[f[j]].clone().sub(initial[f[0]]).cross(initial[f[j+1]].clone().sub(initial[f[0]])).length()/2;
 assert.ok(Math.abs(area-4)<1e-8);
 for(let tick=0;tick<=m.steps.length*16;tick++){
  const p=computeFoldState(m,tick/16).positions;
  for(const f of m.faces)for(const a of f)for(const b of f)assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<eps,`panel ${a}/${b} at ${tick/16}`);
 }
});

test('all refined material seams stay connected throughout the route',()=>{
 const used=[...new Set(m.faces.flat())],edges=new Map(),seams=[];
 for(const f of m.faces)for(let j=0;j<f.length;j++){const a=f[j],b=f[(j+1)%f.length];edges.set([a,b].sort((x,y)=>x-y).join(','),[a,b]);}
 for(const[a,b]of edges.values()){
  const pa=m.vertices[a],pb=m.vertices[b],dx=pb[0]-pa[0],dy=pb[1]-pa[1],den=dx*dx+dy*dy;if(den<1e-16)continue;
  for(const i of used){const q=m.vertices[i],t=((q[0]-pa[0])*dx+(q[1]-pa[1])*dy)/den;
   if(t>=-1e-9&&t<=1+1e-9&&Math.hypot(q[0]-pa[0]-t*dx,q[1]-pa[1]-t*dy)<1e-9)seams.push([i,a,b,t]);}
 }
 for(let tick=0;tick<=m.steps.length*8;tick++){
  const p=computeFoldState(m,tick/8).positions;
  for(const[i,a,b,t]of seams)assert.ok(p[i].distanceTo(p[a].clone().lerp(p[b],t))<eps,`seam at ${tick/8}`);
 }
});

test('body pages, triangular horn roots and support folds avoid sampled transverse panel crossings',()=>{
 const triangles=paperTriangles(m);
 for(let tick=82*16;tick<=m.steps.length*16;tick++)assert.deepEqual(intersectingPanels(triangles,computeFoldState(m,tick/16).positions,1),[],`crossing at ${tick/16}`);
});

test('faceted pocket approximation remains explicitly unfinished and outside the public catalog',()=>{
 assert.ok(!MODELS.some(publicModel=>publicModel.id===m.id));
 assert.match(m.steps.at(-1).caution.en,/Unfinished.*Pocket opening/);
});

test('faceted body depth still leaves the distinct material mouth points coincident, documenting unfinished pocket inflation',()=>{
 const p=computeFoldState(m,beetlePoseCoreEnd).positions,mouth=[38,51,41,54,44,57,47,60];
 for(const a of mouth)for(const b of mouth)assert.ok(p[a].distanceTo(p[b])<eps);
 assert.ok(Math.hypot(m.vertices[38][0]-m.vertices[51][0],m.vertices[38][1]-m.vertices[51][1])>.3,'these must be distinct material points, not copies of the same vertex');
 assert.match(m.steps.at(-1).caution.en,/Pocket opening.*under review/);
});
