import { createRoot } from 'react-dom/client';
import { BeetleStudyPreview } from './BeetleStudyPreview';

// Keep mounting separate from the component so Fast Refresh updates the existing
// root instead of creating a second renderer and animation loop on every edit.
if (import.meta.env.DEV) {
  createRoot(document.getElementById('root')!).render(<BeetleStudyPreview />);
}
