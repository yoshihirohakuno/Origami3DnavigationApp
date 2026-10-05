// Run with: node --import ./tools/register-typescript.mjs tools/diagnose-beetle-body.mjs
// Distinguishes a thicker faceted back from an actually opened body pocket.
import {beetlePoseStudy as model,beetlePoseCoreEnd,beetleFootPlane} from '../src/experiments/beetlePoseStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';

const body=computeFoldState(model,beetlePoseCoreEnd).positions;
const mouth=[38,51,41,54,44,57,47,60];
const mouthSpan=Math.max(...mouth.flatMap(a=>mouth.map(b=>body[a].distanceTo(body[b]))));
const finished=computeFoldState(model,model.steps.length).positions;
const feet=[2,4,6,8,10,12];
console.log(JSON.stringify({
 model:model.id,
 operations:model.steps.length,
 bodyPose:beetlePoseCoreEnd,
 bodyMouthSpan:mouthSpan,
 bodyPocketsStillClosed:mouthSpan<5e-7,
 supportPlane:beetleFootPlane,
 maximumFootHeightError:Math.max(...feet.map(i=>Math.abs(finished[i].z-beetleFootPlane))),
 note:'A supporting pose and separated back panels do not establish correct pocket inflation. This study is unfinished.',
},null,2));
