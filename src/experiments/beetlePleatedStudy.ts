import type { OrigamiModel } from '../engine/types';
import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';
import { createBeetlePleatedCore } from './beetlePleatedCore';
import { Vector3 } from 'three';

const core=createBeetlePleatedCore();
let model:OrigamiModel=core.model;
export const {beetleSquareOpenStart, beetleSquareCorners, beetlePleatStart, beetleFlatNarrowStart, beetleHornHalfStart, beetleLegSpreadStart, beetleLegRoots, beetleFrontTuckStart, beetlePleatedBase, beetleShieldStart, beetleShieldCreases}=core;

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
export const beetleOtherLegBendFraction=1/4;
for(const [tip,,height]of beetleLegRoots){
 const p=computeFoldState(model,model.steps.length).positions;
 const knee=frontKnees.get(tip);
 const root=knee?new Vector3(...knee):new Vector3(0,height,0);
 const along=p[tip].clone().sub(root).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 // These four legs bend near the free root, rather than receiving a short
 // distal foot. Moving the hinge to 20% crosses the rear root panels; 25%
 // leaves a planar flap and preserves the attached shoulder material.
 model=foldSpatialFlap(model,tip,knee?root:root.clone().lerp(p[tip],beetleOtherLegBendFraction),crease,along,65,
  (-Math.sign(crease.clone().cross(along).z)) as 1|-1,{
   description:{ja:knee?'持ち上げた前脚の先を下へ曲げ、山形の関節を作ります。':'一本の脚を、付け根に近い位置で下へ曲げます。',en:knee?'Bend the raised front leg downward beyond its shoulder to form its knee.':'Bend one leg downward near its root.'},
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
 caution:{ja:'未完成の構造試作です。背中の丸み・角の付け根・脚の姿勢と表裏は確認中です。',en:'Unfinished structural study. The rounded back, horn roots, leg stance and paper sides are still under review.'},
});
// One offset per physical planar region needs enough separation for the
// perspective depth buffer; subdividing a region must not supply its thickness.
model.renderLayerSeparation=.00004;
// The sphere-constrained base is coplanar to within numerical solver drift.
// Do not sort its hidden subdivisions by those few nanometers of end depth.
model.renderLayerDepthTolerance=5e-7;
model.renderCoherentPanels=true;
export const beetlePleatedStudy=model;
