import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

const ROT = (-112.5 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const S = 2 - Math.SQRT2;
const H = S / 2;
const HEAD_F = 0.28;
const ANGLE = 176;

function r(x: number, y: number): [number, number] {
  return [
    Math.round((x * COS - y * SIN) * 10000) / 10000,
    Math.round((x * SIN + y * COS) * 10000) / 10000,
  ];
}

function step(
  folds: FoldOp[],
  description: FoldStep['description'],
  caution?: FoldStep['caution'],
): FoldStep {
  return caution ? { folds, description, caution } : { folds, description };
}

function oneFold(
  fold: FoldOp,
  description: FoldStep['description'],
  caution?: FoldStep['caution'],
): FoldStep {
  return step([fold], description, caution);
}

function openFold(fold: FoldOp, description: FoldStep['description']): FoldStep {
  return oneFold(
    { ...fold, type: 'unfold', direction: fold.direction === 1 ? -1 : 1 },
    description,
  );
}

const creaseSteps: FoldStep[] = [
  oneFold(
    { axis: [2, 6], moving: [1, 7, 8, 9, 12, 13], type: 'valley', angle: ANGLE, direction: 1 },
    {
      ja: '角と角を合わせ、対角線で三角に谷折りして折りすじをつけます。',
      en: 'Bring opposite corners together and valley-fold a diagonal crease.',
    },
    {
      ja: 'まず、鶴の基本になる折りすじを一般的な順番で作ります。',
      en: 'First, make the standard creases used for a crane base.',
    },
  ),
  openFold(
    { axis: [2, 6], moving: [1, 7, 8, 9, 12, 13], type: 'valley', angle: ANGLE, direction: 1 },
    {
      ja: '紙を開いて、正方形に戻します。',
      en: 'Unfold the paper back to a square.',
    },
  ),
  oneFold(
    { axis: [4, 8], moving: [5, 6, 7, 12], type: 'valley', angle: ANGLE, direction: 1 },
    {
      ja: '反対の対角線でも、角と角を合わせて三角に谷折りします。',
      en: 'Valley-fold the opposite diagonal, again matching corner to corner.',
    },
  ),
  openFold(
    { axis: [4, 8], moving: [5, 6, 7, 12], type: 'valley', angle: ANGLE, direction: 1 },
    {
      ja: 'もう一度開き、2本の対角線の折りすじを残します。',
      en: 'Unfold again, leaving both diagonal creases.',
    },
  ),
  oneFold(
    { axis: [5, 1], moving: [2, 3, 4, 10, 11], type: 'mountain', angle: ANGLE, direction: 1 },
    {
      ja: '辺と辺を合わせて半分に折り、横の折りすじをつけます。',
      en: 'Fold edge to edge in half to make the horizontal crease.',
    },
  ),
  openFold(
    { axis: [5, 1], moving: [2, 3, 4, 10, 11], type: 'mountain', angle: ANGLE, direction: 1 },
    {
      ja: '紙を開いて、正方形に戻します。',
      en: 'Unfold the paper back to a square.',
    },
  ),
  oneFold(
    { axis: [7, 3], moving: [1, 2, 8, 9, 11, 13], type: 'mountain', angle: ANGLE, direction: -1 },
    {
      ja: 'もう一方の辺と辺も合わせて半分に折り、十字の折りすじを完成させます。',
      en: 'Fold the other pair of edges together to complete the cross crease.',
    },
  ),
  openFold(
    { axis: [7, 3], moving: [1, 2, 8, 9, 11, 13], type: 'mountain', angle: ANGLE, direction: -1 },
    {
      ja: '紙を開きます。対角線2本と十字の折りすじができています。',
      en: 'Unfold. You now have both diagonals and the cross creases.',
    },
  ),
];

const squareBaseStep: FoldStep = step(
  [
    {
      axis: [0, 2],
      moving: [3, 4, 5, 6, 7, 8, 10, 12, 13],
      type: 'valley',
      angle: ANGLE,
      direction: -1,
    },
    {
      axis: [0, 3],
      moving: [4, 5, 6, 7, 8, 12, 13],
      type: 'mountain',
      angle: ANGLE,
      direction: 1,
    },
    {
      axis: [0, 4],
      moving: [5, 6, 7, 8, 12, 13],
      type: 'valley',
      angle: ANGLE,
      direction: -1,
    },
    {
      axis: [0, 5],
      moving: [6, 7, 8, 12, 13],
      type: 'mountain',
      angle: ANGLE,
      direction: 1,
    },
    {
      axis: [0, 6],
      moving: [7, 8, 12, 13],
      type: 'valley',
      angle: ANGLE,
      direction: -1,
    },
    { axis: [0, 7], moving: [8, 13], type: 'mountain', angle: ANGLE, direction: 1 },
  ],
  {
    ja: '折りすじに沿って左右を内側へ寄せ、4つの角を下で合わせて正方基本形にたたみます。',
    en: 'Collapse along the creases, bringing the side corners inward and the four corners together at the bottom.',
  },
  {
    ja: '鶴でよく使う「正方基本形」です。開いた角が下に来ます。',
    en: 'This is the square base used for a crane. The open point is at the bottom.',
  },
);

const frontRightFold: FoldOp = {
  axis: [2, 9],
  moving: [1],
  type: 'valley',
  angle: ANGLE,
  direction: 1,
};
const frontLeftFold: FoldOp = {
  axis: [2, 10],
  moving: [3],
  type: 'valley',
  angle: ANGLE,
  direction: -1,
};
const frontTopFold: FoldOp = {
  axis: [9, 10],
  moving: [2],
  type: 'valley',
  angle: ANGLE,
  direction: -1,
};

const frontPetalSteps: FoldStep[] = [
  oneFold(frontRightFold, {
    ja: '手前の右下のふちを、中央の線へ合わせて谷折りします。',
    en: 'Valley-fold the front lower right edge to the center line.',
  }),
  oneFold(frontLeftFold, {
    ja: '手前の左下のふちも、中央の線へ合わせて谷折りします。',
    en: 'Valley-fold the front lower left edge to the center line.',
  }),
  oneFold(frontTopFold, {
    ja: '上の小さな三角を、左右の折りすじの上端に合わせて下へ折ります。',
    en: 'Fold the small top triangle down across the top of the side creases.',
  }),
  openFold(frontTopFold, {
    ja: '上の三角を開き、横の折りすじを残します。',
    en: 'Unfold the top triangle, leaving the horizontal crease.',
  }),
  openFold(frontLeftFold, {
    ja: '左のふちを開き、折りすじを残します。',
    en: 'Unfold the left edge, leaving its crease.',
  }),
  openFold(frontRightFold, {
    ja: '右のふちも開き、花弁折りの準備をします。',
    en: 'Unfold the right edge too, preparing for the petal fold.',
  }),
  step(
    [
      { axis: [2, 9], moving: [1], type: 'valley', angle: ANGLE, direction: 1 },
      { axis: [2, 10], moving: [3], type: 'valley', angle: ANGLE, direction: -1 },
      { axis: [11, 9], moving: [2], type: 'mountain', angle: ANGLE, direction: -1 },
    ],
    {
      ja: '手前の1枚を下から開き、左右の折りすじを内側へたたみながら上へ花弁折りします。',
      en: 'Open the front layer from the bottom and petal-fold it upward, tucking the side creases inward.',
    },
  ),
];

const backRightFold: FoldOp = {
  axis: [8, 12],
  moving: [7],
  type: 'valley',
  angle: ANGLE,
  direction: 1,
};
const backLeftFold: FoldOp = {
  axis: [8, 9],
  moving: [1],
  type: 'valley',
  angle: ANGLE,
  direction: -1,
};
const backTopFold: FoldOp = {
  axis: [12, 9],
  moving: [8],
  type: 'valley',
  angle: ANGLE,
  direction: 1,
};

const backPetalSteps: FoldStep[] = [
  oneFold(backRightFold, {
    ja: '裏側も同じように、右下のふちを中央の線へ合わせて谷折りします。',
    en: 'On the back, valley-fold the lower right edge to the center line in the same way.',
  }),
  oneFold(backLeftFold, {
    ja: '裏側の左下のふちも、中央の線へ合わせて谷折りします。',
    en: 'Valley-fold the back lower left edge to the center line.',
  }),
  oneFold(backTopFold, {
    ja: '裏側の上の小さな三角を下へ折り、横の折りすじをつけます。',
    en: 'Fold the small top triangle on the back down to make the horizontal crease.',
  }),
  openFold(backTopFold, {
    ja: '裏側の上の三角を開き、横の折りすじを残します。',
    en: 'Unfold the back top triangle, leaving the horizontal crease.',
  }),
  openFold(backLeftFold, {
    ja: '裏側の左のふちを開き、折りすじを残します。',
    en: 'Unfold the back left edge, leaving its crease.',
  }),
  openFold(backRightFold, {
    ja: '裏側の右のふちも開き、花弁折りの準備をします。',
    en: 'Unfold the back right edge too, preparing for the petal fold.',
  }),
  step(
    [
      { axis: [8, 12], moving: [7], type: 'valley', angle: ANGLE, direction: 1 },
      { axis: [8, 9], moving: [1], type: 'valley', angle: ANGLE, direction: -1 },
      { axis: [13, 12], moving: [8], type: 'mountain', angle: ANGLE, direction: 1 },
    ],
    {
      ja: '裏側の1枚も下から開き、左右を内側へたたみながら花弁折りして鶴の基本形にします。',
      en: 'Open the back layer from the bottom and petal-fold it, tucking the sides inward to form the crane base.',
    },
  ),
];

const craneHeadA: FoldOp = {
  axis: [9, 10],
  moving: [2, 14, 15],
  type: 'inside-reverse',
  angle: 118,
  sweep: 'front',
};
const craneTail: FoldOp = {
  axis: [12, 9],
  moving: [8],
  type: 'inside-reverse',
  angle: 116,
  sweep: 'back',
};
const craneHeadTip: FoldOp = {
  axis: [14, 15],
  moving: [2],
  type: 'inside-reverse',
  angle: 112,
  sweep: 'front',
};
const frontWing: FoldOp = {
  axis: [0, 5],
  moving: [4],
  type: 'valley',
  angle: 82,
  direction: 1,
};
const backWing: FoldOp = {
  axis: [0, 7],
  moving: [6],
  type: 'valley',
  angle: 82,
  direction: -1,
};

const finishSteps: FoldStep[] = [
  oneFold(
    craneHeadA,
    {
      ja: '右の細い先を紙の間で上へ中割り折りして、首を立てます。',
      en: 'Inside-reverse the thin right point upward between the layers to raise the neck.',
    },
    {
      ja: '先端を外へかぶせず、左右の紙の間へ割り込ませます。',
      en: 'Tuck the point between the left and right layers, not over the outside.',
    },
  ),
  oneFold(craneTail, {
    ja: '反対側の細い先も中割り折りして、尾を少し上げます。',
    en: 'Inside-reverse the opposite thin point too, lifting it slightly to form the tail.',
  }),
  oneFold(
    craneHeadTip,
    {
      ja: '首の先を小さく下へ中割り折りして、頭を作ります。',
      en: 'Inside-reverse the tip of the neck downward to make the head.',
    },
    {
      ja: '小さく折ると、くちばしが短く整います。',
      en: 'A small fold keeps the beak short and tidy.',
    },
  ),
  oneFold(frontWing, {
    ja: '手前の大きな三角を下へ谷折りして、片方の羽を下げます。',
    en: 'Valley-fold the large front triangle downward to lower one wing.',
  }),
  oneFold(backWing, {
    ja: '反対側の大きな三角も下へ谷折りし、形を整えて鶴の完成です。',
    en: 'Valley-fold the opposite large triangle downward and shape the finished crane.',
  }),
];
/**
 * 鶴 / Crane
 *
 * 一般的な鶴の序盤:対角線と十字の折りすじを作る → 正方基本形 →
 * 前後の花弁折りで鳥の基本形へ進み、首・尾・頭・羽まで折るモデル。
 * 花弁折りの追加頂点は、未回転の紙座標で s = 2 - sqrt(2) の角度二等分点を
 * 置いてから squareBaseModel と同じ -112.5° 回転をかけている。
 */
export const craneModel: OrigamiModel = {
  id: 'crane',
  name: { ja: '鶴', en: 'Crane' },
  difficulty: 5,
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
    r(1 + HEAD_F * (S - 1), 1 - HEAD_F), // 14: 頭の中割り折り線・右端
    r(1 - HEAD_F, 1 + HEAD_F * (S - 1)), // 15: 頭の中割り折り線・左端
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
  steps: [...creaseSteps, squareBaseStep, ...frontPetalSteps, ...backPetalSteps, ...finishSteps],
};
