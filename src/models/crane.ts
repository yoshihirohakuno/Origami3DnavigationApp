import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

const ROT = (-135 * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);
const S = 2 - Math.SQRT2;
const H = S / 2;
const ANGLE = 176;

/**
 * 頭の中割り折り線。畳んだ首(角6のフラップ)は先端角±22.5°の細い三角形で、
 * 両縁はタック線6-16 / 6-12、中心の束に対角線0-6と紙の辺6-7/6-5が重なる。
 * 折り線は畳んだ状態で直線になるように、両縁の折り点の高さ(先端からの距離)
 * HEAD_L / HEAD_R を指定し、中心の束は平均高さで折る。高低差が折り線の傾き
 * となり、折り返したくちばしの向きを決める。
 */
const HEAD_L = 0.09; // タック線6-16上の折り点の高さ
const HEAD_R = 0.21; // タック線6-12上の折り点の高さ
const HEAD_MID = (HEAD_L + HEAD_R) / 2;

function r(x: number, y: number): [number, number] {
  return [
    Math.round((x * COS - y * SIN) * 10000) / 10000,
    Math.round((x * SIN + y * COS) * 10000) / 10000,
  ];
}

/**
 * 頭の折り線の端点(未回転シート座標)。
 * 中心の束(HP=対角線上、HQ/HQM=紙の辺上の鏡映対)は高さHEAD_MID、
 * 縁のHT(タック線6-16上)は高さHEAD_L、HU(タック線6-12上)は高さHEAD_R。
 * タック線上の点は角6から高さuのとき (±(√2-1)u, u) だけ角から離れる。
 */
const HP: [number, number] = [-1 + HEAD_MID / Math.SQRT2, -1 + HEAD_MID / Math.SQRT2];
const HQ: [number, number] = [-1 + HEAD_MID, -1];
const HQM: [number, number] = [-1, -1 + HEAD_MID];
const HT: [number, number] = [-1 + (Math.SQRT2 - 1) * HEAD_L, -1 + HEAD_L];
const HU: [number, number] = [-1 + HEAD_R, -1 + (Math.SQRT2 - 1) * HEAD_R];

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
    { axis: [2, 6], moving: [1, 7, 8, 9, 12, 13, 15, 19], type: 'valley', angle: ANGLE, direction: 1 },
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
    { axis: [2, 6], moving: [1, 7, 8, 9, 12, 13, 15, 19], type: 'valley', angle: ANGLE, direction: 1 },
    {
      ja: '紙を開いて、正方形に戻します。',
      en: 'Unfold the paper back to a square.',
    },
  ),
  oneFold(
    {
      axis: [4, 8],
      moving: [5, 6, 7, 12, 14, 15, 16, 17, 18, 19],
      type: 'valley',
      angle: ANGLE,
      direction: 1,
    },
    {
      ja: '反対の対角線でも、角と角を合わせて三角に谷折りします。',
      en: 'Valley-fold the opposite diagonal, again matching corner to corner.',
    },
  ),
  openFold(
    {
      axis: [4, 8],
      moving: [5, 6, 7, 12, 14, 15, 16, 17, 18, 19],
      type: 'valley',
      angle: ANGLE,
      direction: 1,
    },
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

/**
 * 正方基本形のたたみ込み。
 * 本物の正方基本形では対角線は面の中で平ら(180°)のままで、
 * 折れるのは十字の折りすじ(中線)4本だけ。固定面(S1+S2=前面)から
 * 中線3本を軸に±176°の連鎖回転でアコーディオン状に畳む。
 */
const squareBaseStep: FoldStep = step(
  [
    {
      axis: [0, 3],
      moving: [4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 17, 18, 19],
      type: 'mountain',
      angle: ANGLE,
      direction: 1,
    },
    {
      axis: [0, 5],
      moving: [6, 7, 8, 12, 13, 14, 15, 17, 18, 19],
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
      // 頂点1・3(外側ページ)は前面の花弁折りで畳み済み。裏面では
      // 内側ページの側点5・7をタックし、先端8を持ち上げる。
      { axis: [8, 12], moving: [7], type: 'valley', angle: ANGLE, direction: -1 },
      // タックで回る三角16-5-6には頭の折り線の端点17も含まれる
      { axis: [6, 16], moving: [5, 17], type: 'valley', angle: ANGLE, direction: 1 },
      // 辺6-7側の折り込み(タック線6-12)。頂点7は8側のタックで動き済みのため
      // ここでは頭の折り線の端点15だけが回る
      { axis: [6, 12], moving: [15], type: 'valley', angle: ANGLE, direction: -1 },
      { axis: [13, 12], moving: [8], type: 'mountain', angle: ANGLE, direction: -1 },
    ],
    {
      ja: '裏側の1枚も下から開き、左右を内側へたたみながら花弁折りして鶴の基本形にします。',
      en: 'Open the back layer from the bottom and petal-fold it, tucking the sides inward to form the crane base.',
    },
  ),
];

/**
 * 仕上げ。鳥の基本形の下に残る2本の細い先(角4・6)が首と尾、
 * 花弁折りで持ち上げた先端(2・8)が羽になる。
 */
/**
 * 首・尾の中割り折り。ほぼ180°の中割りで垂直に立てたあと、
 * [11,13](平面視で同一点・奥行き違い=視線方向の軸)まわりの回転で
 * 体の面内で左右に開かせる。
 */
const NECK_SPLAY = 32;
const craneNeck: FoldOp[] = [
  { axis: [9, 13], moving: [6, 14, 15, 17, 18, 19], type: 'inside-reverse', angle: ANGLE, sweep: 'front' },
  { axis: [11, 13], moving: [6, 14, 15, 17, 18, 19], type: 'inside-reverse', angle: NECK_SPLAY, direction: 1 },
];
const craneTail: FoldOp[] = [
  { axis: [13, 10], moving: [4], type: 'inside-reverse', angle: ANGLE, sweep: 'back' },
  { axis: [11, 13], moving: [4], type: 'inside-reverse', angle: NECK_SPLAY, direction: -1 },
];
/**
 * 頭。首の先端(角6)を両縁の折り点18-19を軸に中割り折りして、くちばしを作る。
 * 中心の束の折り点14/15/17は先端と一緒に折り返る(背骨が内側に反転する)。
 */
const craneHead: FoldOp[] = [
  { axis: [18, 19], moving: [6, 14, 15, 17], type: 'inside-reverse', angle: ANGLE, sweep: 'front' },
];
const WING_ANGLE = 72;
const frontWing: FoldOp = {
  axis: [9, 10],
  moving: [2],
  type: 'valley',
  angle: WING_ANGLE,
  direction: 1,
};
const backWing: FoldOp = {
  axis: [9, 10],
  moving: [8],
  type: 'valley',
  angle: WING_ANGLE,
  direction: -1,
};

/**
 * 工程列。序盤は「折りすじをつけて開く→折りすじに沿って正方基本形にたたむ」
 * という標準手順(実折りの三角×2からのつぶし折りは連鎖回転で表現できないため、
 * 幾何的に等価で検証済みのこの手順を採用)。
 */
const siteCraneSteps: FoldStep[] = [
  ...creaseSteps,
  squareBaseStep,
  frontPetalSteps[6],
  backPetalSteps[6],
  step(
    craneNeck,
    {
      ja: '下の細い先の1本を、紙の間へ割り込ませながら斜め上へ中割り折りして首にします。',
      en: 'Inside-reverse one thin lower point diagonally upward between the layers to form the neck.',
    },
    {
      ja: '先端を外へかぶせず、左右の紙の間へ入れます。',
      en: 'Tuck the point between the layers, not over the outside.',
    },
  ),
  step(craneTail, {
    ja: 'もう1本の細い先も反対側へ斜めに中割り折りして、尾にします。',
    en: 'Inside-reverse the other thin point diagonally the opposite way to form the tail.',
  }),
  step(
    craneHead,
    {
      ja: '首の先を中割り折りして、くちばしのある頭を作ります。',
      en: 'Inside-reverse the tip of the neck to form the head and beak.',
    },
    {
      ja: '折る深さと角度で頭の表情が決まります。',
      en: 'The depth and angle of this fold set the look of the head.',
    },
  ),
  step([frontWing, backWing], {
    ja: '花弁折りで持ち上げた大きな2枚を左右へ開き、羽にして鶴のできあがりです。',
    en: 'Open the two large petal flaps outward as the wings — the crane is complete.',
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
  cameraAngle: 22,
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
    r(HP[0], HP[1]), // 14: 頭の折り線・背側(対角線0-6上)
    r(HQ[0], HQ[1]), // 15: 頭の折り線・くちばし側(紙の辺6-7上)
    r(-S, 0), // 16: 内側ページ(S4/S5)の花弁折り点(中線O-5上)
    r(HQM[0], HQM[1]), // 17: 頭の折り線・くちばし側の鏡映(紙の辺6-5上)
    r(HT[0], HT[1]), // 18: 頭の折り線とタック線6-16の交点
    r(HU[0], HU[1]), // 19: 頭の折り線とタック線6-12の交点
  ],
  faces: [
    // 前面フラップ S1 + S2。2本の斜線と横折りを事前分割しておく。
    [0, 9, 11],
    [9, 1, 2],
    [9, 2, 11],
    [0, 11, 10],
    [11, 2, 10],
    [10, 2, 3],
    // 反対側の層。内側ページ(S4/S5)は頂点5のタック用折り線で分割済み。
    // 首になる角6の周りは、頭の中割り折り線(14-15 / 14-17のV字)でさらに分割。
    [0, 3, 4],
    [0, 4, 16],
    [16, 4, 5],
    [0, 16, 18, 14],
    [18, 6, 14],
    [16, 5, 17, 18],
    [17, 6, 18],
    // 辺6-7側はタック線6-12でも分割(首を本物同様に細くするための折り込み)
    [0, 14, 19, 12],
    [14, 6, 19],
    [15, 7, 12, 19],
    [6, 15, 19],
    // 裏面フラップ S7 + S8。前面と同じ花弁折りの鏡映。
    [0, 12, 13],
    [12, 7, 8],
    [12, 8, 13],
    [0, 13, 9],
    [13, 8, 9],
    [9, 8, 1],
  ],
  steps: siteCraneSteps,
};
