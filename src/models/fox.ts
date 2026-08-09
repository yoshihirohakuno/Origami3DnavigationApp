import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * きつねのかお / Fox Face(全6工程)
 * https://www.origami-club.com/easy/animal-face/fox/zu.html の折り図に忠実な工程。
 *
 *   ❶ 半分に折る → 色の三角(白は内側)
 *   ❷ 縦半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❸ てっぺんの角を手前へ折り下げる(先が下のふちから少しはみ出して鼻先になる)
 *   ❹ 左右の角を同時に上へ折り上げて、とがった耳にする
 *   ❺ うらがえして できあがり(完成面は裏側=折り込みが見えない面)
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * ねこ(cat.ts)と同じ 2層+事前折り線分割+層ごとの頂点複製+z補正 の方式。
 *
 * 幾何の要点(2026-08-09 に折り図を実測して修正):
 * - 鼻先の折り線は **y=NOSE=0.5**。てっぺん (0,1) を折り下げると先端がちょうど
 *   下のふちの中央 (0,0) に来る(折り図の実測 h=0.485。先が下のふちに届くのが目印)。
 *   旧版は y=0.4 で先が (0,-0.2) まではみ出していた
 * - 鼻先フラップの縁は (0,0)→(±0.5,0.5) の45°。**耳の折り線はこの縁と平行で
 *   D=0.04 だけ外側**((±D,0)→(±(1+D)/2,(1−D)/2)=(±0.52,0.48))。折り図でも
 *   破線はフラップの縁のすぐ外(実測 0.037)に引かれている。フラップと交差しないので
 *   3層折りにならない
 * - 折った耳の先は (±D,1−D)=(±0.04,0.96) に立ち、耳のあいだに幅 2D の切れこみが
 *   できる。完成形は幅1.04×高さ0.96=ほぼ正方形のひし形(折り図の実測 1.06:1)。
 *   旧版は 1.46:1 の横長で、耳も小さく寝ていた
 * - 折った耳はフラップの上に重なるので、z補正でフラップ(〜0.07)より上(0.08〜0.12)へ
 */

const NOSE = 0.5; // 鼻先の折り線の y(先が下のふちの中央に届く)
const NX = 1 - NOSE; // 0.5 折り線がふちと交わる x
const D = 0.04; // 耳の折り線を鼻先フラップの縁より外へずらす量
const EX = (1 + D) / 2; // 0.52 耳の折り線の外端 x(斜辺上)
const EY = (1 - D) / 2; // 0.48 同 y

const V: [number, number][] = [
  [0, 1], //  0: 上の角(てっぺん→鼻先・上層)
  [1, 0], //  1: 右の角(右耳・上層)
  [0, -1], //  2: 下の角(てっぺんの下層ミラー)
  [-1, 0], //  3: 左の角(左耳・上層)
  [0, 0], //  4: 中心(❶の折り線上。❺うらがえすの回転軸)
  [0, NOSE], //  5: 鼻先折り線の中点(上層・x=0)
  [0, -NOSE], //  6: 鼻先折り線の中点(下層ミラー)
  [-NX, NOSE], //  7: 鼻先折り線・左(左上辺上)
  [NX, NOSE], //  8: 鼻先折り線・右(右上辺上)
  [-NX, -NOSE], //  9: 鼻先折り線の下層ミラー・左(左下辺上・下層シート側)
  [NX, -NOSE], // 10: 鼻先折り線の下層ミラー・右(右下辺上・下層シート側)
  [-D, 0], // 11: 左耳折り線・内側(❶の折り線上)
  [D, 0], // 12: 右耳折り線・内側(❶の折り線上)
  [-EX, EY], // 13: 左耳折り線・外側(左上辺上)
  [EX, EY], // 14: 右耳折り線・外側(右上辺上)
  [-EX, -EY], // 15: 左耳折り線の下層ミラー(左下辺上・下層シート側)
  [EX, -EY], // 16: 右耳折り線の下層ミラー(右下辺上・下層シート側)
  // 下層側の複製(折り返しで手前に出る側)
  [-1, 0], // 17: 3 の下層複製(左耳の先)
  [1, 0], // 18: 1 の下層複製(右耳の先)
  [-EX, -EY], // 19: 15 の複製(左耳フラップの付け根)
  [EX, -EY], // 20: 16 の複製(右耳フラップの付け根)
  [-NX, -NOSE], // 21: 9 の複製(鼻先フラップの付け根・左)
  [NX, -NOSE], // 22: 10 の複製(鼻先フラップの付け根・右)
];

const F: number[][] = [
  // 上層(❶で動かない側)。❷の縦折り目 x=0 で事前分割
  [0, 7, 5], // てっぺん・左
  [0, 5, 8], // てっぺん・右
  [3, 11, 13], // 左耳
  [1, 14, 12], // 右耳
  [11, 4, 5, 7, 13], // 中央・左
  [12, 14, 8, 5, 4], // 中央・右
  // 下層(❶で上へ折られる側)。シートの縁は元の頂点、フラップは複製を使う
  [2, 21, 6], // 鼻先フラップ・左
  [2, 6, 22], // 鼻先フラップ・右
  [17, 11, 19], // 左耳フラップ
  [18, 20, 12], // 右耳フラップ
  [11, 4, 6, 9, 15], // 中央・左
  [12, 16, 10, 6, 4], // 中央・右
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
const LEFT_HALF = [3, 17, 7, 9, 21, 11, 13, 15, 19];

const steps: FoldStep[] = [
  {
    // ❶ 半分に折る(下半分を裏へ=山折り。表の色が両面に出て、白は内側)
    folds: [
      {
        axis: [3, 1],
        moving: [2, 6, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22],
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
    folds: [{ axis: [0, 4], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: 1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❸ てっぺんを手前へ折り下げて鼻先に
    folds: [
      { axis: [7, 8], moving: [0, 2], type: 'valley', angle: 174 },
      // 外側を回る下層のフラップを手前に出す(z補正)
      { axis: [7, 8], moving: [2, 21, 22], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
    ],
    description: {
      ja: 'てっぺんの角を手前に折り下げます。先が下のふちから少しはみ出して、鼻先になります。',
      en: 'Fold the top corner down toward you — the tip pokes past the bottom edge as the snout.',
    },
  },
  {
    // ❹ 両耳を同時に折り上げる
    folds: [
      { axis: [11, 13], moving: [3, 17], type: 'valley', angle: 165 },
      { axis: [12, 14], moving: [1, 18], type: 'valley', angle: 165 },
      // 耳は鼻先フラップの上に重なるので、フラップより手前へ持ち上げる。
      // 表を向く下層側(17/18・19/20)はさらにその上へ
      { axis: [11, 13], moving: [3], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.08] },
      { axis: [12, 14], moving: [1], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.08] },
      { axis: [11, 13], moving: [17, 19], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.12] },
      { axis: [12, 14], moving: [18, 20], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.12] },
    ],
    description: {
      ja: '左右の角を、同時に上へ折り上げて、とがった耳にします。',
      en: 'Fold both side corners up at the same time into pointed ears.',
    },
    caution: {
      ja: '耳の先は内側に少しかたむきます。',
      en: 'The ear tips lean slightly inward.',
    },
  },
  {
    // ❺ うらがえす
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
      ja: 'うらがえしたら、きつねのかお のできあがり。目と鼻を描きましょう。',
      en: 'Turn it over — the fox face is done. Draw the eyes and nose.',
    },
    caution: {
      ja: '折り込みが見えない、きれいな面が顔になります。',
      en: 'The clean side without the flaps becomes the face.',
    },
  },
];

export const foxModel: OrigamiModel = {
  id: 'fox',
  name: { ja: 'きつねのかお', en: 'Fox Face' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  steps,
};
