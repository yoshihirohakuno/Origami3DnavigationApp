import { withRigidFolds } from '../engine/rigidFolds';
import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * おむすび / Rice Ball(全6工程)— アプリ初の「たべもの」。
 * 原典 https://www.origami-club.com/easy/food/riceball/zu.html の❶〜❻。
 *
 *   ❶ たてよこ はんぶんに おって おりめを つける
 *   ❷ てんせんで おる(下の角を折り上げる = のりが出る)
 *   ❸ てんせんで おる(まんなかの折り目で下半分を折り上げる)
 *   ❹ てんせんで うしろに おる(下の両角)
 *   ❺ てんせんで うしろに おる(上の角と、下の両角)
 *   ❻ できあがり
 *
 * 紙は**ひし形**(角 N(0,1) E(1,0) S(0,-1) W(-1,0))で、**白い面を上にして始める**
 * (折り図❶が白いひし形。表=のり / 裏=ごはんの白)。
 *
 * 折り線(すべて折り図のピクセル実測。値の裏づけは下記):
 * - **F=0.55**(❷の折り線 y=-F)。折り図❸の灰色の三角の底が -0.551、
 *   ❻の白い帯の割合 0.312 と一致(下記)。角の先は y=1-2F=-0.10 へ回る
 * - ❸は**まんなかの折り目 y=0**。下半分は❷で短くなっているので上半分を全部は
 *   覆わず、**y=F まで**が のり(灰)・その上が白い三角になる(折り図❹と一致)
 * - **C=2/3**(❹の折り線は N(0,1) から底辺の (±C,0) へ)。目印のない実測値で、
 *   4通りの測り方が 0.66〜0.68 に集まる: ❹の破線の外挿 0.679/0.682、
 *   ❺の輪郭の幅から 0.664/0.660、❻の上のふちの幅 55px から 0.67、
 *   ❻の最大幅の点 (0.539,0.196) から 0.671。**3パネルで一致するので 2/3 を採る**
 * - **TOP=0.80**(❺の上の折り線 y=TOP)。❻の白い帯の割合 (TOP-F)/TOP=0.313 が
 *   実測 0.312 と一致し、上のふちの幅 2C(1-TOP)=0.267 も実測(55px)と一致する
 * - ❺の下の折り線は **(±0.536,0.196)-(±0.386,0)**(❻の輪郭の実測。目印なし)。
 *   上端は❹の折り線の上、下端は底辺の上に乗る
 *
 * 完成形は六角形(おむすび): 上のふち y=0.80、最大幅 1.072(y=0.196)、
 * 底のふち y=0 で幅 0.772。**横縦比 1.340**(折り図❻の実測 1.345)。
 *
 * **層の重なり**: ❸のあと、のりの帯のところは 上から
 * 「下半分(のり)/ ❷で折り上げた先 / 上半分」の3枚。❹❺はその3枚まとめて
 * うしろへ回すので、折り線は層ごとに展開図の別の場所に入る(下記の頂点表)。
 */

/** 面の頂点順を反時計回りにそろえる */
function orient(f: number[], V: [number, number][]): number[] {
  let a = 0;
  for (let i = 0; i < f.length; i++) {
    const p = V[f[i]];
    const q = V[f[(i + 1) % f.length]];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a >= 0 ? f : [...f].reverse();
}

/** 白い面(ごはん)を上にして始める */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const V: [number, number][] = [
  [0, 0], //  0 O  中心(❶よこの折り目 ∩ ❶たての折り目)
  [0, 1], //  1 N  上の角(❺でうしろへ)
  [0, 0.8], //  2 V  ❺上の折り線 ∩ 中心線
  [0, -0.55], //  3 M  ❷の折り線 ∩ 中心線
  [0, -1], //  4 S  下の角(❷で折り上げる先)
  [1, 0], //  5 E  右の角(❹でうしろへ)
  [-1, 0], //  6 W  左の角(❹でうしろへ)

  // 右半分
  [0.6667, 0], //  7 A+ ❹の折り線が底辺に着く点
  [0.1333, 0.8], //  8 U+ ❺上の折り線 ∩ ❹の折り線
  [0.1529, 0.8471], //  9 X+ ❺上の折り線を❹の折り線で鏡映した線が、紙のふちに出る点
  [0.536, 0.196], // 10 P+ ❺下の折り線の上端(❹の折り線の上)
  [0.386, 0], // 11 Q+ ❺下の折り線の下端(底辺の上)
  [0.7479, 0.2521], // 12 R+ ❺下の折り線を❹の折り線で鏡映した線が、紙のふちに出る点
  [0.536, -0.196], // 13 D+ ❺下の折り線(下半分の層。y=0 で鏡映)
  [0.7479, -0.2521], // 14 Y+ 同・下半分のフラップ側(2回鏡映)
  [0.45, -0.55], // 15 T+ ❷の折り線の端(紙のふちの上)
  [0.3, -0.55], // 16 G+ ❹の折り線(下半分) ∩ ❷の折り線
  [0.36, -0.64], // 17 H+ ❹の折り線(先の層)が紙のふちに出る点

  // 左半分(鏡映)
  [-0.6667, 0], // 18 A-
  [-0.1333, 0.8], // 19 U-
  [-0.1529, 0.8471], // 20 X-
  [-0.536, 0.196], // 21 P-
  [-0.386, 0], // 22 Q-
  [-0.7479, 0.2521], // 23 R-
  [-0.536, -0.196], // 24 D-
  [-0.7479, -0.2521], // 25 Y-
  [-0.45, -0.55], // 26 T-
  [-0.3, -0.55], // 27 G-
  [-0.36, -0.64], // 28 H-
];

const F: number[][] = [
  // 上半分・❹の折り線より内側
  [1, 8, 2], // 頂点の三角(❺でうしろへ)
  [2, 8, 10, 11, 0], // 本体
  [11, 7, 10], // 右下の角(❺でうしろへ)
  [1, 2, 19], //
  [2, 0, 22, 21, 19], //
  [22, 21, 18], //
  // 上半分・❹でうしろへ回るフラップ
  [1, 9, 8],
  [8, 9, 12, 10],
  [10, 12, 5, 7],
  [1, 19, 20],
  [19, 21, 23, 20],
  [21, 18, 6, 23],
  // 下半分(❸で折り上がる)・❹の折り線より内側
  [0, 11, 13, 16, 3],
  [11, 7, 13],
  [0, 3, 27, 24, 22],
  [22, 24, 18],
  // 下半分・❹でうしろへ回るフラップ
  [13, 14, 15, 16],
  [7, 13, 14, 5],
  [24, 27, 26, 25],
  [18, 6, 25, 24],
  // 先(❷で折り上がる)
  [3, 16, 17, 4],
  [16, 15, 17],
  [3, 4, 28, 27],
  [27, 28, 26],
];

/** ❶a・❸で折り上がる下半分(❷で折り上げた先も含む) */
const LOWER = [3, 4, 13, 14, 15, 16, 17, 24, 25, 26, 27, 28];
/** ❷で折り上げる下の角 */
const TIP = [4, 17, 28];
/** ❹でうしろへ回るフラップ(❹の折り線の上の頂点は入れない) */
const FLAP_R = [5, 9, 12, 14, 15];
const FLAP_L = [6, 20, 23, 25, 26];

const ANGLE = 176;

const steps: FoldStep[] = [
  {
    // ❶a よこ半分の折り目(❸の折り線になる)
    folds: [{ axis: [6, 5], moving: LOWER, type: 'valley', angle: 178 }],
    description: {
      ja: 'よこ半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half crosswise to crease the middle.',
    },
    caution: {
      ja: '白い面を上にして始めます。この折り目が、あとで下半分を折り上げるときの目印になります。',
      en: 'Start with the white side up. This crease guides the later fold.',
    },
  },
  {
    // ❶b 開いて戻す(直前の valley の自動符号を実測して符号を決めること)
    folds: [{ axis: [6, 5], moving: LOWER, type: 'unfold', angle: 178, direction: 1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❷ 下の角を y=-F で折り上げる(のりが出る)
    folds: [{ axis: [26, 15], moving: TIP, type: 'valley', angle: ANGLE }],
    description: {
      ja: '下の角を、てんせんで折り上げます。',
      en: 'Fold the bottom corner up along the dashed line.',
    },
    caution: {
      ja: '折り上げた先が、のりの色になります。',
      en: 'The folded-up tip shows the nori side.',
    },
  },
  {
    // ❸ まんなかの折り目で下半分を折り上げる(のりの帯ができる)
    folds: [{ axis: [6, 5], moving: LOWER, type: 'valley', angle: ANGLE }],
    description: {
      ja: 'まんなかの折り目で、下半分を折り上げます。',
      en: 'Fold the bottom half up along the middle crease.',
    },
    caution: {
      ja: '❷で短くなっているので上を全部は覆わず、上が白・下がのりの三角になります。',
      en: 'It no longer covers the top, so the rice shows above the nori.',
    },
  },
  {
    // ❹ 下の両角をうしろへ(3枚まとめて回る)
    folds: [
      { axis: [1, 7], moving: FLAP_R, type: 'mountain', angle: ANGLE },
      { axis: [1, 18], moving: FLAP_L, type: 'mountain', angle: ANGLE },
    ],
    description: {
      ja: '下の両角を、てんせんでうしろに折ります。',
      en: 'Fold both bottom corners behind along the dashed lines.',
    },
    caution: {
      ja: 'おむすびの斜めの肩ができます。重なった3枚をまとめて折ります。',
      en: 'This makes the slanted shoulders — all three layers fold together.',
    },
  },
  {
    // ❺ 上の角と、下の両角をうしろへ
    folds: [
      { axis: [19, 8], moving: [1], type: 'mountain', angle: ANGLE },
      { axis: [11, 10], moving: [7, 5], type: 'mountain', angle: ANGLE },
      { axis: [22, 21], moving: [18, 6], type: 'mountain', angle: ANGLE },
    ],
    description: {
      ja: '上の角と下の両角を、てんせんでうしろに折ります。おむすびのできあがり。',
      en: 'Fold the top and bottom corners behind — the rice ball is done.',
    },
    caution: {
      ja: '角を落とすと、まるみのある六角形になります。',
      en: 'Rounding off the corners gives the six-sided rice-ball shape.',
    },
  },
];

const source: OrigamiModel = {
  id: 'riceball',
  name: { ja: 'おむすび', en: 'Rice Ball' },
  difficulty: 2,
  vertices: V,
  faces: backSideUp(F.map((f) => orient(f, V))),
  faceSheet: F.map(() => 0),
  // 表=のり(濃い炭緑。真っ黒だと背景に沈むので ぱんだ と同じ考え方で少し明るく) / 裏=ごはんの白
  sheetColors: [{ front: '#3f4a3e', back: '#f6f2e8' }],
  steps,
};

// Close each flat fold fully and preserve the paper stack, including fold-line vertices.
export const riceballModel = withRigidFolds(source);
