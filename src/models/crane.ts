import type { OrigamiModel } from '../engine/types';

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
  steps: [
    {
      folds: [
        {
          axis: [0, 2],
          moving: [3, 4, 5, 6, 7, 8, 10, 12, 13],
          type: 'valley',
          angle: 176,
          direction: -1,
        },
        {
          axis: [0, 3],
          moving: [4, 5, 6, 7, 8, 12, 13],
          type: 'mountain',
          angle: 176,
          direction: 1,
        },
        {
          axis: [0, 4],
          moving: [5, 6, 7, 8, 12, 13],
          type: 'valley',
          angle: 176,
          direction: -1,
        },
        {
          axis: [0, 5],
          moving: [6, 7, 8, 12, 13],
          type: 'mountain',
          angle: 176,
          direction: 1,
        },
        {
          axis: [0, 6],
          moving: [7, 8, 12, 13],
          type: 'valley',
          angle: 176,
          direction: -1,
        },
        { axis: [0, 7], moving: [8, 13], type: 'mountain', angle: 176, direction: 1 },
      ],
      description: {
        ja: '折りすじを使い、4つの角を1点に集めて正方基本形にたたみます。',
        en: 'Collapse the prepared creases into the square base, bringing the four corners together.',
      },
      caution: {
        ja: '花弁折りで使う線は、見えない層にも先に入っています。',
        en: 'The petal-fold creases are already embedded through the hidden layers.',
      },
    },
    {
      folds: [
        { axis: [2, 9], moving: [1], type: 'valley', angle: 176, direction: 1 },
        { axis: [2, 10], moving: [3], type: 'valley', angle: 176, direction: -1 },
        { axis: [11, 9], moving: [2], type: 'mountain', angle: 176, direction: -1 },
      ],
      description: {
        ja: '手前の1枚を開き、左右を中心へ寄せながら花弁折りします。',
        en: 'Open the front layer and petal-fold it, bringing both sides to the center.',
      },
      caution: {
        ja: '前面フラップは S1 と S2 の2層です。',
        en: 'The front flap is the S1 and S2 layer pair.',
      },
    },
    {
      folds: [
        { axis: [8, 12], moving: [7], type: 'valley', angle: 176, direction: 1 },
        { axis: [8, 9], moving: [1], type: 'valley', angle: 176, direction: -1 },
        { axis: [13, 12], moving: [8], type: 'mountain', angle: 176, direction: 1 },
      ],
      description: {
        ja: '裏返した側も同じように開き、花弁折りして鶴の基本形にします。',
        en: 'Repeat the petal fold on the back side to form the crane base.',
      },
      caution: {
        ja: '裏面は S7 側のフラップを同じ手順で細くします。',
        en: 'On the back, narrow the S7-side flap with the same sequence.',
      },
    },
  ],
};
