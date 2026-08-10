import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ひよこ / Chick(全7工程)
 * https://www.origami-club.com/easy/animal/chick/zu.html の折り図に忠実。
 * 原典のない独自設計だった「ことり」の差し替えとして追加(2026-08-09)。
 *
 *   ❶ たてよこ半分に折り目をつけて戻す(アプリでは縦の折り目のみ2工程。
 *      横の折り目は❹の折り線そのものなので省略)
 *   ❷ 左の角を、中心までの 1/3 の縦線で内へ折る(図の「1/3」の指定)
 *   ❸ そのフラップを縦線で外へ折り返す → くちばし
 *   ❹ はんぶんに おる(上半分を手前へ) → 横長の三角の体。裏の黄が出る
 *   ❺ 下の先をうちがわに折る(前後2枚) → 尾のあたりがたいらになる
 *   ❻ むきをかえる(面内回転 -14°。折り図❼のできあがりの傾きの実測)
 *   ❼ 目を描いてできあがり(折りではない)
 *
 * 幾何の要点(折り図の実測。パネル❸❺を紙の座標系に換算した):
 * - 展開図はひし形の正方形: 上(0,1) 右(1,0) 下(0,-1) 左(-1,0)
 * - ❷の折り線は **x=CA=-2/3**(左の角から中心までの 1/3 の位置)。左の角 (-1,0) は
 *   ちょうど **(-1/3,0)** に来る(パネル❸の実測: 折り線 -0.667、角の先 -0.333)
 * - ❸の折り線は折り後の x=-7/12。展開図に戻すと **x=CB=-3/4**(❷の折り線で鏡映)。
 *   折り返すとくちばしの先が **x=-5/6** に出る(パネル❸の実測 -0.83、
 *   パネル❺でも体の左のふち(-2/3)より 1/6 外に出ているのを確認)
 * - ❹は横の中線 y=0 で上半分を手前へ。折り図❺の体は「上のふちが水平な横長の三角」
 * - ❺の折り線は (-0.14,-0.86)-(0.24,-0.76)(実測)。どちらもひし形の下の辺の上に
 *   ちょうど乗る(左は y=-x-1、右は y=x-1)。下の角 (0,-1) だけが線より外側なので、
 *   前後2枚の角(0 と 8)を1本の折りでまとめてうしろへ回せる
 *
 * 色: 白い面を上にして始め、❹で折り返した面(裏=黄)が体の色になる
 * (折り図も❸までは白く、❹から黄色くなる)。
 *
 * 層: ❹で手前へ回る上半分が常に手前に来るので、z 補正は不要
 * (谷折りの残差角でそのまま層順ができる)。くちばしのプリーツは
 * ❷❸で左端だけが動くので、動く頂点は ❷が [2,4,5,9]、❸が [2] だけ。
 */

const CA = -2 / 3; // ❷の折り線(展開図)
const CB = -0.75; // ❸の折り線(展開図)。折り後は x=-7/12
const CAY = 1 + CA; // 1/3 ❷の折り線がひし形のふちと交わる y
const CBY = 1 + CB; // 0.25 ❸の折り線が交わる y
// ❺の折り線(下の層)。左はふち y=-x-1、右はふち y=x-1 の上
const T1X = -0.14;
const T2X = 0.24;

const V: [number, number][] = [
  [0, 1], //  0: 上の角(❹で下へ回り、❺でうしろへ)
  [1, 0], //  1: 右の角(尾のほう)
  [-1, 0], //  2: 左の角 → くちばしの先(❶の折り線上なので両層で共有)
  [0, 0], //  3: 中心(❶の縦折り・❹の横折りの軸)
  [CB, CBY], //  4: ❸の折り線・上端(左上辺上)
  [CB, 0], //  5: ❸の折り線・中(y=0 上。両層で共有)
  [CA, CAY], //  6: ❷の折り線・上端(左上辺上)
  [CA, 0], //  7: ❷の折り線・中(共有)
  [0, -1], //  8: 下の角(❺でうしろへ)
  [CB, -CBY], //  9: ❸の折り線・下端(左下辺上)
  [CA, -CAY], // 10: ❷の折り線・下端(左下辺上)
  [T1X, -T1X - 1], // 11: ❺の折り線・左(下の層。下の辺 y=-x-1 上)
  [T2X, T2X - 1], // 12: ❺の折り線・右(下の層。下の辺 y=x-1 上)
  [T1X, 1 + T1X], // 13: ❺の折り線・左(上の層。上の辺 y=x+1 上)
  [T2X, 1 - T2X], // 14: ❺の折り線・右(上の層。上の辺 y=-x+1 上)
];

const F: number[][] = [
  // 上半分(❹で手前へ回る=完成形で手前。裏の黄が見える)
  [2, 4, 5], // くちばしの外側(❸で折り返す部分)
  [5, 4, 6, 7], // プリーツの中(❷と❸の折り線のあいだ)
  [13, 0, 14], // 体の下の先(❺でうしろへ)
  [7, 6, 13, 14, 1], // 体
  // 下半分(❹で動かない側)
  [2, 5, 9], // くちばしの外側
  [5, 9, 10, 7], // プリーツの中
  [11, 8, 12], // 体の下の先(❺でうしろへ)
  [7, 10, 11, 12, 1], // 体
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

// ❶の縦折りで動く左半分(x<0)
const LEFT_HALF = [2, 4, 5, 6, 7, 9, 10, 11, 13];
// ❹で手前へ回る上半分(y>0)
const UPPER = [0, 4, 6, 13, 14];

const steps: FoldStep[] = [
  {
    // ❶a 縦半分に折り目(❷の「1/3」を測る目印になる)
    folds: [{ axis: [0, 8], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half to crease the center line.',
    },
    caution: {
      ja: '白い面を上にして始めます。あとで折り返す裏の色が、ひよこの体になります。',
      en: 'Start white side up — the back you fold over becomes the chick’s body.',
    },
  },
  {
    // ❶b 開いて戻す(❶a の自動符号が -1 なので戻しは +1)
    folds: [{ axis: [0, 8], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: 1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❷ 左の角を 1/3 の縦線で内へ。角はちょうど中心までの 1/3 の位置に来る
    folds: [{ axis: [6, 10], moving: [2, 4, 5, 9], type: 'valley', angle: 176 }],
    description: {
      ja: '左の角を、まんなかまでの 3分の1 のところで内へ折ります。',
      en: 'Fold the left corner in, one third of the way to the center.',
    },
    caution: {
      ja: '角の先が、まんなかまでの 3分の1 の位置にぴったり来ます。',
      en: 'The corner lands exactly one third of the way to the center.',
    },
  },
  {
    // ❸ フラップを折り返してくちばしに(先は x=-5/6 まで出る)
    folds: [{ axis: [4, 9], moving: [2], type: 'valley', angle: 176 }],
    description: {
      ja: '折った先を、外へ折り返してくちばしにします。',
      en: 'Fold the tip back out to make the beak.',
    },
    caution: {
      ja: '先が体のふちより外へ、少しだけ出ます。',
      en: 'The tip pokes just past the edge of the body.',
    },
  },
  {
    // ❹ はんぶんに おる(上半分を手前へ)。裏の色が出て体になる
    folds: [{ axis: [3, 1], moving: UPPER, type: 'valley', angle: 177 }],
    description: {
      ja: '上半分を手前へ、はんぶんに折ります。',
      en: 'Fold the top half toward you, in half.',
    },
    caution: {
      ja: '裏の色が出て体になり、くちばしは左に残ります。',
      en: 'The back color becomes the body, and the beak stays at the left.',
    },
  },
  {
    // ❺ 下の先をうちがわに(前後2枚まとめて)。線より外は角の1頂点だけ
    folds: [{ axis: [11, 12], moving: [0, 8], type: 'mountain', angle: 172 }],
    description: {
      ja: '下の先を、うちがわに折ります。',
      en: 'Fold the bottom point inside.',
    },
    caution: {
      ja: '前後2枚を一緒に折ります。ここが尾のあたりになります。',
      en: 'Fold both layers together — this becomes the tail end.',
    },
  },
  {
    // ❻ むきをかえる(面内回転。折りではないので新しい折り線はない)
    folds: [
      {
        axis: [3, 1],
        moving: V.map((_, i) => i),
        type: 'assemble',
        angle: 0,
        direction: 1,
        spinZ: -14,
      },
    ],
    description: {
      ja: 'むきをかえます。目を描いて、ひよこのできあがり。',
      en: 'Turn it to this angle. Draw the eye and the chick is done.',
    },
    caution: {
      ja: 'くちばしが上を向いて、ひよこらしくなります。',
      en: 'With the beak tilted up it reads as a chick.',
    },
  },
];

export const chickModel: OrigamiModel = {
  id: 'chick',
  name: { ja: 'ひよこ', en: 'Chick' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 白い面を上にして始め、折り返した裏(黄)が体の色になる
  sheetColors: [{ front: '#f6f2e8', back: '#e8b93c' }],
  steps,
};
