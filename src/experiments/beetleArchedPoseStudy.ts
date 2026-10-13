import { createBeetleCurvedBodyStudy } from './beetleCurvedBodyStudy';
import { createBeetleSupportPose } from './beetlePoseStudy';

/** Correct the previous outward curling rim with downward curvature across
 * each upper page (and its corresponding lower layer). Still NOT a real pocket
 * inflation: the closed material mouth and central gap remain unresolved. */
export const beetleArchedBody=createBeetleCurvedBodyStudy(true);
// The lower-curvature rim meets the old upper horn hinge at height -.6.
// A retained crease .025 farther along the free horn avoids that local clash;
// the entire resulting route is validated separately before being displayed.
export const beetleArchedPose=createBeetleSupportPose(beetleArchedBody.core,beetleArchedBody.body,beetleArchedBody.model,
  {upperHornRootHeight:-.625,frontShoulderFraction:.42});
beetleArchedPose.beetlePoseStudy.id='beetle-arched-pose-study';
beetleArchedPose.beetlePoseStudy.name={ja:'カブトムシ・背中の反り向きを補正する試作',en:'Beetle corrected back-curvature study'};
beetleArchedPose.beetlePoseStudy.steps.at(-1)!.caution={
  ja:'外縁の反りを抑えた未完成の比較試作です。中央の隙間と袋の開口は未解決です。',
  en:'Unfinished inward-curvature comparison. The central gap and true pocket opening remain unresolved.',
};
export const beetleArchedPoseStudy=beetleArchedPose.beetlePoseStudy;
