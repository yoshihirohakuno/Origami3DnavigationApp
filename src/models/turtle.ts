import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * かめ / Turtle(全5工程)
 * https://www.origami-club.com/easy/animal/turtle/zu.html(作・図:新宮文明)
 *
 *   ❶ 対角線に折り目をつけて戻す(2工程)
 *   ❷ 右上の角を、対角線と平行な線で左下へ折る(裏の緑が出る)
 *   ❸ もう1本の対角線で半分に折る(左上の半分を右下へかぶせる)
 *   ❹ 左の先をかぶせ折りして頭を作る
 *   ❺(折り図)目と甲羅を描いてできあがり = 折りではないので工程にしない
 *
 * 紙は [-1,1] の正方形。**白い面を上にして始める**(折り図と同じ)。
 * 使う対角線は「/」(BL(-1,-1)-TR(1,1))で、これが❶の折り目=❸の折り線になる。
 * 折り図❶は対角線2本に折り目をつけるが、「\」の方は折り線として使われず
 * ❷の折り線の向きの目安にしかならないので、ひよこ・ぺんぎん・ろけっとと同じく
 * 意図的に省いている。
 *
 * 幾何の要点(実測は tools/zu-measure.mjs、パネル名は折り図の丸数字):
 * - **❷の折り線 x+y=C**。折り図に目印(1/2・角の二等分線など)は無く
 *   「てんせんで おる」とだけ書いてある。実測は
 *   ❷の破線の両端から C=0.413/0.422、❸の緑の三角の直角の角から C=0.435/0.396、
 *   ❹の右の短い辺と頂点から C=0.437/0.448。**3パネルの平均 0.42 を採用**した。
 *   右上の角 (1,1) はこの線で (C-1,C-1) へ倒れ、ちょうど「/」の対角線上に乗る
 *   (折り図❸で、折り返した緑の三角の直角の角が対角線上にあるのと一致)
 * - ❸のあとの輪郭は四角形 (-1,-1) / (C/2,C/2) / (1,C-1) / (1,-1)。
 *   折り図❹の実測(1単位≈91.5px)と一致する
 * - **❹のかぶせ折りの折り線**は、背(=❸の折り目)の上の (S-1,S-1)(S=0.30)から
 *   下のふちの**まんなか (0,-1)** へ。実測は背側 (-0.686,-0.719)・
 *   ふち側 (-0.063,-1) で、ふち側は下のふちの中点と読める。
 *   先 (-1,-1) はこの線で (-0.69,-0.28) へ回り、背より外(左上)へ出て頭になる
 * - 完成形の外接矩形は 1.72 x 1.215(比 1.42)。折り図❺の完成図の実測は
 *   198px x 139px(比 1.42)で一致する
 *
 * 層の話:
 * - ❸のあと、上から順に「左上の胴(緑)/ ❷のフラップ・左上側(白)/
 *   フラップ・右下側(緑)/ 右下の胴(白)」。いちばん上が緑なので、
 *   折り図❹のとおり全面が緑になる
 * - **フラップの先(頂点1)は❸の moving に入れる**。❷の残差でこの点は z>0 に
 *   浮いているが、❸の折り線(対角線)の**上**に乗っているため、動かさないと
 *   フラップ2枚が左上の胴より手前に出て、白い面が背に沿って三角に見える。
 *   ❸の回転に含めると z が反転して胴の下へ沈み、緑の胴に隠れる
 * - 頭が白く見えるのは、かぶせ折りで2枚とも裏返るから。上の層(F0)は❸で
 *   持ち上がった頂点9を持つので、回したあとも下の層(F5)より手前に残る
 */

const C = 0.42; // ❷の折り線 x+y=C(実測 0.413〜0.448 の平均。折り図に目印なし)
const S = 0.3; // ❹の折り線が背と交わる点の、先 (-1,-1) からのずれ(実測 0.30)

const V: [number, number][] = [
  [-1, 1], //  0: 左上の角
  [1, 1], //  1: 右上の角(❷で折る。折ると (C-1,C-1) へ)
  [1, -1], //  2: 右下の角
  [-1, -1], //  3: 左下の角(❹で頭になる先)
  [C - 1, 1], //  4: ❷の折り線・上のふち側
  [1, C - 1], //  5: ❷の折り線・右のふち側
  [C / 2, C / 2], //  6: ❷の折り線と対角線の交点(❸のあとの頂点)
  [S - 1, S - 1], //  7: ❹の折り線・背側(対角線上)
  [0, -1], //  8: ❹の折り線・下のふちの中点(右下の層)
  [-1, 0], //  9: ❹の折り線・左のふちの中点(左上の層。❸で 8 に重なる)
];

const F: number[][] = [
  [3, 9, 7], // 0: 左上の層の先(❹で回る)
  [9, 0, 4, 6, 7], // 1: 左上の層の胴(❸で右下へかぶさる=完成形の表)
  [4, 1, 6], // 2: ❷のフラップ・左上側
  [6, 1, 5], // 3: ❷のフラップ・右下側
  [7, 6, 5, 2, 8], // 4: 右下の層の胴(動かない)
  [3, 8, 7], // 5: 右下の層の先(❹で回る)
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

/** 白い面を上にして始める(面の初期向きを反転して表す。front/back は入れ替えない) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

// 対角線 y=x より上(左上)の頂点。1・6・7 は対角線上なので入れない
const UPPER_LEFT = [0, 4, 9];

const steps: FoldStep[] = [
  {
    // ❶a 対角線に折り目(❸の折り線になる)
    folds: [{ axis: [3, 1], moving: UPPER_LEFT, type: 'valley', angle: 178 }],
    description: {
      ja: '対角線で半分に折って、折り目をつけます。',
      en: 'Fold in half along the diagonal to make a crease.',
    },
    caution: {
      ja: 'この折り目が、あとで半分に折るときの目印になります。',
      en: 'This crease is the guide for the later fold in half.',
    },
  },
  {
    // ❶b 開いて戻す。❶a の自動符号が +1 なので、戻しは -1
    folds: [{ axis: [3, 1], moving: UPPER_LEFT, type: 'unfold', angle: 178, direction: -1 }],
    description: {
      ja: '開いて戻します。',
      en: 'Unfold it again.',
    },
  },
  {
    // ❷ 右上の角を、対角線と平行な線(x+y=C)で左下へ折る。
    // 谷折りで折り返した面の裏(緑)が出るのが折り図❸のとおり
    folds: [{ axis: [4, 5], moving: [1], type: 'valley', angle: 176 }],
    description: {
      ja: '右上の角を、折り目と平行な線で左下へ折ります。',
      en: 'Fold the top-right corner down along a line parallel to the crease.',
    },
    caution: {
      ja: '角の先は、まんなかの折り目の上にちょうど乗ります。うらの色が出ます。',
      en: 'The corner lands right on the crease, showing the reverse side.',
    },
  },
  {
    // ❸ 対角線で半分に折る(左上の半分を右下へ)。軸は❷で動いていない 3・6 を使う
    // (1 は❷で移動済み)。フラップの先 1 も回して、胴の下へ沈める
    folds: [{ axis: [3, 6], moving: [...UPPER_LEFT, 1], type: 'valley', angle: 177 }],
    description: {
      ja: 'まんなかの折り目で、半分に折ります。',
      en: 'Fold in half along the center crease.',
    },
    caution: {
      ja: '左上の半分を右下へかぶせます。全体が色の面になります。',
      en: 'Bring the upper-left half over the lower-right one — all colored side now.',
    },
  },
  {
    // ❹ 左の先をかぶせ折り。軸は背側 7 と下のふちの中点 8(どちらも一度も動いていない)。
    // 先 3 が背を越えて左上へ出て、裏返るので白い頭になる
    folds: [{ axis: [7, 8], moving: [3], type: 'outside-reverse', angle: 176 }],
    description: {
      ja: '左の先を、外から包むようにかぶせ折りして、頭にします。',
      en: 'Outside-reverse the left point to form the head.',
    },
    caution: {
      ja: '先が背の外へ出て、白い面が頭になります。目と甲羅を描いたらできあがり。',
      en: 'The point wraps outside the spine and shows white. Draw the eye and shell to finish.',
    },
  },
];

export const turtleModel: OrigamiModel = {
  id: 'turtle',
  name: { ja: 'かめ', en: 'Turtle' },
  difficulty: 2,
  cameraAngle: 0,
  vertices: V,
  faces: backSideUp(F.map(orient)),
  faceSheet: F.map(() => 0),
  // 折り図の緑を実測(#90ce5c)。裏は紙の白
  sheetColors: [{ front: '#90ce5c', back: '#f6f2e8' }],
  steps,
};
