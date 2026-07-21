import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * くじら / Whale(全5工程)
 * https://www.origami-club.com/easy/sea/whale/zu.html を基準にした横向きのくじら。
 *
 *   ❶ 横半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❷ 左の2辺を中央線に向けて折る(凧折り。同時に2枚)→ 左が細くとがって頭になる
 *   ❸ 中央線で半分に折る → 横長の体
 *   ❹ 右の先をかぶせ折りして、尾びれを上へ立てる
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * 左の角(-1,0)が頭の先、右の角(1,0)が尾の先になる。
 *
 * 幾何の要点:
 * - 凧折りの折り線は左角から角の二等分線(傾き tan22.5°)。上辺(0,1)-(1,0) との
 *   交点が (S, 1-S)、S=√2-1=0.4142(厳密値)。上の角(0,1)はこの折り線で中央線上の
 *   (S, 0) へ倒れる=辺が中央線にぴったり重なる
 * - 尾のかぶせ折りの軸は、背中側 (0.85,0) と腹側 (0.62,-0.38) を結ぶ斜めの線。
 *   軸を縦にすると回転が水平面内になり、尾が上へ立たず左へ折り返されるだけになる
 *   (実測で確認)。❸で上下が重なるため、軸の腹側は下層の点を使う
 *   (上層の対応点は❸で下層に重なって退化するため軸にできない)
 *
 * 原典の❸「頭の先を少し折る」は省略(頭のとがりを残す)。
 * かぶせ折りは色の入れ替わりを再現しない(README「既知の制約」)。
 */

const S = Math.SQRT2 - 1; // 0.41421356… 凧折りの折り線が上辺と交わる x
const TX = 0.62; // 尾の折り線の x
const TY = 1 - TX; // 尾の折り線が斜辺と交わる y (斜辺 y = -x+1)

const V: [number, number][] = [
  [-1, 0], //  0: 左の角(頭の先)
  [0, 1], //  1: 上の角(❷で中央線へ倒れる)
  [1, 0], //  2: 右の角(尾の先)
  [0, -1], //  3: 下の角(❷で中央線へ倒れる)
  [S, 1 - S], //  4: 凧折りの折り線・上端(右上辺上)
  [S, -(1 - S)], //  5: 凧折りの折り線・下端(右下辺上)
  [TX, TY], //  6: 尾の折り線・上端(右上辺上)
  [TX, -TY], //  7: 尾の折り線・下端(右下辺上)
  [TX, 0], //  8: 尾の折り線・中央線上
  [0.85, 0], //  9: かぶせ折りの軸・背中側の端(中央線上)
];

const F: number[][] = [
  // 上半分(❸で下へ折られる側)
  [0, 1, 4], // 上の角(❷で倒れる)
  [0, 4, 6, 8], // 中央帯・上
  [8, 6, 9], // 尾の付け根・上
  [6, 2, 9], // 尾・上(かぶせ折りで動く側)
  // 下半分
  [0, 5, 3], // 下の角(❷で倒れる)
  [0, 8, 7, 5], // 中央帯・下
  [8, 9, 7], // 尾の付け根・下
  [9, 2, 7], // 尾・下(かぶせ折りで動く側)
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

// ❶❸で動く上半分
const TOP_HALF = [1, 4, 6];

const steps: FoldStep[] = [
  {
    // ❶a 横半分に折り目
    folds: [{ axis: [0, 2], moving: TOP_HALF, type: 'valley', angle: 178 }],
    description: {
      ja: '横半分に折って、まんなかに折り目をつけます。',
      en: 'Fold in half lengthwise to crease the center line.',
    },
    caution: {
      ja: '左の角が頭、右の角が尾になります。',
      en: 'The left corner becomes the head, the right one the tail.',
    },
  },
  {
    // ❶b 開いて戻す
    folds: [{ axis: [0, 2], moving: TOP_HALF, type: 'unfold', angle: 178, direction: -1 }],
    description: {
      ja: '開いて戻します。まんなかの折り目が目印です。',
      en: 'Unfold. The center crease is your guide.',
    },
  },
  {
    // ❷ 凧折り(左の2辺を中央線へ)。山折り(奥へ)にして、折り返した面の裏(白)が
    // 手前に出ないようにする。谷折りだと下半分の凧三角が手前に残り、体の大部分を
    // 裏の白で覆ってしまう(実測で確認)。上半分側は❸でさらに奥へ回る
    folds: [
      { axis: [0, 4], moving: [1], type: 'mountain', angle: 172 },
      { axis: [0, 5], moving: [3], type: 'mountain', angle: 172 },
    ],
    description: {
      ja: '左の2辺を、まんなかの折り目に合わせて裏側へ折ります。',
      en: 'Fold the two left edges behind to meet the center crease.',
    },
    caution: {
      ja: '辺が折り目にぴったり重なります。左が細くとがって頭になります。',
      en: 'The edges land exactly on the crease — the left end becomes the pointed head.',
    },
  },
  {
    // ❸ 中央線で半分に折る。山折り(上半分を奥へ)にして、動かない下半分が
    // 常に表を向くようにする。谷折りだと手前へ回った上半分が裏返り、
    // 裏の色が前面に出てしまう(tulip.ts と同じハマりどころ)
    folds: [{ axis: [0, 2], moving: TOP_HALF, type: 'mountain', angle: 177 }],
    description: {
      ja: 'まんなかの折り目で半分に折って、横長の体にします。',
      en: 'Fold in half along the center crease into the long body.',
    },
  },
  {
    // ❹ 尾のかぶせ折り。軸は背中側の 9 と腹側の 7 を結ぶ「斜めの線」。
    // 軸を縦(x一定)にすると回転が水平面内になり尾が左へ折り返されるだけで
    // 上へ立たない。斜めにすることで尾先が背中(y=0)より上へ出る
    folds: [{ axis: [9, 7], moving: [2], type: 'outside-reverse', angle: 150 }],
    description: {
      ja: '右の先を外側からかぶせ折りして、尾びれを上へ立てます。',
      en: 'Outside-reverse the right tip to lift the tail fin.',
    },
    caution: {
      ja: '紙の外側をぐるっと包むように折ります。目を描いたらできあがり。',
      en: 'Wrap the fold around the outside. Draw the eye to finish.',
    },
  },
];

export const whaleModel: OrigamiModel = {
  id: 'whale',
  name: { ja: 'くじら', en: 'Whale' },
  difficulty: 2,
  cameraAngle: 0,
  vertices: V,
  faces: F.map(orient),
  faceSheet: F.map(() => 0),
  // 海の生きものなので藍寄りの配色(手裏剣の藍と同系)
  sheetColors: [{ front: '#42708f', back: '#e7eef3' }],
  steps,
};
