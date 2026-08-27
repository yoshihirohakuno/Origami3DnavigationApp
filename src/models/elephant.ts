import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ぞう / Elephant(全7工程)— 原典 https://www.origami-club.com/easy/animal/elephant2/zu.html
 *
 *   ❶ たてよこ はんぶんに おって おりめを つけて もどす
 *   ❷ てんせんで おる(左を斜めの線で右へ)
 *   ❸ はんぶんに おる(上半分を下へ)
 *   ❹ ⇧から ふくろを ひらいて つぶす(頭と鼻)
 *   ❺ かおを かいて できあがり
 *
 * 紙は [-1,1] の正方形、**白い面を上にして始める**(折り図❶が白い正方形)。
 *
 * 折り線:
 * - **❷ は (-0.5,1)-(-1,-1)**。上のふちの「左のふちと中心の折り目の中点」から左下の角へ
 *   (傾き 1/4)。2パネルで裏が取れる: 折り図❷の破線の外挿 (-0.594,1)-(-0.947,-1)、
 *   折り図❸の青い部分の左のふち (-0.49,1)-(-0.884,-1)。
 *   この折りで**左上の角 (-1,1) が (-0.06,0.76) へ回る**(折り図❸の実測 (0.01,0.83))
 * - **❸ は y=0**(❶の折り目)。折り図❹の輪郭は左のふちが傾き 1/4 の台形で、
 *   上のふち 1.75 / 下のふち 2 の比(実測 178px/201px = 0.885、予測 0.875)と一致
 * - **❹ の折り線は折り後の (0,0)-(-1,-1)**(上のふちの中点と左下の角を結ぶ45°線。
 *   折り図❹の破線の実測は (0.018,0)-(-0.974,-0.94))。展開図では
 *   **紙の左半分の2本の対角線**(下の層は (0,0)-(-1,-1)、❸で下りる上の層は (0,0)-(-1,1))
 *
 * 展開図に足した点(どちらも左のふちの上。❷の折り線 4x-y+3=0 で鏡映して逆算した):
 * - **(-1, 2/15)**: ❸の折り線(y=0)が❷のフラップの上を通る点。折ったあと (-0.467,0) に来る
 * - **(-1, 11/23)**: ❹の折り線(折り後の y=x)が❷のフラップの上を通る点。
 *   折ったあと (-0.305,-0.305) に来て、❹の軸の上に乗る。
 *   (-1,t) が❷❸のあと y=x に乗る条件 17-17t = 6+6t を解いて t=11/23)
 * どちらもヨットと同じ「フラップの上でさらに折れる線を、鏡映を逆にたどって埋める」手法。
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
  [0, 0], //  0 中心
  [1, 0], //  1 右のふち ∩ よこの折り目
  [1, 1], //  2 右上の角
  [0, 1], //  3 上のふちの中点(たての折り目)
  [-0.5, 1], //  4 ❷の折り線 ∩ 上のふち
  [-1, 1], //  5 左上の角(❷で右へ回る)
  [-1, 0], //  6 左のふち ∩ よこの折り目(同上)
  [-0.75, 0], //  7 ❷の折り線 ∩ よこの折り目
  [-1, -1], //  8 左下の角(❷の折り線の下端。❹の折り線の端でもある)
  [0, -1], //  9 下のふちの中点
  [1, -1], // 10 右下の角
  [-0.6, 0.6], // 11 ❷の折り線 ∩ 対角線(0,0)-(-1,1)
  [-1, 2 / 15], // 12 ❸の折り線が❷のフラップの上を通る点(下記)
  [-1, 11 / 23], // 13 ❹の折り線が❷のフラップの上を通る点(下記)
];

const F: number[][] = [
  [3, 0, 1, 2], // 右上
  [0, 9, 10, 1], // 右下
  [3, 0, 11, 4], // 左上・❷の折り線の内側(対角線より上)
  [4, 11, 5], // 左上・❷の折り線の外側(対角線より上)
  [0, 7, 11], // 左上・内側(対角線より下)
  [11, 7, 12, 13], // 左上・外側のうち、❸と❹の折り線にはさまれた部分(❹で回る)
  [11, 13, 5], // 左上・外側のうち、❹の折り線より上(❹では動かない)
  [7, 6, 12], // 左上・外側のうち、❸の折り線より下(❸では動かない)
  [0, 9, 8], // 左下・対角線より下
  [0, 8, 7], // 左下・対角線と❷の折り線のあいだ
  [7, 8, 6], // 左下・❷の折り線の外側
];

/** ❶a で下へ回る上半分(展開図で y>0 の頂点すべて) */
const UPPER_FLAT = [2, 3, 4, 5, 11, 12, 13];
/** ❸で下へ回る上半分。**12 は❷で y=0 に来るので軸の上**=動かさない */
const UPPER = [2, 3, 4, 5, 11, 13];
/** ❶c でたて半分に折るときに動く左半分 */
const LEFT = [4, 5, 6, 7, 8, 11, 12, 13];
/** ❷で右へ回る、折り線より左 */
const FLAP = [5, 6, 12, 13];

const ANGLE = 176;

const steps: FoldStep[] = [
  {
    // ❶a よこ半分の折り目(❸の折り線そのもの)
    folds: [{ axis: [6, 1], moving: UPPER_FLAT, type: 'valley', angle: 178 }],
    description: {
      ja: 'よこ半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half crosswise to crease the middle.',
    },
    caution: { ja: '白い面を上にして始めます。', en: 'Start with the white side up.' },
  },
  {
    // ❶b 開いて戻す(符号は実測して決める)
    folds: [{ axis: [6, 1], moving: UPPER_FLAT, type: 'unfold', angle: 178, direction: -1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❶c たて半分の折り目(❷の折り線の上端と、❹の折り線の上端の目印になる)
    folds: [{ axis: [9, 3], moving: LEFT, type: 'valley', angle: 178 }],
    description: {
      ja: 'たて半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half lengthwise to crease the middle.',
    },
    caution: {
      ja: 'この折り目が、次の折り線の位置を決める目印になります。',
      en: 'This crease locates the next fold.',
    },
  },
  {
    // ❶d 開いて戻す
    folds: [{ axis: [9, 3], moving: LEFT, type: 'unfold', angle: 178, direction: -1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❷ 左を (-0.5,1)-(-1,-1) の線で右へ折る
    folds: [{ axis: [4, 8], moving: FLAP, type: 'valley', angle: ANGLE }],
    description: {
      ja: '左のはしを、てんせんで右へ折ります。',
      en: 'Fold the left edge over to the right along the dashed line.',
    },
    caution: {
      ja: '折り線は「上のふちの中点と左のふちの中点」から左下の角へ。折った紙が色の面になります。',
      en: 'The crease runs from between the left edge and the middle crease down to the bottom left corner.',
    },
  },
  {
    // ❸ よこ半分に折る(上半分を下へ)
    // **軸は 7(-0.75,0) と 1(1,0)**。6(-1,0) は❷で (-0.53,-0.12) へ動くので軸に使えない
    folds: [{ axis: [7, 1], moving: UPPER, type: 'valley', angle: ANGLE }],
    description: {
      ja: 'まんなかの折り目で、はんぶんに折ります。',
      en: 'Fold in half along the middle crease.',
    },
    caution: {
      ja: '下りてきた紙の裏が正面に来て、左下に白い三角が残ります。',
      en: 'The underside comes to the front, leaving a white triangle at the bottom left.',
    },
  },
  {
    // ❹ 左下から袋を開いてつぶす。折り線は (0,0)-(-1,-1) の45°線で、
    // つぶしたあとは**この線が完成形の左のふち**になる(折り図❺の実測: 頂点 (0.02,0)、
    // 左のふちの傾き -1、外形 2×1 は❸のときと同じ)
    folds: [{ axis: [0, 8], moving: [6, 7, 12], type: 'valley', angle: ANGLE }],
    description: {
      ja: '左下から ふくろを ひらいて つぶします。かおを描いてできあがり。',
      en: 'Open the pocket from below and squash it flat, then draw the face.',
    },
    caution: {
      ja: '折り線は「上のふちの中点」と「左下の角」を結ぶ線。ここが鼻のせなかになります。',
      en: 'The crease runs from the middle of the top edge to the bottom left corner — it becomes the trunk’s back.',
    },
  },
];

export const elephantModel: OrigamiModel = {
  id: 'elephant',
  name: { ja: 'ぞう', en: 'Elephant' },
  difficulty: 2,
  vertices: V,
  faces: backSideUp(F.map((f) => orient(f, V))),
  faceSheet: F.map(() => 0),
  // 折り図の水色を実測 / 裏は白
  sheetColors: [{ front: '#5cc3e8', back: '#f6f2e8' }],
  steps,
};
