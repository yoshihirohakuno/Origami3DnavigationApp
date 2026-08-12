import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ぺんぎん / Penguin(全9工程 = 原典8工程 + 折り目の戻し)
 * https://www.origami-club.com/easy/sea/penguin/zu.html の折り図に忠実。
 * 2026-08-12 追加。
 *
 *   ❶ たてに半分の折り目をつけて戻す(原典は「たてよこ」だが、横は❷の目安なので
 *      アプリでは対称の軸になる縦だけを折る。ひよこと同じ方針)
 *   ❷ 下の角を y=-F の線で折り上げる(中心より少し下)
 *   ❸ 折り上げた角の先を、展開図 y=-3/4 の弦で下へ折り返す
 *   ❹ うらがえす(以降は下の層=五角形の裏(白)が正面)
 *   ❺ 左右を x=±0.4 で内へ(下の2つの角が中心でぴったり出会う)
 *   ❻ 左右のはしを x=±0.2 で外へ折り返す(はね)
 *   ❼ あたまの先を y=0.87 で下へ折る
 *   ❽ うらがえして、目を描いてできあがり
 *
 * 幾何の要点(折り図のピクセル実測。ひし形の角 N(0,1) E(1,0) S(0,-1) W(-1,0)):
 * - ❷の折り線 **y=-F(F=0.2)**(実測 0.186〜0.211)。下の角の先は y=1-2F=0.6 に来る
 * - ❸の折り線は展開図の **y=-0.75 の弦**(折り後は y=0.35)。弦の幅がちょうど
 *   折り上げた三角の幅と一致するのが目印。折った先は y≈0.1(折り図❹の実測 0.136)
 * - ❺の折り線 **x=±0.4 = ±(1-F)/2**。下の2つの角が中心でぴったり出会う(実測 0.379)。
 *   フラップには**紙の左右の角 E/W も入る**ので、折ると角は中心を越えて x=∓0.2 まで来る
 * - ❻の折り線 **x=±0.2**(実測 0.195)。❺で中心を越えた E/W の角が外へ回って
 *   **x=±0.6 まで張り出す**のが折り図❼のすその形(実測 0.62)。展開図では x=±0.6
 *   (❺の折り線 x=±0.4 で鏡映して逆算)
 * - ❼の折り線 y=0.87(実測)。あたまの先は y=0.74 へ
 *
 * 色: 青い面を上にして始める(折り図❶が青)。
 * ❷で折り上げた三角は裏(白)を見せ、❹でうらがえすと五角形の裏(白)が正面になる。
 * ❺で内へ折ったフラップは表(青)が出て、折り図❻の青いV字になる
 * (V字は「上の層のフラップのうち、下の層のフラップに隠れていない帯」)。
 * ❽でうらがえすと、上の層は表(青)=あたま、下の層は裏(白)=おなか になり、
 * 二つの層のさかいめがおなかのV字のふちになる。
 *
 * 層: どの折りも動く側が手前へ回るので、残差角のままで層順が出る。
 * ❺は約180°なので上下の層の前後が入れ替わり、下の層のフラップ(白)が
 * 上の層のフラップ(青)の上に来る(折り図❻の青い帯の幅がこれで決まる)。
 */

/** ❷の折り線(中心より少し下) */
const F = 0.2;
/** ❸の折り線(展開図。折り後は y=-2F-Y3=0.35) */
const Y3 = -0.75;
/** ❺の折り線。下の2つの角が中心で出会う位置 */
const X5 = (1 - F) / 2;
/** ❻の折り線(展開図。折り後は x=±(2*X5-X6)=±0.2) */
const X6 = 0.6;
/** ❼の折り線(あたまの先) */
const Y7 = 0.87;

const V: [number, number][] = [
  // 上の層(❷で動かない側。y >= -F)
  [0, 1], //  0: N あたまの先(❼で下へ)
  [1 - Y7, Y7], //  1: ❼の折り線・右
  [-(1 - Y7), Y7], //  2: ❼の折り線・左
  [0, Y7], //  3: ❼の折り線・中(❶の折り目の上)
  [X5, 1 - X5], //  4: ❺の折り線が右上のふちと交わる点(かた)
  [-X5, 1 - X5], //  5: 同・左
  [X6, 1 - X6], //  6: ❻の折り線が右上のふちと交わる点
  [-X6, 1 - X6], //  7: 同・左
  [1, 0], //  8: E 右の角(❺で中心を越え、❻ではねの先へ)
  [-1, 0], //  9: W 左の角
  [1 - F, -F], // 10: ❷の折り線・右端(両層で共有)
  [-(1 - F), -F], // 11: 同・左端
  [X6, -F], // 12: ❻の折り線と❷の折り線の交点(共有)
  [-X6, -F], // 13: 同・左
  [X5, -F], // 14: ❺の折り線と❷の折り線の交点(共有)
  [-X5, -F], // 15: 同・左
  [0, -F], // 16: 中心(❹❽のうらがえしの軸)
  // 下の層(❷で折り上げる側。y <= -F)
  [X6, -(1 - X6)], // 17: ❻の折り線が右下のふちと交わる点
  [-X6, -(1 - X6)], // 18: 同・左
  [X5, -(1 - X5)], // 19: ❺の折り線が右下のふちと交わる点
  [-X5, -(1 - X5)], // 20: 同・左
  [1 + Y3, Y3], // 21: ❸の折り線・右端(右下のふちの上。x=0.25)
  [-1 - Y3, Y3], // 22: ❸の折り線・左端
  [0, Y3], // 23: ❸の折り線・中
  [0, -1], // 24: S 下の角(❷で折り上げ、❸で折り返す)
];

const F_ = [
  // 上の層・右
  [3, 1, 0], // ❼で下へ折るあたまの先(右半分)
  [16, 14, 4, 1, 3], // 胴(右半分)
  [14, 12, 6, 4], // ❺で内へ入るフラップのうち、❻で動かない部分 = はね
  [12, 10, 8, 6], // ❻で外へ回る部分(紙の右の角)
  // 上の層・左
  [3, 0, 2],
  [16, 3, 2, 5, 15],
  [15, 5, 7, 13],
  [13, 7, 9, 11],
  // 下の層・右
  [23, 21, 24], // ❸で折り返す先(右半分)
  [16, 23, 21, 19, 14], // 折り上げる三角(右半分)
  [14, 19, 17, 12],
  [12, 17, 10],
  // 下の層・左
  [23, 24, 22],
  [16, 15, 20, 22, 23],
  [15, 13, 18, 20],
  [13, 11, 18],
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

/** ❶の縦の折り目で動く左半分 */
const LEFT_HALF = [2, 5, 7, 9, 11, 13, 15, 18, 20, 22];
/** ❷で折り上げる下の層 */
const LOWER = [17, 18, 19, 20, 21, 22, 23, 24];
/** すべての頂点(うらがえし用) */
const ALL = V.map((_, i) => i);

const steps: FoldStep[] = [
  {
    // ❶a たてに半分の折り目(左右対称の目安になる)
    folds: [{ axis: [0, 24], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: 'たてに半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half vertically to crease the center line.',
    },
    caution: {
      ja: '色のついた面を上にして始めます。折り目は左右をそろえる目安に使います。',
      en: 'Start colored side up. The crease is your guide for lining up both sides.',
    },
  },
  {
    // ❶b 開いて戻す(直前の valley の自動符号を実測して符号を決めること)
    folds: [{ axis: [0, 24], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: 1 }],
    description: {
      ja: '開いて戻します。',
      en: 'Unfold.',
    },
  },
  {
    // ❷ 下の角を、中心より少し下の線で折り上げる
    folds: [{ axis: [11, 10], moving: LOWER, type: 'valley', angle: 176 }],
    description: {
      ja: '下の角を、まんなかより少し下の線で折り上げます。',
      en: 'Fold the bottom corner up along a line just below the center.',
    },
    caution: {
      ja: '折り上げた角の先は、上の角までの 5分の3 くらいのところまで来ます。',
      en: 'The corner ends up about three fifths of the way to the top.',
    },
  },
  {
    // ❸ 折り上げた角の先を下へ折り返す(裏の白から表の色が出る)
    folds: [{ axis: [22, 21], moving: [24], type: 'valley', angle: 174 }],
    description: {
      ja: '折り上げた角の先を、下へ折り返します。',
      en: 'Fold the tip of that corner back down.',
    },
    caution: {
      ja: '白い三角のはばと折り線のはばがちょうど同じになる位置で折ります。',
      en: 'Crease where the line is exactly as wide as the white triangle.',
    },
  },
  {
    // ❹ うらがえす(以降は五角形の裏=白が正面)
    folds: [{ axis: [0, 16], moving: ALL, type: 'assemble', angle: 180, direction: 1 }],
    description: {
      ja: 'うらがえします。',
      en: 'Turn it over.',
    },
  },
  {
    // ❺ 左右を内へ(下の2つの角が中心でぴったり出会う)
    // 軸は「❷で動いていない頂点」だけで取る(4-19 のように❷で持ち上がった頂点を
    // 使うと軸が z 方向に 4° 傾き、フラップが奥へ回ってしまう)
    folds: [
      { axis: [4, 14], moving: [6, 8, 10, 12, 17], type: 'valley', angle: 176 },
      { axis: [5, 15], moving: [7, 9, 11, 13, 18], type: 'valley', angle: 176 },
    ],
    description: {
      ja: '左右を、下の2つの角がまんなかで出会うように折ります。',
      en: 'Fold both sides in so the two bottom corners meet at the center.',
    },
    caution: {
      ja: '紙の左右の角は、まんなかを越えて反対側まで入ります。',
      en: 'The side corners of the paper travel past the center.',
    },
  },
  {
    // ❻ 左右のはしを外へ折り返す(中心を越えた角が外へ張り出して はね になる)
    // ここも軸は❷で動いていない 6-12 / 7-13(❺では両端が同じだけ動くので傾かない)
    folds: [
      { axis: [6, 12], moving: [8, 10], type: 'valley', angle: 176 },
      { axis: [7, 13], moving: [9, 11], type: 'valley', angle: 176 },
    ],
    description: {
      ja: '左右のはしを外へ折り返して、はねにします。',
      en: 'Fold both edges back out to make the flippers.',
    },
    caution: {
      ja: 'さっき中へ入れた角が外へ出て、胴より外へ張り出します。',
      en: 'The corners you just tucked in swing out past the body.',
    },
  },
  {
    // ❼ あたまの先を下へ
    folds: [{ axis: [2, 1], moving: [0], type: 'valley', angle: 174 }],
    description: {
      ja: 'あたまの先を、少し下へ折ります。',
      en: 'Fold the top point down a little.',
    },
  },
  {
    // ❽ うらがえす(上の層の表=あたま、下の層の裏=おなか)
    folds: [{ axis: [3, 16], moving: ALL, type: 'assemble', angle: 180, direction: 1 }],
    description: {
      ja: 'うらがえして、目を描いたらぺんぎんのできあがり。',
      en: 'Turn it over, draw the eyes, and the penguin is done.',
    },
    caution: {
      ja: 'おなかだけが白くなり、さかいめがV字のふちになります。',
      en: 'Only the belly stays white, and the seam becomes its V-shaped edge.',
    },
  },
];

export const penguinModel: OrigamiModel = {
  id: 'penguin',
  name: { ja: 'ぺんぎん', en: 'Penguin' },
  difficulty: 2,
  cameraAngle: 0,
  vertices: V,
  faces: F_.map(orient),
  faceSheet: F_.map(() => 0),
  // 折り図の紙の色(実測 RGB(111,201,223))。色のついた面を上にして始める
  sheetColors: [{ front: '#6fc9df', back: '#f6f2e8' }],
  steps,
};
