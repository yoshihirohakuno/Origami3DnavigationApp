import type { FoldStep, OrigamiModel } from '../engine/types';
import { withRigidFolds } from '../engine/rigidFolds';

/**
 * くまのかお / Bear Face — 全9工程。
 * 原典 https://www.origami-club.com/easy/animal-face/bear/zu.html
 * 半分折り→中央の折り目→左右を交差→折り返して耳→耳先→裏返し→口→あご。
 * 2026-09-06: あごの折り線を y=-0.804 に戻し、白い口の下半分を復元。
 * 旧評価は白いあごを外接範囲から除いてしまい、誤って y=-0.647 に切り詰めていた。
 * 口の折り線 y=-0.647、口先の折り返し y=-0.4705 は維持する。
 * 完成形の白い六角形全体を原典と比較する。層順は withRigidFolds で管理する。
 */

const V: [number, number][] = [
  [-1, 0], //  0: 左の角(❸で中心を越え、❹で左耳の先に)
  [1, 0], //  1: 右の角
  [0, -1], //  2: 下の角(❽で後ろへ)
  [0, 1], //  3: 上の角(❶で奥へ回り、❼でマズルに)
  [0, 0], //  4: 中心(❷の軸)
  // ❸の折り線
  [-0.296, 0], //  5: ❸左・上端(❶の折り線上。両層で共有)
  [0.296, 0], //  6: ❸右・上端
  [-0.435, -0.565], //  7: ❸左・下端(左下辺上)
  [0.435, -0.565], //  8: ❸右・下端
  [-0.435, 0.565], //  9: ❸左の上層ミラー(左上辺上)
  [0.435, 0.565], // 10: ❸右の上層ミラー
  // ❹の折り線(展開図に戻した位置)
  [-0.4929, 0], // 11: ❹左・上端(共有)
  [0.4929, 0], // 12: ❹右・上端
  [-0.5842, -0.416], // 13: ❹左・下端(左下辺上)
  [0.5842, -0.416], // 14: ❹右・下端
  [-0.5842, 0.416], // 15: ❹左の上層ミラー
  [0.5842, 0.416], // 16: ❹右の上層ミラー
  // ❺の折り線(展開図に戻した位置)
  [-0.8732, 0], // 17: ❺左・上端(共有)
  [0.8732, 0], // 18: ❺右・上端
  [-0.896, -0.1042], // 19: ❺左・下端(左下辺上)
  [0.896, -0.1042], // 20: ❺右・下端
  [-0.896, 0.1042], // 21: ❺左の上層ミラー
  [0.896, 0.1042], // 22: ❺右の上層ミラー
  // ❼の折り線(上層。折り上げてマズルになる)
  [-0.353, 0.647], // 23
  [0.353, 0.647], // 24
  [0, 0.647], // 25: 中点(❷の縦分割用)
  // ❽のマズル側の折り線(上層)
  [-0.1765, 0.8235], // 26
  [0.1765, 0.8235], // 27
  [0, 0.8235], // 28: 中点
  // ❽のあご側の折り線(手前の層)。マズルの折り線(❼)と同じ高さ=y=-0.647 の
  // 鏡映。ここで折ると下のふちがマズルの下端にそろい、マズルの白が完成形の
  // 一番下まで届く(折り図の完成図・❽の図と同じ)
  [-0.196, -0.804], // 29
  [0.196, -0.804], // 30
  [0, -0.804], // 31: 中点
];

const F: number[][] = [
  // 手前の層(❶で動かない下半分)
  [0, 17, 19], // 左耳の先(❺で折る)
  [17, 11, 13, 19], // 左耳(❺と❹のあいだ)
  [11, 5, 7, 13], // 左のフラップ(❹と❸のあいだ)
  [1, 20, 18], // 右耳の先
  [18, 20, 14, 12], // 右耳
  [12, 14, 8, 6], // 右のフラップ
  [5, 4, 31, 29, 7], // 中央・左
  [4, 6, 8, 30, 31], // 中央・右
  [29, 2, 31], // あご先・左
  [31, 2, 30], // あご先・右
  // 奥の層(❶で奥へ回る上半分)
  [0, 21, 17], // 左耳の先
  [17, 21, 15, 11], // 左耳
  [11, 15, 9, 5], // 左のフラップ
  [1, 18, 22], // 右耳の先
  [18, 12, 16, 22], // 右耳
  [12, 6, 10, 16], // 右のフラップ
  [5, 9, 23, 25, 4], // 中央・左
  [4, 25, 24, 10, 6], // 中央・右
  [23, 26, 28, 25], // マズルの帯・左
  [25, 28, 27, 24], // マズルの帯・右
  [26, 3, 28], // マズルの先・左
  [28, 3, 27], // マズルの先・右
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

// ❶で動く上半分
const UPPER = [3, 9, 10, 15, 16, 21, 22, 23, 24, 25, 26, 27, 28];
// ❷の縦折りで動く左半分
const LEFT_HALF = [0, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 26, 29];

const steps: FoldStep[] = [
  {
    // ❶ 半分に折る(上半分を奥へ=山折り。動かない下半分が常に表を向く)
    folds: [{ axis: [0, 1], moving: UPPER, type: 'mountain', angle: 177 }],
    description: {
      ja: '半分に折って、下向きの三角にします。',
      en: 'Fold in half into a downward triangle.',
    },
    caution: {
      ja: '折り線が上、角が下になります。',
      en: 'The fold is at the top, the point at the bottom.',
    },
  },
  {
    // ❷a 縦半分に折り目(軸は❶で動いていない 4・2)
    folds: [{ axis: [4, 2], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half sideways to crease the center line.',
    },
  },
  {
    // ❷b 開いて戻す
    folds: [{ axis: [4, 2], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: 1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❸ 左右の角を、ほぼ縦の折り線で内へ折る。角は中心を越えて反対側まで回る。
    // ❶の折り線上の頂点(0/1/11/12/17/18)は両層で共有なので、手前層の折りにだけ含める
    folds: [
      { axis: [5, 7], moving: [0, 11, 13, 17, 19], type: 'valley', angle: 174 },
      { axis: [6, 8], moving: [1, 12, 14, 18, 20], type: 'valley', angle: 174 },
      { axis: [5, 9], moving: [15, 21], type: 'valley', angle: 168 },
      { axis: [6, 10], moving: [16, 22], type: 'valley', angle: 168 },
    ],
    description: {
      ja: '左右の角を、たてに近い折り線で内へ折ります。',
      en: 'Fold both corners inward along the near-vertical creases.',
    },
    caution: {
      ja: '角はまんなかを越えて、反対側まで届きます。',
      en: 'Each corner reaches past the middle to the far side.',
    },
  },
  {
    // ❹ 交差した先を外へ折り返して、大きな三角の耳にする
    folds: [
      { axis: [11, 13], moving: [0, 17, 19], type: 'valley', angle: 174 },
      { axis: [12, 14], moving: [1, 18, 20], type: 'valley', angle: 174 },
      { axis: [11, 15], moving: [21], type: 'valley', angle: 168 },
      { axis: [12, 16], moving: [22], type: 'valley', angle: 168 },
    ],
    description: {
      ja: 'まんなかで交差した先を、外へ折り返して耳にします。',
      en: 'Fold the crossed points back outward into the ears.',
    },
    caution: {
      ja: '耳が顔の外へ大きく張り出します。',
      en: 'The ears stick out well past the head.',
    },
  },
  {
    // ❺ 耳の先を内へ折って、まるくする
    folds: [
      { axis: [17, 19], moving: [0], type: 'valley', angle: 172 },
      { axis: [18, 20], moving: [1], type: 'valley', angle: 172 },
    ],
    description: {
      ja: '耳の先を内へ折って、まるい耳にします。',
      en: 'Fold the ear tips in to round them off.',
    },
  },
  {
    // ❻ うらがえす(軸は動いていない 4・2 を通る縦線)
    folds: [
      { axis: [4, 2], moving: V.map((_, i) => i), type: 'assemble', angle: 180, direction: 1 },
    ],
    description: {
      ja: 'うらがえします。折り込みが見えない面が顔になります。',
      en: 'Turn it over — the clean side becomes the face.',
    },
  },
  {
    // ❼ 下の先を折り上げてマズルにする(裏の生成りが出る)
    folds: [{ axis: [23, 24], moving: [3, 26, 27, 28], type: 'valley', angle: 172 }],
    description: {
      ja: '下の先を折り上げます。裏の色が出て、マズルになります。',
      en: 'Fold the bottom point up — the light side shows as the muzzle.',
    },
  },
  {
    // ❽ マズルの先と、残ったあごの先を後ろへ折る
    folds: [
      { axis: [26, 27], moving: [3], type: 'mountain', angle: 172 },
      { axis: [29, 30], moving: [2], type: 'mountain', angle: 172 },
    ],
    description: {
      ja: 'マズルの先と、残った下の先を後ろへ折って、あごをたいらにします。',
      en: 'Fold the muzzle tip and the remaining bottom point behind, flattening the chin.',
    },
    caution: {
      ja: 'くまのかお のできあがり。目と鼻を描きましょう。',
      en: 'The bear face is done. Draw the eyes and nose.',
    },
  },
];

const source: OrigamiModel = {
  id: 'bear',
  name: { ja: 'くまのかお', en: 'Bear Face' },
  difficulty: 3,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 顔=紙の表(茶)、マズル=裏(生成り)
  sheetColors: [{ front: '#a9713f', back: '#f2ede3' }],
  steps,
};

export const bearModel = withRigidFolds(source);
