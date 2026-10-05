import { Vector3 } from 'three';
import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';
import type { OrigamiModel } from '../engine/types';
import { createBeetlePleatedCore } from './beetlePleatedCore';

/** Private comparison of opposite horn faces and triangular root hinges.
 * The flat back is intentional at this stage: a global body rotation tears
 * material shared with the newly articulated roots. No dome is claimed. */
const core=createBeetlePleatedCore(11);
let model:OrigamiModel=core.model;
model.id='beetle-horn-root-study';
model.name={ja:'カブトムシ・対向する角と付け根の試作',en:'Beetle opposite horn and root study'};
export const beetleRootCoreEnd=model.steps.length;
export const beetleRootLegs=core.beetleLegRoots;

export { straightLegRoot } from './beetleMaterialHinges';
import { straightLegRoot } from './beetleMaterialHinges';
export const beetleRootLegVertices=new Map<number,number>();
type HingeReference={axis:[number,number];weight:number};
export const beetleHornRootReferences=new Map<number,HingeReference>();
export const beetleRootHornStart=model.steps.length;
for(const [tip,corner,height,angle,up] of [[9,62,-.6,55,1],[11,78,-.65,15,-1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const origin=new Vector3(0,height,0);
 const crease=p[corner].clone().sub(origin).normalize();
 const along=new Vector3(0,0,1).cross(crease);
 if(along.dot(p[tip].clone().sub(origin))<0)along.negate();
 model=foldSpatialFlap(model,tip,origin,crease,along,angle,
  Math.sign(crease.clone().cross(along).z)*up as 1|-1,{
   description:{ja:tip===9?'上の角を、三角形の付け根で斜め上へ起こします。':'下の角とつながった脚の層を、付け根で斜め下へ開きます。',
    en:tip===9?'Raise the upper horn on its triangular root hinge.':'Lower the bottom horn together with the connected leg layer at its root.'},
   caution:{ja:'完成前の比較試作です。角の付け根と胴体の折り方は照合中です。',en:'Unfinished comparison study. Horn roots and the body folding are still being checked.'},
  });
 const axis=model.steps.at(-1)!.folds[0].axis;
 const before=computeFoldState(model,model.steps.length-1).positions;
 const d=before[axis[1]].clone().sub(before[axis[0]]);
 const rawWeight=origin.clone().sub(before[axis[0]]).dot(d)/d.lengthSq();
 if(rawWeight< -1e-7||rawWeight>1+1e-7||before[axis[0]].clone().addScaledVector(d,rawWeight).distanceTo(origin)>5e-7)
  throw new Error('The horn root must lie on its physical material hinge');
 // Sphere-constrained preparation has nanometer-scale planar drift. Keep a
 // root at the actual endpoint rather than extrapolating beyond its material.
 const weight=Math.max(0,Math.min(1,rawWeight));
 beetleHornRootReferences.set(tip,{axis,weight});
}

export const beetleRootShoulderStart=model.steps.length;
export const beetleRootShoulderFraction=.4;
export const beetleRootKneeFraction=1/3;
const knees=new Map<number,[number,number,number]>();
for(const [tip] of beetleRootLegs.slice(0,2)){
 const p=computeFoldState(model,model.steps.length).positions;
 const rootVertex=straightLegRoot(model,tip);
 beetleRootLegVertices.set(tip,rootVertex);
 const root=p[rootVertex];
 const shoulder=root.clone().lerp(p[tip],beetleRootShoulderFraction);
 const along=p[tip].clone().sub(shoulder).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,shoulder,crease,along,35,Math.sign(crease.clone().cross(along).z) as 1|-1,{
  description:{ja:`${tip===2?'左':'右'}の前脚の自由な部分を持ち上げます。`,en:`Raise the free part of the ${tip===2?'left':'right'} front leg.`},
 });
 const raised=computeFoldState(model,model.steps.length).positions[tip];
 knees.set(tip,shoulder.clone().lerp(raised,beetleRootKneeFraction).toArray());
}

export const beetleRootFootStart=model.steps.length;
export const beetleRootOtherLegFraction=1/4;
for(const [tip] of beetleRootLegs){
 const p=computeFoldState(model,model.steps.length).positions;
 const knee=knees.get(tip);
 const rootVertex=knee?beetleRootLegVertices.get(tip)!:straightLegRoot(model,tip);
 beetleRootLegVertices.set(tip,rootVertex);
 const root=knee?new Vector3(...knee):p[rootVertex].clone();
 const along=p[tip].clone().sub(root).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,knee?root:root.clone().lerp(p[tip],beetleRootOtherLegFraction),crease,along,65,
  -Math.sign(crease.clone().cross(along).z) as 1|-1,{
   description:{ja:knee?'前脚の持ち上げた部分に関節を作り、先を下へ曲げます。':'移動後の脚の付け根に合わせて、長い部分を下へ曲げます。',
    en:knee?'Make a knee in the raised front leg and bend its end downward.':'Use the moved material root to bend the long part of one leg downward.'},
  });
}

export const beetleRootHookStart=model.steps.length;
for(const [tip,angle,up] of [[9,85,-1],[11,45,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const {axis,weight}=beetleHornRootReferences.get(tip)!;
 const root=p[axis[0]].clone().lerp(p[axis[1]],weight);
 const along=p[tip].clone().sub(root).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,root.clone().lerp(p[tip],.75),crease,along,angle,
  Math.sign(crease.clone().cross(along).z)*up as 1|-1,{
   description:{ja:tip===9?'上の角の先から四分の一を下へ曲げます。':'下の角の先から四分の一を上へ曲げます。',
    en:tip===9?'Hook the outer quarter of the upper horn downward.':'Hook the outer quarter of the lower horn upward.'},
  });
}

export const beetleRootBackTuckStart=model.steps.length;
model=foldConnectedFlap(model,0,[0,-.08],0,{
 description:{ja:'背中の閉じた先を内側へ折り込みます。',en:'Tuck the closed back point inward.'},
},'back');
model.steps.push({folds:[{axis:[0,1],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:180}],
 description:{ja:'角を上に向けて全体を回します。',en:'Turn the model so its horns point upward.'},
 caution:{ja:'未完成の比較試作です。背中のドーム、角の閉じ方、脚の姿勢と表裏は未確定です。',en:'Unfinished comparison study. The back dome, horn closure, leg stance and paper sides remain unresolved.'},
});
model.renderLayerSeparation=.00004;
model.renderLayerDepthTolerance=5e-7;
model.renderCoherentPanels=true;
export const beetleHornRootStudy=model;
