import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

/**
 * 手裏剣 / Shuriken(2枚組み)
 *
 * おりがみくらぶ(https://www.origami-club.com/fun/cross/index.html)基準の2枚組み。
 * 正方形2枚をそれぞれ「四隅を中心へ折る(坐布団折り)」で小さな正方形にし、
 * 最後に中心で交差させて8方向へ尖った星=手裏剣に組む。
 *
 * 2枚を90°でなく45°ずらして重ねるため、1枚目(朱)は軸に沿った菱形、
 * 2枚目(藍)は対角に沿った正方形になるよう、展開図で2枚目を45°回した向きに
 * 置く。これで組み立ては平行移動だけで済む(面に垂直な回転を避ける)。
 *
 * 注記:本物は「半分に折る→両端を折って平行四辺形→タブをポケットへ編む」。
 * 1枚の紙を回転で畳む本エンジンでは編み込みを厳密再現できないため、組み立ては
 * 剛体の平行移動で交差させる見た目上の組みとしている(README「既知の制約」)。
 */

const ANGLE = 176;
const AX = -1.6; // 1枚目(朱)の展開図での中心x
const BX = 1.6; // 2枚目(藍)の展開図での中心x
const S = Math.SQRT2; // 45°正方形の半対角 = √2
const H = Math.SQRT1_2; // √2 / 2

const vertices: [number, number][] = [
  // --- 1枚目(朱)ユニットA: index 0-7。軸に沿った一辺2の正方形、四隅を中心へ折る ---
  [AX + 0, 1], //  0: 上辺中点 mT
  [AX + 1, 0], //  1: 右辺中点 mR
  [AX + 0, -1], //  2: 下辺中点 mB
  [AX - 1, 0], //  3: 左辺中点 mL
  [AX - 1, 1], //  4: TL(中心へ折る隅)
  [AX + 1, 1], //  5: TR
  [AX + 1, -1], //  6: BR
  [AX - 1, -1], //  7: BL
  // --- 2枚目(藍)ユニットB: index 8-15。45°回した正方形、四隅を中心へ折る ---
  [BX + H, H], //  8: 辺中点 mNE
  [BX + H, -H], //  9: mSE
  [BX - H, -H], // 10: mSW
  [BX - H, H], // 11: mNW
  [BX + 0, S], // 12: 上の隅(中心へ折る)
  [BX + S, 0], // 13: 右の隅
  [BX + 0, -S], // 14: 下の隅
  [BX - S, 0], // 15: 左の隅
];

const faces: number[][] = [
  // ユニットA 本体(内接菱形)+ 四隅フラップ
  [0, 3, 2, 1], // 本体 mT,mL,mB,mR(表=+z)
  [3, 4, 0], // TL フラップ
  [0, 5, 1], // TR フラップ
  [1, 6, 2], // BR フラップ
  [2, 7, 3], // BL フラップ
  // ユニットB 本体(内接正方形)+ 四隅フラップ
  [8, 11, 10, 9], // 本体 mNE,mNW,mSW,mSE
  [11, 12, 8], // 上フラップ
  [8, 13, 9], // 右フラップ
  [9, 14, 10], // 下フラップ
  [10, 15, 11], // 左フラップ
];

// 各面の所属シート(0=朱, 1=藍)
const faceSheet = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];

const sheetColors = [
  { front: '#e0492f', back: '#b83a24' }, // 朱
  { front: '#2f4b7c', back: '#233a61' }, // 藍
];

// --- 工程 ---

// 1枚目:四隅を中心へ折る(坐布団折り)
const foldA: FoldOp[] = [
  { axis: [3, 0], moving: [4], type: 'mountain', angle: ANGLE },
  { axis: [0, 1], moving: [5], type: 'mountain', angle: ANGLE },
  { axis: [1, 2], moving: [6], type: 'mountain', angle: ANGLE },
  { axis: [2, 3], moving: [7], type: 'mountain', angle: ANGLE },
];
// 2枚目:同じく四隅を中心へ折る(向きが45°ずれている)
const foldB: FoldOp[] = [
  { axis: [11, 8], moving: [12], type: 'mountain', angle: ANGLE },
  { axis: [8, 9], moving: [13], type: 'mountain', angle: ANGLE },
  { axis: [9, 10], moving: [14], type: 'mountain', angle: ANGLE },
  { axis: [10, 11], moving: [15], type: 'mountain', angle: ANGLE },
];
// 組み立て:2枚を中心へ寄せて交差させる(剛体の平行移動)
const assemble: FoldOp[] = [
  {
    axis: [0, 1],
    moving: [0, 1, 2, 3, 4, 5, 6, 7],
    type: 'assemble',
    angle: 0,
    direction: 1,
    translate: [-AX, 0, 0.03],
  },
  {
    axis: [8, 9],
    moving: [8, 9, 10, 11, 12, 13, 14, 15],
    type: 'assemble',
    angle: 0,
    direction: 1,
    translate: [-BX, 0, 0],
  },
];

const steps: FoldStep[] = [
  {
    folds: foldA,
    description: {
      ja: '1枚目(朱)の正方形の、四隅を中心へ折ります。',
      en: 'On the first (vermilion) square, fold all four corners to the center.',
    },
    caution: {
      ja: '手裏剣は2枚の紙で作ります。まず1枚目を折ります。',
      en: 'The shuriken uses two sheets. Fold the first one now.',
    },
  },
  {
    folds: foldB,
    description: {
      ja: '2枚目(藍)も同じように、四隅を中心へ折ります(向きが45°ずれています)。',
      en: 'Fold the second (indigo) square the same way — it sits rotated 45°.',
    },
    caution: {
      ja: '2枚目は1枚目に対して45°回した向きに置いてあります。',
      en: 'The second sheet is turned 45° relative to the first.',
    },
  },
  {
    folds: assemble,
    description: {
      ja: '2枚を中心で交差するように重ね、尖りを8方向へ出して手裏剣にします。',
      en: 'Overlap the two units crossing at the center so eight points fan out — the shuriken.',
    },
    caution: {
      ja: '互い違いの色で尖りが出ます。',
      en: 'The points alternate in color.',
    },
  },
];

export const shurikenModel: OrigamiModel = {
  id: 'shuriken',
  name: { ja: '手裏剣', en: 'Shuriken' },
  difficulty: 2,
  cameraAngle: 0,
  // 平らな星なのでほぼ正面から(わずかに見下ろす)見せる
  cameraPos: [0, -0.9, 4.6],
  vertices,
  faces,
  faceSheet,
  sheetColors,
  steps,
};
