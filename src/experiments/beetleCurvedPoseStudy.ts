import { beetleCurvedBody } from './beetleCurvedBodyStudy';
import { createBeetleSupportPose } from './beetlePoseStudy';

/** Paper hinges and six-foot support combined with the new curved layers.
 * This remains a private comparison, not a verified open beetle pocket. */
export const beetleCurvedPose = createBeetleSupportPose(
  beetleCurvedBody.core, beetleCurvedBody.body, beetleCurvedBody.model,
);
const model = beetleCurvedPose.beetlePoseStudy;
model.id = 'beetle-curved-pose-study';
model.name = { ja: 'カブトムシ・丸い背中と接地姿勢の試作', en: 'Beetle curved back and support study' };
model.steps.at(-1)!.caution = {
  ja: '背中を細い折り面で丸くした未完成の比較試作です。袋の開口と見本との一致は未確認です。',
  en: 'Unfinished faceted curved-back comparison. Pocket opening and agreement with the source remain unverified.',
};
export const beetleCurvedPoseStudy = model;
