import type { OrigamiModel } from '../engine/types';
import { createBeetlePetalBase } from './beetlePetalBase';
import { computeFoldState } from '../engine/fold';
import { foldFlap } from '../engine/foldFlap';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';

let model: OrigamiModel = createBeetlePetalBase();
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

