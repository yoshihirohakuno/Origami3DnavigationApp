import { createRoot } from 'react-dom/client';
import { BeetleStudyPreview } from './BeetleStudyPreview';
import { beetleExtractedBase } from './beetleExtractedBase';
import { beetlePleatedStudy } from './beetlePleatedStudy';
import { beetleHornRootStudy } from './beetleHornRootStudy';
import { beetleSourceBase } from './beetleSourceBase';
import { beetleBodyStudy } from './beetleBodyStudy';
import { beetlePoseStudy } from './beetlePoseStudy';
import { beetleBodyMeshStudy } from './beetleBodyMeshStudy';
import { beetleCurvedBodyStudy } from './beetleCurvedBodyStudy';
import { beetleCurvedPoseStudy } from './beetleCurvedPoseStudy';
import type { OrigamiModel } from '../engine/types';

// Keep mounting separate from the component so Fast Refresh updates the existing
// root instead of creating a second renderer and animation loop on every edit.
if (import.meta.env.DEV) {
  const stage = new URLSearchParams(location.search).get('stage');
  const studies: Record<string, OrigamiModel> = {
    'curved-pose': beetleCurvedPoseStudy,
    'curved-body': beetleCurvedBodyStudy,
    'body-mesh': beetleBodyMeshStudy,
    'pose-study': beetlePoseStudy,
    'body-study': beetleBodyStudy,
    'source-base': beetleSourceBase,
    'root-study': beetleHornRootStudy,
    'pleated-study': beetlePleatedStudy,
    'extracted-base': beetleExtractedBase,
  };
  const model = stage ? studies[stage] : undefined;
  createRoot(document.getElementById('root')!).render(<BeetleStudyPreview model={model} />);
}
