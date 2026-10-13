import { createRoot } from 'react-dom/client';
import { FoldStudyPreview } from './FoldStudyPreview';
import { roseTwistStudy } from './roseTwistStudy';
import { rosePetalStudy } from './rosePetalStudy';

if (import.meta.env.DEV) {
  const petals=new URLSearchParams(location.search).get('stage')==='petals';
  const study=petals?rosePetalStudy:roseTwistStudy;
  createRoot(document.getElementById('root')!).render(<FoldStudyPreview
    model={study.model}
    stateAt={study.stateAt}
    title={petals?{ja:'バラ・花びらの試作',en:'Rose petal study'}:{ ja: 'バラ・ねじりの試作', en: 'Rose twist study' }}
  />);
}
