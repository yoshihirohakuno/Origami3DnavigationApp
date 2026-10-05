import { computeFoldState } from '../engine/fold';
import type { OrigamiModel } from '../engine/types';

/** Follow the leg's material centerline from its tip to the first physical
 * bend. A new connected fold may shorten the free straight segment, so a
 * previous spread crease or a coincident vertex of another layer is unsafe. */
export function straightLegRoot(m:OrigamiModel,tip:number):number{
 const p=computeFoldState(m,m.steps.length).positions;
 const anchor=tip<9?0:tip===10?5:1;
 const [x,y]=m.vertices[tip],dx=m.vertices[anchor][0]-x,dy=m.vertices[anchor][1]-y;
 const length=dx*dx+dy*dy;
 const line=[...new Set(m.faces.flat())].map(i=>({i,t:((m.vertices[i][0]-x)*dx+(m.vertices[i][1]-y)*dy)/length}))
  .filter(({i,t})=>t>=-1e-9&&t<=1+1e-9&&Math.abs(dx*(m.vertices[i][1]-y)-dy*(m.vertices[i][0]-x))<1e-9)
  .sort((a,b)=>a.t-b.t).filter((point,j,all)=>j===0||point.t-all[j-1].t>1e-9);
 const second=line.find(({i})=>p[i].distanceTo(p[tip])>1e-7);
 if(!second)throw new Error('The leg has no free material centerline');
 const along=p[second.i].clone().sub(p[tip]).normalize();
 let root=tip;
 for(const {i} of line){
  const relative=p[i].clone().sub(p[tip]);
  if(relative.cross(along).length()>5e-7||p[i].clone().sub(p[tip]).dot(along)<-1e-7)break;
  root=i;
 }
 if(root===tip)throw new Error('The leg has no straight free segment');
 return root;
}
