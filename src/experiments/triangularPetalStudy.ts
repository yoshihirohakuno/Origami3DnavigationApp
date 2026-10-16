import { computeFoldState } from '../engine/fold';
import type { FoldOp, OrigamiModel } from '../engine/types';

type XY=readonly [number,number];
const cross=(a:XY,b:XY,c:XY)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function weights(p:XY,a:XY,b:XY,c:XY):[number,number,number]{
  const d=cross(a,b,c),v=cross(a,p,c)/d,w=cross(a,b,p)/d;
  return [1-v-w,v,w];
}
function clip(subject:XY[],boundary:XY[]):XY[]{
  let result=subject;
  const winding=Math.sign(boundary.reduce((sum,a,i)=>{const b=boundary[(i+1)%boundary.length];return sum+a[0]*b[1]-a[1]*b[0];},0));
  for(let j=0;j<boundary.length;j++){
    const a=boundary[j],b=boundary[(j+1)%boundary.length],input=result;result=[];
    input.forEach((p,i)=>{
      const q=input[(i+1)%input.length],s=cross(a,b,p)*winding,t=cross(a,b,q)*winding;
      if(s>=-1e-10)result.push(p);
      if((s>1e-10&&t< -1e-10)||(s< -1e-10&&t>1e-10)){
        const f=s/(s-t);result.push([p[0]+f*(q[0]-p[0]),p[1]+f*(q[1]-p[1])]);
      }
    });
  }
  return result;
}

/** Private material experiment. Split the already-folded triangular flap into
 * a fixed root, a lifting panel, and two pairs of coupled side triangles.
 * The two side points obey three real paper-edge distance constraints.
 * Parameters describe a mechanism comparison, not verified author diagrams. */
export function triangularPetalStudy(source:OrigamiModel,tip:number,left:number,right:number,
  inset=1/8,halfWidth=1/2):OrigamiModel{
  if([tip,left,right].some(i=>!Number.isInteger(i)||i<0||i>=source.vertices.length)
    ||new Set([tip,left,right]).size!==3||source.faceSheet||source.triangles||source.sheetStartSteps)
    throw new Error('Triangle petal study requires three distinct vertices on a single ordinary sheet');
  const pose=computeFoldState(source,source.steps.length).positions;
  const center=pose[left].clone().add(pose[right]).multiplyScalar(.5);
  const radius=pose[left].distanceTo(pose[right])/2;
  if(radius<1e-8||Math.abs(pose[left].x-center.x+radius)>1e-8||Math.abs(pose[right].x-center.x-radius)>1e-8
    ||Math.abs(pose[left].y-center.y)>1e-8||Math.abs(pose[right].y-center.y)>1e-8
    ||Math.abs(pose[tip].x-center.x)>1e-8||Math.abs(pose[tip].y-center.y+radius)>1e-8
    ||pose.some(p=>Math.abs(p.z)>1e-8)||!(inset>0&&inset<.5&&halfWidth>0&&halfWidth<1-inset))
    throw new Error('Triangle petal study requires a flat symmetric downward flap');
  const control:XY[]=[[-1,0],[1,0],[0,-1],[-halfWidth,-inset],[halfWidth,-inset],[-.5,-.5],[.5,-.5],[0,-inset],[0,0]];
  // Also retain the material center crease. Later folding the whole model in
  // half must not rotate one half of an uncut panel across that center line.
  const regions=[[0,3,7,8],[8,7,4,1],[3,2,7],[7,2,4],[0,5,3],[5,2,3],[1,4,6],[6,4,2]];
  const world=control.map(([x,y]):XY=>[center.x+x*radius,center.y+y*radius]);
  const vertices=source.vertices.map(p=>[...p] as [number,number]);
  const points=pose.map(p=>[p.x,p.y] as XY),faces:number[][]=[];
  const oldBindings:NonNullable<FoldOp['surfacePoints']>=[];
  const moving=new Set(source.steps.at(-1)!.folds[0].moving);
  const selected=source.faces.map(f=>f.some(i=>moving.has(i))&&f.every(i=>{
    const x=(points[i][0]-center.x)/radius,y=(points[i][1]-center.y)/radius;
    return y<=1e-8&&y>=-1-1e-8&&Math.abs(x)<=1+y+1e-8;
  }));
  const frame=(face:number[])=>{
    for(let j=1;j<face.length-1;j++)if(Math.abs(cross(points[face[0]],points[face[j]],points[face[j+1]]))>1e-12)
      return [face[0],face[j],face[j+1]] as const;
    throw new Error('Triangle petal study encountered a degenerate parent panel');
  };
  function vertex(p:XY,fi:number):number{
    const [a,b,c]=frame(source.faces[fi]),w=weights(p,points[a],points[b],points[c]);
    const material=[0,1].map(k=>w[0]*source.vertices[a][k]+w[1]*source.vertices[b][k]+w[2]*source.vertices[c][k]) as [number,number];
    const found=vertices.findIndex(v=>Math.hypot(v[0]-material[0],v[1]-material[1])<1e-10);
    if(found>=0)return found;
    const i=vertices.length;vertices.push(material);points.push(p);
    oldBindings.push([i,a,b,c,...w]);return i;
  }
  const owner=(p:XY)=>source.faces.findIndex((f,fi)=>selected[fi]&&f.slice(1,-1).some((_,j)=>{
    const w=weights(p,points[f[0]],points[f[j+1]],points[f[j+2]]);
    return w.every(n=>Number.isFinite(n)&&n>=-1e-8);
  }));
  const ids=[left,right,tip,...world.slice(3).map(p=>{const fi=owner(p);if(fi<0)throw new Error('Petal control left its original material');return vertex(p,fi);})];
  const active=new Set<number>();
  source.faces.forEach((f,fi)=>{
    if(!selected[fi]){faces.push([...f]);return;}
    for(const region of regions){
      const polygon=clip(f.map(i=>points[i]),region.map(i=>world[i]));
      const area=Math.abs(polygon.reduce((sum,a,i)=>{const b=polygon[(i+1)%polygon.length];return sum+a[0]*b[1]-a[1]*b[0];},0))/2;
      if(area<1e-12)continue;
      const result=[...new Set(polygon.map(p=>vertex(p,fi)))];
      if(result.length>=3){faces.push(result);result.forEach(i=>active.add(i));}
    }
  });
  // Insert material edge subdivisions into BOTH neighbors, including fixed
  // paper outside the flap. A crease endpoint must not leave a T junction.
  for(const face of faces){
    const expanded:number[]=[];
    face.forEach((a,j)=>{
      const b=face[(j+1)%face.length],A=vertices[a],B=vertices[b],dx=B[0]-A[0],dy=B[1]-A[1],d=dx*dx+dy*dy;
      expanded.push(a);
      const edge=vertices.flatMap((p,i)=>{
        const t=((p[0]-A[0])*dx+(p[1]-A[1])*dy)/d;
        return t>1e-9&&t<1-1e-9&&Math.abs(cross(A,B,p))<1e-10?[{i,t}]:[];
      }).sort((a,b)=>a.t-b.t);
      edge.forEach(({i})=>expanded.push(i));
    });
    face.splice(0,face.length,...expanded);
  }
  const bindings:NonNullable<FoldOp['surfacePoints']>=[];
  for(const i of active){
    if(ids.includes(i))continue;
    let found=false;
    for(const region of regions)for(let j=1;j<region.length-1&&!found;j++){
      const [a,b,c]=[region[0],region[j],region[j+1]],w=weights(points[i],world[a],world[b],world[c]);
      if(w.every(n=>n>=-1e-8)){bindings.push([i,ids[a],ids[b],ids[c],...w]);found=true;}
    }
    if(!found)throw new Error('Petal subdivision lost its control panel');
  }
  const steps:OrigamiModel['steps']=source.steps.map(s=>({...s,folds:s.folds.map(op=>({...op,surfacePoints:[...(op.surfacePoints??[]),...oldBindings]}))}));
  const dynamic=new Set([tip,ids[5],ids[6]]);
  for(const [i,a,b,c,u,v,w]of bindings)if([[a,u],[b,v],[c,w]].some(([j,weight])=>dynamic.has(j)&&weight>1e-8))dynamic.add(i);
  const op:FoldOp={axis:[ids[3],ids[4]],moving:[...dynamic],type:'valley',angle:180,direction:-1,
    petal:{tip,sides:[[ids[5],ids[3],left],[ids[6],ids[4],right]]},surfacePoints:bindings};
  steps.push({folds:[op],motionRange:[0,.5],
    description:{ja:'中央の角を持ち上げ、左右のひだを開きます。',en:'Lift the central corner and open the two side pleats.'},
    caution:{ja:'折り位置を照合中の構造比較です。完成作品の折り図ではありません。',en:'Mechanism comparison; crease positions are still under review. This is not a completed folding guide.'}},
  {folds:[op],motionRange:[.5,1],description:{ja:'角を上へ送り、左右のひだを内側へ寄せます。',en:'Continue lifting the corner while bringing the side pleats inward.'},
    caution:{ja:'未完成の構造比較です。見本との材料対応、中央の仕上げ、頭・腕・脚・翼・尾は未完成です。',en:'Unfinished mechanism comparison. Reference material matching, central finishing, head, arms, legs, wings and tail are unfinished.'}});
  return {...source,id:'dragon-central-study',name:{ja:'ドラゴン・中央の連動折りの構造比較',en:'Dragon central coupled-fold mechanism study'},vertices,faces,steps};
}
