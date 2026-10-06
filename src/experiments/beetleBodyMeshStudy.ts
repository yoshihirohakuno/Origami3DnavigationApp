import { createBeetlePleatedCore } from './beetlePleatedCore';
import { refineBeetleBodyPanels } from './beetleBodyPanels';

// Keep the horns full-width and the shield unpleated while investigating the
// pocket closure. The finished catalog must not import this authoring route.
const core = createBeetlePleatedCore(11, 'park');
export const beetleBodyMeshPreparation = core.beetlePleatedBase;
export const beetleBodyMesh = refineBeetleBodyPanels(beetleBodyMeshPreparation);
export const beetleBodyMeshStudy = beetleBodyMesh.model;
beetleBodyMeshStudy.id = 'beetle-body-mesh-study';
beetleBodyMeshStudy.name = { ja: 'カブトムシ・背中の曲面用折り面の試作', en: 'Beetle curved-back panel study' };
beetleBodyMeshStudy.steps.at(-1)!.caution = {
  ja: '曲面を近似する折り面の準備段階です。胴体を開く動きは未完成です。',
  en: 'Panel preparation for a faceted curved back. The body-opening motion is unfinished.',
};
