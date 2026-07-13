import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';

/**
 * 手裏剣 / Shuriken(2枚組み・全9工程)
 *
 * おりがみくらぶ(https://www.origami-club.com/fun/cross/index.html)の折り図に
 * 忠実な工程。幾何は tools/solve-shuriken.mjs で厳密値を検証済み。
 *
 *   ❶ 観音折り(左右のはしを中心線へ) ─ 2枚同時
 *   ❷ 中心でさらに半分 → 幅1/4の帯
 *   ❸ 帯の両はしを斜め45°に折る(2枚は鏡写し)
 *   ❹ 端の帯を❸と平行な線で折り返す → 翼が斜めにずれた六角Z形
 *   ❺ 朱をうらがえして向きを90°かえ、中央へ
 *   ❻ 藍を朱の上に十字にかさねる(藍が上)
 *   ❼ 朱の翼を藍の上にかぶせ直し、藍のツメの下へさしこむ
 *   ❽ 全体をうらがえす
 *   ❾ 藍の翼も同じようにさしこんで できあがり
 *
 * ❹の折り線は❸の斜め辺と「平行」(展開図は0.5刻みの5×5格子+対角線)。
 * ユニットは先端が斜めにずれた稲妻形になり、組んだ星の尖りは風車状に傾く。
 * 「さしこむ」は新しい折り線を作らず、❹の折り線で翼をわずかに開いて相手の
 * 帯の上へかぶせ直す(相手のツメの下に入る)。エンジンでは小さな開き回転で
 * 表現する(README「既知の制約」)。
 *
 * 紙は白い面を上にして始める(観音折りで裏の色が表に出る=折り図と同じ)。
 */

const AX = -1.2; // 朱の展開図での中心x
const BX = 1.2; // 藍の展開図での中心x
const Z_TOP = 0.14; // ❻で藍を朱の上に乗せる高さ
const LIFT4 = 0.06; // ❹の折り線頂点(翼側)の持ち上げ

/**
 * ローカル展開図: 0.5刻みの5×5格子(番号 = 5*ix + iy、x,y ∈ {-1,-0.5,0,0.5,1})
 * + 中心線(❷の折り線)上の頂点の複製 25〜29(上層側の面が使う。
 * 折った後に上層の縁は層の厚みぶん浮くため、1頂点では両層を表せない)。
 *
 * 折り線(すべて対角線、傾き±1):
 *   ❸上: (-1,1)-(-0.5,0.5)-(0,1)-(0.5,0.5)-(1,1) のジグザグ
 *   ❹上: (-1,0.5)-(-0.5,0)-(0,0.5)-(0.5,0)-(1,0.5)
 *   ❹下: (-1,0)-(-0.5,-0.5)-(0,0)-(0.5,-0.5)-(1,0)
 *   ❸下: (-1,-0.5)-(-0.5,-1)-(0,-0.5)-(0.5,-1)-(1,-0.5)
 */
const LOCAL: [number, number][] = [];
for (let ix = 0; ix < 5; ix++) {
  for (let iy = 0; iy < 5; iy++) LOCAL.push([-1 + ix * 0.5, -1 + iy * 0.5]);
}
// 25〜29: x=0 列の複製(下から (0,-1),(0,-0.5),(0,0),(0,0.5),(0,1))
for (let iy = 0; iy < 5; iy++) LOCAL.push([0, -1 + iy * 0.5]);
// 30〜33: ❹の折り線頂点の複製(中央帯側)。この折り線は「翼(束の上へ巻く)」と
// 「中央帯(底層)」で共有されるため、1頂点では両方の高さを表せない。
// 中央帯の面(L3/L4の中央)はこちらを使い、元の頂点は翼側として持ち上げる
LOCAL.push([0, 0.5]); // 30 = id(0,0.5) の中央帯側
LOCAL.push([0.5, 0]); // 31 = id(0.5,0) の中央帯側
LOCAL.push([0, 0]); // 32 = id(0,0) の中央帯側
LOCAL.push([0.5, -0.5]); // 33 = id(0.5,-0.5) の中央帯側

const id = (x: number, y: number) => Math.round((x + 1) / 0.5) * 5 + Math.round((y + 1) / 0.5);
const dup = (y: number) => 25 + Math.round((y + 1) / 0.5);

/** 面(20枚)。列1(x∈[-0.5,0]=上層側)は複製頂点を使う */
const LOCAL_FACES: number[][] = [
  // 列0 x∈[-1,-0.5](斜線は左が高い)
  [id(-1, 1), id(-0.5, 1), id(-0.5, 0.5)],
  [id(-1, 1), id(-0.5, 0.5), id(-0.5, 0), id(-1, 0.5)],
  [id(-1, 0.5), id(-0.5, 0), id(-0.5, -0.5), id(-1, 0)],
  [id(-1, 0), id(-0.5, -0.5), id(-0.5, -1), id(-1, -0.5)],
  [id(-1, -0.5), id(-0.5, -1), id(-1, -1)],
  // 列1 x∈[-0.5,0](右が高い。x=0 は複製 25〜29)
  [id(-0.5, 0.5), id(-0.5, 1), dup(1)],
  [id(-0.5, 0.5), dup(1), dup(0.5), id(-0.5, 0)],
  [id(-0.5, 0), dup(0.5), dup(0), id(-0.5, -0.5)],
  [id(-0.5, -0.5), dup(0), dup(-0.5), id(-0.5, -1)],
  [id(-0.5, -1), dup(-0.5), dup(-1)],
  // 列2 x∈[0,0.5](左が高い)
  [id(0, 1), id(0.5, 1), id(0.5, 0.5)],
  [id(0, 1), id(0.5, 0.5), id(0.5, 0), id(0, 0.5)],
  [30, 31, 33, 32], // L3の中央帯(中央帯側の複製を使う)
  [id(0, 0), id(0.5, -0.5), id(0.5, -1), id(0, -0.5)],
  [id(0, -0.5), id(0.5, -1), id(0, -1)],
  // 列3 x∈[0.5,1](右が高い)
  [id(0.5, 0.5), id(0.5, 1), id(1, 1)],
  [id(0.5, 0.5), id(1, 1), id(1, 0.5), id(0.5, 0)],
  [31, id(1, 0.5), id(1, 0), 33], // L4の中央帯(中央帯側の複製を使う)
  [id(0.5, -0.5), id(1, 0), id(1, -0.5), id(0.5, -1)],
  [id(0.5, -1), id(1, -0.5), id(1, -1)],
];

/** 反時計回り(表=+z)に揃える */
function orient(f: number[]): number[] {
  let area = 0;
  for (let i = 0; i < f.length; i++) {
    const [x1, y1] = LOCAL[f[i]];
    const [x2, y2] = LOCAL[f[(i + 1) % f.length]];
    area += x1 * y2 - x2 * y1;
  }
  return area >= 0 ? f : [...f].reverse();
}

// 動く頂点の集合(ローカル)
const COL = (x: number) => [0, 1, 2, 3, 4].map((i) => id(x, -1 + i * 0.5));
const CUPBOARD_L = COL(-1);
const CUPBOARD_R = COL(1);
// ❷で動く側(紙のはし=x=-1列は❶で回転軸上に来ているため含めない)
const HALF = COL(-0.5);
const DUPS = [dup(-1), dup(-0.5), dup(0), dup(0.5), dup(1)];
const SLANT_TOP = [id(-0.5, 1), id(0.5, 1)]; // ❸上(dup(1)は折り線の端点上)
const SLANT_BOT = [id(0, -1), dup(-1), id(-1, -1), id(1, -1)]; // ❸下
// ❹の翼(dup(0.5)/dup(0) は折り線上なので動かない)
const WING_TOP = [id(0, 1), dup(1), id(-1, 1), id(1, 1), id(0.5, 0.5), id(-0.5, 0.5)];
const WING_BOT = [id(0, -0.5), dup(-0.5), id(-1, -0.5), id(1, -0.5), id(0.5, -1), id(-0.5, -1)];
const ALL = LOCAL.map((_, i) => i);

const A = 0; // 朱(鏡映)のインデックスオフセット
const B = 34; // 藍のインデックスオフセット

const vertices: [number, number][] = [
  ...LOCAL.map(([x, y]): [number, number] => [-x + AX, y]), // 朱(鏡映)
  ...LOCAL.map(([x, y]): [number, number] => [x + BX, y]), // 藍
];

const faces: number[][] = [
  ...LOCAL_FACES.map((f) => orient(f).reverse().map((i) => i + A)), // 鏡映は向きも反転
  ...LOCAL_FACES.map((f) => orient(f).map((i) => i + B)),
];

const faceSheet = [...LOCAL_FACES.map(() => 0), ...LOCAL_FACES.map(() => 1)];

// 白い面を上にして始める(折り図と同じ。観音折りで裏の色が表に出る)
const sheetColors = [
  { front: '#f2ede3', back: '#e0492f' }, // 朱
  { front: '#f2ede3', back: '#2f4b7c' }, // 藍
];

/** 両シートへ同じ折りを作るヘルパ */
function both(op: (base: number) => FoldOp[]): FoldOp[] {
  return [...op(A), ...op(B)];
}

const off = (base: number, ids: number[]) => ids.map((i) => i + base);

// ❹の折り線(軸): 上 (0,0.5)-(0.5,0) / 下 (0,0)-(0.5,-0.5)
const AXIS4T: [number, number] = [id(0, 0.5), id(0.5, 0)];
const AXIS4B: [number, number] = [id(0, 0), id(0.5, -0.5)];

const steps: FoldStep[] = [
  {
    // ❶ 観音折り
    folds: both((s) => [
      { axis: [s + id(-0.5, 1), s + id(-0.5, -1)], moving: off(s, CUPBOARD_L), type: 'valley', angle: 177.5 },
      { axis: [s + id(0.5, 1), s + id(0.5, -1)], moving: off(s, CUPBOARD_R), type: 'valley', angle: 177.5 },
    ]),
    description: {
      ja: '2枚とも、左右のはしを中心線に合わせて折ります(かんのん折り)。',
      en: 'On both sheets, fold the left and right edges in to the center line.',
    },
    caution: {
      ja: '手裏剣は2枚の紙で作ります。白い面を上にして始めます。',
      en: 'The shuriken uses two sheets. Start with the white side up.',
    },
  },
  {
    // ❷ 半分に折る
    folds: both((s) => [
      { axis: [s + id(0, 1), s + id(0, -1)], moving: off(s, HALF), type: 'valley', angle: 176.5 },
      // 上層側の折り目の縁(複製頂点)をわずかに持ち上げて層を分離する。
      // 大きく持ち上げると❹の回転軸(z=0)から浮いた蝶番になり翼がねじれるため、
      // ここでは最小限にとどめ、本命の持ち上げは❹の後に行う
      {
        axis: [s + id(0, 1), s + id(0, -1)],
        moving: off(s, DUPS),
        type: 'assemble',
        angle: 0,
        direction: 1,
        translate: [0, 0, 0.012],
      },
    ]),
    description: {
      ja: '中心線でさらに半分に折り、細い帯にします。',
      en: 'Fold in half again along the center line into a slim strip.',
    },
  },
  {
    // ❸ 端を斜めに折る
    folds: both((s) => [
      { axis: [s + id(0, 1), s + id(0.5, 0.5)], moving: off(s, SLANT_TOP), type: 'valley', angle: 175.5 },
      { axis: [s + id(0, -0.5), s + id(0.5, -1)], moving: off(s, SLANT_BOT), type: 'valley', angle: 175.5 },
    ]),
    description: {
      ja: '帯の上下のはしを斜め45°に折ります。2枚は左右対称(鏡写し)です。',
      en: 'Fold both ends of each strip at 45°. The two sheets mirror each other.',
    },
    caution: {
      ja: '上のはしと下のはしは反対向きに折ります。',
      en: 'The top and bottom ends fold in opposite directions.',
    },
  },
  {
    // ❹ 端の帯を折り返して翼にする(❸の斜め辺と平行な折り線)
    folds: both((s) => [
      { axis: [s + AXIS4T[0], s + AXIS4T[1]], moving: off(s, WING_TOP), type: 'valley', angle: 174 },
      { axis: [s + AXIS4B[0], s + AXIS4B[1]], moving: off(s, WING_BOT), type: 'valley', angle: 174 },
      // 折り返した最上層の折り目は層の束の上まで巻き上がるため持ち上げる
      {
        axis: [s + AXIS4T[0], s + AXIS4T[1]],
        moving: off(s, [AXIS4T[0], AXIS4T[1], AXIS4B[0], AXIS4B[1]]),
        type: 'assemble',
        angle: 0,
        direction: 1,
        translate: [0, 0, LIFT4],
      },
      // 中央の折り目の縁(上層側の複製)も、回転が終わったここで本来の高さへ
      {
        axis: [s + AXIS4T[0], s + AXIS4T[1]],
        moving: off(s, [dup(0.5), dup(0)]),
        type: 'assemble',
        angle: 0,
        direction: 1,
        translate: [0, 0, 0.023],
      },
    ]),
    description: {
      ja: '斜めのはしの帯を、❸と平行な折り線で中央へ折り返します。翼が斜めについた稲妻形になります。',
      en: 'Fold each slanted end back along a crease parallel to it — a lightning shape with offset wings.',
    },
  },
  {
    // ❺ 朱をうらがえして向きをかえ、中央へ
    folds: [
      {
        // 縦の折り目線まわりに180°裏返し → 面内90°回転 → 中央へ
        axis: [A + id(0, 0.5), A + id(0, 0)],
        moving: off(A, ALL),
        type: 'assemble',
        angle: 180,
        direction: 1,
        spinZ: 90,
        // 裏返し+回転後のユニット中心 (AX+0.5, 0.75) を原点へ
        translate: [-AX - 0.5, -0.75, 0.02],
      },
    ],
    description: {
      ja: '朱をうらがえして向きを90°かえ、中央に置きます。',
      en: 'Flip the vermilion unit over, turn it 90°, and set it at the center.',
    },
    caution: {
      ja: 'うらがえすと朱の翼が下を向きます(あとで差し込むツメになります)。',
      en: 'Flipped, the vermilion wings face down — they become the tuck tabs.',
    },
  },
  {
    // ❻ 藍を朱の上にかさねる
    folds: [
      {
        axis: [B + id(0, 0.5), B + id(0, 0)],
        moving: off(B, ALL),
        type: 'assemble',
        angle: 0,
        direction: 1,
        // 藍の中心 (BX+0.25, 0) を原点の真上へ
        translate: [-(BX + 0.25), 0, Z_TOP],
      },
    ],
    description: {
      ja: '藍を、朱の上に十字になるようにかさねます。',
      en: 'Lay the indigo unit on top of the vermilion one in a cross.',
    },
    caution: {
      ja: '藍の翼は上を向いたまま。この下がポケットになります。',
      en: 'The indigo wings stay face-up — the pockets form beneath them.',
    },
  },
  {
    // ❼ さしこむ(朱の翼を藍の上にかぶせ直し、藍のツメの下へ)
    folds: [
      // 翼を❹の折り線で開き、藍の帯を巻き込んで反対側(上)へ閉じ直す(ほぼ1回転)
      { axis: [A + AXIS4T[0], A + AXIS4T[1]], moving: off(A, WING_TOP), type: 'mountain', angle: 344, direction: 1 },
      { axis: [A + AXIS4B[0], A + AXIS4B[1]], moving: off(A, WING_BOT), type: 'mountain', angle: 344, direction: -1 },
    ],
    description: {
      ja: '朱の2つの翼をわずかに開き、藍の帯にかぶせて、藍のツメの下へさしこみます。',
      en: 'Open the two vermilion wings slightly, lay them over the indigo strip, and tuck them under the indigo tabs.',
    },
    caution: {
      ja: '翼の折り線は❹と同じ。あたらしい折り線は作りません。',
      en: 'The wings refold on the same creases as step 4 — no new creases.',
    },
  },
  {
    // ❽ うらがえす
    folds: [
      {
        axis: [B + id(0, 0), B + id(0.5, 0)],
        moving: [...off(A, ALL), ...off(B, ALL)],
        type: 'assemble',
        angle: 180,
        direction: 1,
      },
    ],
    description: {
      ja: '全体をうらがえします。',
      en: 'Turn the whole piece over.',
    },
  },
  {
    // ❾ さしこんで できあがり
    folds: [
      // 藍の翼も開いて朱の帯を巻き込み、反対側へ閉じ直す
      { axis: [B + AXIS4T[0], B + AXIS4T[1]], moving: off(B, WING_TOP), type: 'mountain', angle: 344, direction: -1 },
      { axis: [B + AXIS4B[0], B + AXIS4B[1]], moving: off(B, WING_BOT), type: 'mountain', angle: 344, direction: 1 },
    ],
    description: {
      ja: '藍の2つの翼も同じように朱へさしこんだら、手裏剣のできあがり。',
      en: 'Tuck the two indigo wings into the vermilion unit the same way — the shuriken is complete.',
    },
    caution: {
      ja: '向かい合う尖りが同じ色になります。',
      en: 'Opposite points share a color.',
    },
  },
];

export const shurikenModel: OrigamiModel = {
  id: 'shuriken',
  name: { ja: '手裏剣', en: 'Shuriken' },
  difficulty: 2,
  cameraAngle: 0,
  // 平らな作品なのでほぼ正面から(わずかに見下ろす)見せる
  cameraPos: [0, -0.9, 4.6],
  vertices,
  faces,
  faceSheet,
  sheetColors,
  steps,
};
