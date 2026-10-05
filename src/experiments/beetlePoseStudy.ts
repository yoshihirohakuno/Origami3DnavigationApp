import { createBeetleBodyShell } from './beetleBodyStudy';
import { straightLegRoot } from './beetleMaterialHinges';
import { Vector3 } from 'three';
import { computeFoldState } from '../engine/fold';

import { foldSpatialFlap } from '../engine/foldSpatialFlap';
import type { OrigamiModel } from '../engine/types';
import { createBeetlePleatedCore } from './beetlePleatedCore';

/** Development-only integration of the faceted body, material horn roots and six supporting legs. The closed body pockets still need anatomical and paper-folding verification. */
const core=createBeetlePleatedCore(11,'half',{narrowLegs:true,tuckLegEdges:true});
export const beetlePoseCore=core;
const body=createBeetleBodyShell(core.model,.15);
export const beetlePoseBody=body;
let model:OrigamiModel=structuredClone(body.model);
// Each page shares only the fixed spine with the other pages. They can be
// opened separately, so let the viewer inspect one material fold at a time.
const opening=model.steps.pop()!;
for(const [index,fold]of opening.folds.entries())model.steps.push({
 folds:[fold],
 description:{ja:`胴体の${index<2?'上':'下'}側の${index%2===0?'右':'左'}の層を開きます。`,en:`Open the ${index%2===0?'right':'left'} ${index<2?'upper':'lower'} body layer.`},
 caution:opening.caution,
});
model.id='beetle-pose-study';
model.name={ja:'カブトムシ・背中と接地姿勢の試作',en:'Beetle body and support pose study'};
export const beetlePoseCoreEnd=model.steps.length;
export const beetlePoseLegs=core.beetleLegRoots;

export const beetlePoseLegVertices=new Map<number,number>();
type HingeReference={axis:[number,number];weight:number};
export const beetlePoseHornReferences=new Map<number,HingeReference>();
export const beetlePoseHornStart=model.steps.length;
for(const [tip,corner,height,angle,up] of [[9,62,-.6,45,1],[11,78,-.65,15,-1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const origin=new Vector3(0,height,0);
 // Narrowing a connected leg can fold the old outer corner onto the spine.
 // Follow that same material face to its new outer rim, rather than retaining
 // a coincident centerline point as a fictitious triangular hinge.
 const rim=Math.abs(p[corner].x)>1e-5?corner:model.faces
  .filter(face=>face.includes(tip)&&face.includes(corner)).flat()
  .reduce((best,i)=>Math.abs(p[i].x)>Math.abs(p[best].x)?i:best,corner);
 if(Math.abs(p[rim].x)<1e-5)throw new Error('The horn has no outer root rim');
 const crease=p[rim].clone().sub(origin).normalize();
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
 beetlePoseHornReferences.set(tip,{axis,weight});
}

export const beetlePoseShoulderStart=model.steps.length;
export const beetlePoseShoulderFraction=.4;
export const beetlePoseKneeFraction=1/3;
const knees=new Map<number,[number,number,number]>();
for(const [tip] of beetlePoseLegs.slice(0,2)){
 const p=computeFoldState(model,model.steps.length).positions;
 const rootVertex=straightLegRoot(model,tip);
 beetlePoseLegVertices.set(tip,rootVertex);
 const root=p[rootVertex];
 const shoulder=root.clone().lerp(p[tip],beetlePoseShoulderFraction);
 const along=p[tip].clone().sub(shoulder).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 model=foldSpatialFlap(model,tip,shoulder,crease,along,35,Math.sign(crease.clone().cross(along).z) as 1|-1,{
  description:{ja:`${tip===2?'左':'右'}の前脚の自由な部分を持ち上げます。`,en:`Raise the free part of the ${tip===2?'left':'right'} front leg.`},
 });
 const raised=computeFoldState(model,model.steps.length).positions[tip];
 knees.set(tip,shoulder.clone().lerp(raised,beetlePoseKneeFraction).toArray());
}

export const beetlePoseFootStart=model.steps.length;
export const beetlePoseOtherLegFraction=1/4;
export const beetleFootPlane=-.1;
export const beetleFootAngles=new Map<number,number>();
for(const [tip] of beetlePoseLegs){
 const p=computeFoldState(model,model.steps.length).positions;
 const knee=knees.get(tip);
 const rootVertex=knee?beetlePoseLegVertices.get(tip)!:straightLegRoot(model,tip);
 beetlePoseLegVertices.set(tip,rootVertex);
 const root=knee?new Vector3(...knee):p[rootVertex].clone();
 const along=p[tip].clone().sub(root).normalize();
 const face=model.faces.find(f=>f.includes(tip)&&p[f[1]].clone().sub(p[f[0]]).cross(p[f[2]].clone().sub(p[f[0]])).length()>1e-8)!;
 const normal=p[face[1]].clone().sub(p[face[0]]).cross(p[face[2]].clone().sub(p[face[0]])).normalize();
 const crease=normal.clone().cross(along).normalize();
 const footOrigin=knee?root:root.clone().lerp(p[tip],beetlePoseOtherLegFraction);
 const down=-Math.sign(crease.clone().cross(along).z) as 1|-1;
 const relative=p[tip].clone().sub(footOrigin);
 const height=(angle:number)=>footOrigin.z+relative.clone().applyAxisAngle(crease,down*angle*Math.PI/180).z;
 if(height(0)<beetleFootPlane)throw new Error(`Leg ${tip} is already below the support plane`);
 let bracket:number|undefined;
 for(let degree=1;degree<=180;degree++)if(height(degree)<=beetleFootPlane){bracket=degree;break;}
 if(bracket===undefined)throw new Error(`Leg ${tip} cannot reach the support plane with its actual knee`);
 let lo=bracket-1,hi=bracket;
 for(let iteration=0;iteration<40;iteration++){const mid=(lo+hi)/2;if(height(mid)>beetleFootPlane)lo=mid;else hi=mid;}
 const footAngle=(lo+hi)/2;
 beetleFootAngles.set(tip,footAngle);
 model=foldSpatialFlap(model,tip,footOrigin,crease,along,footAngle,
  down,{
   description:{ja:knee?'前脚の持ち上げた部分に関節を作り、先を下へ曲げます。':'移動後の脚の付け根に合わせて、長い部分を下へ曲げます。',
    en:knee?'Make a knee in the raised front leg and bend its end downward.':'Use the moved material root to bend the long part of one leg downward.'},
  });
}

export const beetlePoseHookStart=model.steps.length;
for(const [tip,angle,up] of [[9,85,-1],[11,45,1]]){
 const p=computeFoldState(model,model.steps.length).positions;
 const {axis,weight}=beetlePoseHornReferences.get(tip)!;
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

export const beetlePoseBackTuckStart=model.steps.length;
model.steps.push({folds:[{axis:[0,1],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:90}],
 description:{ja:'角を右に向けて全体を回します。',en:'Turn the model so its horns point to the right.'},
 caution:{ja:'背中は直線の折り面による近似です。袋の開き方と完成シルエットは確認中で、未完成の試作です。',en:'Unfinished study: the back uses straight folded panels. Pocket opening and the final silhouette are still under review.'},
});
// Select the opposite starting face of the ENTIRE sheet. This reverses every
// panel's winding consistently, without painting individual final surfaces.
model.faces=model.faces.map(face=>[...face].reverse());
model.steps[0].caution={ja:'色の面を上にして始めます。',en:'Start with the colored side facing up.'};
model.renderLayerSeparation=.00004;
model.renderLayerDepthTolerance=5e-7;
model.renderCoherentPanels=true;
model.cameraPos=[0,-2,4];
export const beetlePoseStudy=model;
