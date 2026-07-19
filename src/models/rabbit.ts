import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * うさぎのかお / Rabbit Face(全7工程)
 * https://www.origami-club.com/easy/animal-face/rabbit/zu.html を基準にした顔。
 *
 *   ❶ 半分に折る → 色の三角(白は内側)
 *   ❷ 縦半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❸ 左右の角を、あご先からまんなかへ向けて急角度で折り上げ、長い耳にする(同時)
 *   ❹ うらがえす
 *   ❺ てっぺんの角を後ろへ折り、頭の上をたいらにする
 *
 * 原典の折り図は「下端の帯を折ってから角を折り上げる」(耳の内側に白いすじが
 * 出る)が、帯と耳の折り線が交差すると3層折りになりエンジン表現が複雑になる
 * ため、帯は省略した(耳の長さ・頭頂の後ろ折り・とがったあごは原典どおり)。
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * ねこ(cat.ts)と同じ 2層+事前折り線分割+層ごとの頂点複製+z補正 の方式。
 *
 * 幾何の要点:
 * - 耳の折り線はあご先(0,0)から140°方向(斜辺上の ∓0.544,0.456 まで)。
 *   角(∓1,0)を折ると耳先は (±0.174,0.985) に来る=まっすぐ上に立つ長い耳
 * - てっぺんの折り線は y=0.55(斜辺上の ∓0.45,0.55)。頭を低めにして耳を長く見せる。うらがえした後に
 *   後ろへ折るので、完成面にフラップが見えない
 */

const V: [number, number][] = [
  [0, 1], //  0: 上の角(てっぺん・上層)
  [1, 0], //  1: 右の角(右耳・上層)
  [0, -1], //  2: 下の角(てっぺんの下層ミラー)
  [-1, 0], //  3: 左の角(左耳・上層)
  [0, 0], //  4: 中心(❶の折り線上・あご先。❹うらがえすの回転軸)
  [0, 0.55], //  5: てっぺん折り線の中点(上層・x=0)
  [0, -0.55], //  6: てっぺん折り線の中点(下層ミラー)
  [-0.45, 0.55], //  7: てっぺん折り線・左(左上辺上)
  [0.45, 0.55], //  8: てっぺん折り線・右(右上辺上)
  [-0.45, -0.55], //  9: てっぺん折り線の下層ミラー・左(左下辺上・下層シート側)
  [0.45, -0.55], // 10: てっぺん折り線の下層ミラー・右(右下辺上・下層シート側)
  [-0.544, 0.456], // 11: 左耳折り線・外側(左上辺上)
  [0.544, 0.456], // 12: 右耳折り線・外側(右上辺上)
  [-0.544, -0.456], // 13: 左耳折り線の下層ミラー(左下辺上・下層シート側)
  [0.544, -0.456], // 14: 右耳折り線の下層ミラー(右下辺上・下層シート側)
  // 下層側の複製(折り返しで手前に出る側)
  [-1, 0], // 15: 3 の下層複製(左耳の先)
  [1, 0], // 16: 1 の下層複製(右耳の先)
  [-0.544, -0.456], // 17: 13 の複製(左耳フラップの付け根)
  [0.544, -0.456], // 18: 14 の複製(右耳フラップの付け根)
  [-0.45, -0.55], // 19: 9 の複製(てっぺんフラップの付け根・左)
  [0.45, -0.55], // 20: 10 の複製(てっぺんフラップの付け根・右)
];

const F: number[][] = [
  // 上層(❶で動かない側)。❷の縦折り目 x=0 で事前分割
  [0, 7, 5], // てっぺん・左
  [0, 5, 8], // てっぺん・右
  [3, 4, 11], // 左耳
  [1, 12, 4], // 右耳
  [4, 11, 7, 5], // 中央・左
  [4, 5, 8, 12], // 中央・右
  // 下層(❶で上へ折られる側)。シートの縁は元の頂点、フラップは複製を使う
  [2, 19, 20], // てっぺんフラップ
  [15, 4, 17], // 左耳フラップ
  [16, 18, 4], // 右耳フラップ
  [4, 13, 9, 6], // 中央・左
  [4, 6, 10, 14], // 中央・右
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

// ❷の縦折りで動く左半分(上層+下層+複製)
const LEFT_HALF = [3, 15, 7, 9, 19, 11, 13, 17];

const steps: FoldStep[] = [
  {
    // ❶ 半分に折る(下半分を裏へ=山折り。表の色が両面に出て、白は内側)
    folds: [
      {
        axis: [3, 1],
        moving: [2, 6, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20],
        type: 'mountain',
        angle: 177,
      },
    ],
    description: {
      ja: '半分に折って、色の三角にします。',
      en: 'Fold in half into a colored triangle.',
    },
    caution: {
      ja: '白い面が内側にかくれます。',
      en: 'The white side hides inside.',
    },
  },
  {
    // ❷a 縦半分に折り目
    folds: [{ axis: [0, 4], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half sideways to crease the center line.',
    },
  },
  {
    // ❷b 開いて戻す
    folds: [{ axis: [0, 4], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: -1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❸ 両耳を同時に、あご先からまんなかへ向けて折り上げる
    folds: [
      { axis: [4, 11], moving: [3, 15], type: 'valley', angle: 168 },
      { axis: [4, 12], moving: [1, 16], type: 'valley', angle: 168 },
      // 表を向く下層側を手前に出す(z補正)
      { axis: [4, 11], moving: [15, 17], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
      { axis: [4, 12], moving: [16, 18], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
    ],
    description: {
      ja: '左右の角を、あご先からまんなかへ向けて折り上げ、長い耳にします。',
      en: 'Fold both corners up toward the middle from the chin — the long ears.',
    },
    caution: {
      ja: '耳がまっすぐ上に立つように、急な角度で折ります。',
      en: 'Fold steeply so the ears stand straight up.',
    },
  },
  {
    // ❹ うらがえす
    folds: [
      {
        axis: [4, 5],
        moving: V.map((_, i) => i),
        type: 'assemble',
        angle: 180,
        direction: 1,
      },
    ],
    description: {
      ja: 'うらがえします。折り込みが見えない、きれいな面が顔になります。',
      en: 'Turn it over — the clean side becomes the face.',
    },
  },
  {
    // ❺ てっぺんを後ろへ折って頭の上をたいらに
    folds: [{ axis: [7, 8], moving: [0, 2], type: 'mountain', angle: 172 }],
    description: {
      ja: '耳のあいだのてっぺんの角を後ろへ折って、頭の上をたいらにします。',
      en: 'Fold the top corner between the ears behind, flattening the head.',
    },
    caution: {
      ja: 'うさぎのかお のできあがり。目と鼻を描きましょう。',
      en: 'The rabbit face is done. Draw the eyes and nose.',
    },
  },
];

export const rabbitModel: OrigamiModel = {
  id: 'rabbit',
  name: { ja: 'うさぎのかお', en: 'Rabbit Face' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  steps,
};
