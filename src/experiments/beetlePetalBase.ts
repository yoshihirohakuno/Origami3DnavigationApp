import type { OrigamiModel, FoldOp } from '../engine/types';
import { squareBaseModel } from '../models/squareBase';
import { computeFoldState } from '../engine/fold';

/** Author the blintz frog base in its actual paper orientation. The old
 * study retains its legacy route; the extracted route turns the blintz over. */
export function createBeetlePetalBase(turnBlintz = false): OrigamiModel {
const vertices:[number,number][]=squareBaseModel.vertices.map(([x,y])=>[x/1.4142,y/1.4142]);
let faces:number[][]=[];
const corners:[[number,number],number,number,number][]=[[[1,1],2,3,4],[[-1,1],4,5,6],[[-1,-1],6,7,8],[[1,-1],8,1,2]];
let model:OrigamiModel={id:'beetle-base-study',name:{ja:'カブトムシ用・基本形の試作',en:'Beetle base study'},difficulty:2,vertices,faces,steps:[],renderLayerSeparation:.00004,sheetColors:[{front:'#805032',back:'#f3e6ca'}],cameraPos:[0,0,5]};
for(const [[x,y],a,mid,b]of corners){const tip=vertices.length;vertices.push([x,y]);faces.push([a,tip,mid],[mid,tip,b]);model.steps.push({folds:[{axis:[a,b],moving:[tip],angle:180,type:'valley'}],description:{ja:`${tip-8}つ目の角を中心へ合わせます。`,en:`Fold corner ${tip-8} to the center.`}});}
faces.push(...squareBaseModel.faces.map(f=>[...f]));
if (turnBlintz) model.steps.push({
 folds:[{axis:[0,4],moving:vertices.map((_,i)=>i),angle:180,type:'assemble',direction:1}],
 description:{ja:'平らな面を上にして裏返します。',en:'Turn over with the smooth side facing up.'},
});
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
return model;
}
