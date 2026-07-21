import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ハート / Heart(全4工程)【未完成・保留中 — App.tsx の MODELS には未登録】
 *
 * ⚠ 中央の「くぼみ」が未解決。上辺中央を後ろへ折る(❶)と、上辺より上に紙が
 * 無いため頂点が上へ跳ね上がってしまい(くぼみ底が y=0.45→1.5 へ)、くぼみに
 * ならない。実際の折り紙のハートのくぼみは「上辺中央を摘まんで奥へたくし込む」
 * (うさぎの耳折り/中割り折り)で作られ、単軸回転1本の折りでは表現できない。
 * 上の2つの山・下の尖り(角の後ろ折り)は単軸回転で問題なく作れている。
 * 詳細と再開方針は CLAUDE.md「ハート(保留中)」を参照。
 *
 * 定番の「角落とし」ハート。正方形(辺が水平)の角と上辺中央を後ろへ折るだけで
 * 作れる1枚折り。裏(白)はすべて後ろを向くので、正面は赤いハートに見える。
 *
 *   ❶ てっぺんの中央を後ろへ折り、山を2つに分ける(ハートのくぼみ)
 *   ❷ 上の左右の角を後ろへ折る(2つの山を丸く)
 *   ❸ 下の左右の角を後ろへ折る(すそをとがらせる)
 *
 * 展開図は辺が水平の正方形:左上(-1,1) 右上(1,1) 右下(1,-1) 左下(-1,-1)。
 * 上辺の左右=2つの山、上辺中央=くぼみ、下辺中央(0,-1)=すその先。
 * すべて山折り(後ろ折り)なので2層の色管理は不要。表=赤。
 */

const V: [number, number][] = [
  [-1, 1], //  0: 左上の角(❷で後ろへ=左の山)
  [1, 1], //  1: 右上の角(❷で後ろへ=右の山)
  [1, -1], //  2: 右下の角(❸で後ろへ)
  [-1, -1], //  3: 左下の角(❸で後ろへ)
  // くぼみ(上辺中央の逆三角を後ろへ)
  [-0.3, 1], //  4: くぼみ折り線・左(上辺上)
  [0.3, 1], //  5: くぼみ折り線・右(上辺上)
  [0, 0.42], //  6: くぼみの底(内部点)
  // 上の山を丸く(左上・右上の角を後ろへ)
  [-0.62, 1], //  7: 左山折り線・上(上辺上)
  [-1, 0.55], //  8: 左山折り線・横(左辺上)
  [0.62, 1], //  9: 右山折り線・上(上辺上)
  [1, 0.55], // 10: 右山折り線・横(右辺上)
  // 下のすそを絞る(左下・右下の角を後ろへ)
  [-1, -0.15], // 11: 左すそ折り線・横(左辺上)
  [-0.12, -1], // 12: 左すそ折り線・下(下辺上)
  [1, -0.15], // 13: 右すそ折り線・横(右辺上)
  [0.12, -1], // 14: 右すそ折り線・下(下辺上)
];

const F: number[][] = [
  [4, 5, 6], // くぼみの逆三角(❶で後ろへ)
  [0, 7, 8], // 左の山の角(❷で後ろへ)
  [1, 10, 9], // 右の山の角(❷で後ろへ)
  [3, 11, 12], // 左すその角(❸で後ろへ)
  [2, 14, 13], // 右すその角(❸で後ろへ)
  // 中央(残り)。上辺は 7→4→6→5→9 とくぼみでV字に凹む
  [7, 4, 6, 5, 9, 10, 13, 14, 12, 11, 8],
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
    // ❶ くぼみ(上辺中央の逆三角を後ろへ)
    folds: [{ axis: [4, 5], moving: [6], type: 'mountain', angle: 150 }],
    description: {
      ja: 'てっぺんの中央を後ろへ折って、山を2つに分けます。',
      en: 'Fold the center of the top edge behind to split it into two humps.',
    },
    caution: {
      ja: '赤い面を表にして折ります。',
      en: 'Keep the red side facing out.',
    },
  },
  {
    // ❷ 上の左右の角を後ろへ
    folds: [
      { axis: [7, 8], moving: [0], type: 'mountain', angle: 168 },
      { axis: [9, 10], moving: [1], type: 'mountain', angle: 168 },
    ],
    description: {
      ja: '上の左右の角を後ろへ折って、2つの山を丸くします。',
      en: 'Fold the top corners behind to round the two humps.',
    },
    caution: {
      ja: '左右を同じ大きさに折ります。',
      en: 'Fold both sides evenly.',
    },
  },
  {
    // ❸ 下の左右の角を後ろへ
    folds: [
      { axis: [11, 12], moving: [3], type: 'mountain', angle: 165 },
      { axis: [13, 14], moving: [2], type: 'mountain', angle: 165 },
    ],
    description: {
      ja: '下の左右の角を後ろへ折って、すそをとがらせます。ハートのできあがり。',
      en: 'Fold the bottom corners behind to taper the point — the heart is done.',
    },
  },
];

export const heartModel: OrigamiModel = {
  id: 'heart',
  name: { ja: 'ハート', en: 'Heart' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  sheetColors: [{ front: '#e0492f', back: '#f2ede3' }],
  steps,
};
