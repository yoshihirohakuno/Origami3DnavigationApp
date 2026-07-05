import type { OrigamiModel } from '../engine/types';

/**
 * コップ / Cup(5工程)
 * 半分折り→左右の角を反対側へ→前後のフタを畳む、の古典作品。
 * 全工程が1軸折りで、前後レイヤーの折り分け(工程4・5)を含む。
 *
 * 工程2・3の折り線は s = 2-√2 ≈ 0.5858 を使った古典の厳密解:
 * 角(±1,0)の折り先が反対側の折り線の上端(∓(√2-1), s)にぴったり重なり、
 * フタの折り線(y=s)とあわせて、はみ出しのない台形のコップになる。
 */
const S = 2 - Math.SQRT2; // ≈ 0.5858(フタ折り線の高さ)
const X_TOP = Math.SQRT2 - 1; // ≈ 0.4142(折り線上端のx)
const X_BASE = 3 - 2 * Math.SQRT2; // ≈ 0.1716(折り線下端のx)
export const cupModel: OrigamiModel = {
  id: 'cup',
  name: { ja: 'コップ', en: 'Cup' },
  difficulty: 2,
  vertices: [
    [0, 1], //  0: 上の角(最後に裏へ折るフタ)
    [1, 0], //  1: 右の角
    [0, -1], //  2: 下の角(工程1で上へ、工程4で手前フタに)
    [-1, 0], //  3: 左の角
    [X_BASE, 0], //  4: 右折り線・軸上の端点
    [X_TOP, S], //  5: 右折り線・上端(右上辺上)
    [X_TOP, -S], //  6: 右折り線の鏡映(右下辺上)
    [-X_BASE, 0], //  7: 左折り線・軸上の端点
    [-X_TOP, S], //  8: 左折り線・上端(左上辺上)
    [-X_TOP, -S], //  9: 左折り線の鏡映(左下辺上)
  ],
  faces: [
    // 下半分(工程1で手前に折り上げる側)
    [2, 6, 9], // 下の角(手前フタになる)
    [1, 4, 6], // 右角(下層)
    [3, 9, 7], // 左角(下層)
    [4, 7, 9, 6], // 中央(下層)
    // 上半分
    [0, 8, 5], // 上の角(裏フタ)
    [1, 5, 4], // 右角(上層)
    [3, 7, 8], // 左角(上層)
    [4, 5, 8, 7], // 中央(上層)
  ],
  steps: [
    {
      folds: [{ axis: [3, 1], moving: [2, 6, 9], type: 'valley', angle: 177 }],
      description: {
        ja: '下の角を上の角に合わせて、半分に谷折りします。',
        en: 'Valley-fold in half, bringing the bottom corner up to the top.',
      },
    },
    {
      folds: [{ axis: [4, 6], moving: [1], type: 'valley', angle: 175 }],
      description: {
        ja: '右の角を、反対側の斜め辺に届くまで谷折りします。',
        en: 'Valley-fold the right corner across until it reaches the opposite slanted edge.',
      },
      caution: {
        ja: '2枚重ねたまま折ります。',
        en: 'Fold both layers together.',
      },
    },
    {
      folds: [{ axis: [7, 9], moving: [3], type: 'valley', angle: 173 }],
      description: {
        ja: '左の角も同じように、反対側へ谷折りして重ねます。',
        en: 'Valley-fold the left corner across the same way, overlapping the first.',
      },
    },
    {
      folds: [{ axis: [6, 9], moving: [2], type: 'valley', angle: 172 }],
      description: {
        ja: '手前のフタを、折った角にかぶせるように谷折りします。',
        en: 'Valley-fold the front flap down over the folded corners.',
      },
      caution: {
        ja: '手前の1枚だけ折ります。',
        en: 'Fold the front layer only.',
      },
    },
    {
      folds: [{ axis: [5, 8], moving: [0], type: 'mountain', angle: 172 }],
      description: {
        ja: '後ろのフタを、裏側へ山折りします。口を開けば完成です。',
        en: 'Mountain-fold the back flap behind. Open the mouth and it is done.',
      },
    },
  ],
};
