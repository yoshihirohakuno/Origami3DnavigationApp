// Authoring diagnostic for zero-thickness paper, not a collision solver.
// Coplanar stacks and contact along crease edges are intentionally excluded.
const subtract=(a,b)=>[a.x-b.x,a.y-b.y,a.z-b.z];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

function cutsInterior(a,b,triangle,normal,epsilon){
 const da=dot(subtract(a,triangle[0]),normal),db=dot(subtract(b,triangle[0]),normal);
 if(!((da>epsilon&&db< -epsilon)||(da< -epsilon&&db>epsilon)))return false;
 const t=da/(da-db),p={x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y),z:a.z+t*(b.z-a.z)};
 const u=subtract(triangle[1],triangle[0]),v=subtract(triangle[2],triangle[0]),w=subtract(p,triangle[0]);
 const uu=dot(u,u),uv=dot(u,v),vv=dot(v,v),wu=dot(w,u),wv=dot(w,v),den=uu*vv-uv*uv;
 if(den<epsilon**4)return false;
 const s=(vv*wu-uv*wv)/den,r=(uu*wv-uv*wu)/den;
 // Test distance from each edge in paper units, not barycentric fractions.
 // A thin refined triangle can have a large fraction only nanometers from
 // its hinge; treating that as an interior hit misreports numerical contact.
 const area=Math.sqrt(den),opposite=subtract(triangle[2],triangle[1]);
 return s*area/Math.sqrt(vv)>epsilon&&r*area/Math.sqrt(uu)>epsilon
  &&(1-s-r)*area/Math.hypot(...opposite)>epsilon;
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
 for(let i=0;i<3;i++)if(cutsInterior(a[i],a[(i+1)%3],b,nb,epsilon)||cutsInterior(b[i],b[(i+1)%3],a,na,epsilon))return true;
 return false;
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
