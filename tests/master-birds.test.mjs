import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFoldState, isGuideFold } from '../src/engine/fold.ts';
import { flappingBirdModel } from '../src/models/flappingBird.ts';
import { pterosaurModel } from '../src/models/pterosaur.ts';
import { phoenixModel } from '../src/models/phoenix.ts';
import { waterbirdModel } from '../src/models/waterbird.ts';
import { crestedBirdModel } from '../src/models/crestedBird.ts';
import { cappedAntiprism } from '../src/engine/antiprismScaffold.ts';
import { Vector3 } from 'three';

for (const m of [flappingBirdModel,pterosaurModel,phoenixModel,waterbirdModel,crestedBirdModel]) {
  test(`${m.id}: a continuous uncut square through every quarter-step`, () => {
    const initial=computeFoldState(m,0).positions, groups=new Map();
    let area=0;
    for(const f of m.faces){
      for(let i=1;i<f.length-1;i++)area+=initial[f[i]].clone().sub(initial[f[0]]).cross(initial[f[i+1]].clone().sub(initial[f[0]])).length()/2;
      for(const vi of f){const key=m.vertices[vi].map(v=>v.toFixed(8)).join(',');if(!groups.has(key))groups.set(key,new Set());groups.get(key).add(vi);}
    }
    assert.ok(Math.abs(area-4)<.0001);
    assert.ok(m.steps.every(s=>s.folds.filter(isGuideFold).length===1));
    assert.ok(m.steps.every(s=>s.folds.every(op=>!op.targets && op.type!=='unfold')));
    for(let t=0;t<=m.steps.length;t+=.25){
      const p=computeFoldState(m,t).positions;
      for(const f of m.faces)for(const a of f)for(const b of f)
        assert.ok(Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]))<1e-8,`panel at ${t}`);
      for(const ids of groups.values()){const first=p[ids.values().next().value];for(const i of ids)assert.ok(first.distanceTo(p[i])<1e-7,`seam at ${t}`);}
    }
  });
}

function crosses(p,q,[a,b,c]) {
  const u=b.clone().sub(a),v=c.clone().sub(a),n=u.clone().cross(v),d=q.clone().sub(p),den=n.dot(d);
  if(Math.abs(den)<1e-9)return false;
  const f=n.dot(a.clone().sub(p))/den;
  if(f<1e-7||f>1-1e-7)return false;
  const x=p.clone().addScaledVector(d,f).sub(a),uu=u.dot(u),uv=u.dot(v),vv=v.dot(v),xu=x.dot(u),xv=x.dot(v),det=uu*vv-uv*uv;
  const s=(xu*vv-xv*uv)/det,r=(xv*uu-xu*uv)/det;
  return s>1e-7&&r>1e-7&&s+r<1-1e-7;
}
for(const [sides,rings] of [[4,2],[3,3],[4,3],[5,3],[3,4]]) {
  test(`capped antiprism ${sides}/${rings}: closed unit-edge manifold without cap crossings`,()=>{
    const {vertices,faces}=cappedAntiprism(sides,rings),p=vertices.map(v=>new Vector3(...v)),edges=new Map(),tri=[];
    for(const f of faces){
      const [a,b,c]=f.map(i=>p[i]),normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      const peak=a.clone().add(b).add(c).multiplyScalar(1/3).addScaledVector(normal,Math.sqrt(1/6));
      for(let j=0;j<3;j++){
        const a=f[j],b=f[(j+1)%3],key=[a,b].sort((x,y)=>x-y).join(',');
        assert.ok(Math.abs(p[a].distanceTo(p[b])-1)<1e-10);
        edges.set(key,(edges.get(key)||0)+1);tri.push([p[a],p[b],peak]);
      }
    }
    assert.ok([...edges.values()].every(n=>n===2));
    assert.equal(vertices.length-edges.size+faces.length,2);
    assert.equal(edges.size,3*sides*rings);
    for(let a=0;a<tri.length;a++)for(let b=a+1;b<tri.length;b++)for(let i=0;i<3;i++){
      assert.ok(!crosses(tri[a][i],tri[a][(i+1)%3],tri[b]));
      assert.ok(!crosses(tri[b][i],tri[b][(i+1)%3],tri[a]));
    }
  });
}
