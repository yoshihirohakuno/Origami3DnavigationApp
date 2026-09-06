import type { FoldStep, OrigamiModel } from '../engine/types';

/** 水風船基本形。辺を合わせて半分、さらに半分、袋を開いてつぶす、裏返す、反対も同様。
 * 2026-09-06: 正方基本形と同じ pocket の拘束式を使う。
 * 二つの連鎖回転による中間形の伸びを解消し、開口とつぶしで停止できる。
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
    folds: [{ axis: [1, 5], moving: [2, 3, 4], type: 'valley', angle: 180 }],
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
    folds: [{ axis: [0, 7], moving: [4, 5, 6], type: 'valley', angle: 180 }],
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
    // ❸ 口の点をヒンジ周りに動かし、先端を面の辺長拘束で追従させる。
    folds: [
      { axis: [0, 7], moving: [5, 6], type: 'valley', angle: ANGLE,
        pocket: { rim: 6, tip: 5, pivot: 8 } },
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
    // ❺ 裏返した反対側も、同じ4面の拘束を保ってつぶす。
    folds: [
      { axis: [0, 7], moving: [1, 2], type: 'valley', angle: ANGLE,
        pocket: { rim: 2, tip: 1, pivot: 4 } },
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
