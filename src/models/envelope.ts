import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ふうとう / Envelope(全4工程)
 *
 * ひし形に置いた正方形から、左右・下・上の角を中心へ畳む簡単な封筒。
 * 原典照合前の新規作品。紙の表は金茶、裏は白で扱い、白い裏面を上にして
 * 始めることで、折ったフラップの色面が外側に出る。
 *
 * 展開図は、ひし形を4つの角フラップと中央の正方形に分ける:
 * - 左右の折り線: x=±0.5
 * - 下の折り線: y=-0.5
 * - 上の折り線: y=0.5
 * 各角は中心(0,0)へ着地する。
 */

const V: [number, number][] = [
  [0, 1], // 0: 上の角
  [1, 0], // 1: 右の角
  [0, -1], // 2: 下の角
  [-1, 0], // 3: 左の角
  [0, 0], // 4: 中心(4つの角の着地点)
  [-0.5, 0.5], // 5: 左折り線・上 / 上折り線・左
  [-0.5, -0.5], // 6: 左折り線・下 / 下折り線・左
  [0.5, 0.5], // 7: 右折り線・上 / 上折り線・右
  [0.5, -0.5], // 8: 右折り線・下 / 下折り線・右
];

const F: number[][] = [
  [3, 5, 6], // 左フラップ
  [1, 8, 7], // 右フラップ
  [2, 6, 8], // 下フラップ
  [0, 7, 5], // 上フラップ
  [5, 7, 8, 6], // 中央
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

const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const steps: FoldStep[] = [
  {
    folds: [{ axis: [5, 6], moving: [3], type: 'valley', angle: 176 }],
    description: {
      ja: '左の角を、まんなかへ折ります。',
      en: 'Fold the left corner to the center.',
    },
    caution: {
      ja: '紙の表は色面、裏は白です。白い裏面を上にして始めます。',
      en: 'The colored side is the front and the reverse is white. Start with the white reverse side up.',
    },
  },
  {
    folds: [{ axis: [7, 8], moving: [1], type: 'valley', angle: 176 }],
    description: {
      ja: '右の角も、まんなかへ折ります。',
      en: 'Fold the right corner to the center as well.',
    },
    caution: {
      ja: '左右の先が、まんなかで合わさります。',
      en: 'The left and right tips meet at the center.',
    },
  },
  {
    folds: [{ axis: [6, 8], moving: [2], type: 'valley', angle: 176 }],
    description: {
      ja: '下の角を、まんなかへ折り上げます。',
      en: 'Fold the bottom corner up to the center.',
    },
    caution: {
      ja: '下の先が、左右の角の上に重なります。',
      en: 'The bottom tip lands over the side flaps.',
    },
  },
  {
    folds: [{ axis: [5, 7], moving: [0], type: 'valley', angle: 176 }],
    description: {
      ja: '上の角を下へ折って、ふうとうのできあがり。',
      en: 'Fold the top corner down to finish the envelope.',
    },
    caution: {
      ja: '最後のフラップが、ふたになります。',
      en: 'The final flap becomes the closure.',
    },
  },
];

export const envelopeModel: OrigamiModel = {
  id: 'envelope',
  name: { ja: 'ふうとう', en: 'Envelope' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: backSideUp(F.map(orient)),
  faceSheet: F.map(() => 0),
  sheetColors: [{ front: '#c99a4a', back: '#f6f2e8' }],
  steps,
};
