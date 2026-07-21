import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ぱんだのかお / Panda Face(全6工程)
 * https://www.origami-club.com/easy/animal-face/panda/zu.html を基準にした顔。
 *
 *   ❶ 縦半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❷ てっぺんの角を後ろへ折る(頭の上をたいらに)
 *   ❸ 上の両角を手前へ折る → 裏の色(朱)が出て耳になる(同時)
 *   ❹ 左右の角を後ろへ折る(顔の横をまっすぐに)
 *   ❺ 下の先を手前へ折り上げる → 裏の色が出て鼻になる
 *
 * 他の動物の顔と違い半分折りをせず、1枚のまま角の折り込みだけで作る
 * (原典どおり)。顔は紙の表(白)、耳・鼻は裏(朱)が折り返しで表に出たもの。
 * sheetColors で表=生成り/裏=朱 に反転している(既定は表=朱)。
 *
 * 原典との差: 原典は左右の角を中央へ折ってから側面を後ろへ折り返して
 * 耳を残す(多層)。ここでは上の両角を手前へ折る1層の折りで同等の見た目
 * (上の角に朱の三角=耳)を作る。❷の後ろ折りフラップと耳の折りがわずかに
 * 重なるが、裏側なので見た目には影響しない。
 */

const V: [number, number][] = [
  [0, 1], //  0: 上の角(❷で後ろへ)
  [1, 0], //  1: 右の角(❹で後ろへ)
  [0, -1], //  2: 下の角(❺で手前へ=鼻)
  [-1, 0], //  3: 左の角(❹で後ろへ)
  [0, 0.5], //  4: てっぺん折り線の中点(x=0)
  [-0.5, 0.5], //  5: てっぺん折り線・左(左上辺上。❸で耳として手前へ)
  [0.5, 0.5], //  6: てっぺん折り線・右(右上辺上)
  [-0.5, 0.3], //  7: 左耳折り線・下端(❹の折り線上)
  [0.5, 0.3], //  8: 右耳折り線・下端
  [-0.15, 0.5], //  9: 左耳折り線・上端(てっぺん折り線上)
  [0.15, 0.5], // 10: 右耳折り線・上端
  [-0.5, -0.5], // 11: 左側面折り線・下端(左下辺上)
  [0.5, -0.5], // 12: 右側面折り線・下端(右下辺上)
  [-0.3, -0.7], // 13: 鼻折り線・左(左下辺上)
  [0.3, -0.7], // 14: 鼻折り線・右(右下辺上)
  [0, -0.7], // 15: 鼻折り線の中点(x=0)
];

const F: number[][] = [
  [0, 5, 4], // てっぺん・左
  [0, 4, 6], // てっぺん・右
  [5, 7, 9], // 左耳の角
  [6, 10, 8], // 右耳の角
  [3, 5, 7, 11], // 左側面
  [1, 12, 8, 6], // 右側面
  [2, 13, 15], // 鼻先・左
  [2, 15, 14], // 鼻先・右
  [4, 9, 7, 11, 13, 15], // 中央・左
  [4, 15, 14, 12, 8, 10], // 中央・右
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

// ❶の縦折りで動く左半分
const LEFT_HALF = [3, 5, 7, 9, 11, 13];

const steps: FoldStep[] = [
  {
    // ❶a 縦半分に折り目
    folds: [{ axis: [0, 2], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half sideways to crease the center line.',
    },
    caution: {
      ja: 'ぱんだは白い面が顔になります。',
      en: 'The white side becomes the panda face.',
    },
  },
  {
    // ❶b 開いて戻す
    folds: [{ axis: [0, 2], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: -1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❷ てっぺんを後ろへ
    folds: [{ axis: [5, 6], moving: [0], type: 'mountain', angle: 172 }],
    description: {
      ja: 'てっぺんの角を後ろへ折って、頭の上をたいらにします。',
      en: 'Fold the top corner behind to flatten the head.',
    },
  },
  {
    // ❸ 両耳(上の両角を手前へ折ると裏の朱が出る)
    folds: [
      { axis: [7, 9], moving: [5], type: 'valley', angle: 168 },
      { axis: [8, 10], moving: [6], type: 'valley', angle: 168 },
    ],
    description: {
      ja: '上の両角を手前へ折ります。裏の色が出て、耳になります。',
      en: 'Fold both top corners toward you — the color side shows as the ears.',
    },
    caution: {
      ja: '左右の耳をそろえましょう。',
      en: 'Keep both ears symmetrical.',
    },
  },
  {
    // ❹ 左右の角を後ろへ
    folds: [
      { axis: [7, 11], moving: [3], type: 'mountain', angle: 172 },
      { axis: [8, 12], moving: [1], type: 'mountain', angle: 172 },
    ],
    description: {
      ja: '左右の角を後ろへ折って、顔の横をまっすぐにします。',
      en: 'Fold the side corners behind to straighten the face.',
    },
  },
  {
    // ❺ 鼻(下の先を手前へ)
    folds: [{ axis: [13, 14], moving: [2], type: 'valley', angle: 165 }],
    description: {
      ja: '下の先を手前へ折り上げます。裏の色が出て、鼻になります。目を描いたらできあがり。',
      en: 'Fold the bottom tip up toward you — the color side shows as the nose. Draw the eyes to finish.',
    },
  },
];

export const pandaModel: OrigamiModel = {
  id: 'panda',
  name: { ja: 'ぱんだのかお', en: 'Panda Face' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 顔=紙の表(生成り)、耳・鼻=裏(朱)。既定の表裏を反転
  sheetColors: [{ front: '#f2ede3', back: '#e0492f' }],
  steps,
};
