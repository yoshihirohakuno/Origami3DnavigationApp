import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPaper } from '../src/engine/painter.ts';

const point=(x,y,z)=>({x,y,z});
function inside(ps,x,y){
 let sign=0;
 for(let i=0;i<ps.length;i++){
  const a=ps[i],b=ps[(i+1)%ps.length],d=(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);
  if(Math.abs(d)<1e-10)continue;
  if(sign&&Math.sign(d)!==sign)return false;
  sign=Math.sign(d);
 }
 return !!sign;
}
function depth(p,x,y){
 const [a,b,c]=p.points,u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
 const nx=u.y*v.z-u.z*v.y,ny=u.z*v.x-u.x*v.z,nz=u.x*v.y-u.y*v.x;
 return a.z-(nx*(x-a.x)+ny*(y-a.y))/nz;
}
function frontFace(ps,x,y){
 let result, z=-Infinity;
 for(const p of ps)if(inside(p.points,x,y)){
  const d=depth(p,x,y);if(d>z+1e-8||Math.abs(d-z)<1e-8){z=d;result=p.face;}
 }
 return result;
}
function paintedFace(ps,x,y){let result;for(const p of ps)if(inside(p.points,x,y))result=p.face;return result;}

test('dense tiled paper retains the geometrically frontmost layer at sampled points',()=>{
 const ps=[];
 for(let i=0;i<160;i++){
  const x=(i%16)*.1,y=Math.floor(i/16)*.1,z=i*.002;
  ps.push({face:i,points:[point(x,y,z),point(x+.28,y,z+.008),point(x,y+.26,z-.006)]});
 }
 const sorted=orderPaper(ps);
 for(let i=0;i<47;i++)for(let j=0;j<31;j++){
  const x=(i+.371)*1.8/47,y=(j+.613)*1.2/31;
  assert.equal(paintedFace(sorted,x,y),frontFace(ps,x,y),`wrong exposed face at ${x},${y}`);
 }
});

test('tile pruning removes hidden stacks and keeps the exposed background outside them',()=>{
 const ps=[{face:0,points:[point(0,0,0),point(2,0,0),point(0,2,0)]}];
 for(let i=1;i<=150;i++)ps.push({face:i,points:[point(0,0,i*.001),point(1,0,i*.001),point(0,1,i*.001)]});
 const sorted=orderPaper(ps);
 assert.ok(sorted.length<200,'hidden sheets must not all survive as tile fragments');
 assert.equal(paintedFace(sorted,.173,.219),150);
 assert.equal(paintedFace(sorted,1.173,.219),0,'partial coverage must retain the rest of the paper');
});

test('projected crossing faces keep their depth ordering on both sides of the crossing',()=>{
 const ps=[];
 for(let i=0;i<130;i++)ps.push({face:i,points:[point(-1,-1,-2-i*.01),point(1,-1,-2-i*.01),point(0,1,-2-i*.01)]});
 ps.push({face:130,points:[point(-1,-1,-1),point(1,-1,1),point(0,1,0)]});
 ps.push({face:131,points:[point(-1,-1,1),point(1,-1,-1),point(0,1,0)]});
 const sorted=orderPaper(ps);
 for(const x of [-.61,-.19,.21,.63])assert.equal(paintedFace(sorted,x,-.37),x<0?131:130);
});
