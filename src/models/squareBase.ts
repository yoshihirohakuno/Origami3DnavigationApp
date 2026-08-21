import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * 正方基本形 / Square Base(全5工程)— 鶴への第一歩。
 * 原典 https://www.origami-club.com/traditional/crane/zu.html の❶〜❻と同じ手順。
 *
 *   ❶ はんぶんに おる(対角線で三角に)
 *   ❷ はんぶんに おる(さらに半分の三角に)
 *   ❸ ふくろを ひらいて つぶす
 *   ❹ うらがえす
 *   ❺ おなじように ふくろを つぶす
 *
 * **2026-08-15 に作り直した(2回目)。** それまでは「対角線と十字の折りすじを
 * つけて戻す」を4本ぶん(8工程)並べてから1工程で畳んでいたが、
 * **原典には折りすじをつけて戻す工程が無い**。三角に2回折ってから袋を開いてつぶす
 * のが本来の手順で、戻す工程は要らない(ユーザー指摘 2026-08-15)。
 *
 * 幾何(紙は [-1,1] の正方形。O=中心、E/N/W/S=辺の中点、NE/NW/SW/SE=角):
 * - ❶ 対角線 NE-SW で、北西の半分を南東へ折る。N→E / NW→SE / W→S に重なる
 * - ❷ 対角線 O-SE で、南西の半分を北東へ折る。**4つの辺の中点が1点(E)に重なり、
 *   角は NE と SE の2点に2枚ずつ重なる**四分の一の三角形になる
 * - ❸ **袋を開いてつぶす**。エンジンでは2回の連鎖回転で表す:
 *   ①手前の層を❷の折り線(O-SE)で開き(SW角とS中点が回る)、
 *   ②できた折り目 O-S で角を折り返す。SW角が SE角に重なり、S中点が紙の S の位置へ戻る
 * - ❺ うらがえしたあと、まったく同じ2回の回転で反対側の袋をつぶす(NE角とN中点)
 * - 完成形は一辺 √2 のひし形。閉じた角が O、開いた4つの角(紙の4隅)が反対の頂点。
 *   シート全体を -45° 回転してあるので、画面では閉じた角が上・開いた角が下になる
 *
 * 鶴(`src/models/crane.ts`)は折りすじ先行の collapse で正方基本形を作っており、
 * ルートが違う(2026-08-13 にユーザー判断で現行維持と決定済み)。
 */

const ROT = (-45 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const ANGLE = 176;

function r(x: number, y: number): [number, number] {
  return [
    Math.round((x * COS - y * SIN) * 10000) / 10000,
    Math.round((x * SIN + y * COS) * 10000) / 10000,
  ];
}

const steps: FoldStep[] = [
  {
    // ❶ 対角線 NE-SW で三角に折る(北西の半分が南東へ回る)
    folds: [{ axis: [2, 6], moving: [3, 4, 5], type: 'valley', angle: ANGLE }],
    description: {
      ja: '角と角を合わせて、対角線で三角に折ります。',
      en: 'Bring opposite corners together and fold into a triangle.',
    },
    caution: {
      ja: '鶴の土台になる「正方基本形」を作ります。折りすじをつけて戻す必要はありません。',
      en: 'We are making the square base for the crane — no pre-creasing needed.',
    },
  },
  {
    // ❷ もう半分。4つの辺の中点が1点に重なる
    folds: [{ axis: [0, 8], moving: [5, 6, 7], type: 'valley', angle: ANGLE }],
    description: {
      ja: 'もう一度はんぶんに折って、小さな三角にします。',
      en: 'Fold in half again into a smaller triangle.',
    },
    caution: {
      ja: '4つの辺の中点がぴったり1点に重なります。',
      en: 'All four edge midpoints stack up on a single point.',
    },
  },
  {
    // ❸ 袋を開いてつぶす(①❷の折り線で開く → ②できた折り目で角を折り返す)
    folds: [
      { axis: [0, 8], moving: [6, 7], type: 'valley', angle: ANGLE },
      { axis: [0, 7], moving: [6], type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: '手前のふくろを開いて、四角くつぶします。',
      en: 'Open the front pocket and squash it flat into a square.',
    },
    caution: {
      ja: '中に指を入れて開き、角どうしが合うように押しつぶします。',
      en: 'Slip a finger inside, open it up, and press it flat so the corners meet.',
    },
  },
  {
    // ❹ うらがえす(軸は完成形の対称軸=O と 4隅の重なる点を結ぶ線)
    folds: [{ axis: [0, 8], moving: [1, 2, 3, 4, 5, 6, 7], type: 'assemble', angle: 180, direction: 1 }],
    description: { ja: 'うらがえします。', en: 'Turn it over.' },
  },
  {
    // ❺ 反対側のふくろも同じようにつぶす
    folds: [
      { axis: [0, 8], moving: [2, 3], type: 'valley', angle: ANGLE },
      { axis: [0, 3], moving: [2], type: 'valley', angle: ANGLE },
    ],
    description: {
      ja: 'こちらのふくろも同じように開いて、つぶします。正方基本形のできあがり。',
      en: 'Open and squash this pocket the same way — the square base is done.',
    },
    caution: {
      ja: '閉じた角が上、開いた4つの角が下のひし形になります。',
      en: 'You get a diamond: closed point up, four open corners down.',
    },
  },
];

export const squareBaseModel: OrigamiModel = {
  id: 'square-base',
  name: { ja: '正方基本形', en: 'Square Base' },
  difficulty: 1,
  vertices: [
    r(0, 0), //  0: 中心O(完成形の閉じた角)
    r(1, 0), //  1: 辺中点E
    r(1, 1), //  2: 角NE(❺でつぶす側)
    r(0, 1), //  3: 辺中点N
    r(-1, 1), //  4: 角NW
    r(-1, 0), //  5: 辺中点W
    r(-1, -1), //  6: 角SW(❸でつぶす側)
    r(0, -1), //  7: 辺中点S
    r(1, -1), //  8: 角SE(❷❸❺の軸。完成形で4隅が重なる点)
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
