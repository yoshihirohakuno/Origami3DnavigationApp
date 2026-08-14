import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ぴあの / Piano(全8工程 = 原典6工程 + 折り目の戻し2回)
 * https://www.origami-club.com/easy/other/piano/zu.html の折り図に忠実。
 * 2026-08-13 に、原典のない独自設計だった「さいふ」の差し替えとして追加
 * (ことり→ひよこ、ふうとう→てがみ と同じ扱い)。
 *
 *   ❶ たてよこ半分に折り目をつけて戻す(❸の折り線の両端がこの折り目の上に来るので、
 *      縦・横のどちらも目印として要る)
 *   ❷ 左右のふちを内へ折る(折り線 x=±3/4。折り図の「1/4 ぐらい」は
 *      **半分の幅の 1/4** = ふちから 0.25 の位置。実測 0.25/0.26)
 *   ❸ 左上の角を、**左のふちの中点 (-3/4,0) から上のふちの中点 (0,1)** への線で折る
 *   ❹ うらがえす(以降、斜めの辺が右上に来る = ぴあのの形)
 *   ❺ 下を**うしろへ**折り上げてけんばんの高さにする(折り線 y=-0.65。実測)。
 *      手前へ折ると帯が白い裏面を見せる。折り図❻は全面が紙の色なのでうしろが正しい
 *   ❻ けんばんを描いてできあがり(折りではない)
 *
 * 幾何の要点(折り図のピクセル実測):
 * - ❷の折り線は紙の半分の幅の 1/4。実測 52/390 と 46/390(=0.25 前後)
 * - ❸の折り線は ❶の折り目の交点を結ぶ線そのもの。左の帯にもかかるので、
 *   展開図では帯の分を❷の折り線 x=-3/4 で鏡映して (-1,1/3) まで入れる
 * - ❺の折り線 y=-0.65(折り図❺の破線の実測。原典に目印の指定はない)
 * - 完成形は 1.5 × 1.65 で縦横比 0.91。折り図の完成図の実測は 340/390=0.87
 *
 * 色: 白い面を上にして始める(折り図❶が白)。❷で折り返した裏(灰 #898989、実測)が
 * ぴあのの色になる。`sheetColors` は front=色面 / back=白い裏面 のままにし、
 * 白面スタートは `backSideUp` で面の初期向きを反転して表す。
 *
 * 層: ❷で内へ回った帯が手前、❸の角はその上、❺のけんばんは最後に手前へ来る。
 * どれも一方向に重なるだけなので、残差角の階段(176/174)で足りる。
 * ❺の軸は❷で動いていない (±3/4,-0.65) で取る(紙のふちの (±1,-0.65) を使うと
 * 軸が z 方向に傾く)。
 */

/** ❷の折り線(紙の半分の幅の 1/4 内側) */
const S = 0.75;
/** ❺の折り線(けんばん)。折り図❺の破線の実測 */
const K = -0.65;
/** ❸の折り線が左のふちに届く高さ(帯を開いた展開図での位置) */
const D = 1 / 3;

const V: [number, number][] = [
  [-1, 1], //  0: 左上の角(❸で回る)
  [-S, 1], //  1: ❷の折り線・上(❸で回る)
  [0, 1], //  2: 上のふちの中点(❸の折り線の端。❶の縦の折り目の上)
  [S, 1], //  3: ❷の折り線・上(右)
  [1, 1], //  4: 右上の角
  [-1, D], //  5: ❸の折り線が左のふちと交わる点(帯の分)
  [-1, 0], //  6: 左のふち・中点(❶の横の折り目)
  [-S, 0], //  7: ❸の折り線の端(❷の折り線の上)
  [0, 0], //  8: 中心
  [S, 0], //  9: ❷の折り線・中(右)
  [1, 0], // 10: 右のふち・中点
  [-1, K], // 11: ❺の折り線・左のふち
  [-S, K], // 12: ❺の折り線(❷の折り線の上。❺の軸)
  [0, K], // 13: ❺の折り線・中
  [S, K], // 14: 同・右(❺の軸)
  [1, K], // 15: ❺の折り線・右のふち
  [-1, -1], // 16: 左下の角
  [-S, -1], // 17
  [0, -1], // 18: 下のふちの中点(うらがえしの軸)
  [S, -1], // 19
  [1, -1], // 20: 右下の角
];

const F: number[][] = [
  // 左の帯(❷で内へ折る)
  [5, 0, 1, 7], // ❸の折り線より上
  [5, 7, 6], // ❸の折り線より下
  [6, 7, 12, 11],
  [11, 12, 17, 16],
  // 左の胴
  [1, 2, 7], // ❸で回る角
  [7, 2, 8],
  [7, 8, 13, 12],
  [12, 13, 18, 17],
  // 右の胴
  [2, 3, 9, 8],
  [8, 9, 14, 13],
  [13, 14, 19, 18],
  // 右の帯
  [3, 4, 10, 9],
  [9, 10, 15, 14],
  [14, 15, 20, 19],
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

/** 白い裏面を上にして始める(面の初期向きを反転する) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

/** ❶a の縦の折り目で動く左半分 */
const LEFT_HALF = [0, 1, 5, 6, 7, 11, 12, 16, 17];
/** ❶c の横の折り目で動く下半分 */
const LOWER_HALF = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const ALL = V.map((_, i) => i);

const steps: FoldStep[] = [
  {
    // ❶a たて半分の折り目
    folds: [{ axis: [2, 18], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: 'たて半分に折って、折り目をつけます。',
      en: 'Fold in half vertically to make a crease.',
    },
    caution: {
      ja: '白い面を上にして始めます。折り返した裏の色が、ぴあのの色になります。',
      en: 'Start white side up — the back you fold over becomes the piano.',
    },
  },
  {
    folds: [{ axis: [2, 18], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: 1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❶c よこ半分の折り目
    folds: [{ axis: [6, 10], moving: LOWER_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: 'よこ半分にも折って、折り目をつけます。',
      en: 'Fold in half the other way as well.',
    },
    caution: {
      ja: 'この2本の折り目の端が、次の斜めの折り線の目印になります。',
      en: 'The ends of these two creases mark the diagonal fold that comes next.',
    },
  },
  {
    folds: [{ axis: [6, 10], moving: LOWER_HALF, type: 'unfold', angle: 178, direction: 1 }],
    description: { ja: '開いて戻します。', en: 'Unfold.' },
  },
  {
    // ❷ 左右のふちを内へ(半分の幅の 1/4)
    folds: [
      // 残差角を深めにして帯を胴からはっきり浮かせる。❹でうらがえすと帯は奥へ回るので、
      // ここで差がないと z が拮抗して白い裏面が正面にちらつく
      { axis: [1, 17], moving: [0, 5, 6, 11, 16], type: 'valley', angle: 170 },
      { axis: [3, 19], moving: [4, 10, 15, 20], type: 'valley', angle: 170 },
    ],
    description: {
      ja: '左右のふちを、内がわへ折ります。',
      en: 'Fold the left and right edges inward.',
    },
    caution: {
      ja: '折る幅は、まんなかまでの 4分の1 くらいです。',
      en: 'Fold in about a quarter of the way to the middle.',
    },
  },
  {
    // ❸ 左上の角を、折り目の交点を結ぶ線で折る
    folds: [{ axis: [7, 2], moving: [0, 1], type: 'valley', angle: 174 }],
    description: {
      ja: '左上の角を、左のふちの中点から上のふちの中点への線で折ります。',
      en: 'Fold the top-left corner along the line joining the two crease ends.',
    },
    caution: {
      ja: 'この斜めの辺が、ぴあののふたの傾きになります。',
      en: 'This slanted edge becomes the sloping lid of the piano.',
    },
  },
  {
    // ❹ うらがえす(斜めの辺が右上に来る)
    folds: [{ axis: [2, 18], moving: ALL, type: 'assemble', angle: 180, direction: 1 }],
    description: { ja: 'うらがえします。', en: 'Turn it over.' },
  },
  {
    // ❺ 下を折り上げてけんばんに
    folds: [
      // うしろへ折る。手前へ折ると帯が白い裏面を見せてしまい、折り図❻(全面が紙の色)と合わない
      // 11/15(帯のふち)は折り線の上にあるが、❷で持ち上がった z を持っている。
      // moving に入れると z が反転して正面へ出てしまうので、軸上の紙はしとして除外する
      { axis: [12, 14], moving: [16, 17, 18, 19, 20], type: 'mountain', angle: 174 },
    ],
    description: {
      ja: '下を折り上げて、けんばんにします。けんばんを描いてできあがり。',
      en: 'Fold the bottom up for the keyboard, draw the keys, and it is done.',
    },
  },
];

export const pianoModel: OrigamiModel = {
  id: 'piano',
  name: { ja: 'ぴあの', en: 'Piano' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: backSideUp(F.map(orient)),
  faceSheet: F.map(() => 0),
  // 折り図の紙の色(実測 RGB(137,137,137))。白い裏面を上にして始める
  sheetColors: [{ front: '#898989', back: '#f6f2e8' }],
  steps,
};
