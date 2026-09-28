import { birdBaseModel } from '../engine/birdBase';
import { foldFlap } from '../engine/foldFlap';
import { computeFoldState } from '../engine/fold';
import type { OrigamiModel } from '../engine/types';

// Traditional flapping bird: a bird base, shallow neck/tail reverse folds,
// no narrowing of the tail, then a beak and two wings. Reuse only the base,
// including its tested continuous pocket/petal mechanisms and material mesh.
let model: OrigamiModel = {
  ...birdBaseModel,
  id: 'flapping-bird', name: { ja: 'はばたく鳥', en: 'Flapping Bird' }, difficulty: 5,
  sheetColors: [{ front: '#8aaed1', back: '#fbfaf7' }],
};
model = foldFlap(model, 4, [0, -.6], 30, {
  description: { ja: '下の先を浅い角度で折り上げ、首にします。', en: 'Reverse-fold one lower point up at a shallow angle for the neck.' },
});
model = foldFlap(model, 8, [0, -.6], -30, {
  description: { ja: 'もう一方の先を反対側へ折り上げ、尾にします。', en: 'Reverse-fold the other point up on the opposite side for the tail.' },
  caution: { ja: '尾は細く折り込まず、幅を残します。', en: 'Leave the tail broad; do not narrow it with extra folds.' },
}, 'back');
const neck = computeFoldState(model, model.steps.length).positions[4];
model = foldFlap(model, 4, [neck.x + Math.sqrt(3) * .09, neck.y - .09], 0, {
  description: { ja: '首の先を小さく中割り折りし、くちばしにします。', en: 'Inside-reverse-fold a small section of the neck tip to make the beak.' },
});
model.steps.push({ folds: [{ axis: [9, 10], moving: [2], type: 'valley', angle: 75, direction: -1 }],
  description: { ja: '手前の大きな一枚を開き、翼を広げます。', en: 'Open the large front flap into a wing.' } },
{ folds: [{ axis: [14, 12], moving: [6], type: 'valley', angle: 75, direction: -1 }],
  description: { ja: '反対側の翼も同じように広げます。', en: 'Open the opposite wing in the same way.' },
  caution: { ja: '実物では胸を持ち、尾をやさしく引いたり戻したりします。羽ばたきには紙のしなりを使います。', en: 'On the real model, hold the chest and gently pull and release the tail. Flapping relies on the paper flexing.' } });
export const flappingBirdModel = model;
