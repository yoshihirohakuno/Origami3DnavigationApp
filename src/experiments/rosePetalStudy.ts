import { appendStudyFlap, type MaterialStudy } from './materialFoldStudy';
import { roseTwistStudy } from './roseTwistStudy';

/** Private material access/curvature comparison. These are real retained
 * corner folds, but they are not yet a verified complete rose folding route. */
let study: MaterialStudy=roseTwistStudy;
const petals=[[12,4,5],[13,6,7],[14,8,9],[15,10,11]];
const petalHinges=new Map<number,[number,number]>();
for(const[corner,a,b]of petals){
  const p=study.stateAt(study.model,study.model.steps.length).positions;
  const origin=p[a].clone().add(p[b]).multiplyScalar(.5),crease=p[b].clone().sub(p[a]).normalize();
  const across=p[corner].clone().sub(origin);across.addScaledVector(crease,-across.dot(crease));
  const height=across.length();across.normalize();
  origin.addScaledVector(across,height*.55);
  const liftDirection=Math.sign(crease.clone().cross(across).z) as 1|-1;
  study=appendStudyFlap(study,corner,origin,crease,across,70,liftDirection,{
    description:{ja:'外側の一つの角を持ち上げ、花びらになる材料を開きます。',en:'Lift one outer corner to expose the material for a petal.'},
    caution:{ja:'材料の動きを調べる未完成の比較試作です。バラ全体の折り方との一致は未確認です。',en:'Unfinished material comparison. Agreement with a complete rose route is unverified.'},
  });
  petalHinges.set(corner,study.model.steps.at(-1)!.folds[0].axis);
}
export const rosePetalLiftEnd=study.model.steps.length;
for(const[corner]of petals){
  const[a,b]=petalHinges.get(corner)!;
  const p=study.stateAt(study.model,study.model.steps.length).positions;
  const origin=p[a].clone().add(p[b]).multiplyScalar(.5),crease=p[b].clone().sub(p[a]).normalize();
  const across=p[corner].clone().sub(origin);across.addScaledVector(crease,-across.dot(crease));
  const height=across.length();across.normalize();
  // The flap is raised; the cross product's original z sign is retained.
  const direction=-Math.sign(crease.clone().cross(across).z) as 1|-1;
  let previous=0;
  for(const fraction of[.45,.7,.85]){
    const distance=height*fraction;origin.addScaledVector(across,distance-previous);
    study=appendStudyFlap(study,corner,origin,crease,across,12,direction,{
      description:{ja:'花びらの先を細い折り面で少しずつ外へ丸めます。',en:'Curve the petal tip outward with a narrow panel fold.'},
      caution:{ja:'紙を伸ばさずに曲率を近似する試作です。花の底はまだ固定していません。',en:'Unfinished faceted curvature without stretching. The flower bottom is not locked yet.'},
    },'mountain');
    across.applyAxisAngle(crease,direction*12*Math.PI/180);previous=distance;
  }
}
study.model={...study.model,id:'rose-petal-study',name:{ja:'バラ・花びらの材料と丸みの試作',en:'Rose petal material and curvature study'},
  steps:study.model.steps.map((step,i)=>i<6?{...step,caution:{
    ja:'花びらの材料へつなぐ未完成の比較試作です。バラ全体の折り方と底の固定は未確認です。',
    en:'Unfinished material comparison. The complete rose route and bottom locking remain unverified.',
  }}:step),
};
export const rosePetalStudy=study;
