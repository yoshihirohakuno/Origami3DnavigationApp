import { flatSequence } from '../engine/flatSequence';

// 参考: easy/food/cake(rn-image/zu/cake.gif、全10パネル)。❶の折り目づけを省略。
// 折り図❶と❷のあいだに**番号のない折り**があり、ひし形を横の対角線で半分に折る。
//
// ❷〜❺は同じ2本の折り線を交互に使う**じゃばら**で、これがクリームのぎざぎざになる。
// 三角の斜辺が45°なので、折り返すたびに山と谷が45°のぎざぎざとして並ぶ。
// 帯の高さを (1-A)/4 に取ると先がちょうど折り線 A に戻り、ぎざぎざは山5つ・谷4つ。
// ❷ 手前の1枚(折り上げた色の面)の上の角を y=A で折り下げる。先は y=2A-1 へ
// ❸ その先を y=B で折り上げる。❹ もう一度 y=A で折り下げる。❺ もう一度 y=B で
//    折り上げると、先が y=A に戻ってじゃばらが閉じる
// ❻ 上を y=P1 で後ろへ折り、折り図で y=P2 だった線(折ると y=Q=P1-D)で
//    手前へ折り返す(だんおり、D=P2-P1)。頂点は y=1-2D へ下がり、
//    P1 より上は頂点 1-2D の小さい三角になる
// ❼ 残った角を y=S=((1-2D)+Q)/2 で折り下げる。**先が段折りのふち Q にちょうど重なる**。
//    裏が返って色の面が出る。これがいちご
// ❽ 左右を後ろへ折る。折り線は帯のはし (±(1-A),A) から下のふちの ±1/3 へ
// ❾ 中央で浅く折り、立体にする(ふじさん・たまごと同じ扱い)
//
// A=.575 と P1・P2 は折り図に目印がなく、原典のアニメーション
// (origami-mobile easy/food/shortcake/animation.html)の実測値。
// B=A-(1-A)/4 は実測 .4688 とぴったり合う(じゃばらが閉じる条件)。
const A = 0.575;                  // ❷❹の折り線(実測)
const B = A - (1 - A) / 4;        // 0.46875 ❸❺の折り線。帯の高さ (1-A)/4 = .10625
const P1 = 0.692;                 // だんおりの下の折り線(実測)
const D = 0.754 - P1;             // 0.062 だんおりの深さ(折り図の上の折り線 .754 から)
const Q = P1 - D;                 // 0.630 折り返す線(折ると P2 の紙がここへ来る)
const S = (1 - 2 * D + Q) / 2;    // 0.753 ❼の折り線。先が Q のふちに重なる
const foot = 1 / 3;               // ❽の折り線が下のふちを切る点
export const cakeModel = flatSequence({
  id: 'cake', name: { ja: 'ショートケーキ', en: 'Shortcake' }, difficulty: 3,
  sheetColors: [{ front: '#eb9ab9', back: '#fbfaf7' }],
}, [[0, 1], [-1, 0], [0, -1], [1, 0]], true, [
  { moves: [{ line: [[-1, 0], [1, 0]], side: -1 }],
    description: { ja: '下の角を上の角に合わせて折り、三角にします。', en: 'Fold the bottom point up to the top point to make a triangle.' },
    caution: { ja: '白い面を上にして、角を上下に向けて始めます。折り返した色の面が表になります。', en: 'Start white side up with the points at the top and bottom. The colored side turned up becomes the front.' } },
  { moves: [{ line: [[-1, A], [1, A]], side: 1, fromFold: 0 }],
    description: { ja: '手前の1枚だけ、上の角を折り下げます。', en: 'Fold just the front layer of the top point down.' },
    caution: { ja: '奥の1枚は折りません。出てきた白い面がクリームになります。', en: 'Leave the back layer alone. The white that appears becomes the cream.' } },
  { moves: [{ line: [[-1, B], [1, B]], side: -1, fromFold: 1 }],
    description: { ja: '折り下げた先を、少し上の線で折り上げます。', en: 'Fold the turned-down tip back up along a slightly higher line.' },
    caution: { ja: '斜めのふちがそろって、ぎざぎざが1つできます。', en: 'The slanted edges line up and make the first zigzag.' } },
  { moves: [{ line: [[-1, A], [1, A]], side: 1, fromFold: 2 }],
    description: { ja: '折り上げた先を、最初の線でもう一度折り下げます。', en: 'Fold that tip down again along the first line.' } },
  { moves: [{ line: [[-1, B], [1, B]], side: -1, fromFold: 3 }],
    description: { ja: '残った先をもう一度折り上げ、じゃばらを閉じます。', en: 'Fold the remaining tip up once more to close the pleats.' },
    caution: { ja: '先がちょうど最初の折り線に戻り、ぎざぎざが5つ並びます。', en: 'The tip lands exactly on the first crease, leaving five zigzag peaks.' } },
  { moves: [{ line: [[-1, P1], [1, P1]], side: 1, type: 'mountain' }],
    description: { ja: '上の角を後ろへ折ります。', en: 'Fold the top point behind.' } },
  { moves: [{ line: [[-1, Q], [1, Q]], side: -1, fromFold: 5 }],
    description: { ja: '後ろへ折った先を、低い線で手前へ折り返します。', en: 'Fold the tip you turned behind forward again along a lower line.' },
    caution: { ja: '段折りになり、ケーキの上が平らになります。', en: 'This makes a pleat and flattens the top of the cake.' } },
  { moves: [{ line: [[-1, S], [1, S]], side: 1 }],
    description: { ja: '出ている角を、先が段折りのふちに重なるまで折り下げます。', en: 'Fold the point that sticks up down until its tip meets the edge of the pleat.' },
    caution: { ja: '裏が返って色の面が出ます。ここがいちごになります。', en: 'It turns over and shows the colored side. This is the strawberry.' } },
  { moves: [{ line: [[-(1 - A), A], [-foot, 0]], side: -1, type: 'mountain' }],
    description: { ja: '左のはしを、帯のはしから下のふちへ向けて後ろへ折ります。', en: 'Fold the left side behind, from the end of the band down to the bottom edge.' } },
  { moves: [{ line: [[1 - A, A], [foot, 0]], side: 1, type: 'mountain' }],
    description: { ja: '右のはしも同じように後ろへ折り、ケーキの形にします。', en: 'Fold the right side behind in the same way to shape the cake.' } },
  { moves: [{ line: [[0, -1], [0, 1]], side: -1, type: 'mountain' }],
    description: { ja: '中央で浅く折り、立体にしたらできあがりです。', en: 'Bend it slightly along the center line to give it depth and finish.' },
    caution: { ja: '半分には閉じません。浅く曲げて形を整えます。', en: 'Keep it mostly open; only a shallow bend is needed.' } },
]);
// 最後は平らに閉じず、浅い山折りで立体感だけを出す(ふじさん・たまごと同じ扱い)。
const bend = cakeModel.steps.at(-1)!;
bend.folds = bend.folds.filter(op => op.guide !== false);
bend.folds[0].angle = 16;
