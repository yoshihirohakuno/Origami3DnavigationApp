import type { OrigamiModel } from '../engine/types';
import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { beetleExtractedBase } from './beetleExtractedBase';

/** Shared, development-only flat preparation. The legacy study keeps its
 * existing adjacent horn choice; the new cone study checks opposite faces. */
export function createBeetlePleatedCore(lowerHorn:10|11=10,hornPreparation:'half'|'park'='half',finish:{narrowLegs?:boolean;tuckLegEdges?:boolean}={}){
/** Private continuation: open the four partial squares before narrowing them.
 * All eight points share the open-end position. The extra points are not
 * narrowed by simply reflecting the already-squashed kites across one line. */
let model: OrigamiModel = structuredClone(beetleExtractedBase);
model.id='beetle-pleated-study';
model.name={ja:'カブトムシ・部分基本形の段折り試作',en:'Beetle partial-base pleat study'};
// Preserve the base's one consistent sheet orientation; the initial white
// side faces up. Never recolor individual finished panels to hide layer errors.
model.steps[0].caution={ja:'白い面を上にして始めます。',en:'Start with the white side facing up.'};
const beetleSquareOpenStart=model.steps.length;
const beetleSquareCorners=[[9,3,22,24],[10,5,26,28],[11,7,30,32],[12,1,34,36]] as const;
for(const [rim,tip,anchor]of [[22,9,21],[24,9,23],[26,10,25],[28,10,27],[30,11,29],[32,11,31],[34,12,33],[36,12,35]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const d=p[anchor].clone().sub(p[tip]);
 model=foldConnectedFlap(model,rim,[p[tip].x,p[tip].y],Math.atan2(d.y,d.x)*180/Math.PI,{
  description:{ja:[22,26,30,34].includes(rim)?'小さな部分基本形の片側を開きます。':'反対側も開き、小さな正方形にします。',
   en:[22,26,30,34].includes(rim)?'Open one side of the small partial base.':'Open the other side to form a small square.'},
 },'front');
 model.steps.at(-1)!.folds[0].type='valley';
}
const beetlePleatStart=model.steps.length;
for(const tip of [9,10,11,12])for(const side of [-1,1])for(const theta of [33.75,22.5,11.25]){
 const p=computeFoldState(model,model.steps.length).positions,origin=p[tip];
 const degrees=90-side*theta,rad=degrees*Math.PI/180;
 const candidates=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())];
 const seeds=candidates.filter(i=>(Math.cos(rad)*(p[i].y-origin.y)-Math.sin(rad)*(p[i].x-origin.x))*(-side)>1e-8);
 model=foldConnectedFlap(model,seeds,[origin.x,origin.y],degrees,{
  description:{ja:`${side<0?'左':'右'}側の${theta===33.75?'外側':theta===22.5?'中央':'内側'}の折り線で${theta===22.5?'谷':'山'}折りします。`,
   en:`Make the ${theta===22.5?'valley':'mountain'} fold on the ${theta===33.75?'outer':theta===22.5?'middle':'inner'} crease of the ${side<0?'left':'right'} side.`},
 },theta===22.5?'front':'back');
 model.steps.at(-1)!.folds[0].type=theta===22.5?'valley':'mountain';
}
const beetleFlatNarrowStart=model.steps.length;
for(const [tip,side]of [[2,-1],[4,1],[6,-1],[6,1],[8,-1],[8,1]]){
 const p=computeFoldState(model,model.steps.length).positions,origin=p[tip],degrees=90-side*11.25,rad=degrees*Math.PI/180;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())].filter(i=>(Math.cos(rad)*(p[i].y-origin.y)-Math.sin(rad)*(p[i].x-origin.x))*(-side)>1e-8);
 model=foldConnectedFlap(model,seeds,[origin.x,origin.y],degrees,{
  description:{ja:`平らな層の${side<0?'左':'右'}下の辺を${finish.tuckLegEdges?'裏へ折り込み、':''}中心線へ合わせます。`,en:`Fold the ${side<0?'left':'right'} lower edge ${finish.tuckLegEdges?'behind the flat layer':'of the flat layer'} to its centerline.`},
 },finish.tuckLegEdges?'back':'front');
 model.steps.at(-1)!.folds[0].type=finish.tuckLegEdges?'mountain':'valley';
}
const beetleLegNarrowStart=model.steps.length;
if(finish.narrowLegs)for(const [tip,side]of [[6,-1],[6,1],[8,-1],[8,1],[lowerHorn===10?11:10,-1],[12,1]]){
 const p=computeFoldState(model,model.steps.length).positions,origin=p[tip];
 const degrees=90-side*5.625,rad=degrees*Math.PI/180;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())]
  .filter(i=>(Math.cos(rad)*(p[i].y-origin.y)-Math.sin(rad)*(p[i].x-origin.x))*(-side)>1e-8);
 model=foldConnectedFlap(model,seeds,[origin.x,origin.y],degrees,{
  description:{ja:'脚の外側の層を裏へ折り込み、さらに細くします。',en:'Fold the outer leg layer underneath to narrow it further.'},
  caution:[6,8].includes(tip)?{ja:'角の付け根につながる層も、一緒に折られます。',en:'The connected material at the horn root folds with this leg layer.'}:undefined,
 },'back');
 model.steps.at(-1)!.folds[0].type='mountain';
 const after=computeFoldState(model,model.steps.length).positions;
 for(const other of [0,2,4,6,8,9,10,11,12].filter(i=>i!==tip))
  if(after[other].distanceTo(p[other])>5e-7)throw new Error(`Narrowing leg ${tip} moved another appendage tip ${other}`);
}
const beetleHornHalfStart=model.steps.length;
// Half-fold while the leg tips are still on the spine. Doing this after
// spreading the legs folds one of the front legs back across the body.
if(hornPreparation==='half')for(const [tip,side]of [[9,-1],[lowerHorn,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())].filter(i=>p[i].x*side>1e-8);
 model=foldConnectedFlap(model,seeds,[0,0],90,{
  description:{ja:tip===9?'上側の角になる層を縦に半分に折ります。':'下側の角になる層も縦に半分に折ります。',
   en:tip===9?'Fold the upper horn layer lengthwise in half.':'Fold the lower horn layer lengthwise in half.'},
 },'back');
}
else for(const tip of [9,lowerHorn]){
 model=foldConnectedFlap(model,tip,[0,-.5],0,{
  description:{ja:tip===9?'上の角になる層を背中側へよけます。':'下の角になる層も背中側へよけます。',
   en:tip===9?'Park the upper horn layer toward the back.':'Park the lower horn layer toward the back too.'},
  caution:{ja:'脚の層を開くための操作です。角を細く折るのは、胴体を立体にしてからです。',en:'Move this layer aside to access the legs. Narrow the horns after opening the body.'},
 },'back');
}
const beetleLegSpreadStart=model.steps.length;
const rootWidth=.5*Math.tan(Math.PI/16);
const beetleLegRoots=[[2,30],[4,-30],[6,45],[8,-45],[lowerHorn===10?11:10,65],[12,-65]].map(([tip,degrees])=>
 [tip,degrees,-.5-rootWidth*Math.tan(Math.abs(degrees)*Math.PI/180)] as const);
for(const [tip,degrees,height]of beetleLegRoots){
 // The crease passes through the shared root corner, keeping the adjacent
 // point outside the moving component. A crease through (0,-.5) drags it.
 model=foldConnectedFlap(model,tip,[0,height],degrees,{
  description:{ja:'脚の付け根の外側の角を通る折り線で、一本を外へ開きます。',en:'Spread one leg on the diagonal crease through its outer root corner.'},
 });
}
const beetleFrontTuckStart=model.steps.length;
// The two retained wide layers belong to the front legs and shield. Tuck
// only the free outer half of each leg; the opposite side would fold the
// closed back point too. The broad shoulder at the root remains in place.
for(const [tip,side,height]of [[2,-1,beetleLegRoots[0][2]],[4,1,beetleLegRoots[1][2]]]){
 const p=computeFoldState(model,model.steps.length).positions,origin=p[tip];
 const dx=-origin.x,dy=height-origin.y;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())]
  .filter(i=>(dx*(p[i].y-origin.y)-dy*(p[i].x-origin.x))*side>1e-8);
 model=foldConnectedFlap(model,seeds,[origin.x,origin.y],Math.atan2(dy,dx)*180/Math.PI,{
  description:{ja:`${tip===2?'左':'右'}の前脚の広い層を内側へ折り込み、脚を細くします。`,en:`Tuck the wide layer into the ${tip===2?'left':'right'} front leg to narrow it.`},
 },'back');
 model.steps.at(-1)!.folds[0].type='mountain';
}
const beetleHornRestoreStart=model.steps.length;
if(hornPreparation==='park')for(const tip of [9,lowerHorn]){
 model=foldConnectedFlap(model,tip,[0,-.5],0,{
  description:{ja:tip===9?'よけていた上の角を前向きに戻します。':'よけていた下の角も前向きに戻します。',
   en:tip===9?'Return the parked upper horn to its forward position.':'Return the parked lower horn to its forward position too.'},
 },'front');
}
const beetlePleatedBase: OrigamiModel=structuredClone(model);

const beetleShieldStart=model.steps.length;
// Joint 3 is the short shield point between the wide front shoulders. Fold
// only its free triangular tip: the closed back point 0 and the horn point 9
// are different material points, even where layers meet on the centerline.
// The first crease creates the boundary that stops the return fold from
// traversing into the horn's root. Neither operation is a guide-crease return.
const beetleShieldCreases=[-.36,-.37] as const;
for(const [j,height] of beetleShieldCreases.entries()){
 model=foldConnectedFlap(model,3,[0,height],0,{
  description:{ja:j===0?'盾の小さな先を内側へ折ります。':'隣の折り線で盾を折り返し、段を作ります。',
   en:j===0?'Tuck the shield tip inward.':'Fold the shield back on the neighboring crease to form a pleat.'},
  caution:j===0?{ja:'角の付け根まで届かない位置で、小さな三角形だけを折ります。',en:'Fold only the small triangle, keeping its point clear of the horn root.'}:undefined,
 },j===0?'back':'front');
 model.steps.at(-1)!.folds[0].type=j===0?'mountain':'valley';
}

return {model, beetleSquareOpenStart, beetleSquareCorners, beetlePleatStart, beetleFlatNarrowStart, beetleLegNarrowStart, beetleHornHalfStart, beetleHornRestoreStart, beetleLegSpreadStart, beetleLegRoots, beetleFrontTuckStart, beetlePleatedBase, beetleShieldStart, beetleShieldCreases};
}
