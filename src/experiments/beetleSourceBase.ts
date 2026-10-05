import { createBeetlePleatedCore } from './beetlePleatedCore';

/** The reference parks two intact horn layers to access the legs, then
 * restores them before shaping the body. This is a required layer-access
 * maneuver, not a preparatory fold/unfold to show a crease. */
export const beetleSourceCore=createBeetlePleatedCore(11,'park');
const model=beetleSourceCore.model;
model.id='beetle-source-base-study';
model.name={ja:'カブトムシ・角をよける手順の試作',en:'Beetle parked-horn base study'};
model.steps.at(-1)!.caution={
 ja:'基本形の試作です。ここから背中を立体に開き、角と脚を仕上げます。完成品ではありません。',
 en:'Base study only. The body still needs to open in 3D, followed by shaping the horns and legs. This is unfinished.',
};
model.renderLayerSeparation=.00004;
model.renderLayerDepthTolerance=5e-7;
model.renderCoherentPanels=true;
export const beetleSourceBase=model;
