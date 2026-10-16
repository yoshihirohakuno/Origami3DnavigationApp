import assert from 'node:assert/strict';
import { computeFoldState } from '../../src/engine/fold.ts';
import { paperTriangles } from '../../src/engine/mesh.ts';
import { renderFaceOffsets } from '../../src/engine/renderLayers.ts';

// Cast from the front through the actual offset triangles. No face colors or
// designated drawing priorities are supplied by the test.
export function frontSide(model,time,x,y){
  const state=computeFoldState(model,time),p=state.positions,o=renderFaceOffsets(model,state),hits=[];
  for(const[fi,ai,bi,ci]of paperTriangles(model)){
    const a=p[ai],b=p[bi],c=p[ci];
    const d=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
    if(Math.abs(d)<1e-12)continue;
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/d;
    const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/d;
    if(u>1e-8&&v>1e-8&&u+v<1-1e-8)hits.push({z:o[fi].z+u*a.z+v*b.z+(1-u-v)*c.z,side:Math.sign(d)});
  }
  assert.ok(hits.length,`no paper at ${x}, ${y}`);
  return hits.sort((a,b)=>b.z-a.z)[0].side;
}
