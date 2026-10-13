import { createRoot } from 'react-dom/client';
import { FoldStudyPreview } from './FoldStudyPreview';
import { dragonBaseStudy } from './dragonBaseStudy';
import { dragonWingStudy } from './dragonWingStudy';

const base=new URLSearchParams(location.search).get('stage')==='base';
if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<FoldStudyPreview
  model={base?dragonBaseStudy:dragonWingStudy} title={base?
    {ja:'ドラゴン・基本形の試作',en:'Dragon base study'}:
    {ja:'ドラゴン・翼の段折りの試作',en:'Dragon wing pleat study'}} />);
