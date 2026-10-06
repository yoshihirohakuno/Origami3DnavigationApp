import { beetleStudy as defaultBeetleStudy } from './beetleStudy';
import type { OrigamiModel } from '../engine/types';
import { FoldStudyPreview } from './FoldStudyPreview';

/** Keep the existing private beetle workbench and its default model. */
export function BeetleStudyPreview({ model = defaultBeetleStudy }: { model?: OrigamiModel }) {
  return <FoldStudyPreview model={model} title={{ ja: 'カブトムシ・構造試作', en: 'Beetle structure study' }} />;
}
