import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * 水風船基本形 / Water-bomb Base(全5工程)— ふうせん・かえるの土台。
 * 原典 https://www.origami-club.com/fun/balloon/zu.html の❶〜❻と同じ手順。
 *
 *   ❶ はんぶんに おる(辺と辺を合わせて)
 *   ❷ はんぶんに おる(さらに半分。小さな正方形に)
 *   ❸ ふくろを ひらいて つぶす
 *   ❹ うらがえす
 *   ❺ おなじように ふくろを つぶす
 *
 * **正方基本形と対になる基本形**。正方基本形が対角線で2回折るのに対し、
 * こちらは辺と辺(中線)で2回折る。折り線の役割がちょうど入れ替わっていて、
 * 手順・たたみ方はまったく同じ形になる(`src/models/squareBase.ts` と読み比べると
 * 軸の頂点が1つずれているだけ)。
 *
 * 幾何(紙は [-1,1] の正方形。O=中心、E/N/W/S=辺の中点、NE/NW/SW/SE=角):
 * - ❶ 中線 E-W(y=0)で上半分を下へ。N→S / NE→SE / NW→SW に重なる
 * - ❷ 中線 O-S で左半分を右へ。**4つの角が1点(SE)に重なり、辺の中点は
 *   E と S の2点に2枚ずつ重なる**小さな正方形になる
 * - ❸ **袋を開いてつぶす**。正方基本形と同じく1軸回転2回の連鎖:
 *   ①手前の層を❷の折り線(O-S)で開き、②できた折り目 O-SW で角を折り返す
 * - ❺ うらがえしたあと、同じ2回の回転で反対側の袋をつぶす
 * - 完成形は直角二等辺三角形。**頂点が紙の中心O(上)、底辺の両端に紙の4隅が
 *   2枚ずつ、底辺の中点に4つの辺の中点が集まる**。この形のまま
 *   角を持ち上げて折れば ふうせん(fun/balloon ❼〜⓭)になる
 */

const ANGLE = 176;

/** 白い面を上にして始める(折り図❶が白い正方形) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const F: number[][] = [
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5],
  [0, 5, 6],
  [0, 6, 7],
  [0, 7, 8],
  [0, 8, 1],
];

const steps: FoldStep[] = [
  {
    // ❶ 中線 E-W で上半分を下へ
    folds: [{ axis: [1, 5], moving: [2, 3, 4], type: 'valley', angle: ANGLE }],
    description: {
      ja: '辺と辺を合わせて、はんぶんに折ります。',
      en: 'Fold in half, edge to edge.',
    },
    caution: {
      ja: 'ふうせんやかえるの土台になる「水風船基本形」を作ります。',
      en: 'We are making the water-bomb base, used for balloons and frogs.',
    },
  },
  {
    // ❷ もう半分。4つの角が1点に重なる
    folds: [{ axis: [0, 7], moving: [4, 5, 6], type: 'valley', angle: ANGLE }],
    description: {
      ja: 'もう一度はんぶんに折って、小さな正方形にします。',
      en: 'Fold in half again into a small square.',
    },
    caution: {
      ja: '紙の4つの角が、ぴったり1点に重なります。',
      en: 'All four corners of the paper stack up on a single point.',
    },
  },
  {
    // ❸ 袋を開いてつぶす(①❷の折り線で開く → ②できた折り目で角を折り返す)
    folds: [
      { axis: [0, 7], moving: [5, 6], type: 'valley', angle: ANGLE },
      { axis: [0, 6], moving: [5], type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: '手前のふくろを開いて、三角につぶします。',
      en: 'Open the front pocket and squash it flat into a triangle.',
    },
    caution: {
      ja: '中に指を入れて開き、辺の中点が底辺のまんなかに来るように押しつぶします。',
      en: 'Slip a finger inside and press flat so the edge midpoint lands at the middle of the base.',
    },
  },
  {
    // ❹ うらがえす(軸は完成形の対称軸=O と底辺の中点を結ぶ線)
    folds: [
      { axis: [0, 7], moving: [1, 2, 3, 4, 5, 6, 8], type: 'assemble', angle: 180, direction: 1 },
    ],
    description: { ja: 'うらがえします。', en: 'Turn it over.' },
  },
  {
    // ❺ 反対側のふくろも同じようにつぶす
    // 2本目の軸は **NE(2) ではなく、平らなまま残っている角 SW(6)** を使う。
    // NE は1本目の折りで z=+0.139 まで持ち上がるので、軸にすると z 方向に傾き、
    // つぶしたフラップが紙束の上に乗って白い裏面が外に出る(折り図❻は一面が桃色)。
    // また❹のうらがえしで束が -z 側へ移るため、連鎖回転の自動符号は使えない。
    // direction を明示してフラップを束の中へ倒す(types.ts の direction の用途そのもの)。
    folds: [
      { axis: [0, 7], moving: [1, 2], type: 'valley', angle: ANGLE, direction: -1 },
      { axis: [0, 6], moving: [1], type: 'valley', angle: ANGLE, direction: -1 },
    ],
    description: {
      ja: 'こちらのふくろも同じように開いて、つぶします。水風船基本形のできあがり。',
      en: 'Open and squash this pocket the same way — the water-bomb base is done.',
    },
    caution: {
      ja: '直角二等辺三角形になります。底辺の両はしに、紙の4すみが2枚ずつ集まります。',
      en: 'You get a right triangle, with two of the paper corners at each end of the base.',
    },
  },
];

export const waterbombBaseModel: OrigamiModel = {
  id: 'waterbomb-base',
  name: { ja: '水風船基本形', en: 'Water-bomb Base' },
  difficulty: 1,
  vertices: [
    [0, 0], //  0: 中心O(完成形の頂点)
    [1, 0], //  1: 辺中点E(❺でつぶす側)
    [1, 1], //  2: 角NE
    [0, 1], //  3: 辺中点N
    [-1, 1], //  4: 角NW
    [-1, 0], //  5: 辺中点W(❸でつぶす側)
    [-1, -1], //  6: 角SW
    [0, -1], //  7: 辺中点S(❷❸❺の軸。完成形で4つの中点が重なる点)
    [1, -1], //  8: 角SE
  ],
  faces: backSideUp(F),
  faceSheet: F.map(() => 0),
  // 折り図の桃色を実測(#f7a8c8 相当)。白い面を上にして始める
  sheetColors: [{ front: '#f2a1c0', back: '#f6f2e8' }],
  steps,
};
