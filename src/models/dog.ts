import type { OrigamiModel } from '../engine/types';

/**
 * 犬 / Dog(5工程)
 * 谷折り4回+山折り1回。工程4は「手前の1枚だけ折る」を含み、
 * レイヤー(紙の重なり)を区別して折れることを示すサンプル。
 *
 * 展開図はひし形向きの正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * すべての折り線の端点を頂点として事前に埋め込んである。
 */
export const dogModel: OrigamiModel = {
  id: 'dog',
  name: { ja: '犬', en: 'Dog' },
  difficulty: 1,
  vertices: [
    [0, 1], //  0: 上の角(工程1で手前へ折られ、工程4で鼻になる)
    [1, 0], //  1: 右の角(右耳)
    [0, -1], //  2: 下の角(あご)
    [-1, 0], //  3: 左の角(左耳)
    [-0.35, 0], //  4: 左耳折り線・上端
    [-0.65, -0.35], //  5: 左耳折り線・下端(左下辺上)
    [0.35, 0], //  6: 右耳折り線・上端
    [0.65, -0.35], //  7: 右耳折り線・下端(右下辺上)
    [-0.65, 0.35], //  8: 左耳折り線の鏡映(左上辺上)
    [0.65, 0.35], //  9: 右耳折り線の鏡映(右上辺上)
    [-0.25, -0.75], // 10: あご折り線・左端(左下辺上)
    [0.25, -0.75], // 11: あご折り線・右端(右下辺上)
    [-0.25, 0.75], // 12: 鼻折り線の鏡映・左(左上辺上)
    [0.25, 0.75], // 13: 鼻折り線の鏡映・右(右上辺上)
  ],
  faces: [
    // 下半分
    [3, 5, 4], // 左耳(下層)
    [1, 6, 7], // 右耳(下層)
    [2, 11, 10], // あご先
    [4, 5, 10, 11, 7, 6], // 中央(下層)
    // 上半分(工程1で手前に折られる側)
    [3, 4, 8], // 左耳(上層)
    [1, 9, 6], // 右耳(上層)
    [0, 12, 13], // 鼻先
    [4, 6, 9, 13, 12, 8], // 中央(上層)
  ],
  steps: [
    {
      folds: [{ axis: [3, 1], moving: [0, 8, 9, 12, 13], type: 'valley', angle: 177 }],
      description: {
        ja: '上の角を下の角に合わせて、半分に谷折りします。',
        en: 'Valley-fold in half, bringing the top corner down to the bottom corner.',
      },
      caution: {
        ja: '角と角をぴったり合わせましょう。',
        en: 'Align the corners precisely.',
      },
    },
    {
      folds: [{ axis: [4, 5], moving: [3], type: 'valley', angle: 172 }],
      description: {
        ja: '左の角を斜め下へ谷折りして、耳を作ります。',
        en: 'Valley-fold the left corner down at an angle to form an ear.',
      },
    },
    {
      folds: [{ axis: [6, 7], moving: [1], type: 'valley', angle: 172 }],
      description: {
        ja: '右の角も同じように谷折りして、耳を作ります。',
        en: 'Valley-fold the right corner the same way for the other ear.',
      },
      caution: {
        ja: '左右の耳の大きさをそろえましょう。',
        en: 'Keep both ears symmetrical.',
      },
    },
    {
      folds: [{ axis: [12, 13], moving: [0], type: 'valley', angle: 168 }],
      description: {
        ja: '手前の1枚だけ、下の角を上へ谷折りします。',
        en: 'Valley-fold only the front layer, lifting the bottom corner up.',
      },
      caution: {
        ja: '後ろの紙は折らないように注意。',
        en: 'Leave the back layer in place.',
      },
    },
    {
      folds: [{ axis: [10, 11], moving: [2], type: 'mountain', angle: 150 }],
      description: {
        ja: '後ろに残った角を、裏側へ山折りします。',
        en: 'Mountain-fold the remaining back corner behind.',
      },
    },
  ],
};
