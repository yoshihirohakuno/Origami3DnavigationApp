import type { OrigamiModel } from '../engine/types';

/**
 * ことり / Little Bird(4工程)
 * 中割り折り(inside reverse fold)の教材モデル。鶴の首・頭と同じ機構を
 * 首・くちばし・尾の3か所で使う。
 *
 * 展開図はひし形の正方形:右(1,0) 上(0,1) 左(-1,0) 下(0,-1)。
 * 工程1で上半分を後ろへ倒して下向き三角(右=頭側・左=尾側・下=腹)にし、
 *  - 工程2: 右の先を上へ中割り折り→首(先端E(1,0)は折り線 4(0.704,0)-5(0.3,-0.7)
 *    で鏡映され (0.556,0.256) へ=背中から斜め上に首が立つ)
 *  - 工程3: 首先を手前下へ中割り折り→くちばし
 *  - 工程4: 左の先を上へ中割り折り→尾(首の折り線を左右反転した位置)
 * くちばし折り線 P1(0.603,0.174)-P2(0.491,0.014) を首の折り線で鏡映して展開図に
 * 埋め込む:下層 (0.905,0)-(0.8228,-0.1772)、上層はそのy反転。
 * 尾の折り線は首の折り線の x 反転。
 */
export const birdModel: OrigamiModel = {
  id: 'bird',
  name: { ja: 'ことり', en: 'Little Bird' },
  difficulty: 3,
  vertices: [
    [1, 0], //  0: 右の角(首の先端→くちばし)
    [0, 1], //  1: 上の角(工程1で後ろへ)
    [-1, 0], //  2: 左の角(尾の先端)
    [0, -1], //  3: 下の角(腹)
    [0.704, 0], //  4: 首折り線・背中側の端点
    [0.3, -0.7], //  5: 首折り線・下端(右下辺上)
    [0.3, 0.7], //  6: 首折り線の鏡映(右上辺上)
    [0.905, 0], //  7: くちばし折り線・背中側の端点
    [0.8228, -0.1772], //  8: くちばし折り線・下端(右下辺上)
    [0.8228, 0.1772], //  9: くちばし折り線の鏡映(右上辺上)
    [-0.82, 0], // 10: 尾折り線・背中側の端点(角寄り=胴を太く残し、尾は小さく低く=頭を優位に)
    [-0.62, -0.38], // 11: 尾折り線・下端(左下辺上)
    [-0.62, 0.38], // 12: 尾折り線の鏡映(左上辺上)
  ],
  faces: [
    // 下半分(手前に残る側)
    [3, 5, 4, 10, 11], // 胴体(下層)
    [4, 5, 8, 7], // 首(下層)
    [7, 8, 0], // くちばし(下層)
    [10, 2, 11], // 尾(下層)
    // 上半分(工程1で後ろへ折る側)
    [4, 6, 1, 12, 10], // 胴体(上層)
    [4, 7, 9, 6], // 首(上層)
    [7, 0, 9], // くちばし(上層)
    [10, 12, 2], // 尾(上層)
  ],
  steps: [
    {
      folds: [{ axis: [0, 2], moving: [1, 6, 9, 12], type: 'mountain', angle: 177 }],
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
    {
      folds: [{ axis: [10, 11], moving: [2], type: 'inside-reverse', angle: 168 }],
      description: {
        ja: '左の先を上へ中割り折りして、尾を作ります。',
        en: 'Inside-reverse the left point up to form the tail.',
      },
      caution: {
        ja: '首と反対向きに、後ろへ跳ね上げます。',
        en: 'It flips up toward the back, opposite the neck.',
      },
    },
  ],
};
