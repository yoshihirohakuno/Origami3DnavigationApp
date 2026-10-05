// Authoring diagnostic for zero-thickness paper, not a collision solver.
// Coplanar stacks and contact along crease edges are intentionally excluded.
const subtract=(a,b)=>[a.x-b.x,a.y-b.y,a.z-b.z];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

// Clip the planes' intersection line to the interior of ONE triangle. The
// margin is a distance in paper units from all three edges. Requiring overlap
// of BOTH intervals excludes a second triangle's hinge touching the interior
// of the first, even if a thin triangle's noisy plane extrapolates far away.
function interiorInterval(triangle,normal,origin,direction,epsilon){
 let low=-Infinity,high=Infinity;
 for(let i=0;i<3;i++){
  const edge=subtract(triangle[(i+1)%3],triangle[i]),length=Math.hypot(...edge);
  if(length<=epsilon)return null;
  const distance=dot(cross(edge,subtract(origin,triangle[i])),normal)/length;
  const slope=dot(cross(edge,direction),normal)/length;
  if(Math.abs(slope)<1e-12){if(distance<=epsilon)return null;continue;}
  const cut=(epsilon-distance)/slope;
  if(slope>0)low=Math.max(low,cut);else high=Math.min(high,cut);
  if(high<=low)return null;
 }
 return [low,high];
}

export function trianglesCross(a,b,epsilon=1e-7){
 const normal=t=>{const n=cross(subtract(t[1],t[0]),subtract(t[2],t[0])),l=Math.hypot(...n);return l>epsilon**2?n.map(v=>v/l):null;};
 const na=normal(a),nb=normal(b);
 if(!na||!nb)return false;
 // Both triangles must straddle the other's plane. A plane through the
 // first triangle's hinge can cut edges of the second even when the first
 // stays wholly above it (apart from floating point drift at that hinge).
 const straddles=(points,origin,n)=>{
  const distances=points.map(p=>dot(subtract(p,origin),n));
  return Math.min(...distances)<-epsilon&&Math.max(...distances)>epsilon;
 };
 if(!straddles(a,b[0],nb)||!straddles(b,a[0],na))return false;
 const line=cross(na,nb),length=Math.hypot(...line);
 if(length<1e-12)return false;
 const direction=line.map(v=>v/length);
 let origin;
 for(let i=0;i<3;i++){
  const p=a[i],q=a[(i+1)%3];
  const dp=dot(subtract(p,b[0]),nb),dq=dot(subtract(q,b[0]),nb);
  if(dp*dq>=0)continue;
  const t=dp/(dp-dq);
  origin={x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y),z:p.z+t*(q.z-p.z)};
  break;
 }
 if(!origin)return false;
 // A shallow angle amplifies tiny normal drift into a larger displacement
 // along a hinge. Convert the normal-distance tolerance to that in-plane
 // margin; otherwise nanometers of contact look like a transverse crossing.
 const margin=epsilon/length;
 const ia=interiorInterval(a,na,origin,direction,margin);
 const ib=interiorInterval(b,nb,origin,direction,margin);
 return !!(ia&&ib&&Math.min(ia[1],ib[1])-Math.max(ia[0],ib[0])>epsilon);
}

export function intersectingPanels(triangles,positions,limit=20){
 const panels=triangles.map(([face,...ids])=>{
  const points=ids.map(i=>positions[i]);
  return {face,points,min:['x','y','z'].map(k=>Math.min(...points.map(p=>p[k]))),max:['x','y','z'].map(k=>Math.max(...points.map(p=>p[k])))};
 });
 const pairs=new Map();
 for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){
  const a=panels[i],b=panels[j];
  if(a.face===b.face||a.min.some((v,k)=>v>b.max[k]+1e-7||b.min[k]>a.max[k]+1e-7))continue;
  const key=[a.face,b.face].sort((x,y)=>x-y).join(',');
  if(pairs.has(key))continue;
  if(trianglesCross(a.points,b.points)){pairs.set(key,[a.face,b.face]);if(pairs.size>=limit)return [...pairs.values()];}
 }
 return [...pairs.values()];
}
