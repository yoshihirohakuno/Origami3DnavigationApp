import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';
import { squareBaseModel } from './squareBase';
import { carrySurfacePoints } from '../engine/carrySurfacePoints';

const ROT = (-45 * Math.PI) / 180;
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

// The first five physical folds follow the square-base route. Subdivision
// points for the later petal/head folds travel with their original panels.
const frontPetal: FoldStep = step([
  { axis: [2, 9], moving: [1], type: 'valley', angle: ANGLE, direction: 1 },
  { axis: [2, 10], moving: [3], type: 'valley', angle: ANGLE, direction: -1 },
  { axis: [11, 9], moving: [2], type: 'mountain', angle: ANGLE, direction: -1 },
], { ja: '手前の1枚を開き、左右を内側へたたんで花弁折りします。',
  en: 'Open the front layer and tuck its sides inward into a petal fold.' });
const backPetal: FoldStep = step([
  { axis: [8, 12], moving: [7], type: 'valley', angle: ANGLE, direction: -1 },
  { axis: [6, 16], moving: [5, 17], type: 'valley', angle: ANGLE, direction: 1 },
  { axis: [6, 12], moving: [15], type: 'valley', angle: ANGLE, direction: -1, guide: false },
  { axis: [13, 12], moving: [8], type: 'mountain', angle: ANGLE, direction: -1 },
], { ja: '反対側の1枚も開き、左右を内側へたたんで花弁折りします。',
  en: 'Open the opposite layer and tuck its sides inward into a petal fold.' });



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

const siteCraneSteps: FoldStep[] = [
  ...squareBaseModel.steps,
  frontPetal,
  backPetal,
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
const source: OrigamiModel = {
  id: 'crane',
  name: { ja: '鶴', en: 'Crane' },
  difficulty: 5,
  cameraAngle: 22,
  cameraPos: [0, -2.4, 4],
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

// Carry fine crease intersections throughout the coarse base construction.
export const craneModel = carrySurfacePoints({ ...source,
  faces: source.faces.map(face => [...face].reverse()),
  steps: source.steps.map((s, i) => i ? s : { ...s, caution: {
    ja: '白い面を上にして始めます。角を合わせ、三角の形で止めます。',
    en: 'Start white side up. Match the corners and stop at the triangle.',
  } }),
}, squareBaseModel, 5);
