import type { LocalizedText } from '../engine/types';

/** Short UI guidance for the existing folds; their paper geometry is unchanged. */
export const CUP_GUIDE: { action: LocalizedText; point: LocalizedText; badge: LocalizedText; backView?: boolean }[] = [
  {
    action: { ja: '下の角を、奥から上へ。', en: 'Bring the bottom corner up behind the paper.' },
    point: { ja: '上下の角をぴったり合わせる。', en: 'Match the top and bottom corners.' },
    badge: { ja: '角を合わせる', en: 'Match corners' },
  },
  {
    action: { ja: '右の角を、左の斜めの辺へ。', en: 'Bring the right corner to the left slanted edge.' },
    point: { ja: '2枚重ねたまま折る。', en: 'Fold both layers together.' },
    badge: { ja: '2枚', en: '2 layers' },
  },
  {
    action: { ja: '左の角を、右の斜めの辺へ。', en: 'Bring the left corner to the right slanted edge.' },
    point: { ja: 'ここも2枚いっしょに。', en: 'Fold both layers together here too.' },
    badge: { ja: '2枚', en: '2 layers' },
  },
  {
    action: { ja: '後ろのフタを、裏へ折り下げる。', en: 'Fold the back flap down behind the cup.' },
    point: { ja: '奥の1枚だけ。手前は残す。', en: 'Back layer only. Leave the front layer up.' },
    badge: { ja: '奥の1枚', en: 'Back layer' }, backView: true,
  },
  {
    action: { ja: '手前のフタを、下へ折りかぶせる。', en: 'Fold the front flap down over the corners.' },
    point: { ja: '手前の1枚だけ折る。', en: 'Fold the front layer only.' },
    badge: { ja: '手前の1枚', en: 'Front layer' },
  },
  {
    action: { ja: '口をそっと開く。', en: 'Gently open the mouth of the cup.' },
    point: { ja: '左右を軽く寄せる。引っぱらない。', en: 'Ease the sides inward. Do not pull them apart.' },
    badge: { ja: 'そっと', en: 'Gently' },
  },
];
