import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ヨット / Yacht(全3工程)
 * https://www.origami-club.com/easy/vehicle/yacht/zu.html の折り図に忠実。
 * アプリ初の「のりもの」(2026-08-12 追加)。
 *
 *   ❶ はんぶんに おる(対角線。左上の角を右下の角に合わせる)
 *   ❷ てんせんで おる(上の1枚だけ、右のふちを斜めのふちに合わせて左へ折る = 2枚目の帆)
 *   ❸ てんせんで おる(下を折り上げて船体に。全部の層をまとめて折る)
 *
 * 幾何の要点(折り図のピクセル実測。パネル❷❸を紙の座標系に換算した):
 * - 展開図は軸に平行な正方形。左上 TL(-1,1) 右上 TR(1,1) 右下 BR(1,-1) 左下 BL(-1,-1)。
 *   ❶の折り線は対角線 BL-TR で、TL が BR に重なる。以降は
 *   「頂点 TR・直角 BR・斜辺 TR-BL」の直角二等辺三角形(実測 170px×169px)
 * - ❷の折り線は **TR の角の二等分線**(右のふちを斜辺に合わせる)。下のふちとの交点は
 *   x=K=3-2√2≈0.172、折られた角 BR はちょうど斜辺の上の (1-√2, 1-√2) に来る
 *   (だから折り図❸の輪郭が三角形のままで、はみ出しがない)。
 *   実測の折り線は下のふち x≈0.16 で、二等分線の 0.172 とほぼ一致
 * - ❸の折り線は斜辺の (-H,-H)(H=0.58)から右のふちの (1,-G)(G=0.81)へ。
 *   折り図❸の破線の実測(左端 (-0.55,-0.61)・右端 (1.02,-0.81))から取った
 * - 折り図❹のできあがりは、❸の折り線(=船底)が水平になるように 7.3° 回して
 *   描かれているだけで、折り自体は❸で終わり
 *
 * 色: 紙の表は藍、裏は白で扱い、折り図に合わせて白い裏面を上にして始める。
 * ❷で上の1枚が左へ動くと、
 * その下から白い裏面(=帆)が出てくる。
 * 船体は❸で下の層が持ち上がって前に来る。
 *
 * 層: ❶で手前へ回った上の層が常に手前。❸は約180°回転なので z の前後が入れ替わり、
 * 下の層(❶で動かなかった側)が船体の表になる。残差角のままで層順は正しく出る。
 */

/** ❷の折り線が下のふちと交わる x(TR の角の二等分線。exact: 3-2√2) */
const K = 3 - 2 * Math.SQRT2;
/** ❸の折り線・斜辺側の点 (-H,-H)(折り図の破線の実測) */
const H = 0.58;
/** ❸の折り線・右のふち側の点 (1,-G) */
const G = 0.81;

/** ❸の折り線の傾き(y = -H + (x+H)*SLOPE) */
const SLOPE = (H - G) / (1 + H);
/** ❸の折り線と❷の折り線の交点(折り後の座標)。ここで折り線が「くの字」に折れる */
const T2 = (1 + G) / (2 - SLOPE * (1 - K));
const X1: [number, number] = [1 - (1 - K) * T2, 1 - 2 * T2];
/**
 * ❸の折り線が「❷で折り返したフラップのふち」と交わる点を、折る前(=❷の前)の
 * 位置に戻したときの x。フラップのふちは折り後 y = K-1-x の 45°線なので、
 * 交点から Q までの距離をそのまま下のふちに戻せばよい。
 */
const EX = (K - 1 + H * (1 - SLOPE)) / (1 + SLOPE);
const E_ON_BASE = K + (K - EX) * Math.SQRT2;

/**
 * 展開図の頂点。上の層(❶で折り返す左上半分)の点は、下の層の座標を
 * 対角線 y=x で鏡映した位置(=x と y を入れ替えた位置)に入れる。
 */
const V: [number, number][] = [
  [1, 1], // 0: TR 帆の先(両層で共有。❶❷の折り線の端)
  [1, -1], // 1: BR 右下の角(下の層。❸で船体へ)
  [-1, -1], // 2: BL 左下の角(両層で共有。❸で船体の左の先へ)
  [-1, 1], // 3: TL 左上の角(上の層。❶で BR に重なり、❷で斜辺の上へ)
  [-H, -H], // 4: ❸の折り線・斜辺側(対角線の上なので両層で共有)
  [1, -G], // 5: ❸の折り線・右のふち側(下の層)
  [-1, K], // 6: ❷の折り線・左のふち側(上の層。折り後は下のふちの Q)
  [X1[1], X1[0]], // 7: ❸と❷の折り線の交点(上の層。折り後は折り線の上)
  [-1, E_ON_BASE], // 8: ❸の折り線・フラップ側の端(上の層。折り後はフラップのふちの上)
];

const F: number[][] = [
  // 下の層(❶で動かない右下半分)
  [0, 5, 4], // 帆になる部分
  [4, 5, 1, 2], // ❸で折り上げる部分 = 船体の表
  // 上の層(❶で手前へ回る左上半分)
  [0, 4, 7], // 2枚目の帆(❷では動かない側)
  [4, 2, 6, 7], // ❸で折り上げる部分
  [0, 7, 8, 3], // ❷で左へ折り返すフラップ(帆の先)
  [7, 6, 8], // フラップのうち❸で折り上げる部分
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
    // ❶ 対角線で半分に折る(左上の角 TL が右下の角 BR に重なる)
    folds: [{ axis: [2, 0], moving: [3, 6, 7, 8], type: 'valley', angle: 176 }],
    description: {
      ja: '対角線で、半分に折ります。',
      en: 'Fold in half along the diagonal.',
    },
    caution: {
      ja: '紙の表は色面、裏は白です。折り図に合わせて白い裏面を上にして始めます。',
      en: 'The colored side is the front and the reverse is white. Start with the white reverse side up.',
    },
  },
  {
    // ❷ 上の1枚だけ、右のふちを斜めのふちに合わせて左へ折る(角の二等分線)
    folds: [{ axis: [0, 6], moving: [3, 8], type: 'valley', angle: 176 }],
    description: {
      ja: '上の1枚を、右のふちが斜めのふちに重なるように折ります。',
      en: 'Fold just the top sheet so its right edge lies along the slanted edge.',
    },
    caution: {
      ja: '角がちょうど斜めのふちの上に来ます。下から白い面が出て、帆が2枚になります。',
      en: 'The corner lands exactly on the slanted edge, and the white sail appears beneath.',
    },
  },
  {
    // ❸ 下を折り上げて船体に(全部の層をまとめて)
    folds: [{ axis: [4, 5], moving: [1, 2, 6], type: 'valley', angle: 176 }],
    description: {
      ja: '下のふちを折り上げて、船体にします。ヨットのできあがり。',
      en: 'Fold the bottom up to make the hull — the yacht is done.',
    },
    caution: {
      ja: '全部の層をまとめて折ります。持ち上がった下の層が前に出て、船体になります。',
      en: 'Fold every layer together; the bottom layer comes to the front and forms the hull.',
    },
  },
];

export const yachtModel: OrigamiModel = {
  id: 'yacht',
  name: { ja: 'ヨット', en: 'Yacht' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: backSideUp(F.map(orient)),
  faceSheet: F.map(() => 0),
  // 折り図の紙の色(実測 RGB(65,184,212))。紙の表=藍、裏=白
  sheetColors: [{ front: '#41b8d4', back: '#f6f2e8' }],
  steps,
};
