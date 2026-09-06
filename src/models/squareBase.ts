import type { FoldStep, OrigamiModel } from '../engine/types';

/** 正方基本形。三角に2回折り、手前の袋を開いてつぶす。裏返して反対も同様。
 * 2026-09-06: pocket は4枚の三角パネルの辺長を保つ連動運動。
 * 従来の2本の連鎖回転は中間で面が潰れたため廃止した。
 * 平畳みの2工程は180°で閉じ、後のヒンジから角をずらさない。
 * 袋つぶしは紙の層が見えるよう176°で止める。表示ルートでは開口とつぶしを分ける。
 * 鶴もこの基本形ルートを共有し、細かい折り点を各三角面に追従させる。
 */

/**
 * 白い面を上にして始める(2026-08-24)。実物の折り紙と同じで、**色を出したいときは
 * 白い面を上にして折り始める**(❶で半分に折った時点で色の面が外に出る)。
 * 色面スタートにすると、正しく折るほど完成形は白い面が外になる。
 */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const F: number[][] = [
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5],
  [0, 5, 6],
  [0, 6, 7],
  [0, 7, 8],
  [0, 8, 1],
];

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
    // Fully close this triangle so its stacked corner lies on the next hinge.
    // A 176° stop leaves that corner off-axis and stretches the next fold.
    folds: [{ axis: [2, 6], moving: [3, 4, 5], type: 'valley', angle: 180 }],
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
    folds: [{ axis: [0, 8], moving: [5, 6, 7], type: 'valley', angle: 180 }],
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
    // ❸ 口の点をヒンジ周りに動かし、先端を面の辺長拘束で追従させる。
    folds: [
      { axis: [0, 8], moving: [6, 7], type: 'valley', angle: ANGLE,
        pocket: { rim: 7, tip: 6, pivot: 5 } },
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
    // ❺ 裏返した反対側も、同じ4面の拘束を保ってつぶす。
    folds: [
      { axis: [0, 8], moving: [2, 3], type: 'valley', angle: ANGLE,
        pocket: { rim: 3, tip: 2, pivot: 1 } },
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
  faces: backSideUp(F),
  faceSheet: [0, 0, 0, 0, 0, 0, 0, 0],
  steps,
};
