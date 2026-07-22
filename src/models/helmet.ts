import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * 兜 / Samurai Helmet(全4工程)
 * https://www.origami-club.com/fun/kabuto/zu.html を基準にした伝承の兜。
 *
 *   ❶ まんなかで半分に折る → 三角
 *   ❷ 左右の角を中央へ折り下げる(同時) → ひし形
 *   ❸ 手前の2枚の先を斜め上外へ折り上げる(同時) → 左右のつの(くわがた)
 *   ❹ 手前の1枚の下の先を上へ折る → 前立ての帯
 *
 * 原典は❸❹でつのを2段階に折り、❺❻❼で帯を2回折って残りを中へ押し込む(全7工程)。
 * ここでは つのを1回の折りにまとめ、帯も1回にして4工程へ簡略化した(層が深くなる
 * ほど重なり順の破綻が出やすいため)。兜の見た目の要=左右のつのと前立ては再現している。
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 *
 * 幾何の要点:
 * - ❷の折り線は中心(0,0)から角の二等分線方向。左は y=x 上の (0,0)-(-0.5,-0.5) で、
 *   左の角(-1,0)はちょうど下の角(0,-1)へ重なる(厳密に一致)
 * - ❸のつのの折り線は「折った後の位置」から逆算して展開図に埋め込む。
 *   目標: 折り後の先端 (0,-1) を (-0.5,-0.3) へ跳ね上げる。その垂直二等分線は
 *   折り後の座標で (0,-0.471)-(-0.308,-0.692)。これを❷の折り線 y=x で鏡映して
 *   展開図に戻すと (-0.471,0)-(-0.692,-0.308) になる(頂点 10-9)
 * - 手前の1枚だけを折るため、L/R は層ごとに頂点を複製する(3/1 が手前、16/17 が奥)。
 *   複製しないと、つのを折るときに奥の層まで一緒に動いてしまう
 */

const V: [number, number][] = [
  [0, 1], //  0: 上の角(❶で奥へ回り、奥の層の下の先になる)
  [1, 0], //  1: 右の角(手前層。❷で中央へ、❸でつのに)
  [0, -1], //  2: 下の角(手前層。❹で帯に)
  [-1, 0], //  3: 左の角(手前層。❷で中央へ、❸でつのに)
  [0, 0], //  4: 中心(❷の折り線の起点)
  [-0.5, -0.5], //  5: ❷左の折り線・下端(左下辺上)
  [0.5, -0.5], //  6: ❷右の折り線・下端(右下辺上)
  [-0.5, 0.5], //  7: ❷左の折り線の上層ミラー(左上辺上)
  [0.5, 0.5], //  8: ❷右の折り線の上層ミラー(右上辺上)
  [-0.692, -0.308], //  9: 左つの折り線・外端(左下辺上)
  [-0.471, 0], // 10: 左つの折り線・内端(中央線 y=0 上)
  [0.692, -0.308], // 11: 右つの折り線・外端(右下辺上)
  [0.471, 0], // 12: 右つの折り線・内端
  [-0.3, -0.7], // 13: 帯の折り線・左(左下辺上)
  [0.3, -0.7], // 14: 帯の折り線・右(右下辺上)
  [0, -0.7], // 15: 帯の折り線の中点(x=0)
  // 16/17: 3/1 の奥層複製。❸で手前の1枚だけ折るために層を分ける
  [-1, 0], // 16: 3 の奥層複製
  [1, 0], // 17: 1 の奥層複製
];

const F: number[][] = [
  // 手前の層(❶で動かない下半分)。❷の折り線・つの線・帯線で分割
  [3, 9, 10], // 左つの
  [10, 4, 5, 9], // 左フラップの本体
  [4, 5, 13, 14, 6], // 中央(帯より上)
  [2, 14, 13], // 帯(下の先)
  [12, 11, 6, 4], // 右フラップの本体
  [1, 12, 11], // 右つの
  // 奥の層(❶で奥へ回る上半分)。❷の折り線のミラーで分割
  [16, 7, 4], // 左
  [4, 7, 0, 8], // 中央
  [17, 4, 8], // 右
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

const steps: FoldStep[] = [
  {
    // ❶ 半分に折る(上半分を奥へ=山折り。表の色が前面に残る)
    folds: [{ axis: [3, 1], moving: [0, 7, 8], type: 'mountain', angle: 177 }],
    description: {
      ja: 'まんなかで半分に折って、三角にします。',
      en: 'Fold in half down the middle into a triangle.',
    },
    caution: {
      ja: '色の面が外側になります。',
      en: 'The colored side stays on the outside.',
    },
  },
  {
    // ❷ 左右の角を中央へ折り下げる(2枚重ねて折る=奥層の複製も一緒に動かす)
    // 山折り(奥へ)にして、動かない中央が常に表を向くようにする。谷折りだと
    // 折った左右のフラップが裏返り、ひし形の全面が裏の白になる(実測。tulip/whale と同じ)
    folds: [
      { axis: [4, 5], moving: [3, 16, 9, 10], type: 'mountain', angle: 174 },
      { axis: [4, 6], moving: [1, 17, 11, 12], type: 'mountain', angle: 174 },
    ],
    description: {
      ja: '左右の角を、まんなかに向けて裏側へ折り下げます。',
      en: 'Fold the left and right corners down behind, to the center.',
    },
    caution: {
      ja: '角が下の先にぴったり重なります。',
      en: 'The corners land exactly on the bottom point.',
    },
  },
  {
    // ❸ つの(手前の1枚だけを斜め上外へ)
    folds: [
      { axis: [10, 9], moving: [3], type: 'valley', angle: 168 },
      { axis: [12, 11], moving: [1], type: 'valley', angle: 168 },
      // つのを手前へ出す(z補正)。動かすのは つのだけが持つ頂点(3/1)
      { axis: [10, 9], moving: [3], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.06] },
      { axis: [12, 11], moving: [1], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.06] },
    ],
    description: {
      ja: '手前の2枚の先を、斜め上へ折り上げて、つのにします。',
      en: 'Fold the two front points up and out into the horns.',
    },
    caution: {
      ja: '手前の紙だけを折ります。左右をそろえましょう。',
      en: 'Fold only the front layers. Keep both horns symmetrical.',
    },
  },
  {
    // ❹ 前立ての帯(手前の1枚の下の先を上へ)
    folds: [{ axis: [13, 14], moving: [2], type: 'valley', angle: 168 }],
    description: {
      ja: '手前の1枚の下の先を上へ折って、前立てにします。',
      en: 'Fold the bottom point of the front layer up into the crest.',
    },
    caution: {
      ja: '兜のできあがり。',
      en: 'The samurai helmet is done.',
    },
  },
];

export const helmetModel: OrigamiModel = {
  id: 'helmet',
  name: { ja: '兜', en: 'Samurai Helmet' },
  difficulty: 2,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 兜らしい藍(手裏剣の藍と同系)
  sheetColors: [{ front: '#2f4b7c', back: '#e7eef3' }],
  steps,
};
