import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

/**
 * 手裏剣 / Shuriken(2枚組み・全9工程)
 *
 * おりがみくらぶ(https://www.origami-club.com/fun/cross/index.html)の折り図に
 * 忠実な工程を再現する。幾何は tools/solve-shuriken.mjs で厳密値を検証済み。
 *
 *   ❶ 観音折り(左右のはしを中心線へ) ─ 2枚同時
 *   ❷ 中心でさらに半分 → 幅1/4の帯
 *   ❸ 帯の両はしを斜め45°に折る(2枚は鏡写し)
 *   ❹ 斜めのはしを折り返し、先のとがった稲妻形にする
 *   ❺ 朱を裏返して向きをかえ、藍を中央へ
 *   ❻ 朱を藍の上に十字にかさねる
 *   ❼ 朱の先端を藍のポケットへさしこむ
 *   ❽ 全体をうらがえす
 *   ❾ 藍の先端もさしこんで できあがり
 *
 * 紙は白い面を上にして始める(観音折りで裏の色が表に出る=折り図と同じ)。
 * 差し込みは、折り上がりの位置がシルエットを変えず層の間へ入るだけであることを
 * ソルバで確認済みのため、小さな押し込み回転+ガイド矢印で表現する
 * (編み込みの厳密再現はエンジン制約で不可。README「既知の制約」)。
 */

const AX = -1.2; // 朱の展開図での中心x
const BX = 1.2; // 藍の展開図での中心x
const STAGE_Y = 1.0; // ❺で朱が待機する高さ
const Z_LIFT = 0.12; // ❺で朱を持ち上げる高さ
const Z_GAP = 0.06; // ❻で藍の上に乗せた時のすき間

/**
 * ローカル展開図の20頂点(藍=このまま、朱=x反転)。
 * 縦線 x=±1(紙のはし), ±0.5(観音折り), 0(半分折り)と、
 * ❸❹の折り線を各層へ展開したジグザグ線(帯座標では
 * ❸上=(0,1)-(0.5,0.5) / ❸下=(0,-0.5)-(0.5,-1) /
 * ❹上=(0,0)-(0.5,0.5) / ❹下=(0,-0.5)-(0.5,0))の交点。
 */
const LOCAL: [number, number][] = [
  [-1, 1], // 0: 左上の角
  [-1, 0], // 1: 左はし∩❹上
  [-1, -0.5], // 2: 左はし∩❹下・❸下
  [-1, -1], // 3: 左下の角
  [-0.5, 1], // 4: 観音折り線の上端
  [-0.5, 0.5], // 5: 観音折り線∩❸上・❹上
  [-0.5, 0], // 6: 観音折り線∩❹下
  [-0.5, -1], // 7: 観音折り線の下端(❸下も通る)
  [0, 1], // 8: 中心線の上端(❸上の起点)
  [0, 0], // 9: 中心線∩❹上
  [0, -0.5], // 10: 中心線∩❹下・❸下
  [0, -1], // 11: 中心線の下端
  [0.5, 1], // 12: 観音折り線の上端
  [0.5, 0.5], // 13: 観音折り線∩❸上・❹上
  [0.5, 0], // 14: 観音折り線∩❹下
  [0.5, -1], // 15: 観音折り線の下端(❸下も通る)
  [1, 1], // 16: 右上の角
  [1, 0], // 17: 右はし∩❹上
  [1, -0.5], // 18: 右はし∩❹下・❸下
  [1, -1], // 19: 右下の角
  // 20〜23: 中心線(❷の折り線)上の頂点の複製。この折り線は下層(x∈[0,0.5]の面)と
  // 上層(x∈[-0.5,0]の面)で共有されるが、折った後は上層の縁が層の厚みぶん上に
  // 浮くため、1つの頂点では両層の高さを同時に表せない。上層側の面はこちらを使い、
  // ❷の後に z を持ち上げる(下層側 8〜11 は z=0 のまま)
  [0, 1], // 20: 8 の複製(上層側)
  [0, 0], // 21: 9 の複製(上層側)
  [0, -0.5], // 22: 10 の複製(上層側)
  [0, -1], // 23: 11 の複製(上層側)
];

/** 面(藍の向きで反時計回り。朱=鏡映シートは生成時に向きを反転) */
const LOCAL_FACES: number[][] = [
  // 左はしの列 x∈[-1,-0.5]
  [0, 5, 4],
  [0, 1, 5],
  [1, 2, 6, 5],
  [2, 7, 6],
  [2, 3, 7],
  // x∈[-0.5,0](上層側。中心線の頂点は複製 20〜23 を使う)
  [4, 5, 20],
  [5, 21, 20],
  [5, 6, 22, 21],
  [6, 7, 22],
  [7, 23, 22],
  // x∈[0,0.5]
  [8, 13, 12],
  [8, 9, 13],
  [9, 10, 14, 13],
  [10, 15, 14],
  [10, 11, 15],
  // 右はしの列 x∈[0.5,1]
  [12, 13, 16],
  [13, 17, 16],
  [13, 14, 18, 17],
  [14, 15, 18],
  [15, 19, 18],
];

// 動く頂点の集合(ローカル)
const CUPBOARD_L = [0, 1, 2, 3]; // ❶ 左はし
const CUPBOARD_R = [16, 17, 18, 19]; // ❶ 右はし
// ❷ 半分折りで動く側。紙のはし(0〜3)は❶で中心線上=回転軸上に来ているため
// 含めない(含めると軸上の点が~180°回って紙面の裏へ潜り、以降の層順が崩れる)
const HALF = [4, 5, 6, 7];
const SLANT_TOP = [4, 12]; // ❸ 上(帯の角、全層。20 は折り線の端点上なので動かない)
const SLANT_BOT = [3, 11, 19, 23]; // ❸ 下
const TIP_TOP = [0, 4, 8, 12, 16, 20]; // ❹ 上の先端(層ごと)
const TIP_BOT = [3, 7, 11, 15, 19, 23]; // ❹ 下の先端
const ALL = LOCAL.map((_, i) => i); // シート全体(組み立て用)

const A = 0; // 朱のインデックスオフセット
const B = 24; // 藍のインデックスオフセット

const vertices: [number, number][] = [
  ...LOCAL.map(([x, y]): [number, number] => [-x + AX, y]), // 朱(鏡映)
  ...LOCAL.map(([x, y]): [number, number] => [x + BX, y]), // 藍
];

const faces: number[][] = [
  ...LOCAL_FACES.map((f) => [...f].reverse().map((i) => i + A)), // 鏡映は向きも反転
  ...LOCAL_FACES.map((f) => f.map((i) => i + B)),
];

const faceSheet = [...LOCAL_FACES.map(() => 0), ...LOCAL_FACES.map(() => 1)];

// 白い面を上にして始める(折り図と同じ。観音折りで裏の色が表に出る)
const sheetColors = [
  { front: '#f2ede3', back: '#e0492f' }, // 朱
  { front: '#f2ede3', back: '#2f4b7c' }, // 藍
];

/** 両シートへ同じ折りを作るヘルパ */
function both(op: (base: number) => FoldOp[]): FoldOp[] {
  return [...op(A), ...op(B)];
}

const off = (base: number, ids: number[]) => ids.map((i) => i + base);

const steps: FoldStep[] = [
  {
    // ❶ 観音折り
    folds: both((s) => [
      { axis: [s + 4, s + 7], moving: off(s, CUPBOARD_L), type: 'valley', angle: 177.5 },
      { axis: [s + 12, s + 15], moving: off(s, CUPBOARD_R), type: 'valley', angle: 177.5 },
    ]),
    description: {
      ja: '2枚とも、左右のはしを中心線に合わせて折ります(かんのん折り)。',
      en: 'On both sheets, fold the left and right edges in to the center line.',
    },
    caution: {
      ja: '手裏剣は2枚の紙で作ります。白い面を上にして始めます。',
      en: 'The shuriken uses two sheets. Start with the white side up.',
    },
  },
  {
    // ❷ 半分に折る
    folds: both((s) => [
      { axis: [s + 8, s + 11], moving: off(s, HALF), type: 'valley', angle: 176.5 },
      // 上層側の折り目の縁(複製頂点)を層の厚みぶん持ち上げる。
      // 下層側(8〜11)は z=0 のままなので、上下の層が独立した高さを持てる
      {
        axis: [s + 8, s + 11],
        moving: off(s, [20, 21, 22, 23]),
        type: 'assemble',
        angle: 0,
        direction: 1,
        translate: [0, 0, 0.055],
      },
    ]),
    description: {
      ja: '中心線でさらに半分に折り、細い帯にします。',
      en: 'Fold in half again along the center line into a slim strip.',
    },
  },
  {
    // ❸ 端を斜めに折る
    folds: both((s) => [
      { axis: [s + 8, s + 13], moving: off(s, SLANT_TOP), type: 'valley', angle: 175.5 },
      { axis: [s + 10, s + 15], moving: off(s, SLANT_BOT), type: 'valley', angle: 175.5 },
    ]),
    description: {
      ja: '帯の上下のはしを斜め45°に折ります。2枚は左右対称(鏡写し)です。',
      en: 'Fold both ends of each strip at 45°. The two sheets mirror each other.',
    },
    caution: {
      ja: '上のはしと下のはしは反対向きに折ります。',
      en: 'The top and bottom ends fold in opposite directions.',
    },
  },
  {
    // ❹ 先端を折る
    folds: both((s) => [
      { axis: [s + 9, s + 13], moving: off(s, TIP_TOP), type: 'valley', angle: 174 },
      { axis: [s + 10, s + 14], moving: off(s, TIP_BOT), type: 'valley', angle: 174 },
      // 折り返した最上層(下層側の面)の折り目は層の束の上まで巻き上がるため、
      // ❹の折り線頂点を持ち上げて折り返し面が下の層に沈まないようにする
      {
        axis: [s + 9, s + 13],
        moving: off(s, [9, 10, 13, 14]),
        type: 'assemble',
        angle: 0,
        direction: 1,
        translate: [0, 0, 0.04],
      },
    ]),
    description: {
      ja: '斜めのはしを折り線で折り返し、先のとがった稲妻形にします。',
      en: 'Fold the slanted ends back along the creases into a pointed lightning shape.',
    },
  },
  {
    // ❺ 朱を裏返して向きをかえ、藍を中央へ
    folds: [
      {
        // 長軸(先端どうしを結ぶ線)まわりに180°裏返し → 面内90°回転 → 待機位置へ
        axis: [A + 8, A + 15],
        moving: off(A, ALL),
        type: 'assemble',
        angle: 180,
        direction: 1,
        spinZ: 90,
        // 回転後のユニット中心 (AX-1, 0.75) を待機位置 (0, STAGE_Y) へ
        translate: [1 - AX, STAGE_Y - 0.75, Z_LIFT],
      },
      {
        axis: [B + 8, B + 15],
        moving: off(B, ALL),
        type: 'assemble',
        angle: 0,
        direction: 1,
        // ユニット中心 (BX+0.25, 0) を原点へ
        translate: [-(BX + 0.25), 0, 0],
      },
    ],
    description: {
      ja: '朱をうらがえして向きを90°かえ、藍を中央へ動かします。',
      en: 'Flip the vermilion unit over, turn it 90°, and move the indigo unit to the center.',
    },
    caution: {
      ja: 'うらがえすことで、差し込むためのツメが下を向きます。',
      en: 'Flipping it points the tuck tabs downward.',
    },
  },
  {
    // ❻ 上にかさねる
    folds: [
      {
        axis: [A + 8, A + 15],
        moving: off(A, ALL),
        type: 'assemble',
        angle: 0,
        direction: 1,
        translate: [0, -STAGE_Y, Z_GAP - Z_LIFT],
      },
    ],
    description: {
      ja: '朱を藍の上に、十字になるようにかさねます。',
      en: 'Lay the vermilion unit across the indigo one in a cross.',
    },
  },
  {
    // ❼ さしこむ(朱の先端 → 藍のポケット)
    folds: [
      { axis: [A + 9, A + 13], moving: off(A, TIP_TOP), type: 'mountain', angle: 8, direction: 1 },
      { axis: [A + 10, A + 14], moving: off(A, TIP_BOT), type: 'mountain', angle: 8, direction: -1 },
    ],
    description: {
      ja: '朱の2つの先端を、藍の中央のすきま(ポケット)へさしこみます。',
      en: 'Tuck the two vermilion points into the pockets at the indigo center.',
    },
    caution: {
      ja: '折り線は藍の中央部のふちとぴったり重なります。',
      en: 'The creases line up exactly with the edges of the indigo center.',
    },
  },
  {
    // ❽ うらがえす
    folds: [
      {
        axis: [B + 8, B + 15],
        moving: [...off(A, ALL), ...off(B, ALL)],
        type: 'assemble',
        angle: 180,
        direction: 1,
      },
    ],
    description: {
      ja: '全体をうらがえします。',
      en: 'Turn the whole piece over.',
    },
  },
  {
    // ❾ さしこんで できあがり
    folds: [
      { axis: [B + 9, B + 13], moving: off(B, TIP_TOP), type: 'mountain', angle: 6, direction: -1 },
      { axis: [B + 10, B + 14], moving: off(B, TIP_BOT), type: 'mountain', angle: 6, direction: 1 },
    ],
    description: {
      ja: '藍の2つの先端も同じようにさしこんだら、手裏剣のできあがり。',
      en: 'Tuck the two indigo points the same way — the shuriken is complete.',
    },
    caution: {
      ja: '向かい合う尖りが同じ色になります。',
      en: 'Opposite points share a color.',
    },
  },
];

export const shurikenModel: OrigamiModel = {
  id: 'shuriken',
  name: { ja: '手裏剣', en: 'Shuriken' },
  difficulty: 2,
  cameraAngle: 0,
  // 平らな作品なのでほぼ正面から(わずかに見下ろす)見せる
  cameraPos: [0, -0.9, 4.6],
  vertices,
  faces,
  faceSheet,
  sheetColors,
  steps,
};
