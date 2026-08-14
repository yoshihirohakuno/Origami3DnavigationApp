import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * さいふ / Wallet(全4工程)
 *
 * 原典照合前の新規作品。正方形を3分割の目印で左右・上下から畳む、
 * 平たい封入型のさいふ。紙の表は青緑、裏は白で扱い、白い裏面を上にして始める。
 *
 * 展開図は 3x3 の格子。左右の1/3を中心へ、上下の1/3を中心へ順に折る。
 * 共有頂点のままでも破綻しないよう、各折りは外周列/行の頂点だけを動かす。
 */

const XS = [-1, -1 / 3, 1 / 3, 1];
const YS = [-1, -1 / 3, 1 / 3, 1];

const V: [number, number][] = [];
for (const y of YS) {
  for (const x of XS) V.push([x, y]);
}

const id = (ix: number, iy: number) => iy * 4 + ix;

const F: number[][] = [];
for (let iy = 0; iy < 3; iy++) {
  for (let ix = 0; ix < 3; ix++) {
    F.push([id(ix, iy), id(ix + 1, iy), id(ix + 1, iy + 1), id(ix, iy + 1)]);
  }
}

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

const LEFT = [id(0, 0), id(0, 1), id(0, 2), id(0, 3)];
const RIGHT = [id(3, 0), id(3, 1), id(3, 2), id(3, 3)];
const BOTTOM = [id(0, 0), id(1, 0), id(2, 0), id(3, 0)];
const TOP = [id(0, 3), id(1, 3), id(2, 3), id(3, 3)];

const steps: FoldStep[] = [
  {
    folds: [{ axis: [id(1, 0), id(1, 3)], moving: LEFT, type: 'valley', angle: 176 }],
    description: {
      ja: '左の3分の1を、まんなかへ折ります。',
      en: 'Fold the left third in toward the middle.',
    },
    caution: {
      ja: '紙の表は色面、裏は白です。白い裏面を上にして始めます。',
      en: 'The colored side is the front and the reverse is white. Start with the white reverse side up.',
    },
  },
  {
    folds: [{ axis: [id(2, 0), id(2, 3)], moving: RIGHT, type: 'valley', angle: 176 }],
    description: {
      ja: '右の3分の1も、まんなかへ折ります。',
      en: 'Fold the right third in toward the middle as well.',
    },
    caution: {
      ja: '左右のふちが、中央で少し重なる形になります。',
      en: 'The two side edges meet and slightly overlap at the center.',
    },
  },
  {
    // 軸は❶❷で動いていない内側の格子点で取る(外周の id(0,1)/id(3,1) は左右の折りで
    // 動いているので、そのまま軸にすると軸が z 方向に傾いて完成形が破綻する)
    folds: [{ axis: [id(1, 1), id(2, 1)], moving: BOTTOM, type: 'valley', angle: 176 }],
    description: {
      ja: '下の3分の1を、上へ折ります。',
      en: 'Fold the bottom third upward.',
    },
    caution: {
      ja: '下のふちが、中央の帯に重なります。',
      en: 'The lower edge overlaps the middle band.',
    },
  },
  {
    folds: [{ axis: [id(1, 2), id(2, 2)], moving: TOP, type: 'valley', angle: 174 }],
    description: {
      ja: '上の3分の1を下へ折って、さいふのできあがり。',
      en: 'Fold the top third down to finish the wallet.',
    },
    caution: {
      ja: '小さな平たい長方形になります。',
      en: 'It becomes a small flat rectangle.',
    },
  },
];

export const walletModel: OrigamiModel = {
  id: 'wallet',
  name: { ja: 'さいふ', en: 'Wallet' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: backSideUp(F.map(orient)),
  faceSheet: F.map(() => 0),
  sheetColors: [{ front: '#3c8f8f', back: '#f6f2e8' }],
  steps,
};
