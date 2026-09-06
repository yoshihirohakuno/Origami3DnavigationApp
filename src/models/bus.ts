import { withRigidFolds } from '../engine/rigidFolds';
import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ばす / Bus(全8工程)— 6つめの「のりもの」。
 * 原典 https://www.origami-club.com/rn-image/zu/bus.gif の❶〜❼
 *
 *   ❶ はんぶんに おって おりめを つけて もどす(よこ)
 *   ❷ 上下のふちを てんせんで 内へ おる
 *   ❸ 帯の四すみを てんせんで 外へ おる
 *   ❹ 四すみの先を てんせんで 小さく おる
 *   ❺ はんぶんに おる
 *   ❻ 上の両角を てんせんで なかわりおり
 *   ❼ まどを かいて できあがり
 *
 * 紙は [-1,1] の正方形、**白い面を上にして始める**(折り図❶❷が白い正方形)。
 *
 * 折り線(実測はすべて別のパネルと突き合わせてある):
 * - **❷ は y=±2/3**。折り図❷の破線の実測が **+0.639 / -0.651** で、目印の 2/3 と一致する。
 *   結果も4通りで裏が取れる: 折り図❸の 帯 0.315 / 白い中央 0.682 / 全高 1.306、
 *   折り図❺の帯の上端〜中心 0.653、折り図❼の本体の高さ 0.658(いずれも 2/3=0.667 の予測)
 *   **注意**: この破線は**薄いグレー**で描かれている。暗さの閾値を上げて拾わないと、
 *   すぐ内側にある**黒い矢印**(±0.36 のあたり)を破線と取り違える(実装時に一度やった)
 * - **❸ は帯の対角線**。展開図では (∓1,±2/3)-(∓1/3,±1)、折った状態では (∓1,±2/3)-(∓1/3,±1/3)。
 *   紙の四すみは **(∓0.733,±0.867)** へ回って帯の外へ出る(折り図❹のピークの実測
 *   (∓0.74,±0.92)、輪郭が45°で狭まるのと一致)。ここが車輪になる
 * - **❹ はピークの先を折り下げるだけ**(折り図❹の小さな下向き矢印)。折った状態で
 *   先から 0.065 下の水平線。展開図では紙の角を切る **(∓1,±0.892)-(∓0.919,±1)**
 *   (❸→❷ の鏡映を逆にたどって逆算)
 * - **❺ は y=0**(❶の折り目)。折り図❻の本体が **2/3 の高さ**(実測 0.664)、
 *   車輪の先が上のふちから **0.867**(実測 0.86)で裏づけ
 * - **❻ の折り線は折り後の (∓0.90,0)-(∓1,∓0.06)**(折り図❻の破線の実測)
 *
 * 検証: 裏面% は `100 0 100 50 79 78 0 0`(❷のあと 50% = 白い中央がちょうど半分、
 * ❺で一面が色になる)。辺の長さのずれ 0.000。
 * 完成形の横縦比 **2.49** に対し、折り図❼の完成図は **2.408**(色面の外接矩形 236×98px)で
 * ずれは **3.4%**。車輪の底の平らな幅はモデルが 0.135、折り図は 0.118〜0.131 とばらつく。
 * なお折り図はピークを幾何的にあり得ない高さに描いている(折り図❹の実測 0.929 は、
 * 帯の高さ 1/3 を鏡映した最大 0.333 を超えている)。車輪の出っぱりが折り図 0.169 /
 * モデル 0.135 と違うのはこのため。
 *
 * 色: 白い面を上に始めるので、❷で折り上げた帯が紙の色(橙)になり、❸で外へ回した
 * 四すみはまた白にもどる(折り図❹の白い三角)。❺で上半分が下りると、その裏の橙が
 * 正面に来て一面が橙になり、車輪も**上の層の三角が下の層をおおって橙**になる。
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

/** 白い面を上にして始める(折り図❶❷が白い正方形) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const A = 2 / 3; // ❷の折り線
const Bx = 1 / 3; // ❸の折り線が上下のふちを切る x
const C = 0.892; // ❹の折り線が左右のふちを切る y(実測)
const D = 0.919; // ❹の折り線が上下のふちを切る x(実測)
const E = 0.9; // ❻の折り線が中心の折り目を切る x(実測)
const F = 0.06; // ❻の折り線が左右のふちを切る y(実測)

const V: [number, number][] = [
  [-1, 1], //  0 左上の角(❹で先を折る)
  [-D, 1], //  1 ❹の折り線 ∩ 上のふち
  [-Bx, 1], //  2 ❸の折り線 ∩ 上のふち
  [Bx, 1], //  3
  [D, 1], //  4
  [1, 1], //  5 右上の角
  [1, C], //  6 ❹の折り線 ∩ 右のふち
  [1, A], //  7 ❷の折り線 ∩ 右のふち
  [1, F], //  8 ❻の折り線(上の層)∩ 右のふち
  [1, 0], //  9 右のふち ∩ 中心の折り目(❻でなかわりおりする角)
  [1, -F], // 10 ❻の折り線(下の層)∩ 右のふち
  [1, -A], // 11
  [1, -C], // 12
  [1, -1], // 13 右下の角
  [D, -1], // 14
  [Bx, -1], // 15
  [-Bx, -1], // 16
  [-D, -1], // 17
  [-1, -1], // 18 左下の角
  [-1, -C], // 19
  [-1, -A], // 20
  [-1, -F], // 21
  [-1, 0], // 22 左のふち ∩ 中心の折り目(❻でなかわりおりする角)
  [-1, F], // 23
  [-1, A], // 24
  [-1, C], // 25
  [-E, 0], // 26 ❻の折り線 ∩ 中心の折り目(左)
  [E, 0], // 27 同(右)
];

const F_ = [
  [0, 1, 25], // 上の帯・左上の先(❹で折る)
  [25, 1, 2, 24], // 上の帯・左の角(❸で外へ回って車輪に)
  [24, 2, 3, 7], // 上の帯・中央
  [7, 3, 4, 6], // 上の帯・右の角
  [6, 4, 5], // 上の帯・右上の先
  [22, 26, 23], // 中央・上半分の左の角(❻でなかわりおり)
  [23, 26, 27, 8, 7, 24], // 中央・上半分
  [9, 8, 27], // 中央・上半分の右の角
  [22, 21, 26], // 中央・下半分の左の角
  [21, 20, 11, 10, 27, 26], // 中央・下半分
  [10, 9, 27], // 中央・下半分の右の角
  [18, 19, 17], // 下の帯・左下の先
  [19, 20, 16, 17], // 下の帯・左の角
  [20, 11, 15, 16], // 下の帯・中央
  [11, 12, 14, 15], // 下の帯・右の角
  [12, 13, 14], // 下の帯・右下の先
];

/** ❶❺で下へ回る上半分(y>0 の頂点すべて) */
const UPPER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 23, 24, 25];
/** ❷で内へ折る上の帯 / 下の帯 */
const TOP_BAND = [0, 1, 2, 3, 4, 5, 6, 25];
const BOTTOM_BAND = [12, 13, 14, 15, 16, 17, 18, 19];

const ANGLE = 176;

const steps: FoldStep[] = [
  {
    // ❶a よこ半分の折り目(❺の折り線そのもの。❷の着地の目印にもなる)
    folds: [{ axis: [22, 9], moving: UPPER, type: 'valley', angle: 178 }],
    description: {
      ja: 'よこ半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half crosswise to crease the middle.',
    },
    caution: {
      ja: '白い面を上にして始めます。',
      en: 'Start with the white side up.',
    },
  },
  {
    // ❶b 開いて戻す(直前の valley の自動符号を実測して符号を決めること)
    folds: [{ axis: [22, 9], moving: UPPER, type: 'unfold', angle: 178, direction: -1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❷ 上下のふちを y=±2/3 で内へ(折ったふちが y=±1/3 に来て、白い中央が 2/3 になる)
    folds: [
      { axis: [24, 7], moving: TOP_BAND, type: 'valley', angle: ANGLE },
      { axis: [11, 20], moving: BOTTOM_BAND, type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: '上下のふちを、てんせんで内へ折ります。',
      en: 'Fold the top and bottom edges inwards along the dashed lines.',
    },
    caution: {
      ja: '折ったふちが中央に届かず、まんなかに白い帯が残るのが正しい形です。',
      en: 'The folded edges stop short of the middle — a white band stays between them.',
    },
  },
  {
    // ❸ 帯の四すみを対角線で外へ折る(紙の角が帯の外へ出て、あとで車輪になる)
    folds: [
      { axis: [24, 2], moving: [0, 1, 25], type: 'valley', angle: ANGLE },
      { axis: [3, 7], moving: [4, 5, 6], type: 'valley', angle: ANGLE },
      { axis: [16, 20], moving: [17, 18, 19], type: 'valley', angle: ANGLE },
      { axis: [11, 15], moving: [12, 13, 14], type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: '帯の四すみを、てんせんで外へ折ります。',
      en: 'Fold the four corners of the bands outwards along the dashed lines.',
    },
    caution: {
      ja: '折り線は帯の対角線。外へ出た三角が、あとで車輪になります。',
      en: 'The creases are the diagonals of the bands — the corners that stick out become the wheels.',
    },
  },
  {
    // ❹ 四すみの先を小さく折る
    folds: [
      { axis: [25, 1], moving: [0], type: 'valley', angle: ANGLE },
      { axis: [4, 6], moving: [5], type: 'valley', angle: ANGLE },
      { axis: [17, 19], moving: [18], type: 'valley', angle: ANGLE },
      { axis: [12, 14], moving: [13], type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: '四すみの先を、てんせんで小さく折ります。',
      en: 'Fold the tip of each of the four corners over.',
    },
    caution: {
      ja: 'とがった先を落として、車輪の形をととのえます。',
      en: 'Blunting the points shapes the wheels.',
    },
  },
  {
    // ❺ よこ半分に折る(上半分が下りて、その裏の色が正面に来る)
    // 残差角は ANGLE(176)。172 だと上の層が 0.006 届かず、車輪のふちに下の層の白が見える
    folds: [{ axis: [22, 9], moving: UPPER, type: 'valley', angle: ANGLE }],
    description: {
      ja: 'まんなかの折り目で、はんぶんに折ります。',
      en: 'Fold in half along the middle crease.',
    },
    caution: {
      ja: '下りてきた紙の裏が正面に来るので、一面が色の面になります。',
      en: 'The underside of the folded half comes to the front, so it turns all one colour.',
    },
  },
  {
    // ❻ 上の両角をなかわりおり(折り後の (∓0.90,0)-(∓1,∓0.06))
    folds: [
      { axis: [26, 21], moving: [22], type: 'inside-reverse', angle: 176 },
      { axis: [27, 10], moving: [9], type: 'inside-reverse', angle: 176 },
    ],
    description: {
      ja: '上の両角を、てんせんで なかわりおりします。まどを描いてできあがり。',
      en: 'Inside reverse fold both top corners, then draw the windows.',
    },
    caution: {
      ja: '折り込んだ紙は層のあいだに入ります。屋根の角が落ちてバスらしくなります。',
      en: 'The corners tuck in between the layers, rounding off the roof.',
    },
  },
];

const source: OrigamiModel = {
  id: 'bus',
  name: { ja: 'ばす', en: 'Bus' },
  difficulty: 2,
  vertices: V,
  faces: backSideUp(F_.map((f) => orient(f, V))),
  faceSheet: F_.map(() => 0),
  // 折り図の橙を実測 / 裏は白
  sheetColors: [{ front: '#f5a11f', back: '#f6f2e8' }],
  steps,
};

// Close each flat fold fully and preserve the paper stack, including fold-line vertices.
export const busModel = withRigidFolds(source);
