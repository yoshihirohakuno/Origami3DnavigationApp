import type { FoldStep, OrigamiModel } from '../engine/types';

/** おたまじゃくし。三角2回から手前の袋をつぶし、尾を後ろへ折る。
 * 2026-09-06: 袋は正方基本形と同じ pocket の拘束式で開く。
 * 開口とつぶしを別工程にする。尾の2層は1回の折りとして連動させる。
 */

/** 面の頂点順を反時計回りにそろえる */
function orient(f: number[], V: [number, number][]): number[] {
  let a = 0;
  for (let i = 0; i < f.length; i++) {
    const p = V[f[i]];
    const q = V[f[(i + 1) % f.length]];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a >= 0 ? f : [...f].reverse();
}

/** 白い面を上にして始める(折り図❶が白いひし形) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

/**
 * ❹の折り線。上のふち側 AX と、折り目 O-(-0.5,-0.5) の上の点 BX。
 * **BX=-1/4 は折り目 O-(-0.5,-0.5) のちょうど中点**(折り図❺の破線の下端の実測 -0.273)。
 * **AX=-1/3**(実測 -0.355〜-0.361。数px差で、完成図❻の尾の先の x=0.211 と一致するのはこちら)。
 * 折り図❺の破線と完成図❻の尾は1割ほど食い違うので、両方に近い厳密値を採った。
 */
const AX = -1 / 3;
const BX = -1 / 4;

const V: [number, number][] = [
  [0, 0], //  0 O   紙の中心(完成形では体の上の角)
  [0.5, -0.5], //  1 右下の辺の中点
  [1, 0], //  2 右の角
  [0.5, 0.5], //  3 右上の辺の中点
  [0, 1], //  4 上の角(❶で下の角へ)
  [-0.5, 0.5], //  5 左上の辺の中点
  [-1, 0], //  6 左の角(❹でうしろへ回って尾の先になる)
  [-0.5, -0.5], //  7 左下の辺の中点
  [0, -1], //  8 下の角
  [AX, 0], //  9 ❹の折り線 ∩ 上のふち(❶の折り目)
  [BX, BX], // 10 ❹の折り線 ∩ 折り目 O-7(下の層)
  [BX, -BX], // 11 同・上の層(❶の折り線 y=0 で鏡映)
  [-0.5, 0.5], // 12 5 の複製(尾の上の層。体の左上は動かさないので分ける)
  [-0.5, -0.5], // 13 7 の複製(尾の下の層)
  [-1, 0], // 14 6 の複製(尾の上の層。2層の z を別々にするため先も分ける)
];

const F: number[][] = [
  [0, 1, 2], // 右半分(❷で左へ、❸でつぶす)
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5], // 体の左上(❶で下へ回って体の面になる)
  [0, 7, 8], // 体の左下
  [0, 11, 9], // 尾の上の層・折らない側
  [9, 11, 12, 14], // 尾の上の層(❹でうしろへ。奥に入る)
  [0, 9, 10], // 尾の下の層・折らない側
  [9, 6, 13, 10], // 尾の下の層(❹でうしろへ)
];

/** ❶で下へ回る上半分 */
const UPPER = [3, 4, 5, 11, 12, 14];
/** ❷で左へ回る右半分 */
const RIGHT = [1, 2, 3];
/**
 * ❹でうしろへ回る尾。**2層を別々に回す**(折るとフラップの前後が入れ替わるので、
 * 残差角の階段で層順を作る)。うしろへ回ると、それまで下にいた層(動いていない層)が
 * 手前に来て緑を見せ、上にいた層(❶で下りてきた層)が奥へ入る。
 */
const TAIL_FRONT = [6, 13]; //  手前に出る層(白い面が裏返って緑になる)
const TAIL_BACK = [14, 12]; //  奥へ入る層

const ANGLE = 176;

const steps: FoldStep[] = [
  {
    // ❶ 上の角を下の角へ(ひし形 → 三角)
    folds: [{ axis: [2, 6], moving: UPPER, type: 'valley', angle: 180 }],
    description: {
      ja: '上の角を下の角に合わせて、はんぶんに折ります。',
      en: 'Fold in half, bringing the top corner down to the bottom.',
    },
    caution: {
      ja: '白い面を上にして始めます。折ると色の面が外に出ます。',
      en: 'Start white side up — folding brings the colored side out.',
    },
  },
  {
    // ❷ 右半分を左へ(三角 → 直角三角形。4枚に重なる)
    folds: [{ axis: [0, 8], moving: RIGHT, type: 'valley', angle: 180 }],
    description: {
      ja: 'もう一度はんぶんに、右半分を左へ折ります。',
      en: 'Fold in half again, right half over to the left.',
    },
    caution: {
      ja: '紙が4枚に重なります。',
      en: 'The paper is now four layers thick.',
    },
  },
  {
    // ❸ 口の点をヒンジ周りに動かし、先端を面の辺長拘束で追従させる。
    folds: [
      { axis: [0, 8], moving: [2, 1], type: 'valley', angle: ANGLE,
        pocket: { rim: 1, tip: 2, pivot: 3 } },
    ],
    description: {
      ja: '手前のふくろを開いて、つぶします。',
      en: 'Open the front pocket and squash it flat.',
    },
    caution: {
      ja: '中に指を入れて開き、四角い「体」になるように押しつぶします。',
      en: 'Slip a finger inside and press it flat into the square body.',
    },
  },
  {
    // ❹(折り図❺) 尾の三角をうしろへ。回った紙が上のふちより上に出て尾になる
    folds: [
      { axis: [9, 10], moving: TAIL_FRONT, type: 'mountain', angle: 178 },
      { axis: [9, 10], moving: TAIL_BACK, type: 'mountain', angle: 172 },
    ],
    description: {
      ja: '左の角を、てんせんでうしろに折ります。目を描いてできあがり。',
      en: 'Fold the left corner behind along the dashed line, then draw the eyes.',
    },
    caution: {
      ja: 'うしろへ回った紙が上に出て、細い尾になります。',
      en: 'The paper that goes behind comes up above the edge as the thin tail.',
    },
  },
];

export const tadpoleModel: OrigamiModel = {
  id: 'tadpole',
  name: { ja: 'おたまじゃくし', en: 'Tadpole' },
  difficulty: 2,
  vertices: V,
  faces: backSideUp(F.map((f) => orient(f, V))),
  faceSheet: F.map(() => 0),
  // 折り図の黄緑を実測(#b5dd4f 相当) / 裏は白
  sheetColors: [{ front: '#b3d94f', back: '#f6f2e8' }],
  steps,
};
