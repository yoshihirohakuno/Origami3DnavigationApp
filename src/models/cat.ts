import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ねこのかお / Cat Face(伝承・新宮文明、全7工程)
 * https://www.origami-club.com/easy/animal-face/cat/zu.html の折り図に忠実な工程。
 *
 *   ❶ 半分に折る → 色の三角(白は内側)
 *   ❷ 縦半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❸ 下の両角を、あご先(下辺の中心)から出る折り線で上へ折り上げて耳(左右で2工程)。
 *      折り線があご先から出るので、折った後のあごはとがったV字になり、
 *      あごから耳先へ向かう斜めの線(フラップの縁)が顔に現れる(完成図と同じ)
 *   ❹ てっぺんの角を手前へ折り下げる
 *   ❺ うらがえして できあがり(完成面は裏側=折り込みが見えない面)
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * 2層+事前折り線分割方式(dog.ts と同系)。
 *
 * 層の重なりの補正(shuriken.ts で確立したパターン):
 * 紙の角(±1,0)と折り返しの縁は上下の層で共有できないため層ごとに複製し、
 * 折った後に下層側を z 補正で手前に出す(実物では外側を回る層が手前に来る)。
 * これで耳・てっぺんの折り返しが表の色で見える。
 */

const V: [number, number][] = [
  [0, 1], //  0: 上の角(てっぺん・上層)
  [1, 0], //  1: 右の角(右耳・上層)
  [0, -1], //  2: 下の角(てっぺんの下層ミラー)
  [-1, 0], //  3: 左の角(左耳・上層)
  [-0.68, -0.32], //  4: 左耳折り線・外側(左下辺上・下層シート側)
  [-0.68, 0.32], //  5: 左耳折り線の上層ミラー(左上辺上)
  [0.68, -0.32], //  6: 右耳折り線・外側(右下辺上・下層シート側)
  [0.68, 0.32], //  7: 右耳折り線の上層ミラー(右上辺上)
  [-0.28, 0.72], //  8: てっぺん折り線・左(左上辺上)
  [0.28, 0.72], //  9: てっぺん折り線・右(右上辺上)
  [-0.28, -0.72], // 10: てっぺん折り線の下層ミラー・左(左下辺上・下層シート側)
  [0.28, -0.72], // 11: てっぺん折り線の下層ミラー・右(右下辺上・下層シート側)
  // ❷の縦折り目(x=0)が辺・折り線と交わる点。
  // 12=中心はあご先であり、両耳の折り線の起点でもある。❺の回転軸は [12,13]
  [0, 0], // 12: 中心(❶の折り線上・あご先)
  [0, 0.72], // 13: てっぺん折り線の中点(上層)
  [0, -0.72], // 14: てっぺん折り線の中点(下層ミラー)
  // 下層側の複製(折り返しで手前に出る側)
  [-1, 0], // 15: 3 の下層複製(左耳の先)
  [1, 0], // 16: 1 の下層複製(右耳の先)
  [-0.68, -0.32], // 17: 4 の複製(左耳フラップの付け根)
  [0.68, -0.32], // 18: 6 の複製(右耳フラップの付け根)
  [-0.28, -0.72], // 19: 10 の複製(てっぺんフラップの付け根・左)
  [0.28, -0.72], // 20: 11 の複製(てっぺんフラップの付け根・右)
];

const F: number[][] = [
  // 上層(❶で動かない側)。❷の縦折り目 x=0 で事前分割
  [12, 13, 8, 5], // 中央・左
  [12, 7, 9, 13], // 中央・右
  [0, 8, 13], // てっぺん・左
  [0, 13, 9], // てっぺん・右
  [3, 12, 5], // 左耳(折り線 12-5 の外側)
  [1, 7, 12], // 右耳
  // 下層(❶で上へ折られる側)。シートの縁は元の頂点、フラップは複製を使う
  [12, 4, 10, 14], // 中央・左
  [14, 11, 6, 12], // 中央・右
  [2, 20, 19], // てっぺんフラップ
  [15, 17, 12], // 左耳フラップ
  [16, 12, 18], // 右耳フラップ
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
const LEFT_HALF = [3, 15, 4, 17, 5, 8, 10, 19];

const steps: FoldStep[] = [
  {
    // ❶ 半分に折る(下半分を裏へ=山折り。表の色が両面に出て、白は内側)
    folds: [
      { axis: [3, 1], moving: [2, 4, 6, 10, 11, 14, 17, 18, 19, 20], type: 'mountain', angle: 177 },
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
    folds: [{ axis: [0, 12], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half sideways to crease the center line.',
    },
  },
  {
    // ❷b 開いて戻す
    folds: [{ axis: [0, 12], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: -1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❸ 左耳(折り線はあご先 12 から左辺の 5 へ)
    folds: [
      { axis: [12, 4], moving: [3, 15], type: 'valley', angle: 165 },
      // 外側を回る下層のフラップを手前に出す(z補正)
      { axis: [12, 4], moving: [15, 17], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
    ],
    description: {
      ja: '左の角を、あご先から出る折り線で上へ折り上げて耳にします。',
      en: 'Fold the left corner up along the crease from the chin to make an ear.',
    },
  },
  {
    // ❸ 右耳
    folds: [
      { axis: [12, 6], moving: [1, 16], type: 'valley', angle: 165 },
      { axis: [12, 6], moving: [16, 18], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
    ],
    description: {
      ja: '右の角も同じように折り上げて、耳にします。',
      en: 'Fold the right corner up the same way for the other ear.',
    },
    caution: {
      ja: '左右の耳をそろえましょう。',
      en: 'Keep both ears symmetrical.',
    },
  },
  {
    // ❹ てっぺんを手前へ折り下げる
    folds: [
      { axis: [8, 9], moving: [0, 2], type: 'valley', angle: 150 },
      { axis: [8, 9], moving: [2, 19, 20], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
    ],
    description: {
      ja: 'てっぺんの角を、耳のあいだで手前に折り下げます。',
      en: 'Fold the top corner down toward you, between the ears.',
    },
  },
  {
    // ❺ うらがえす
    folds: [
      {
        axis: [12, 13],
        moving: V.map((_, i) => i),
        type: 'assemble',
        angle: 180,
        direction: 1,
      },
    ],
    description: {
      ja: 'うらがえしたら、ねこのかお のできあがり。目とひげを描きましょう。',
      en: 'Turn it over — the cat face is done. Draw the eyes and whiskers.',
    },
    caution: {
      ja: '折り込みが見えない、きれいな面が顔になります。',
      en: 'The clean side without the flaps becomes the face.',
    },
  },
];

export const catModel: OrigamiModel = {
  id: 'cat',
  name: { ja: 'ねこのかお', en: 'Cat Face' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  steps,
};
