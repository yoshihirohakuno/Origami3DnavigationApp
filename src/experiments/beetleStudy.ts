import type { OrigamiModel, FoldOp } from '../engine/types';
import { squareBaseModel } from '../models/squareBase';
import { computeFoldState } from '../engine/fold';
import { foldFlap } from '../engine/foldFlap';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';

/** Development-only blintz frog-base research; never a finished library model. */
const vertices:[number,number][]=squareBaseModel.vertices.map(([x,y])=>[x/1.4142,y/1.4142]);
let faces:number[][]=[];
const corners:[[number,number],number,number,number][]=[[[1,1],2,3,4],[[-1,1],4,5,6],[[-1,-1],6,7,8],[[1,-1],8,1,2]];
let model:OrigamiModel={id:'beetle-base-study',name:{ja:'カブトムシ用・基本形の試作',en:'Beetle base study'},difficulty:2,vertices,faces,steps:[],renderLayerSeparation:.00004,sheetColors:[{front:'#805032',back:'#f3e6ca'}],cameraPos:[0,0,5]};
for(const [[x,y],a,mid,b]of corners){const tip=vertices.length;vertices.push([x,y]);faces.push([a,tip,mid],[mid,tip,b]);model.steps.push({folds:[{axis:[a,b],moving:[tip],angle:180,type:'valley'}],description:{ja:`${tip-8}つ目の角を中心へ合わせます。`,en:`Fold corner ${tip-8} to the center.`}});}
faces.push(...squareBaseModel.faces.map(f=>[...f]));
const followers:NonNullable<FoldOp['surfacePoints']>=[9,10,11,12].map(i=>[i,0,0,0,1,0,0]);
model.steps.push(...squareBaseModel.steps.map(step=>({...step,folds:step.folds.map(op=>({...op,angle:180,surfacePoints:[...followers]})),caution:undefined})));
// Insert an edge point in the physical material. Earlier operations carry it
// on its parent edge, including the initial corner folds.
function edgePoint(a:number,b:number,t:number){
 const vi=model.vertices.length;const pa=model.vertices[a],pb=model.vertices[b];model.vertices.push([pa[0]*(1-t)+pb[0]*t,pa[1]*(1-t)+pb[1]*t]);
 for(const step of model.steps)for(const op of step.folds)op.surfacePoints=[...(op.surfacePoints??[]),[vi,a,b,a,1-t,t,0]];
 return vi;
}
const ds=new Map<string,number>();
for(const a of [1,3,5,7])for(const b of [a===1?8:a-1,a+1])ds.set(`${a},${b}`,edgePoint(a,b,Math.SQRT2-1));
faces=faces.flatMap(f=>{
 const a=f.find(i=>[1,3,5,7].includes(i))!,b=f.find(i=>[2,4,6,8].includes(i))!,o=f.find(i=>i===0||i>=9)!;
 const d=ds.get(`${a},${b}`)!;
 return [[o,a,d],[o,d,b]];
});
model.faces=faces;
for(const a of [1,3,5,7]){
 const prev=a===1?8:a-1,next=a+1,d1=ds.get(`${a},${a===3||a===7?next:prev}`)!,d2=ds.get(`${a},${a===3||a===7?prev:next}`)!;
 model.steps.push({folds:[{axis:[0,next],moving:[a,d2],type:'valley',angle:180,direction:a===1||a===5?1:-1,petal:{tip:d2,sides:[[a,0,d1]]},surfacePoints:[...followers]}],description:{ja:'袋の左右を開き、細長いひし形につぶします。',en:'Open the pocket and squash it into a narrow kite.'}});
}
// Refine each squash panel into the hinges needed for the next petal.
const ps=new Map<string,number>(),qs=new Map<string,number>();
function pointOn(map:Map<string,number>,o:number,b:number,t:number){const key=`${o},${b}`;if(!map.has(key))map.set(key,edgePoint(o,b,t));return map.get(key)!;}
faces=faces.flatMap(f=>{
 const o=f[0], d=f.find(i=>[...ds.values()].includes(i))!;
 const p=pointOn(ps,o,d,Math.SQRT1_2);
 const a=f.find(i=>[1,3,5,7].includes(i));
 let panels:number[][];
 if(a!==undefined)panels=[[o,a,p],[p,a,d]];
 else {
  const b=f.find(i=>[2,4,6,8].includes(i))!,q=pointOn(qs,o,b,.5);
  panels=[[o,p,q],[p,d,b],[p,b,q]];
 }
 return panels;
});
for(const map of [ps,qs])for(const [key,i]of map){const [o,b]=key.split(',').map(Number);if(o!==0)followers.push([i,map.get(`0,${b}`)!,map.get(`0,${b}`)!,map.get(`0,${b}`)!,1,0,0]);}
model.faces=faces;
for(const b of [2,4,6,8]){
 const left=b-1,right=b===8?1:b+1;
 const dl=ds.get(`${left},${b}`)!,dr=ds.get(`${right},${b}`)!,pl=ps.get(`0,${dl}`)!,pr=ps.get(`0,${dr}`)!;
 const before=computeFoldState(model,model.steps.length).positions;
 const direction=before[pr].x>before[pl].x?-1:1;
 model.steps.push({folds:[{axis:[pl,pr],moving:[b,dl,dr],type:'valley',angle:180,direction,petal:{tip:b,sides:[[dl,pl,left],[dr,pr,right]]},surfacePoints:[...followers]}],description:{ja:'下の一枚を開き、両側を内側にたたみます。',en:'Lift the lower flap and tuck both sides inward.'}});

}
export const beetlePetalBase: OrigamiModel = model;
// Fold the small lifted flaps down individually; their side tucks remain.
for(const b of [2,4,6,8])model=foldFlap(model,b,[0,1-Math.SQRT2],0,{description:{ja:'起こした細い先を下へ折り下げます。',en:'Fold the lifted narrow flap down.'}});
model=foldFlap(model,0,[0,-.08],0,{description:{ja:'中央の閉じた先を折り込み、背中を短く整えます。',en:'Tuck the closed central point inward to shorten the back.'}},'back');
export const beetleNarrowStart=model.steps.length;
for(const corner of [2,4,6,8,9,10,11,12])for(const side of [-1,1]) {
 const p=computeFoldState(model,model.steps.length).positions,tip=p[corner];
 const degrees=90-side*11.25;
 const rad=degrees*Math.PI/180;
 const signed=(i:number)=>Math.cos(rad)*(p[i].y-tip.y)-Math.sin(rad)*(p[i].x-tip.x);
 const candidates=[...new Set(model.faces.filter(f=>f.includes(corner)).flat())];
 const sign=corner<9?-side:side;
 const seeds=candidates.filter(i=>signed(i)*sign>1e-8);
 if(!seeds.length)continue;
 model=foldConnectedFlap(model,seeds,[tip.x,tip.y],degrees,{description:{ja:'先端の片側を内側へ折り、幅を細くします。',en:'Fold one edge inward to narrow the point.'}},'back');
}
export const beetleNarrowEnd=model.steps.length;
export const beetlePointRouteStart=model.steps.length;
for(const extra of [9,10,11,12])model=foldConnectedFlap(model,extra,[0,-.38],0,{description:{ja:'内側の先端を反対側へ折り出します。',en:'Fold the inner point toward the open end.'}},'back');
for(const [corner,side]of [[9,-1],[10,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(corner)).flat())].filter(i=>p[i].x*side>1e-8);
 model=foldConnectedFlap(model,seeds,[0,0],90,{description:{ja:'角を縦に半分に折り、外側を色の面で包みます。',en:'Fold the horn lengthwise in half, keeping the colored surface outside.'}},'back');
}
export const beetleLegRootStart=model.steps.length;
// Six real paper flaps become the legs, leaving the other two for the horns.
for(const [corner,angle,height] of [[2,30,-.5],[4,-30,-.5],[6,45,-.55],[8,-45,-.55],[11,65,-.6],[12,-65,-.6]]) {
 model=foldConnectedFlap(model,corner,[0,height],angle,{description:{ja:'脚の根元を斜めに折り、外へ向けます。',en:'Fold the leg diagonally outward at its root.'}});
}
export const beetleShoulderStart=model.steps.length;
for(const corner of [3,7])model=foldConnectedFlap(model,corner,[0,-.65],0,{description:{ja:'頭の付け根の角を折り込み、輪郭を整えます。',en:'Tuck the point beside the head to refine the outline.'}},'back');
const flatHornStart=model.steps.length;
export const beetleBodyStart=flatHornStart;
export const beetleHornStart=flatHornStart+2;
for(const [corner,height,angle]of [[9,-.6,55],[10,-.6,15]]) {
 const upper=corner===9;
 model=foldConnectedFlap(model,corner,[0,height],0,{description:{ja:upper?'上側の角を起こします。':'下側の角を下へ開きます。',en:upper?'Lift the upper horn.':'Open the lower jaw downward.'}},upper?'front':'back',angle);
}
// Creases perpendicular to each leg avoid traversing into the horn material.
// Bend the outer part down, one leg per operation; do not alter its lengths.
export const beetleJointStart=model.steps.length+2;
for(const [corner,rootHeight]of [[2,-.5],[4,-.5],[6,-.55],[8,-.55],[11,-.6],[12,-.6]]) {
 const p=computeFoldState(model,model.steps.length).positions,tip=p[corner];
 const ux=tip.x,uy=tip.y-rootHeight;
 const origin:[number,number]=[ux*.72,rootHeight+uy*.72];
 const degrees=Math.atan2(ux,-uy)*180/Math.PI;
 model=foldConnectedFlap(model,corner,origin,degrees,{description:{ja:'脚先を下へ曲げ、接地する関節を作ります。',en:'Bend the outer leg down to form its foot joint.'}},'back',65);
}
model.steps.push({folds:[{axis:[0,1],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:180}],description:{ja:'角を上に向けて全体を回します。',en:'Turn the model so the horns point upward.'}});
// Author the later appendage hinges while their source panels are still flat.
// Then insert the longitudinal back creases. Fine points after those creases
// must travel rigidly with their panel, not interpolate across its bent edges.
const flatSteps=model.steps;
model={...model,steps:flatSteps.slice(0,flatHornStart)};
const oldBindingCount=model.steps[0].folds[0].surfacePoints!.length;
for(const side of [-1,1]){
 const p=computeFoldState(model,model.steps.length).positions;
 const seeds=p.flatMap((v,i)=>v.x*side>1e-7?[i]:[]);
 model=foldConnectedFlap(model,seeds,[0,0],90,{description:{ja:side<0?'背中の左側を下へ折り、中央に稜線を作ります。':'背中の右側も下へ折り、立体的に整えます。',en:side<0?'Fold the left side of the back downward to form a central ridge.':'Fold the right side downward to shape the raised back.'}},'back',20);
}
export const beetleBodyBindings=model.steps[0].folds[0].surfacePoints!.slice(oldBindingCount);
for(const step of flatSteps.slice(flatHornStart))model.steps.push({...step,folds:step.folds.map(op=>{
 const moving=new Set(op.moving);
 for(const [vi,a,b,c,u,v,w]of [...(op.surfacePoints??[]),...beetleBodyBindings]){
  if([[a,u],[b,v],[c,w]].some(([i,weight])=>weight>1e-10&&moving.has(i)))moving.add(vi);
 }
 return {...op,moving:[...moving],surfacePoints:undefined};
})});
// Shape the hooks AFTER raising the horns, using their actual 3D plane.
// A flat 180-degree tip tuck followed by lifting the whole horn cannot create
// opposing hooks: it leaves both tips folded back along the same straight line.
const turn=model.steps.pop()!;
export const beetleHookStart=model.steps.length;
for(const [corner,angle,zsign]of [[9,85,-1],[10,45,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const root=model.steps[beetleHornStart+(corner===9?0:1)].folds[0];
 const center=p[root.axis[0]].clone().lerp(p[root.axis[1]],.5);
 const tip=p[corner],along=tip.clone().sub(center).normalize();
 const face=model.faces.find(f=>f.includes(corner)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 const direction=(Math.sign(crease.clone().cross(along).z)*zsign) as 1|-1;
 model=foldSpatialFlap(model,corner,center.clone().lerp(tip,.75),crease,along,angle,direction,{
  description:{ja:corner===9?'上の角の先を下へ曲げます。':'下の角の先を上へ曲げます。',
   en:corner===9?'Bend the upper horn tip downward.':'Bend the lower horn tip upward.'},
 });
}
model.steps.push({...turn,folds:turn.folds.map(op=>({...op,moving:model.vertices.map((_,i)=>i)}))});
// Preserve the material winding; every original face starts white-side up.
model.faces=model.faces.map(f=>{const [p,q,r]=f.map(i=>model.vertices[i]);return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])<0?f:[...f].reverse();});
model.faceSheet=model.faces.map(()=>0);
model.steps.at(-1)!.caution={ja:'構造検証用の試作です。角・脚・背中の形は調整中で、完成作品ではありません。',en:'Structural study only; the horns, legs and back are not ready for release.'};
export const beetleStudy=model;
export const beetleLandmarks={extraCorners:[9,10,11,12],center:0};

