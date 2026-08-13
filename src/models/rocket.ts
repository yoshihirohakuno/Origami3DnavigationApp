import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ろけっと / Rocket(全8工程 = 原典7工程 + 折り目の戻し)
 * https://www.origami-club.com/easy/vehicle/rocket/zu.html の折り図に忠実。
 * 2026-08-12 追加。3つめの「のりもの」。
 *
 *   ❶ よこ半分の折り目をつけて戻す(原典は「たてよこ」。縦は左右対称の目安なので
 *      アプリでは❷の目印になる横だけを折る。ひよこ・ぺんぎんと同じ方針)
 *   ❷ 上のふちを中心の折り目に合わせて折り下げる(折り線 y=0.5)
 *   ❸ うらがえす(原典のパネル番号では❹)
 *   ❹ 上の両角を中心へ(折り線は (0,0.5)→(±1,-0.5) の45°)
 *   ❺ 左右を中心へ(折り線 x=±0.5)
 *   ❻ 下の左右を外へ折り返して尾翼(折り線 x=±1/3)
 *   ❼ うらがえして、ろけっとのできあがり
 *
 * 幾何の要点(折り図のピクセル実測。紙は [-1,1] の正方形):
 * - ❷の折り線 **y=0.5**。折り下げた帯は y=0〜0.5 を覆う(折り図❹の帯の高さと一致)
 * - ❹の折り線は **(0,0.5)→(±1,-0.5)**。上の角 (±1,0.5) がちょうど中心線上の
 *   (0,-0.5) に来る(「まんなかに むけて」の目印)。屋根は幅2・高さ1の45°三角になる
 * - ❺の折り線 **x=±0.5**(実測 0.500/0.536)。左右のふちが中心でぴったり出会う
 * - ❻の折り線 **x=±1/3**(実測 0.327)。❺で内へ入った紙のふち(折り後 x=0)が
 *   外へ回って **x=±2/3** まで出るので、胴(±0.5)より 1/6 外へ張り出して尾翼になる。
 *   折り図の破線が y=-1〜-1/6 だけなのは、そのフラップの上のふち(折り後の
 *   (0.5,0)-(0,-0.5) の線)が x=1/3 で y=-1/6 になるから = フラップの範囲そのもの
 * - 展開図では、先に折った層の折り線は鏡映して埋め込む:
 *   ❹の帯側は (0,0.5)→(±0.5,1)、❺のフラップ側は y=0 の (±0.5,0)-(±1,0)、
 *   ❻は❺の折り線で鏡映して **x=±2/3**(y=-1〜-1/6)
 *
 * 色: 紙の表は緑 #63c09f(折り図の実測)、裏は白で扱う。
 * ❸でうらがえすと主の層の白い裏面が正面になり、❹で折った角は表の緑を見せる。
 * 折り図❻で色面と白面が層ごとに出るのは、❹で一緒に回った**帯の層**が
 * 主の層より手前に来るため。
 *
 * 層: どの折りも手前へ回すので残差角のままで層順が出る。
 * ❻で動く尾翼は、❹のフラップと (±1,-0.5) を共有すると引きずられるので、
 * 尾翼の面だけ同じ座標の複製頂点(24/25)を持たせている。
 */

/** ❺の折り線(左右を中心へ) */
const S = 0.5;
/** ❻の折り線(尾翼)。展開図では❺の折り線で鏡映して 1-1/3 = 2/3 */
const F6 = 2 / 3;
/** ❻の折り線の上端(❹の折り線 y=0.5-x の上) */
const F6Y = 0.5 - F6; // = -1/6

const V: [number, number][] = [
  [0, 0.5], //  0: ❷の折り線の中央(❹の折り線の頂点)
  [1, 0.5], //  1: ❷の折り線の右端(主の層と帯で共有)
  [-1, 0.5], //  2: 同・左端
  [1, 0], //  3: 右のふち・y=0
  [-1, 0], //  4: 左のふち・y=0
  [S, 0], //  5: ❹の折り線と y=0 の交点(❺の折り線の上端)
  [-S, 0], //  6: 同・左
  [0, 0], //  7: 中心(❶の折り目の上)
  [1, -0.5], //  8: ❹の折り線の右端
  [-1, -0.5], //  9: 同・左
  [F6, F6Y], // 10: ❻の折り線の上端(右)
  [-F6, F6Y], // 11: 同・左
  [S, -1], // 12: ❺の折り線の下端(右)
  [-S, -1], // 13: 同・左
  [F6, -1], // 14: ❻の折り線の下端(右)
  [-F6, -1], // 15: 同・左
  [1, -1], // 16: 右下の角(尾翼の先)
  [-1, -1], // 17: 左下の角
  [0, -1], // 18: 下のふちの中央(うらがえしの軸)
  [0, 1], // 19: 上のふちの中央(帯)
  [S, 1], // 20: ❹の折り線(帯)の上端(右)
  [-S, 1], // 21: 同・左
  [1, 1], // 22: 右上の角(帯)
  [-1, 1], // 23: 左上の角(帯)
  [1, -0.5], // 24: 8 の複製(尾翼の面だけが❻で動くように)
  [-1, -0.5], // 25: 9 の複製
  [1, 0.5], // 26: 1 の複製(帯のフラップだけ❹の残差角を変えて手前に出すため)
  [-1, 0.5], // 27: 2 の複製
];

const F: number[][] = [
  // 主の層(❷で動かない側)・右
  [0, 1, 3, 5], // ❹で回る角のうち y>0 の部分
  [5, 3, 8], // 同・y<0 の部分
  [0, 5, 7], // 胴の上(❹の折り線より内側)
  [7, 5, 12, 18], // 胴
  [5, 10, 14, 12], // ❺で内へ入る部分のうち、❻で動かない側
  [10, 24, 16, 14], // ❻で外へ回る尾翼
  // 主の層・左
  [0, 6, 4, 2],
  [6, 9, 4],
  [0, 7, 6],
  [7, 18, 13, 6],
  [6, 13, 15, 11],
  [11, 15, 17, 25],
  // 帯(❷で折り下げる上の 1/4)・右
  [0, 20, 22, 26], // ❹で回る角(残差角を変えるので 1 ではなく複製の 26 を使う)
  [0, 19, 20], // 帯の残り
  // 帯・左
  [0, 27, 23, 21],
  [0, 21, 19],
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

/** ❶の折り目で動く下半分 */
const LOWER = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 24, 25];
/** 帯(❷で折り下げる) */
const BAND = [19, 20, 21, 22, 23];
const ALL = V.map((_, i) => i);

const steps: FoldStep[] = [
  {
    // ❶a よこ半分の折り目(❷で「まんなか」に合わせる目印)
    folds: [{ axis: [4, 3], moving: LOWER, type: 'valley', angle: 178 }],
    description: {
      ja: 'よこ半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half crosswise to crease the middle.',
    },
    caution: {
      ja: '色の面を表、裏を白として扱います。この折り目が、次の工程で合わせる目印になります。',
      en: 'Treat the colored side as the front and the reverse as white. This crease is the guide for the next fold.',
    },
  },
  {
    // ❶b 開いて戻す(直前の valley の自動符号を実測して符号を決めること)
    folds: [{ axis: [4, 3], moving: LOWER, type: 'unfold', angle: 178, direction: 1 }],
    description: {
      ja: '開いて戻します。',
      en: 'Unfold.',
    },
  },
  {
    // ❷ 上のふちを、まんなかの折り目に合わせて折り下げる
    folds: [{ axis: [2, 1], moving: BAND, type: 'valley', angle: 176 }],
    description: {
      ja: '上のふちを、まんなかの折り目に合わせて折り下げます。',
      en: 'Fold the top edge down to the middle crease.',
    },
    caution: {
      ja: '折り下げた帯は、層の表裏が見える目印になります。',
      en: 'The folded band becomes a guide for which side of the layer is showing.',
    },
  },
  {
    // ❸ うらがえす(原典❹)
    folds: [{ axis: [0, 18], moving: ALL, type: 'assemble', angle: 180, direction: 1 }],
    description: {
      ja: 'うらがえします。',
      en: 'Turn it over.',
    },
  },
  {
    // ❹ 上の両角を中心へ(角がちょうど中心線に来る)
    // 帯の層(26/22・27/23)は残差角を浅くして、主の層のフラップより手前に出す。
    // 折り図❻の表裏の出方はこの層順で決まる(同じ角度だと z 差が
    // 0.001 しかなく、主の層の白が勝ってしまう)
    folds: [
      { axis: [0, 8], moving: [1, 3], type: 'valley', angle: 176 },
      { axis: [0, 8], moving: [26, 22], type: 'valley', angle: 173 },
      { axis: [0, 9], moving: [2, 4], type: 'valley', angle: 176 },
      { axis: [0, 9], moving: [27, 23], type: 'valley', angle: 173 },
    ],
    description: {
      ja: '上の両角を、まんなかに向けて折ります。',
      en: 'Fold both top corners in to the middle.',
    },
    caution: {
      ja: '角の先がちょうどまんなかの線に来ます。ろけっとの先になります。',
      en: 'Each corner lands right on the center line — that becomes the nose.',
    },
  },
  {
    // ❺ 左右を中心へ(ふちが中心でぴったり出会う)
    folds: [
      { axis: [5, 12], moving: [8, 10, 14, 16, 24], type: 'valley', angle: 176 },
      { axis: [6, 13], moving: [9, 11, 15, 17, 25], type: 'valley', angle: 176 },
    ],
    description: {
      ja: '左右を、まんなかに向けて折ります。',
      en: 'Fold both sides in to the middle.',
    },
    caution: {
      ja: '左右のふちが、まんなかでぴったり出会います。',
      en: 'The two side edges meet exactly at the middle.',
    },
  },
  {
    // ❻ 下の左右を外へ折り返して尾翼
    folds: [
      { axis: [10, 14], moving: [24, 16], type: 'valley', angle: 176 },
      { axis: [11, 15], moving: [25, 17], type: 'valley', angle: 176 },
    ],
    description: {
      ja: '下の左右を、外へ折り返して尾翼にします。',
      en: 'Fold the lower sides back out to make the fins.',
    },
    caution: {
      ja: 'さっき中へ入れたふちが外へ出て、胴より少し外へ張り出します。',
      en: 'The edges you just tucked in swing out just past the body.',
    },
  },
  {
    // ❼ うらがえす
    folds: [{ axis: [0, 18], moving: ALL, type: 'assemble', angle: 180, direction: 1 }],
    description: {
      ja: 'うらがえして、ろけっとのできあがり。',
      en: 'Turn it over and the rocket is done.',
    },
  },
];

export const rocketModel: OrigamiModel = {
  id: 'rocket',
  name: { ja: 'ろけっと', en: 'Rocket' },
  difficulty: 2,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 折り図の紙の色(実測 RGB(99,192,159))。紙の表=緑、裏=白
  sheetColors: [{ front: '#63c09f', back: '#f6f2e8' }],
  steps,
};
