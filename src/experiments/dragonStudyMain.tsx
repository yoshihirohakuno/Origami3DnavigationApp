import { createRoot } from 'react-dom/client';
import { FoldStudyPreview } from './FoldStudyPreview';
import { dragonBaseStudy } from './dragonBaseStudy';
import { dragonWingStudy } from './dragonWingStudy';
import { dragonCornerStudy } from './dragonCornerStudy';

const stage=new URLSearchParams(location.search).get('stage');
const base=stage==='base',wing=stage==='wing';
if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<FoldStudyPreview
  model={base?dragonBaseStudy:wing?dragonWingStudy:dragonCornerStudy} title={base?
    {ja:'ドラゴン・基本形の試作',en:'Dragon base study'}:
    wing?{ja:'ドラゴン・翼の段折りの試作',en:'Dragon wing pleat study'}:
    {ja:'ドラゴン・上の角を開く試作',en:'Dragon upper-corner opening study'}} />);
