import type { OrigamiModel } from '../engine/types';

/**
 * チューリップ / Tulip(3工程)
 * 工程2で左右の花びらを「同時に」折る:1工程に複数の折り(FoldOp)を
 * 持たせられることを示すサンプル。
 *
 * 花びらの折り線は (±0.2,0)-(±0.65,∓0.35)。この線で角(±1,0)を折ると
 * 先端が (±0.40,0.78) 付近に来て、上辺の外側へはみ出す(花びららしい形)。
 * 工程3の折り線 (±0.4,-0.6) で手前の先端を裏へ折り、花の谷間を作る。
 */
export const tulipModel: OrigamiModel = {
  id: 'tulip',
  name: { ja: 'チューリップ', en: 'Tulip' },
  difficulty: 1,
  vertices: [
    [0, 1], //  0: 上の角(奥の花びらになる)
    [1, 0], //  1: 右の角(右の花びら)
    [0, -1], //  2: 下の角(工程3で裏へ折る先端)
    [-1, 0], //  3: 左の角(左の花びら)
    [0.2, 0], //  4: 右花びら折り線・軸上の端点
    [0.65, 0.35], //  5: 右花びら折り線・上端(右上辺上)
    [0.65, -0.35], //  6: 右花びら折り線の鏡映(右下辺上)
    [-0.2, 0], //  7: 左花びら折り線・軸上の端点
    [-0.65, 0.35], //  8: 左花びら折り線・上端(左上辺上)
    [-0.65, -0.35], //  9: 左花びら折り線の鏡映(左下辺上)
    [0.4, -0.6], // 10: 先端折り線・右端(右下辺上)
    [-0.4, -0.6], // 11: 先端折り線・左端(左下辺上)
  ],
  faces: [
    // 下半分(工程1で手前に折り上げる側)
    [1, 4, 6], // 右角(下層)
    [3, 9, 7], // 左角(下層)
    [2, 10, 11], // 先端(工程3で裏へ)
    [4, 7, 9, 11, 10, 6], // 中央(下層)
    // 上半分
    [1, 5, 4], // 右角(上層)
    [3, 7, 8], // 左角(上層)
    [4, 5, 0, 8, 7], // 中央(上層)
  ],
  steps: [
    {
      folds: [{ axis: [3, 1], moving: [2, 6, 9, 10, 11], type: 'valley', angle: 177 }],
      description: {
        ja: '下の角を上の角に合わせて、半分に谷折りします。',
        en: 'Valley-fold in half, bringing the bottom corner up to the top.',
      },
    },
    {
      folds: [
        { axis: [4, 6], moving: [1], type: 'valley', angle: 172 },
        { axis: [7, 9], moving: [3], type: 'valley', angle: 172 },
      ],
      description: {
        ja: '左右の角を、同時に斜め上へ谷折りして花びらにします。',
        en: 'Valley-fold both corners up at an angle — the petals — at the same time.',
      },
      caution: {
        ja: '先が上の辺から少しはみ出すように折ります。',
        en: 'Let the tips poke out past the top edges.',
      },
    },
    {
      folds: [{ axis: [10, 11], moving: [2], type: 'mountain', angle: 160 }],
      description: {
        ja: '手前の1枚の先端を、裏側へ山折りして花の谷間を作ります。',
        en: 'Mountain-fold the tip of the front layer behind to shape the bloom.',
      },
    },
  ],
};
