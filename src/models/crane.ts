import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

const ROT = (-112.5 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const S = 2 - Math.SQRT2;
const H = S / 2;

function r(x: number, y: number): [number, number] {
  return [
    Math.round((x * COS - y * SIN) * 10000) / 10000,
    Math.round((x * SIN + y * COS) * 10000) / 10000,
  ];
}

function oneFold(
  fold: FoldOp,
  description: FoldStep['description'],
  caution?: FoldStep['caution'],
): FoldStep {
  return caution ? { folds: [fold], description, caution } : { folds: [fold], description };
}

const squareBaseSteps: FoldStep[] = [
  oneFold(
    {
      axis: [0, 2],
      moving: [3, 4, 5, 6, 7, 8, 10, 12, 13],
      type: 'valley',
      angle: 176,
      direction: -1,
    },
    {
      ja: '1本目の中心から角へ伸びる折りすじで、外側の紙を手前へ倒します。',
      en: 'Fold the outer paper forward along the first center-to-corner crease.',
    },
    {
      ja: 'ここから正方基本形を1本ずつたたみます。',
      en: 'From here, collapse the square base one crease at a time.',
    },
  ),
  oneFold(
    {
      axis: [0, 3],
      moving: [4, 5, 6, 7, 8, 12, 13],
      type: 'mountain',
      angle: 176,
      direction: 1,
    },
    {
      ja: '2本目の折りすじで、重なった紙を後ろへ倒します。',
      en: 'Fold the stacked paper back along the second crease.',
    },
  ),
  oneFold(
    {
      axis: [0, 4],
      moving: [5, 6, 7, 8, 12, 13],
      type: 'valley',
      angle: 176,
      direction: -1,
    },
    {
      ja: '3本目の折りすじで、次の面を手前へ倒します。',
      en: 'Fold the next section forward along the third crease.',
    },
  ),
  oneFold(
    {
      axis: [0, 5],
      moving: [6, 7, 8, 12, 13],
      type: 'mountain',
      angle: 176,
      direction: 1,
    },
    {
      ja: '4本目の折りすじで、残りの紙を後ろへ倒します。',
      en: 'Fold the remaining paper back along the fourth crease.',
    },
  ),
  oneFold(
    {
      axis: [0, 6],
      moving: [7, 8, 12, 13],
      type: 'valley',
      angle: 176,
      direction: -1,
    },
    {
      ja: '5本目の折りすじで、細くなった部分を手前へ倒します。',
      en: 'Fold the narrowing section forward along the fifth crease.',
    },
  ),
  oneFold(
    { axis: [0, 7], moving: [8, 13], type: 'mountain', angle: 176, direction: 1 },
    {
      ja: '最後の折りすじを後ろへ倒し、4つの角を1点に集めます。',
      en: 'Fold the final crease back, bringing the four corners to one point.',
    },
    {
      ja: 'これで正方基本形になります。',
      en: 'This completes the square base.',
    },
  ),
];

const frontPetalSteps: FoldStep[] = [
  oneFold(
    { axis: [2, 9], moving: [1], type: 'valley', angle: 176, direction: 1 },
    {
      ja: '手前の右ふちを、中央の線へ合わせるように谷折りします。',
      en: 'Valley-fold the front right edge inward to meet the center line.',
    },
    {
      ja: '手前の1枚だけを動かします。',
      en: 'Move only the front layer.',
    },
  ),
  oneFold(
    { axis: [2, 10], moving: [3], type: 'valley', angle: 176, direction: -1 },
    {
      ja: '手前の左ふちも、中央の線へ合わせるように谷折りします。',
      en: 'Valley-fold the front left edge inward to meet the center line.',
    },
  ),
  oneFold(
    { axis: [11, 9], moving: [2], type: 'mountain', angle: 176, direction: -1 },
    {
      ja: '手前の先端を開き、横の折りすじで平らに倒して花弁折りにします。',
      en: 'Open the front point and flatten it across the horizontal crease to make the petal fold.',
    },
  ),
];

const backPetalSteps: FoldStep[] = [
  oneFold(
    { axis: [8, 12], moving: [7], type: 'valley', angle: 176, direction: 1 },
    {
      ja: '裏側の右ふちを、中央の線へ合わせるように谷折りします。',
      en: 'On the back side, valley-fold the right edge inward to the center line.',
    },
    {
      ja: '裏側も同じ順番で1本ずつ折ります。',
      en: 'Repeat the same sequence on the back, one crease at a time.',
    },
  ),
  oneFold(
    { axis: [8, 9], moving: [1], type: 'valley', angle: 176, direction: -1 },
    {
      ja: '裏側の左ふちも、中央の線へ合わせるように谷折りします。',
      en: 'Valley-fold the back left edge inward to the center line.',
    },
  ),
  oneFold(
    { axis: [13, 12], moving: [8], type: 'mountain', angle: 176, direction: 1 },
    {
      ja: '裏側の先端を開き、横の折りすじで平らに倒して鶴の基本形にします。',
      en: 'Open the back point and flatten it across the horizontal crease to form the crane base.',
    },
  ),
];

/**
 * 鶴 / Crane
 *
 * 正方基本形から、前後2枚の花弁折りで鶴の基本形へ進めるモデル。
 * 花弁折りの追加頂点は、未回転の紙座標で s = 2 - sqrt(2) の角度二等分点を
 * 置いてから squareBaseModel と同じ -112.5° 回転をかけている。
 */
export const craneModel: OrigamiModel = {
  id: 'crane',
  name: { ja: '鶴の基本形', en: 'Crane Base' },
  difficulty: 4,
  vertices: [
    r(0, 0), //  0: 中心O
    r(1, 0), //  1: 辺中点E
    r(1, 1), //  2: 角NE
    r(0, 1), //  3: 辺中点N
    r(-1, 1), //  4: 角NW
    r(-1, 0), //  5: 辺中点W
    r(-1, -1), //  6: 角SW
    r(0, -1), //  7: 辺中点S
    r(1, -1), //  8: 角SE
    r(S, 0), //  9: 花弁折り点E
    r(0, S), // 10: 前面花弁折り点N
    r(H, H), // 11: 前面横折りの対角線交点
    r(0, -S), // 12: 裏面花弁折り点S
    r(H, -H), // 13: 裏面横折りの対角線交点
  ],
  faces: [
    // 前面フラップ S1 + S2。2本の斜線と横折りを事前分割しておく。
    [0, 9, 11],
    [9, 1, 2],
    [9, 2, 11],
    [0, 11, 10],
    [11, 2, 10],
    [10, 2, 3],
    // 反対側の層。
    [0, 3, 4],
    [0, 4, 5],
    [0, 5, 6],
    [0, 6, 7],
    // 裏面フラップ S7 + S8。前面と同じ花弁折りの鏡映。
    [0, 12, 13],
    [12, 7, 8],
    [12, 8, 13],
    [0, 13, 9],
    [13, 8, 9],
    [9, 8, 1],
  ],
  steps: [...squareBaseSteps, ...frontPetalSteps, ...backPetalSteps],
};
