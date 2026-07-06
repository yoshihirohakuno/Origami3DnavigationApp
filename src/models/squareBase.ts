import type { OrigamiModel } from '../engine/types';

/**
 * 正方基本形 / Square Base(1工程)— 鶴への第一歩。
 *
 * 中心Oの周りの8扇形の「単一頂点平坦折り」。折り線(O-頂点)を軸にした
 * 連鎖回転6回で表現する(tools/solve-collapse.mjs で検証:
 * 厳密±180°ではどの符号でも4隅が1点(1,1)・辺中点が固定扇形の縁(1,0)に
 * 集まり、符号は層の重なり順=アコーディオンの向きにだけ効く)。
 * 176°+交互方向で、層が交互に重なる正方基本形になる。
 *
 * 固定扇形はS1(O, M_E, TR)。完成形は0°〜45°の扇形に全層が重なる。
 */
export const squareBaseModel: OrigamiModel = {
  id: 'square-base',
  name: { ja: '正方基本形', en: 'Square Base' },
  difficulty: 2,
  // シート全体を-112.5°回転してある:固定扇形の二等分線が真下を向き、
  // 完成形が「閉じた角(O)が上・開いた端が下」の正規の向きになる。
  vertices: [
    [0, 0], //  0: 中心O(完成形の閉じた角・上)
    [-0.3827, -0.9239], //  1: 辺中点(固定扇形の縁)
    [0.5412, -1.3066], //  2: 角(固定・4隅の集合点・下)
    [0.9239, -0.3827], //  3: 辺中点
    [1.3066, 0.5412], //  4: 角
    [0.3827, 0.9239], //  5: 辺中点
    [-0.5412, 1.3066], //  6: 角
    [-0.9239, 0.3827], //  7: 辺中点
    [-1.3066, -0.5412], //  8: 角
  ],
  faces: [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 5],
    [0, 5, 6],
    [0, 6, 7],
    [0, 7, 8],
    [0, 8, 1],
  ],
  steps: [
    {
      folds: [
        { axis: [0, 2], moving: [3, 4, 5, 6, 7, 8], type: 'valley', angle: 176, direction: -1 },
        { axis: [0, 3], moving: [4, 5, 6, 7, 8], type: 'mountain', angle: 176, direction: 1 },
        { axis: [0, 4], moving: [5, 6, 7, 8], type: 'valley', angle: 176, direction: -1 },
        { axis: [0, 5], moving: [6, 7, 8], type: 'mountain', angle: 176, direction: 1 },
        { axis: [0, 6], moving: [7, 8], type: 'valley', angle: 176, direction: -1 },
        { axis: [0, 7], moving: [8], type: 'mountain', angle: 176, direction: 1 },
      ],
      description: {
        ja: '対角線と十字の折りすじを使い、4つの角を1点に集めて正方基本形にたたみます。',
        en: 'Using the diagonal and cross creases, collapse all four corners to one point — the square base.',
      },
      caution: {
        ja: '鶴の土台になる基本形です。層が交互に重なります。',
        en: 'This base is the foundation of the crane. The layers alternate.',
      },
    },
  ],
};
