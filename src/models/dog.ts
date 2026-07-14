import type { OrigamiModel } from '../engine/types';

/**
 * 犬 / Dog(5工程)
 * 谷折り4回+山折り1回。工程4は「手前の1枚だけ折る」を含み、
 * レイヤー(紙の重なり)を区別して折れることを示すサンプル。
 *
 * 展開図はひし形向きの正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * 工程1で上半分を手前へ倒して下向き三角にし、左右の角を「下へ垂れる耳」に
 * 折る。頭(上辺)は広めに残し、鼻先(下の角)を下へ突き出して犬の顔にする。
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
    // 左耳の折り線:上辺の 4 から左下辺の 5 へ。角3を下へ垂らす
    [-0.42, 0], //  4: 左耳折り線・上端(上辺上)
    [-0.72, -0.28], //  5: 左耳折り線・下端(左下辺上)
    // 右耳(左右対称)
    [0.42, 0], //  6: 右耳折り線・上端
    [0.72, -0.28], //  7: 右耳折り線・下端(右下辺上)
    // 耳折り線の鏡映(上半分、工程1で下へ倒れる側)
    [-0.72, 0.28], //  8: 左耳折り線の鏡映(左上辺上)
    [0.72, 0.28], //  9: 右耳折り線の鏡映(右上辺上)
    // 鼻先の折り線:下の角のまわり(左下辺 10・右下辺 11)
    [-0.16, -0.84], // 10: あご折り線・左端(左下辺上)
    [0.16, -0.84], // 11: あご折り線・右端(右下辺上)
    // 鼻折り線の鏡映(上半分)
    [-0.16, 0.84], // 12: 鼻折り線の鏡映・左(左上辺上)
    [0.16, 0.84], // 13: 鼻折り線の鏡映・右(右上辺上)
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
        ja: '左の角を下へ垂らすように谷折りして、耳を作ります。',
        en: 'Valley-fold the left corner downward to make a floppy ear.',
      },
    },
    {
      folds: [{ axis: [6, 7], moving: [1], type: 'valley', angle: 172 }],
      description: {
        ja: '右の角も同じように下へ垂らして、耳を作ります。',
        en: 'Valley-fold the right corner down the same way for the other ear.',
      },
      caution: {
        ja: '左右の耳の大きさをそろえましょう。',
        en: 'Keep both ears symmetrical.',
      },
    },
    {
      folds: [{ axis: [12, 13], moving: [0], type: 'valley', angle: 165 }],
      description: {
        ja: '手前の1枚だけ、下の角を少し上へ谷折りして鼻先にします。',
        en: 'Valley-fold only the front layer, lifting the bottom corner a little into a snout.',
      },
      caution: {
        ja: '後ろの紙は折らないように注意。',
        en: 'Leave the back layer in place.',
      },
    },
    {
      folds: [{ axis: [10, 11], moving: [2], type: 'mountain', angle: 150 }],
      description: {
        ja: '後ろに残った角を、裏側へ山折りしてあごを整えます。',
        en: 'Mountain-fold the remaining back corner behind to shape the chin.',
      },
    },
  ],
};
