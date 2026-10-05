import { createRoot } from 'react-dom/client';
import { BeetleStudyPreview } from './BeetleStudyPreview';
import { beetleExtractedBase } from './beetleExtractedBase';
import { beetlePleatedStudy } from './beetlePleatedStudy';
import { beetleHornRootStudy } from './beetleHornRootStudy';
import { beetleSourceBase } from './beetleSourceBase';
import { beetleBodyStudy } from './beetleBodyStudy';
import { beetlePoseStudy } from './beetlePoseStudy';

// Keep mounting separate from the component so Fast Refresh updates the existing
// root instead of creating a second renderer and animation loop on every edit.
if (import.meta.env.DEV) {
  const stage = new URLSearchParams(location.search).get('stage');
  const model = stage === 'pose-study' ? beetlePoseStudy : stage === 'body-study' ? beetleBodyStudy : stage === 'source-base' ? beetleSourceBase : stage === 'root-study' ? beetleHornRootStudy : stage === 'pleated-study' ? beetlePleatedStudy : stage === 'extracted-base' ? beetleExtractedBase : undefined;
  createRoot(document.getElementById('root')!).render(<BeetleStudyPreview model={model} />);
}
