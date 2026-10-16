import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { petalSide } from '../src/engine/petal.ts';
const width=(28-5*Math.sqrt(7))/24;
function fixture(scale){
  return {point:new Vector3(-.5*scale,-.5*scale,0),anchor:new Vector3(-width*scale,-scale/8,0),
    neighbor:new Vector3(-scale,0,0),tip:new Vector3(0,-scale,0),end:new Vector3(0,.75*scale,0)};
}

test('a flat petal closure does not invent a square-root-sized gap from squared-distance roundoff',()=>{
  for(const scale of[.01,.25/Math.SQRT2,1,10]){
    const f=fixture(scale),p=petalSide(f.point,f.anchor,f.neighbor,f.tip,f.end);
    assert.ok(Math.abs(p.z)<64*Number.EPSILON*scale);
    for(const[a,b]of[[f.anchor,f.anchor],[f.neighbor,f.neighbor],[f.tip,f.end]])
      assert.ok(Math.abs(f.point.distanceTo(a)-p.distanceTo(b))<64*Number.EPSILON*scale);
  }
});

test('a real open petal remains three-dimensional and retains its three edge lengths',()=>{
  const f=fixture(1),tip=f.tip.clone().sub(f.anchor).applyAxisAngle(new Vector3(1,0,0),-Math.PI/2).add(f.anchor);
  const p=petalSide(f.point,f.anchor,f.neighbor,f.tip,tip);
  assert.ok(p.z>.05);
  for(const[a,b]of[[f.anchor,f.anchor],[f.neighbor,f.neighbor],[f.tip,tip]])
    assert.ok(Math.abs(f.point.distanceTo(a)-p.distanceTo(b))<1e-12);
});

test('incompatible petal distances still fail instead of being treated as numerical closure',()=>{
  const f=fixture(1);
  assert.throws(()=>petalSide(f.point,f.anchor,f.neighbor,f.tip,new Vector3(0,10,0)),/cannot meet/);
});
