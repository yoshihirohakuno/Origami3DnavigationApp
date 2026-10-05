import { createRoot } from 'react-dom/client';
import { BeetleStudyPreview } from './BeetleStudyPreview';
import { beetleExtractedBase } from './beetleExtractedBase';

// Keep mounting separate from the component so Fast Refresh updates the existing
// root instead of creating a second renderer and animation loop on every edit.
if (import.meta.env.DEV) {
  const extracted = new URLSearchParams(location.search).get('stage') === 'extracted-base';
  createRoot(document.getElementById('root')!).render(<BeetleStudyPreview model={extracted ? beetleExtractedBase : undefined} />);
}
