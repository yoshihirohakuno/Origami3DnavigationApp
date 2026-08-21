import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

/**
 * 正方基本形 / Square Base(全9工程)— 鶴への第一歩。
 *
 *   ❶ 対角線で三角に折って、折りすじをつけて開く(2工程)
 *   ❷ もう1本の対角線でも同じように(2工程)
 *   ❸ 辺と辺を合わせて半分に折り、折りすじをつけて開く(2工程)
 *   ❹ もう一方の辺どうしでも同じように(2工程)
 *   ❺ 折りすじに沿ってたたみ、4つの角を下で合わせる
 *
 * **2026-08-15 に作り直した。** それまでは「たたむ」1工程だけで、しかも
 * 中心まわりの8つの扇形を**全部**畳んでいたため、完成形が45°の三角形になっていた。
 * 本物の正方基本形は**ひし形**で、対角線は面の中で平ら(180°)のままになり、
 * 折れるのは十字の折りすじ(中線)だけ。鶴の `squareBaseStep` と同じ
 * 「中線3本の連鎖回転」に直し、折りすじをつける工程も順番に見せるようにした。
 *
 * 幾何は鶴(`src/models/crane.ts`)の❶〜❾とまったく同じ。頂点も同じ並びで、
 * 鶴の展開図から花弁折り・首・頭のための点を落としたもの。
 * シート全体を -135° 回転してあるのも鶴と同じで、これで完成形が
 * 「閉じた角が上・開いた角が下」の正規の向きになる。
 */

const ROT = (-135 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const ANGLE = 176;

function r(x: number, y: number): [number, number] {
  return [
    Math.round((x * COS - y * SIN) * 10000) / 10000,
    Math.round((x * SIN + y * COS) * 10000) / 10000,
  ];
}

/** 折って戻す2工程を作る(戻しの符号は鶴と同じ規則) */
function crease(fold: FoldOp, ja: string, en: string, backJa: string, backEn: string): FoldStep[] {
  return [
    { folds: [fold], description: { ja, en } },
    {
      folds: [{ ...fold, type: 'unfold', direction: fold.direction === 1 ? -1 : 1 }],
      description: { ja: backJa, en: backEn },
    },
  ];
}

const steps: FoldStep[] = [
  ...crease(
    { axis: [2, 6], moving: [1, 7, 8], type: 'valley', angle: ANGLE, direction: 1 },
    '角と角を合わせ、対角線で三角に折ります。',
    'Bring opposite corners together and fold a diagonal.',
    '開いて、正方形に戻します。',
    'Unfold back to a square.',
  ),
  ...crease(
    { axis: [4, 8], moving: [5, 6, 7], type: 'valley', angle: ANGLE, direction: 1 },
    'もう1本の対角線でも、角と角を合わせて折ります。',
    'Fold the other diagonal, matching corner to corner.',
    'もう一度開きます。対角線の折りすじが2本できました。',
    'Unfold again — both diagonal creases are now in place.',
  ),
  ...crease(
    { axis: [5, 1], moving: [2, 3, 4], type: 'mountain', angle: ANGLE, direction: 1 },
    '辺と辺を合わせて半分に折り、よこの折りすじをつけます。',
    'Fold edge to edge in half for the horizontal crease.',
    '開いて、正方形に戻します。',
    'Unfold back to a square.',
  ),
  ...crease(
    { axis: [7, 3], moving: [1, 2, 8], type: 'mountain', angle: ANGLE, direction: -1 },
    'もう一方の辺どうしも合わせて半分に折り、十字の折りすじにします。',
    'Fold the other pair of edges together to complete the cross crease.',
    '開きます。対角線2本と十字の折りすじがそろいました。',
    'Unfold. You now have both diagonals and the cross creases.',
  ),
  {
    // ❺ たたみ込み。対角線は面の中で平ら(180°)のままで、折れるのは中線だけ。
    // 固定面(前面)から中線3本を軸に ±176° の連鎖回転でアコーディオン状に畳む
    folds: [
      { axis: [0, 3], moving: [4, 5, 6, 7, 8], type: 'mountain', angle: ANGLE, direction: 1 },
      { axis: [0, 5], moving: [6, 7, 8], type: 'valley', angle: ANGLE, direction: -1 },
      { axis: [0, 7], moving: [8], type: 'mountain', angle: ANGLE, direction: 1 },
    ],
    description: {
      ja: '折りすじに沿って左右を内側へ寄せ、4つの角を下で合わせてたたみます。',
      en: 'Collapse along the creases, bringing the four corners together at the bottom.',
    },
    caution: {
      ja: '鶴でよく使う「正方基本形」です。閉じた角が上、開いた4つの角が下に来ます。',
      en: 'This is the square base used for the crane: closed point up, four open corners down.',
    },
  },
];

export const squareBaseModel: OrigamiModel = {
  id: 'square-base',
  name: { ja: '正方基本形', en: 'Square Base' },
  difficulty: 1,
  vertices: [
    r(0, 0), //  0: 中心O(完成形の閉じた角・上)
    r(1, 0), //  1: 辺中点E
    r(1, 1), //  2: 角NE
    r(0, 1), //  3: 辺中点N
    r(-1, 1), //  4: 角NW
    r(-1, 0), //  5: 辺中点W
    r(-1, -1), //  6: 角SW
    r(0, -1), //  7: 辺中点S
    r(1, -1), //  8: 角SE
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
  faceSheet: [0, 0, 0, 0, 0, 0, 0, 0],
  steps,
};
