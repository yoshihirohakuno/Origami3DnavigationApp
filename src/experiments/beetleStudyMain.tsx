import { createRoot } from 'react-dom/client';
import { BeetleStudyPreview } from './BeetleStudyPreview';
import { beetleExtractedBase } from './beetleExtractedBase';
import { beetlePleatedStudy } from './beetlePleatedStudy';

// Keep mounting separate from the component so Fast Refresh updates the existing
// root instead of creating a second renderer and animation loop on every edit.
if (import.meta.env.DEV) {
  const stage = new URLSearchParams(location.search).get('stage');
  const model = stage === 'pleated-study' ? beetlePleatedStudy : stage === 'extracted-base' ? beetleExtractedBase : undefined;
  createRoot(document.getElementById('root')!).render(<BeetleStudyPreview model={model} />);
}
