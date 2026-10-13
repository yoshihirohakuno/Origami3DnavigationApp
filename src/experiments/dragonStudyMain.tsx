import { createRoot } from 'react-dom/client';
import { FoldStudyPreview } from './FoldStudyPreview';
import { dragonBaseStudy } from './dragonBaseStudy';

if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<FoldStudyPreview
  model={dragonBaseStudy} title={{ja:'ドラゴン・基本形の試作',en:'Dragon base study'}} />);
