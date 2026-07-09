import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

/**
 * 手裏剣 / Shuriken(2枚組み)
 *
 * おりがみくらぶ(https://www.origami-club.com/fun/cross/index.html)基準の2枚組み。
 * 正方形2枚をそれぞれ細い「羽根(平行四辺形)」に折り、90°で交差させて組むと
 * 4方向へ尖った手裏剣になる(向かい合う尖りが同じ色)。
 *
 * 各ユニットは、正方形の向かい合う2つの隅(北西・南東)を対角線に沿って裏へ折り、
 * 対角線(北東-南西)方向に細長い羽根にする。1枚目(朱)は北東-南西、2枚目(藍)は
 * それを90°回した北西-南東の羽根。展開図で2枚目を90°回した向きに置くので、
 * 組み立ては中心へ寄せる平行移動だけで済む(面に垂直な回転を避ける)。
 *
 * 注記:本物は「半分に折る→左右を中心へ折る→両端を斜めに折って平行四辺形→
 * タブをポケットへ編む」。1枚の紙を回転で畳む本エンジンでは編み込みを厳密再現
 * できないため、羽根の折りは簡略化し、組み立ては剛体の平行移動で交差させる見た目
 * 上の組みとしている(README「既知の制約」)。
 */

const ANGLE = 176;
const AX = -1.6; // 1枚目(朱)の展開図での中心x
const BX = 1.6; // 2枚目(藍)の展開図での中心x
const C = 0.6; // 対角線から折り線までのオフセット(小さいほど細い羽根)

// ユニットA(朱, 北東-南西の羽根)のローカル座標。対角線 y=x に沿った細い帯 +
// 北西隅(TL)・南東隅(BR)の折り返しフラップ。
// 折り線 L1: y=x+C(上辺で (1-C,1)、左辺で (-1,-1+C))、L2: y=x-C(右辺で (1,1-C)、下辺で (-1+C,-1))。
const A_LOCAL: [number, number][] = [
  [1, 1], // 0: 北東の尖り
  [1 - C, 1], // 1: 上辺∩L1
  [-1, -1 + C], // 2: 左辺∩L1
  [-1, -1], // 3: 南西の尖り
  [-1 + C, -1], // 4: 下辺∩L2
  [1, 1 - C], // 5: 右辺∩L2
  [-1, 1], // 6: TL(裏へ折る隅)
  [1, -1], // 7: BR(裏へ折る隅)
];

// ユニットB は A を面内で90°回した向き(x,y)->(-y,x)。北西-南東の羽根になる。
function rot90(pt: [number, number]): [number, number] {
  return [-pt[1], pt[0]];
}

const vertices: [number, number][] = [
  ...A_LOCAL.map(([x, y]): [number, number] => [AX + x, y]),
  ...A_LOCAL.map(rot90).map(([x, y]): [number, number] => [BX + x, y]),
];

const faces: number[][] = [
  // ユニットA 帯(六角形 0-1-2-3-4-5 を頂点0から扇状に、表=+z)
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5],
  // ユニットA フラップ(裏へ折る)
  [1, 6, 2], // 北西フラップ(軸 L1 = 1-2)
  [5, 7, 4], // 南東フラップ(軸 L2 = 5-4)
  // ユニットB 帯(頂点8から扇状に)
  [8, 9, 10],
  [8, 10, 11],
  [8, 11, 12],
  [8, 12, 13],
  // ユニットB フラップ
  [9, 14, 10],
  [13, 15, 12],
];

// 各面の所属シート(0=朱, 1=藍)
const faceSheet = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];

const sheetColors = [
  { front: '#e0492f', back: '#b83a24' }, // 朱
  { front: '#2f4b7c', back: '#233a61' }, // 藍
];

// --- 工程 ---

// 1枚目:向かい合う2隅を対角線に沿って裏へ折り、細い羽根にする
const foldA: FoldOp[] = [
  { axis: [1, 2], moving: [6], type: 'mountain', angle: ANGLE },
  { axis: [5, 4], moving: [7], type: 'mountain', angle: ANGLE },
];
// 2枚目:同じ折り(向きが90°ずれている)
const foldB: FoldOp[] = [
  { axis: [9, 10], moving: [14], type: 'mountain', angle: ANGLE },
  { axis: [13, 12], moving: [15], type: 'mountain', angle: ANGLE },
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
      ja: '1枚目(朱)の正方形の、向かい合う2つの角を対角線に沿って裏へ折り、細い羽根にします。',
      en: 'On the first (vermilion) square, fold two opposite corners back along the diagonal into a slim blade.',
    },
    caution: {
      ja: '手裏剣は2枚の紙で作ります。まず1枚目を折ります。',
      en: 'The shuriken uses two sheets. Fold the first one now.',
    },
  },
  {
    folds: foldB,
    description: {
      ja: '2枚目(藍)も同じように羽根に折ります(向きが90°ずれています)。',
      en: 'Fold the second (indigo) square into the same blade — it sits rotated 90°.',
    },
    caution: {
      ja: '2枚目は1枚目に対して90°回した向きに置いてあります。',
      en: 'The second sheet is turned 90° relative to the first.',
    },
  },
  {
    folds: assemble,
    description: {
      ja: '2枚の羽根を中心で十字に交差させて重ね、4方向へ尖りを出して手裏剣にします。',
      en: 'Cross the two blades at the center so four points fan out — the shuriken.',
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
  // 平らな星なのでほぼ正面から(わずかに見下ろす)見せる
  cameraPos: [0, -0.9, 4.6],
  vertices,
  faces,
  faceSheet,
  sheetColors,
  steps,
};
