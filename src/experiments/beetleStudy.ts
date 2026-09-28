import type { OrigamiModel, FoldOp } from '../engine/types';
import { squareBaseModel } from '../models/squareBase';
import { computeFoldState } from '../engine/fold';
import { foldFlap } from '../engine/foldFlap';

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
 if(a!==undefined)return [[o,a,p],[p,a,d]];
 const b=f.find(i=>[2,4,6,8].includes(i))!,q=pointOn(qs,o,b,.5);
 return [[o,p,q],[p,d,b],[p,b,q]];
});
for(const map of [ps,qs])for(const [key,i]of map){const [o,b]=key.split(',').map(Number);if(o!==0)followers.push([i,map.get(`0,${b}`)!,map.get(`0,${b}`)!,map.get(`0,${b}`)!,1,0,0]);}
model.faces=faces;
for(const b of [2,4,6,8]){
 const left=b-1,right=b===8?1:b+1;
 const dl=ds.get(`${left},${b}`)!,dr=ds.get(`${right},${b}`)!,pl=ps.get(`0,${dl}`)!,pr=ps.get(`0,${dr}`)!;
 const before=computeFoldState(model,13).positions;
 const direction=before[pr].x>before[pl].x?-1:1;
 model.steps.push({folds:[{axis:[pl,pr],moving:[b,dl,dr],type:'valley',angle:180,direction,petal:{tip:b,sides:[[dl,pl,left],[dr,pr,right]]},surfacePoints:[...followers]}],description:{ja:'下の一枚を開き、両側を内側にたたみます。',en:'Lift the lower flap and tuck both sides inward.'}});
}
// Fold the small lifted flaps down individually; their side tucks remain.
for(const b of [2,4,6,8])model=foldFlap(model,b,[0,1-Math.SQRT2],0,{description:{ja:'起こした細い先を下へ折り下げます。',en:'Fold the lifted narrow flap down.'}});
model=foldFlap(model,0,[0,-.25],0,{description:{ja:'中央の閉じた先を折り込み、背中を短く整えます。',en:'Tuck the closed central point inward to shorten the back.'}},'back');
// Six real paper flaps become the legs, leaving the other two for the horns.
for(const [corner,angle,height] of [[2,45,-.56],[4,-45,-.56],[6,65,-.51],[8,-65,-.51],[11,-30,-.22],[12,30,-.22]]) {
 const p=computeFoldState(model,model.steps.length).positions;
 const rad=angle*Math.PI/180;const signed=(i:number)=>Math.cos(rad)*(p[i].y-height)-Math.sin(rad)*p[i].x;
 const sign=Math.sign(signed(corner)) as 1|-1;
 const moving=new Set([corner]),selected=new Set<number[]>();let changed=true;
 while(changed){changed=false;for(const f of model.faces)if(!selected.has(f)&&f.some(i=>moving.has(i))){selected.add(f);for(const i of f)if(signed(i)*sign>1e-8)moving.add(i);changed=true;}}
 model=foldFlap(model,corner,[0,height],angle,{description:{ja:'脚の根元を斜めに折り、外へ向けます。',en:'Fold the leg diagonally outward at its root.'}},'front',false,sign,f=>selected.has(f));
}
for(const corner of [9,10])model=foldFlap(model,corner,[0,-.045],0,{description:{ja:'角の先を小さく折り返します。',en:'Fold back the tip of the horn.'}});
for(const [corner,height,angle]of [[9,-.3,55],[10,-.3,15]]) {
 const p=computeFoldState(model,model.steps.length).positions;
 const moving=new Set([corner]),selected=new Set<number[]>();let changed=true;
 while(changed){changed=false;for(const f of model.faces)if(!selected.has(f)&&f.some(i=>moving.has(i))){selected.add(f);for(const i of f)if(p[i].y>height+1e-8)moving.add(i);changed=true;}}
 model=foldFlap(model,corner,[0,height],0,{description:{ja:'角を起こして上下に開きます。',en:'Lift the horn to open the upper and lower jaws.'}},'front',false,1,f=>selected.has(f));
 model.steps.at(-1)!.folds[0].angle=angle;
}
// Preserve the material winding; every original face starts white-side up.
model.faces=model.faces.map(f=>{const [p,q,r]=f.map(i=>model.vertices[i]);return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])<0?f:[...f].reverse();});
model.faceSheet=model.faces.map(()=>0);
model.steps.at(-1)!.caution={ja:'構造検証用の試作です。角・脚・背中の形は調整中で、完成作品ではありません。',en:'Structural study only; the horns, legs and back are not ready for release.'};
export const beetleStudy=model;
export const beetleLandmarks={extraCorners:[9,10,11,12],center:0};

