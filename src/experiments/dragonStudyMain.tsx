import { createRoot } from 'react-dom/client';
import { FoldStudyPreview } from './FoldStudyPreview';
import { dragonBaseStudy } from './dragonBaseStudy';
import { dragonWingStudy } from './dragonWingStudy';
import { dragonCornerStudy } from './dragonCornerStudy';
import { dragonStripStudy } from './dragonStripStudy';

const stage=new URLSearchParams(location.search).get('stage');
const base=stage==='base',wing=stage==='wing',corner=stage==='corner';
if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<FoldStudyPreview
  model={base?dragonBaseStudy:wing?dragonWingStudy:corner?dragonCornerStudy:dragonStripStudy} title={base?
    {ja:'ドラゴン・基本形の試作',en:'Dragon base study'}:
    wing?{ja:'ドラゴン・翼の段折りの試作',en:'Dragon wing pleat study'}:
    corner?{ja:'ドラゴン・上の角を開く試作',en:'Dragon upper-corner opening study'}:
    {ja:'ドラゴン・細い帯と白い角の試作',en:'Dragon narrow strips and white corner study'}} />);
