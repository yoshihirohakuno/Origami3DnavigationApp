import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ねこのかお / Cat Face(伝承・新宮文明)
 * https://www.origami-club.com/easy/animal-face/cat/zu.html を基準にした顔。
 *
 *   ❶ 半分に折る(下半分を上へ)→ 上向き三角(頂点=頭のてっぺん)
 *   ❷ 中心線に折り目(展開図に埋め込み済み・工程なし)
 *   ❸ 下の両角を上へ折って耳にする(左右)
 *   ❹ てっぺんの山を下へ折って頭頂に切れ込みを作る
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * 犬(dog.ts)と同じ2層+事前折り線分割の方式。数値は3Dプレビューで検証して詰める。
 */

const V: [number, number][] = [
  [0, 1], //  0: 上の角(頭のてっぺん・上層)
  [1, 0], //  1: 右の角(右耳)
  [0, -1], //  2: 下の角(工程1で上へ折られる・あご側)
  [-1, 0], //  3: 左の角(左耳)
  // 左耳の折り線(下半分=B-L辺 と 折り線上、上層ミラー=T-L辺)。
  // 中心寄り+急角度にして耳を高く立てる(耳先が上を向く)
  [-0.15, 0], //  4: 左耳折り線・中心側(折り線上)
  [-0.68, -0.32], //  5: 左耳折り線・外側(左下辺 B-L 上)
  [-0.68, 0.32], //  6: 左耳折り線の上層ミラー(左上辺 T-L 上)
  // 右耳
  [0.15, 0], //  7: 右耳折り線・中心側
  [0.68, -0.32], //  8: 右耳折り線・外側(右下辺 B-R 上)
  [0.68, 0.32], //  9: 右耳折り線の上層ミラー(右上辺 T-R 上)
  // 頭頂の切れ込み(てっぺんの山を下へ折る)。上層=T辺、下層=B辺
  [-0.28, 0.72], // 10: 切れ込み折り線・左(左上辺 T-L 上)
  [0.28, 0.72], // 11: 切れ込み折り線・右(右上辺 T-R 上)
  [-0.28, -0.72], // 12: 切れ込み折り線・左の下層ミラー(左下辺 B-L 上)
  [0.28, -0.72], // 13: 切れ込み折り線・右の下層ミラー(右下辺 B-R 上)
];

const F: number[][] = [
  // 下半分(工程1で上へ折られる側)
  [3, 5, 4], // 左耳(下層)
  [1, 7, 8], // 右耳(下層)
  [2, 13, 12], // てっぺん切れ込み(下層)
  [4, 5, 12, 13, 8, 7], // 中央(下層)
  // 上半分(そのまま)
  [3, 4, 6], // 左耳(上層)
  [1, 9, 7], // 右耳(上層)
  [0, 10, 11], // てっぺん切れ込み(上層)
  [4, 7, 9, 11, 10, 6], // 中央(上層)
];

/** 反時計回り(表=+z)へ揃える */
function orient(f: number[]): number[] {
  let a = 0;
  for (let i = 0; i < f.length; i++) {
    const [x1, y1] = V[f[i]];
    const [x2, y2] = V[f[(i + 1) % f.length]];
    a += x1 * y2 - x2 * y1;
  }
  return a >= 0 ? f : [...f].reverse();
}

const steps: FoldStep[] = [
  {
    // ❶ 半分に折る(下半分を裏=奥へ回して上へ。表の色が前面に出る)
    folds: [{ axis: [3, 1], moving: [2, 5, 8, 12, 13], type: 'mountain', angle: 177 }],
    description: {
      ja: '下半分を上へ、半分に谷折りします。',
      en: 'Valley-fold in half, bringing the bottom half up.',
    },
    caution: {
      ja: '角と角をぴったり合わせましょう。',
      en: 'Align the corners precisely.',
    },
  },
  {
    // ❸ 左耳
    folds: [{ axis: [4, 5], moving: [3], type: 'valley', angle: 165 }],
    description: {
      ja: '左の下の角を上へ折り上げて、耳にします。',
      en: 'Fold the lower-left corner up to form an ear.',
    },
  },
  {
    // ❸ 右耳
    folds: [{ axis: [7, 8], moving: [1], type: 'valley', angle: 165 }],
    description: {
      ja: '右の下の角も同じように折り上げて、耳にします。',
      en: 'Fold the lower-right corner up the same way for the other ear.',
    },
    caution: {
      ja: '左右の耳をそろえましょう。',
      en: 'Keep both ears symmetrical.',
    },
  },
  {
    // ❹ てっぺんの切れ込み
    folds: [{ axis: [10, 11], moving: [0, 2], type: 'valley', angle: 150 }],
    description: {
      ja: 'てっぺんの山を下へ折って、耳の間に切れ込みを作ります。',
      en: 'Fold the top peak down to make the notch between the ears.',
    },
  },
];

export const catModel: OrigamiModel = {
  id: 'cat',
  name: { ja: 'ねこのかお', en: 'Cat Face' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  steps,
};
