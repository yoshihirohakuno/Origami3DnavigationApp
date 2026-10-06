import { createRoot } from 'react-dom/client';
import { FoldStudyPreview } from './FoldStudyPreview';
import { roseTwistStudy } from './roseTwistStudy';

if (import.meta.env.DEV) {
  createRoot(document.getElementById('root')!).render(<FoldStudyPreview
    model={roseTwistStudy.model}
    stateAt={roseTwistStudy.stateAt}
    title={{ ja: 'バラ・ねじりの試作', en: 'Rose twist study' }}
  />);
}
