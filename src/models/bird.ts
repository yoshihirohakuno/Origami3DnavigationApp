import type { OrigamiModel } from '../engine/types';

/**
 * ことり / Little Bird(3工程)
 * 中割り折り(inside reverse fold)の検証モデル。鶴の首・頭と同じ機構。
 *
 * 工程2(首):折り線 A(0.704,0)-Q(0.3,-0.7)。60°の折り線なので
 * 先端E(1,0)は鏡映で (0.556,0.256) へ=背中から斜め上に首が立つ。
 * 工程3(くちばし)の折り線は、完成状態で決めた線
 * P1(0.603,0.174)-P2(0.491,0.014) を首の折り線で鏡映して展開図に埋め込む:
 * 下層 (0.905,0)-(0.8228,-0.1772)、上層はそのy反転。
 */
export const birdModel: OrigamiModel = {
  id: 'bird',
  name: { ja: 'ことり', en: 'Little Bird' },
  difficulty: 3,
  vertices: [
    [1, 0], //  0: 右の角(首の先端→くちばし)
    [0, 1], //  1: 上の角(工程1で後ろへ)
    [-1, 0], // 2: 左の角(しっぽ)
    [0, -1], // 3: 下の角
    [0.704, 0], //  4: 首折り線・背中側の端点
    [0.3, -0.7], //  5: 首折り線・下端(右下辺上)
    [0.3, 0.7], //  6: 首折り線の鏡映(右上辺上)
    [0.905, 0], //  7: くちばし折り線・背中側の端点
    [0.8228, -0.1772], //  8: くちばし折り線・下端(右下辺上)
    [0.8228, 0.1772], //  9: くちばし折り線の鏡映(右上辺上)
  ],
  faces: [
    // 下半分(手前に残る側)
    [2, 3, 5, 4], // 胴体(下層)
    [4, 5, 8, 7], // 首(下層)
    [7, 8, 0], // くちばし(下層)
    // 上半分(工程1で後ろへ折る側)
    [2, 4, 6, 1], // 胴体(上層)
    [4, 7, 9, 6], // 首(上層)
    [7, 0, 9], // くちばし(上層)
  ],
  steps: [
    {
      folds: [{ axis: [0, 2], moving: [1, 6, 9], type: 'mountain', angle: 177 }],
      description: {
        ja: '上の角を後ろへ、半分に山折りします。',
        en: 'Mountain-fold in half, taking the top corner behind.',
      },
    },
    {
      folds: [{ axis: [4, 5], moving: [0, 7, 8, 9], type: 'inside-reverse', angle: 175 }],
      description: {
        ja: '紙の間を開き、右の先を折り線から上へ中割り折りして首を作ります。',
        en: 'Open the layers and inside-reverse the point up along the crease to form the neck.',
      },
      caution: {
        ja: '先端を2枚の間に折り込みます。',
        en: 'The point tucks between the two layers.',
      },
    },
    {
      folds: [{ axis: [7, 8], moving: [0], type: 'inside-reverse', angle: 172 }],
      description: {
        ja: '首の先を手前下へ中割り折りして、くちばしを作ります。',
        en: 'Inside-reverse the tip of the neck down to form the beak.',
      },
      caution: {
        ja: '左右の紙の間に割り込ませます。',
        en: 'Split the tip between the layers.',
      },
    },
  ],
};
