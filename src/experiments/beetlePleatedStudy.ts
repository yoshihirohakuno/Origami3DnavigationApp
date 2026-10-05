import type { OrigamiModel } from '../engine/types';
import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';
import { beetleExtractedBase } from './beetleExtractedBase';
import { Vector3 } from 'three';

/** Private continuation: open the four partial squares before narrowing them.
 * All eight points share the open-end position. The extra points are not
 * narrowed by simply reflecting the already-squashed kites across one line. */
let model: OrigamiModel = structuredClone(beetleExtractedBase);
model.id='beetle-pleated-study';
model.name={ja:'カブトムシ・部分基本形の段折り試作',en:'Beetle partial-base pleat study'};
// Preserve the base's one consistent sheet orientation; the initial white
// side faces up. Never recolor individual finished panels to hide layer errors.
model.steps[0].caution={ja:'白い面を上にして始めます。',en:'Start with the white side facing up.'};
export const beetleSquareOpenStart=model.steps.length;
export const beetleSquareCorners=[[9,3,22,24],[10,5,26,28],[11,7,30,32],[12,1,34,36]] as const;
for(const [rim,tip,anchor]of [[22,9,21],[24,9,23],[26,10,25],[28,10,27],[30,11,29],[32,11,31],[34,12,33],[36,12,35]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const d=p[anchor].clone().sub(p[tip]);
 model=foldConnectedFlap(model,rim,[p[tip].x,p[tip].y],Math.atan2(d.y,d.x)*180/Math.PI,{
  description:{ja:[22,26,30,34].includes(rim)?'小さな部分基本形の片側を開きます。':'反対側も開き、小さな正方形にします。',
   en:[22,26,30,34].includes(rim)?'Open one side of the small partial base.':'Open the other side to form a small square.'},
 },'front');
 model.steps.at(-1)!.folds[0].type='valley';
}
export const beetlePleatStart=model.steps.length;
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
export const beetleFlatNarrowStart=model.steps.length;
for(const [tip,side]of [[2,-1],[4,1],[6,-1],[6,1],[8,-1],[8,1]]){
 const p=computeFoldState(model,model.steps.length).positions,origin=p[tip],degrees=90-side*11.25,rad=degrees*Math.PI/180;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())].filter(i=>(Math.cos(rad)*(p[i].y-origin.y)-Math.sin(rad)*(p[i].x-origin.x))*(-side)>1e-8);
 model=foldConnectedFlap(model,seeds,[origin.x,origin.y],degrees,{
  description:{ja:`平らな層の${side<0?'左':'右'}下の辺を中心線へ合わせます。`,en:`Fold the ${side<0?'left':'right'} lower edge of the flat layer to its centerline.`},
 },'front');
 model.steps.at(-1)!.folds[0].type='valley';
}
export const beetleHornHalfStart=model.steps.length;
// Half-fold while the leg tips are still on the spine. Doing this after
// spreading the legs folds one of the front legs back across the body.
for(const [tip,side]of [[9,-1],[10,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const seeds=[...new Set(model.faces.filter(f=>f.includes(tip)).flat())].filter(i=>p[i].x*side>1e-8);
 model=foldConnectedFlap(model,seeds,[0,0],90,{
  description:{ja:tip===9?'上側の角になる層を縦に半分に折ります。':'下側の角になる層も縦に半分に折ります。',
   en:tip===9?'Fold the upper horn layer lengthwise in half.':'Fold the lower horn layer lengthwise in half.'},
 },'back');
}
export const beetleLegSpreadStart=model.steps.length;
const rootWidth=.5*Math.tan(Math.PI/16);
export const beetleLegRoots=[[2,30],[4,-30],[6,45],[8,-45],[11,65],[12,-65]].map(([tip,degrees])=>
 [tip,degrees,-.5-rootWidth*Math.tan(Math.abs(degrees)*Math.PI/180)] as const);
for(const [tip,degrees,height]of beetleLegRoots){
 // The crease passes through the shared root corner, keeping the adjacent
 // point outside the moving component. A crease through (0,-.5) drags it.
 model=foldConnectedFlap(model,tip,[0,height],degrees,{
  description:{ja:'脚の付け根の外側の角を通る折り線で、一本を外へ開きます。',en:'Spread one leg on the diagonal crease through its outer root corner.'},
 });
}
export const beetleFrontTuckStart=model.steps.length;
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
export const beetlePleatedBase: OrigamiModel=structuredClone(model);

export const beetleBackTuckStart=model.steps.length;
model=foldConnectedFlap(model,0,[0,-.08],0,{
 description:{ja:'背中の閉じた先を内側へ折り込みます。',en:'Tuck the closed back point inward.'},
},'back');
export const beetleBackShapeStart=model.steps.length;
for(const side of [-1,1]){
 const p=computeFoldState(model,model.steps.length).positions;
 const seeds=p.flatMap((v,i)=>v.x*side>1e-7?[i]:[]);
 model=foldConnectedFlap(model,seeds,[0,0],90,{
  description:{ja:`背中の${side<0?'左':'右'}側を少し下げて立体にします。`,en:`Lower the ${side<0?'left':'right'} side of the back slightly.`},
 },'back',20);
}
export const beetleSpatialHornStart=model.steps.length;
for(const [tip,side,angle,direction]of [[9,1,55,-1],[10,-1,15,1]]){
 const origin=new Vector3(0,-.65,0),along=new Vector3(0,-1,0);
 const crease=new Vector3(Math.cos(Math.PI/9),0,-side*Math.sin(Math.PI/9));
 model=foldSpatialFlap(model,tip,origin,crease,along,angle,direction as 1|-1,{
  description:{ja:tip===9?'上の角を斜め上へ起こします。':'下の角を斜め下へ開きます。',en:tip===9?'Raise the upper horn diagonally.':'Lower the bottom horn diagonally.'},
 });
}
export const beetleFrontShoulderStart=model.steps.length;
export const beetleFrontShoulderFraction=.2;
export const beetleFrontKneeFraction=1/3;
// The free front leg starts beyond the folded root's broad shoulder. Do not
// rotate the whole material fan at the nominal spine point: it is not planar
// after shaping the back, and would drag the shield and neighboring layers.
const frontKnees=new Map<number,[number,number,number]>();
for(const [tip,,height]of beetleLegRoots.slice(0,2)){
 const p=computeFoldState(model,model.steps.length).positions;
 const nominalRoot=new Vector3(0,height,0);
 const shoulder=nominalRoot.clone().lerp(p[tip],beetleFrontShoulderFraction);
 const along=p[tip].clone().sub(shoulder).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,shoulder,crease,along,35,
  Math.sign(crease.clone().cross(along).z) as 1|-1,{
   description:{ja:`${tip===2?'左':'右'}の前脚を、肩から少し持ち上げます。`,en:`Raise the ${tip===2?'left':'right'} front leg slightly at its shoulder.`},
   caution:{ja:'次の折り下げで、持ち上げた部分の先に関節を作ります。',en:'A later downward fold makes the knee beyond this raised segment.'},
  });
 const raised=computeFoldState(model,model.steps.length).positions[tip];
 frontKnees.set(tip,shoulder.clone().lerp(raised,beetleFrontKneeFraction).toArray());
}
export const beetleSpatialFootStart=model.steps.length;
for(const [tip,,height]of beetleLegRoots){
 const p=computeFoldState(model,model.steps.length).positions;
 const knee=frontKnees.get(tip);
 const root=knee?new Vector3(...knee):new Vector3(0,height,0);
 const along=p[tip].clone().sub(root).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,knee?root:root.clone().lerp(p[tip],.72),crease,along,65,
  (-Math.sign(crease.clone().cross(along).z)) as 1|-1,{
   description:{ja:knee?'持ち上げた前脚の先を下へ曲げ、山形の関節を作ります。':'一本の脚先を下へ曲げて関節を作ります。',en:knee?'Bend the raised front leg downward beyond its shoulder to form its knee.':'Bend one leg tip down to form its foot joint.'},
  });
}
export const beetleSpatialHookStart=model.steps.length;
for(const [tip,angle,zsign]of [[9,85,-1],[10,45,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const op=model.steps[beetleSpatialHornStart+(tip===9?0:1)].folds[0];
 const root=p[op.axis[0]].clone().lerp(p[op.axis[1]],.5),along=p[tip].clone().sub(root).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize(),crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,root.clone().lerp(p[tip],.75),crease,along,angle,
  (Math.sign(crease.clone().cross(along).z)*zsign) as 1|-1,{
   description:{ja:tip===9?'上の角の先を下へ曲げます。':'下の角の先を上へ曲げます。',en:tip===9?'Hook the upper horn tip downward.':'Hook the lower horn tip upward.'},
  });
}
model.steps.push({folds:[{axis:[0,1],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:180}],
 description:{ja:'角を上に向けて全体を回します。',en:'Turn the model so its horns point upward.'},
 caution:{ja:'未完成の構造試作です。背中・盾・角の付け根・残りの脚と表裏は確認中です。',en:'Unfinished structural study. The back, shield, horn roots, remaining legs and paper sides are still under review.'},
});
// One offset per physical planar region needs enough separation for the
// perspective depth buffer; subdividing a region must not supply its thickness.
model.renderLayerSeparation=.00004;
// The sphere-constrained base is coplanar to within numerical solver drift.
// Do not sort its hidden subdivisions by those few nanometers of end depth.
model.renderLayerDepthTolerance=5e-7;
model.renderCoherentPanels=true;
export const beetlePleatedStudy=model;
