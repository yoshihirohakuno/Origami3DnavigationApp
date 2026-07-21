import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * くまのかお / Bear Face(全6工程)
 * https://www.origami-club.com/easy/animal-face/bear/zu.html を基準にした顔。
 *
 *   ❶ 縦半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❷ てっぺんの角を後ろへ折る(頭の上をたいらに)
 *   ❸ 上の両角を手前へ折る → 裏の色が出て耳になる(同時)
 *   ❹ 左右の角を後ろへ折る(顔の横をまっすぐに)
 *   ❺ 下の先を手前へ大きく折り上げる → 裏の白が出て、口のまわり(マズル)になる
 *
 * ぱんだ(panda.ts)と同じ「半分に折らず1枚のまま角を折り込む」構造。くまの識別
 * 要素である**大きな白いマズル**を出すためにこの構造を選んだ。
 *
 * 構造選択の経緯(実測して判断):
 * 最初はうさぎ(rabbit.ts)と同じ「半分に折って左右の角を折り上げる」構造で作ったが、
 * この構造では顔の幅が耳の張り出し(±0.7〜0.8)で決まる一方、高さは あご(0)〜頭(0.5)
 * しか取れず、幅:高さ ≒ 2:1 の横長にしかならなかった(耳先は原点を通る軸での反射
 * なので必ず単位円上に乗り、外側にするほど低くなる=幅広と縦長が両立しない)。
 * ぱんだ構造ならひし形の正方形から六角形の顔になり、縦横のバランスが取れる。
 *
 * 原典との差: 原典では耳は顔と同じ色だが、この構造では折り返しで裏の色が出る。
 * くまの耳の内側として見れば不自然ではないため許容した。
 *
 * 折り返しの大きさの調整(実測して決定): 耳の折り線の上端(9/10)を内側に寄せると
 * 耳が顔の中央まで倒れ込み、マズルの折り線を上げすぎると口まわりが顔の半分を
 * 覆って、どちらも「顔の色(茶)が見えず白だらけ」になる。耳は上端を外寄り(∓0.42)、
 * マズルは折り線を y=-0.65 にして、茶色の顔がしっかり残るようにした。
 */

const V: [number, number][] = [
  [0, 1], //  0: 上の角(❷で後ろへ)
  [1, 0], //  1: 右の角(❹で後ろへ)
  [0, -1], //  2: 下の角(❺で手前へ=マズル)
  [-1, 0], //  3: 左の角(❹で後ろへ)
  [0, 0.5], //  4: てっぺん折り線の中点(x=0)
  [-0.5, 0.5], //  5: てっぺん折り線・左(左上辺上。❸で耳として手前へ)
  [0.5, 0.5], //  6: てっぺん折り線・右(右上辺上)
  [-0.5, 0.3], //  7: 左耳折り線・下端(❹の折り線上)
  [0.5, 0.3], //  8: 右耳折り線・下端
  [-0.42, 0.5], //  9: 左耳折り線・上端(てっぺん折り線上。ぱんだより外=耳を大きく)
  [0.42, 0.5], // 10: 右耳折り線・上端(9と対称)
  [-0.5, -0.5], // 11: 左側面折り線・下端(左下辺上)
  [0.5, -0.5], // 12: 右側面折り線・下端(右下辺上)
  // マズルの折り線。ぱんだの鼻(y=-0.7)より高くして、口のまわりを大きく取る
  [-0.35, -0.65], // 13: マズル折り線・左(左下辺上)
  [0.35, -0.65], // 14: マズル折り線・右(右下辺上)
  [0, -0.65], // 15: マズル折り線の中点(x=0)
  // 16/17: 5/6 の複製(耳の面専用)。5/6 は「てっぺんの折り返し面」と「側面」にも
  // 属しているため、耳を手前へ z 補正すると それらの面まで引きずって手前に出て
  // しまう(実測: てっぺんの折り返しが z=+0.04 で顔の上半分を白く覆った)。
  // 耳だけを動かせるように層を分ける
  [-0.5, 0.5], // 16: 5 の複製(左耳)
  [0.5, 0.5], // 17: 6 の複製(右耳)
];

const F: number[][] = [
  [0, 5, 4], // てっぺん・左
  [0, 4, 6], // てっぺん・右
  [16, 7, 9], // 左耳の角(複製頂点)
  [17, 10, 8], // 右耳の角(複製頂点)
  [3, 5, 7, 11], // 左側面
  [1, 12, 8, 6], // 右側面
  [2, 13, 15], // マズル・左
  [2, 15, 14], // マズル・右
  [4, 9, 7, 11, 13, 15], // 中央・左
  [4, 15, 14, 12, 8, 10], // 中央・右
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

// ❶の縦折りで動く左半分
const LEFT_HALF = [3, 5, 7, 9, 11, 13, 16];

const steps: FoldStep[] = [
  {
    // ❶a 縦半分に折り目
    folds: [{ axis: [0, 2], moving: LEFT_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half sideways to crease the center line.',
    },
    caution: {
      ja: '色の面が顔になります。',
      en: 'The colored side becomes the face.',
    },
  },
  {
    // ❶b 開いて戻す
    folds: [{ axis: [0, 2], moving: LEFT_HALF, type: 'unfold', angle: 178, direction: -1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❷ てっぺんを後ろへ
    folds: [{ axis: [5, 6], moving: [0], type: 'mountain', angle: 172 }],
    description: {
      ja: 'てっぺんの角を後ろへ折って、頭の上をたいらにします。',
      en: 'Fold the top corner behind to flatten the head.',
    },
  },
  {
    // ❸ 両耳(上の両角を手前へ折ると裏の色が出る)
    folds: [
      { axis: [7, 9], moving: [16], type: 'valley', angle: 168 },
      { axis: [8, 10], moving: [17], type: 'valley', angle: 168 },
      // 耳の折り線はほぼ縦向きなので、valley の自動判定では耳が奥(z<0)へ回り、
      // 中央面に隠れてしまう(実測)。折った後に z 補正で手前へ出す
      { axis: [7, 9], moving: [16], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
      { axis: [8, 10], moving: [17], type: 'assemble', angle: 0, direction: 1, translate: [0, 0, 0.05] },
    ],
    description: {
      ja: '上の両角を手前へ折って、丸い耳にします。',
      en: 'Fold both top corners toward you into round ears.',
    },
    caution: {
      ja: '左右の耳をそろえましょう。',
      en: 'Keep both ears symmetrical.',
    },
  },
  {
    // ❹ 左右の角を後ろへ。軸には「前の工程で動いていない」頂点を使う
    // (耳の角 5/6 を軸にすると軸が傾いて角があらぬ位置へ飛ぶ。panda.ts と同じ注意点)
    folds: [
      { axis: [7, 11], moving: [3], type: 'mountain', angle: 172 },
      { axis: [8, 12], moving: [1], type: 'mountain', angle: 172 },
    ],
    description: {
      ja: '左右の角を後ろへ折って、顔の横をまっすぐにします。',
      en: 'Fold the side corners behind to straighten the face.',
    },
  },
  {
    // ❺ マズル(下の先を手前へ大きく)
    folds: [{ axis: [13, 14], moving: [2], type: 'valley', angle: 168 }],
    description: {
      ja: '下の先を手前へ大きく折り上げます。裏の白が出て、口のまわりになります。',
      en: 'Fold the bottom tip up toward you — the white side shows as the muzzle.',
    },
    caution: {
      ja: 'くまのかお のできあがり。目と鼻を描きましょう。',
      en: 'The bear face is done. Draw the eyes and nose.',
    },
  },
];

export const bearModel: OrigamiModel = {
  id: 'bear',
  name: { ja: 'くまのかお', en: 'Bear Face' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 顔=紙の表(茶)、耳とマズル=裏(生成り)
  sheetColors: [{ front: '#a9713f', back: '#f2ede3' }],
  steps,
};
