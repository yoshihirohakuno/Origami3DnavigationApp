import { withRigidFolds } from '../engine/rigidFolds';
import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * くるま / Car(全10工程)— 5つめの「のりもの」。
 * 原典 https://www.origami-club.com/easy/vehicle/car/zu.html の❶〜❾
 * (折り図の番号は❸が飛んでいて ❶❷❹❺❻❼❽❾ の8パネル)。
 *
 *   ❶ たてよこ はんぶんに おって おりめを つけて もどす(よこ→たての順に2回)
 *   ❷ 下のふちを、まんなかの折り目に合わせて折り上げる(帯ができる)
 *   ❹ 帯の左右を、帯の対角線で下へ折る(タイヤ)
 *   ❺ 上半分を、まんなかの折り目で下へ折る
 *   ❻ 手前の1枚だけ、上から 1/4 のところで折り上げる
 *   ❼ 上のふちの中点から、手前の紙の右下の角への線で、右上の角を折り下げる(ボンネット)
 *   ❽ うらがえして、まどを描いてできあがり
 *
 * 紙は [-1,1] の正方形、**白い面を上にして始める**(折り図❶が白い正方形)。
 *
 * 折り線はすべて目印のある厳密値(実測はその裏づけ):
 * - ❷ は **y=-0.5**。折り上げた下のふちが**まんなかの折り目にぴったり重なる**。
 *   折り図❹の帯の高さ 46px / 紙の幅 186px = 0.49単位 と一致
 * - ❹ は **帯の対角線**(0,0)-(±1,-0.5)。折り図❹の破線が帯の上の中点と下の両角を結ぶ。
 *   角 (±1,0) は **(±0.6,-0.8)** へ回る(折り図❺のタイヤの先の実測 -0.80 と一致)。
 *   タイヤの内側のふち (0,0)-(±0.6,-0.8) にはさまれて、帯の青が細い三角に見える
 *   (折り図❺の実測: y=-0.287 で青は ±0.20、この構成の予測は ±0.215)
 * - ❺ は **y=0**(まんなかの折り目)。折り図❻が一面青になるのは、下りてきた上半分の
 *   裏(=紙の色の面)が正面に来るから。残差角は 172(下記)
 * - ❻ は **y=-0.25**(手前の1枚(y=-1〜0)の**上から** 1/4)。折り図の実測は3パネルで
 *   0.261(❻の破線)/ 0.259(❼の白い矩形の高さ)/ 0.251(❽のフラップの高さ)= 平均 0.257。
 *   折り上げたふちは y=+0.5 まで来て、そこが完成形の上のふちになる
 * - ❼ の折り線は **上のふちの中点 (0,0.5) から、手前の紙の右下の角 (1,-0.25) へ**。
 *   右上の角 (1,0.5) は **(0.28,-0.46)相当**へ回る(折り図❽の実測と一致。下記)
 * - 完成形は **横縦比 1.54**(折り図❾の実測 1.56)
 *
 * 展開図への戻し方: ❹の折り線は❷で折り上がる帯の中なので、展開図では
 * y=-0.5 で鏡映して **(0,-1)-(±1,-0.5)**。❻❼の折り線は❺で下りる上半分の中なので
 * y=0 で鏡映して **y=+0.25** と **(0,1)-(1,0.25)**。
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

/** 白い面を上にして始める(折り図❶が白い正方形) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const V: [number, number][] = [
  [0, 0], //  0 中心(❶の折り目の交点)
  [1, 0], //  1 右のふち ∩ よこの折り目
  [1, 0.25], //  2 右のふち ∩ ❻の折り線
  [1, 1], //  3 右上の角(❼で折り下げてボンネットになる)
  [0, 1], //  4 上のふちの中点(❼の折り線の端)
  [-1, 1], //  5 左上の角
  [-1, 0.25], //  6 左のふち ∩ ❻の折り線
  [-1, 0], //  7 左のふち ∩ よこの折り目
  [-1, -0.5], //  8 左のふち ∩ ❷の折り線
  [0, -0.5], //  9 ❷の折り線 ∩ たての折り目
  [1, -0.5], // 10 右のふち ∩ ❷の折り線
  [1, -1], // 11 右下の角(❹で回ってタイヤになる)
  [0, -1], // 12 下のふちの中点(❹の折り線が集まる点)
  [-1, -1], // 13 左下の角(同上)
  [0, 0.25], // 14 ❻の折り線 ∩ たての折り目
];

const F: number[][] = [
  [7, 0, 14, 6], // 上半分の帯・左(❻で折り上げない側)
  [0, 1, 2, 14], // 上半分の帯・右
  [6, 14, 4, 5], // 上半分・左(❻で折り上がる)
  [14, 2, 4], // 上半分・右のうち❼の折り線の内側
  [2, 3, 4], // 上半分・右上の角(❼で折り下げる)
  [8, 9, 0, 7], // 下半分・左
  [9, 10, 1, 0], // 下半分・右
  [12, 10, 9], // 帯の中央・右(タイヤの内側)
  [12, 9, 8], // 帯の中央・左
  [12, 11, 10], // 帯の右(❹でタイヤに)
  [12, 8, 13], // 帯の左(❹でタイヤに)
];

/** ❶❺で下へ回る上半分 */
const UPPER = [2, 3, 4, 5, 6, 14];
/** ❶c でたて半分に折るときに動く右半分 */
const RIGHT = [1, 2, 3, 10, 11];

/** ❷で折り上げる帯 */
const BAND = [11, 12, 13];
/** ❻で折り上げる、手前の1枚のうち折り線より向こう */
const FLAP = [3, 4, 5];

const ANGLE = 176;

const steps: FoldStep[] = [
  {
    // ❶a よこ半分の折り目(❷で合わせる目印。❺の折り線でもある)
    folds: [{ axis: [7, 1], moving: UPPER, type: 'valley', angle: 178 }],
    description: {
      ja: 'よこ半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half crosswise to crease the middle.',
    },
    caution: {
      ja: '白い面を上にして始めます。この折り目が次の工程で合わせる目印になります。',
      en: 'Start white side up. This crease is the guide for the next fold.',
    },
  },
  {
    // ❶b 開いて戻す
    // 直前の valley の自動符号が +1 なので、戻しは -1(+1 だと 178+178=356° で 4° 傾いたまま残る)
    folds: [{ axis: [7, 1], moving: UPPER, type: 'unfold', angle: 178, direction: -1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❶c たて半分の折り目。折り線としては使わないが、**❼の折り線の上端(上のふちの中点)の
    // 目印**になる(折り図❺〜❾にも縦の中心線が描かれている)
    folds: [{ axis: [12, 4], moving: RIGHT, type: 'valley', angle: 178 }],
    description: {
      ja: 'たて半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half lengthwise to crease the middle.',
    },
    caution: {
      ja: 'この折り目が、最後にボンネットを折るときの目印になります。',
      en: 'This crease marks where the bonnet fold starts, at the very end.',
    },
  },
  {
    // ❶d 開いて戻す(たての valley は自動符号が -1 なので、戻しは +1。よこと逆になる)
    folds: [{ axis: [12, 4], moving: RIGHT, type: 'unfold', angle: 178, direction: 1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❷ 下のふちを、まんなかの折り目に合わせて折り上げる
    folds: [{ axis: [8, 10], moving: BAND, type: 'valley', angle: ANGLE }],
    description: {
      ja: '下のふちを、まんなかの折り目に合わせて折り上げます。',
      en: 'Fold the bottom edge up to the middle crease.',
    },
    caution: {
      ja: '折り上げた帯が、車の色の面になります。',
      en: 'The band you fold up shows the colored side.',
    },
  },
  {
    // ❹ 帯の対角線で左右を下へ折る(タイヤ)
    folds: [
      { axis: [12, 10], moving: [11], type: 'valley', angle: ANGLE },
      { axis: [12, 8], moving: [13], type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: '帯の左右を、てんせんで下へ折ります。',
      en: 'Fold the two ends of the band downwards along the dashed lines.',
    },
    caution: {
      ja: '折り線は帯の対角線です。下に出た2つの角がタイヤになります。',
      en: 'The creases are the diagonals of the band — the two corners become the wheels.',
    },
  },
  {
    // ❺ 上半分を、まんなかの折り目で下へ折る
    // 残差角を ANGLE より深く(172)する: ❷の残差で帯とタイヤが z=+0.01〜0.035 に浮いているので、
    // 176 のままだと折り目ぎわでタイヤの白が 3% のぞく(折り図❻は一面が色)
    folds: [{ axis: [7, 1], moving: UPPER, type: 'valley', angle: 172 }],
    description: {
      ja: '上半分を、まんなかの折り目で下へ折ります。',
      en: 'Fold the top half down along the middle crease.',
    },
    caution: {
      ja: '下りてきた紙の裏が正面に来るので、一面が色の面になります。',
      en: 'The underside of the folded half comes to the front, so it turns all one colour.',
    },
  },
  {
    // ❻ 手前の1枚だけ、上から 1/4(y=-0.25)で折り上げる
    folds: [{ axis: [6, 2], moving: FLAP, type: 'valley', angle: ANGLE }],
    description: {
      ja: '手前の1枚だけ、てんせんで折り上げます。',
      en: 'Fold just the front layer up along the dashed line.',
    },
    caution: {
      ja: '下にかくれていたタイヤと、帯の色の面が出てきます。',
      en: 'This brings back the wheels and the coloured band that were hidden underneath.',
    },
  },
  {
    // ❼ 上のふちの中点から手前の紙の右下の角への線で、右上の角を折り下げる
    folds: [{ axis: [4, 2], moving: [3], type: 'valley', angle: ANGLE }],
    description: {
      ja: '右上の角を、てんせんで折り下げます。',
      en: 'Fold the top right corner down along the dashed line.',
    },
    caution: {
      ja: '折り線は「上のふちの中点」と「手前の紙の右下の角」を結ぶ線。ボンネットになります。',
      en: 'The crease runs from the middle of the top edge to the front layer’s bottom right corner — this makes the bonnet.',
    },
  },
  {
    // ❽ うらがえす(たての中心線が軸。車は左を向く)
    folds: [
      {
        axis: [0, 9],
        moving: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14],
        type: 'assemble',
        angle: 180,
        direction: 1,
      },
    ],
    description: {
      ja: 'うらがえします。まどを描いてできあがり。',
      en: 'Turn it over, then draw the windows.',
    },
    caution: {
      ja: 'うらがえすと、色の面のボディに白いタイヤの車になります。',
      en: 'Turned over, you get a coloured body with white wheels.',
    },
  },
];

const source: OrigamiModel = {
  id: 'car',
  name: { ja: 'くるま', en: 'Car' },
  difficulty: 2,
  vertices: V,
  faces: backSideUp(F.map((f) => orient(f, V))),
  faceSheet: F.map(() => 0),
  // 折り図の水色を実測(#4aa9c9 相当) / 裏は白
  sheetColors: [{ front: '#48a6c6', back: '#f6f2e8' }],
  steps,
};

// Close each flat fold fully and preserve the paper stack, including fold-line vertices.
export const carModel = withRigidFolds(source);
