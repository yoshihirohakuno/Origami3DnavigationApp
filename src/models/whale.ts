import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * くじら / Whale(全6工程)
 * https://www.origami-club.com/easy/sea/whale/zu.html を基準にした横向きのくじら。
 *
 *   ❶ 横半分に折って折り目をつけ、開いて戻す(2工程)
 *   ❷ 右の2辺を中央線に向けて折る(凧折り。同時に2枚)→ 右が細くとがる
 *   ❸ 左の先を折る → 頭の鼻先(先は凧のとがり先 (-K,0) にちょうど合う)
 *   ❹ 中央線で半分に折る → 横長の体
 *   ❺ 右の細い先をかぶせ折りして、尾びれを上へ立てる
 *
 * 展開図はひし形の正方形:上(0,1) 右(1,0) 下(0,-1) 左(-1,0)。
 * **左の角(-1,0)が頭側(鈍角)、右の角(1,0)が尾の先**。
 *
 * 2026-08-03 修正: 以前の実装は凧折りのヒンジを左の角に置き、
 * 「とがった左=頭 / 太い右=尾」としていたが、原典は逆で
 * 凧折りのヒンジは**右の角**、できた鋭い先が**尾**、
 * 折り残した鈍角の左が**頭**になる(原典❸の図・完成図❻で確認)。
 * くじらの頭が丸く、尾びれが細いのはこのため。頭と尾を入れ替えた。
 *
 * 幾何の要点:
 * - 凧折りの折り線は右角から角の二等分線。上辺(-1,0)-(0,1) との交点が
 *   (-K, KY)、K=√2-1=0.41421、KY=2-√2=0.58579(厳密値)。
 *   上の角(0,1)はこの折り線で中央線上の (-K, 0) へ倒れる=辺が中央線に重なる
 * - ❸の頭の折り線は x=-H、H=(1+K)/2=1/√2=0.70711。左の角(-1,0)がちょうど
 *   凧のとがり先 (-K,0) に重なる(原典❸の矢印の到達点と一致)
 * - 尾のかぶせ折りの軸は、背中側 (0.79,0) と腹側 (0.585,-0.1719) を結ぶ
 *   「後ろへ傾いた斜めの線」。腹の縁は凧の折り線 y=K(x-1) 上なので
 *   腹側の点はこの直線上に取る。軸を縦にすると回転が水平面内になり
 *   尾が上へ立たない(実測で確認済み)
 * - かぶせ折りは全レイヤーを貫くので、折り線は本体だけでなく凧のフラップにも
 *   入れる。フラップ側の線は本体側の線を凧の折り線で鏡映した位置
 *   (10-12 / 11-13)。折りたたむと 12・13 は 9 に、10 は 11 に重なって
 *   1本の軸になる
 *
 * かぶせ折りは色の入れ替わりを再現しない(README「既知の制約」)。
 */

const K = Math.SQRT2 - 1; // 0.41421… 凧折りの折り線が上辺と交わる x の絶対値
const KY = 2 - Math.SQRT2; // 0.58579… 同 y
const H = (1 + K) / 2; // 0.70711 = 1/√2 頭の折り線の x
const HY = 1 - H; // 0.29289 頭の折り線が上辺と交わる y
const TBX = 0.79; // 尾の折り線・背中側の x(中央線上)
const TFX = 0.585; // 尾の折り線・腹側の x
const TFY = K * (1 - TFX); // 0.17190 腹の縁(凧の折り線)上の y

/** 点 p を、点 a を通り方向 d の直線で鏡映する */
function mirror(p: [number, number], a: [number, number], d: [number, number]): [number, number] {
  const t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]);
  const f: [number, number] = [a[0] + t * d[0], a[1] + t * d[1]];
  return [2 * f[0] - p[0], 2 * f[1] - p[1]];
}
// 尾の折り線の背中側の点を、凧の折り線((1,0)→(-K,KY))で鏡映した点=上辺上に来る
const TE = mirror([TBX, 0], [1, 0], [-1 - K, KY]);

const V: [number, number][] = [
  [-1, 0], //  0: 左の角(頭の先。❸で折る)
  [0, 1], //  1: 上の角(❷で中央線へ倒れる)
  [1, 0], //  2: 右の角(尾の先。❺でかぶせ折り)
  [0, -1], //  3: 下の角(❷で中央線へ倒れる)
  [-K, KY], //  4: 凧の折り線・上端(左上辺上)
  [-K, -KY], //  5: 凧の折り線・下端(左下辺上)
  [-H, 0], //  6: 頭の折り線・中央線上
  [-H, HY], //  7: 頭の折り線・上端(左上辺上)
  [-H, -HY], //  8: 頭の折り線・下端(左下辺上)
  [TBX, 0], //  9: 尾の折り線・背中側(中央線上)
  [TFX, TFY], // 10: 尾の折り線・上(凧の折り線上)
  [TFX, -TFY], // 11: 尾の折り線・下(凧の折り線上)
  [TE[0], TE[1]], // 12: 尾の折り線・上のフラップ側(右上辺上)
  [TE[0], -TE[1]], // 13: 尾の折り線・下のフラップ側(右下辺上)
];

const F: number[][] = [
  // 本体(凧)。中央線・頭の折り線・尾の折り線で分割
  [0, 6, 7], // 頭・上
  [0, 8, 6], // 頭・下
  [6, 9, 10, 4, 7], // 胴・上
  [6, 8, 5, 11, 9], // 胴・下
  [9, 2, 10], // 尾の付け根・上(本体側)
  [9, 11, 2], // 尾の付け根・下(本体側)
  // 凧のフラップ(❷で中央線へ倒れる)。尾の折り線で分割
  [4, 1, 12, 10], // 上のフラップ
  [10, 12, 2], // 上のフラップの尾側
  [5, 11, 13, 3], // 下のフラップ
  [11, 2, 13], // 下のフラップの尾側
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

// ❶❹で動く上半分(中央線より上の頂点。1・12 は❷で中央線上へ来るが含めて無害)
const TOP_HALF = [1, 4, 7, 10, 12];

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
    // ❷ 凧折り(右の2辺を中央線へ)。山折り(奥へ)にして、動かない側が常に表を
    // 向くようにする。谷折りだと折り返した面の裏(白)が体の大部分を覆う(実測)
    folds: [
      { axis: [2, 4], moving: [1, 12], type: 'mountain', angle: 172 },
      { axis: [2, 5], moving: [3, 13], type: 'mountain', angle: 172 },
    ],
    description: {
      ja: '右の2辺を、まんなかの折り目に合わせて裏側へ折ります。',
      en: 'Fold the two right edges behind to meet the center crease.',
    },
    caution: {
      ja: '辺が折り目にぴったり重なります。右が細くとがって、尾になります。',
      en: 'The edges land exactly on the crease — the right end becomes the pointed tail.',
    },
  },
  {
    // ❸ 頭の先を折る(左の角が凧のとがり先にちょうど重なる)
    folds: [{ axis: [7, 8], moving: [0], type: 'valley', angle: 168 }],
    description: {
      ja: '左の角を右へ折って、頭の鼻先を作ります。',
      en: 'Fold the left corner over to shape the blunt head.',
    },
    caution: {
      ja: '角の先が、とがった折り目の先にちょうど届きます。',
      en: 'The corner lands exactly on the tip of the folded point.',
    },
  },
  {
    // ❹ 中央線で半分に折る。山折り(上半分を奥へ)にして、動かない下半分が
    // 常に表を向くようにする(tulip.ts と同じハマりどころ)。
    // 軸は❸で動いていない 6・2 を使う(0 は❸で移動済み)
    folds: [{ axis: [6, 2], moving: TOP_HALF, type: 'mountain', angle: 177 }],
    description: {
      ja: 'まんなかの折り目で半分に折って、横長の体にします。',
      en: 'Fold in half along the center crease into the long body.',
    },
  },
  {
    // ❺ 尾のかぶせ折り。軸は背中側の 9 と腹側の 11 を結ぶ「後ろへ傾いた斜めの線」。
    // 軸を縦(x一定)にすると回転が水平面内になり尾が左へ折り返されるだけで
    // 上へ立たない。斜めにすることで尾先が背中(y=0)より上へ出る
    folds: [{ axis: [9, 11], moving: [2], type: 'outside-reverse', angle: 150 }],
    description: {
      ja: '右の細い先を外側からかぶせ折りして、尾びれを上へ立てます。',
      en: 'Outside-reverse the narrow right tip to lift the tail fin.',
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
