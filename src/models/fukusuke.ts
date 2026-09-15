import { flatSequence } from '../engine/flatSequence';

// 参考: traditional/hukusuke(rn-image/zu/hukusuke.gif、全12パネル)。
// ❶の折り目づけを省略、❺「むきをかえる」は紙をあらかじめ45°まわして持つことで省く。
// そのため折り図❶〜❹の正方形は、ここではひし形として出る(折り自体は同じ)。
//
// h = √2/2。紙は半径 √2 のひし形(面積4の正方形と同じ)。
// ❷ ざぶとん折り(4すみを中心へ)。折り返した色の面が全面に出る → 辺 √2 の正方形
// ❸ もう一度ざぶとん折り。土台の色の面が上に返るので、ここでも全面が色になる
//    → 半径 h のひし形。表も裏も色の面なので、以降しばらく白は出ない
// ❻ 上の角から22.5°の線で、左右の角を中心線へ折る(たこ形)。角 E,W は中心線上の
//    (0,-(√2-1)h) にそろって重なる。折り線の下端は下の辺の ((2-√2)h, -(√2-1)h)
// ❽ ❸で中心に来た手前の1枚を、❻と同じ折り線で外へ返して開く。
//    先が (±1/2,(√2-1)/2) へ出て、これが腕になる。**❻で動いた層は動かさない**ので
//    `exceptFold` で除く。ここを動かすと腕が二重に折れて開かない
// ❿ 腕の先を通る横線 y=(√2-1)/2 で上を折り下げる。ざぶとん折り1回目の
//    「上の1枚」は角でしか本体につながっていないので、この1枚だけが丸ごと返って
//    上へ出る。それが頭になる(先 (0,0) が (0,√2-1) へ回り、45°の三角になる)。
//    engine では「上を全部折り下げる」+「その1枚の下半分を折り上げる」の2手で表す
// ⓫ 下を y=-(√2-1)h で後ろへ折り、すそを平らにして完成
//
// **❾のうらがえしを飛ばさないこと**。折り図では❽と❿のあいだにうらがえしがあり、
// これが抜けると頭に紙の裏(白)が出る。うらがえしが3回で、頭は色の面になる
// (原典の完成写真 traditional/hukusuke/index.jpg も頭まで一色)。
const h = Math.SQRT2 / 2;                   // 0.70710678 ひし形の半径(ざぶとん折り2回後)
const r = Math.SQRT2;                       // 紙のひし形の半径
const px = (2 - Math.SQRT2) * h;            // 0.29289 ❻の折り線が下の辺と交わる x
const py = -(Math.SQRT2 - 1) * h;           // -0.29289 同 y。E,W が重なる高さでもある
const arm = (Math.SQRT2 - 1) / 2;           // 0.20711 腕の先の高さ(=❿の折り線)
export const fukusukeModel = flatSequence({
  id: 'fukusuke', name: { ja: 'ふくすけ', en: 'Fukusuke' }, difficulty: 3,
  sheetColors: [{ front: '#7ecee2', back: '#fbfaf7' }],
}, [[0, r], [-r, 0], [0, -r], [r, 0]], true, [
  { moves: [
    { line: [[-1, h], [1, h]], side: 1 },
    { line: [[h, -1], [h, 1]], side: -1 },
    { line: [[-1, -h], [1, -h]], side: -1 },
    { line: [[-h, -1], [-h, 1]], side: 1 },
  ],
    description: { ja: '4つの角を中心へ折り、正方形にします。', en: 'Fold all four corners to the center to make a square.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が全面に出ます。', en: 'Start white side up. The colored side turned up covers the whole square.' } },
  { moves: [
    { line: [[h, 0], [0, h]], side: -1 },
    { line: [[0, h], [-h, 0]], side: -1 },
    { line: [[-h, 0], [0, -h]], side: -1 },
    { line: [[0, -h], [h, 0]], side: -1 },
  ],
    description: { ja: 'できた4つの角も、もう一度中心へ折ります。', en: 'Fold the four new corners to the center once more.' },
    caution: { ja: '4枚の先が中心に集まります。この面がふくすけの腕になります。', en: 'The four tips meet at the center. This face becomes the arms.' } },
  { moves: [{ line: [[0, -1], [0, 1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえします。', en: 'Turn the paper over.' } },
  { moves: [
    { line: [[0, h], [px, py]], side: 1 },
    { line: [[0, h], [-px, py]], side: -1 },
  ],
    description: { ja: '左右の角を、上の角から中心線へ折ります。', en: 'Fold the left and right corners in to the center line from the top corner.' },
    caution: { ja: '角は中心線の上でぴたりと出会います。たこ形になります。', en: 'The two corners meet exactly on the center line, making a kite shape.' } },
  { moves: [{ line: [[0, -1], [0, 1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度うらがえします。', en: 'Turn the paper over again.' },
    caution: { ja: '中心に集まった4枚の先が、こちら側に出ます。', en: 'The four tips gathered at the center come back to this side.' } },
  { moves: [
    { line: [[0, h], [px, py]], side: -1, fromFold: 4, exceptFold: 10 },
    { line: [[0, h], [-px, py]], side: 1, fromFold: 5, exceptFold: 9 },
  ],
    description: { ja: '中心の1枚ずつを、同じ折り線で外へ開きます。', en: 'Open one tip at a time outward along the same crease.' },
    caution: { ja: '開いた先が横へ出ます。これが腕です。', en: 'Each opened tip swings out sideways to become an arm.' } },
  { moves: [{ line: [[0, -1], [0, 1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度うらがえします。', en: 'Turn the paper over once more.' } },
  { moves: [
    { line: [[-1, arm], [1, arm]], side: 1 },
    { line: [[-1, arm], [1, arm]], side: -1, fromFold: 0, exceptFold: [4, 5, 9, 10, 15] },
  ],
    description: { ja: '腕の先を通る横線で、上を折り下げます。', en: 'Fold the top down along the line through the arm tips.' },
    caution: { ja: '中の1枚が返って上に出ます。これが頭になります。', en: 'One inner layer turns over and comes up. That is the head.' } },
  { moves: [{ line: [[-1, py], [1, py]], side: -1, type: 'mountain' }],
    description: { ja: '下を後ろへ折り、すそを平らにしたらできあがりです。', en: 'Fold the bottom behind to flatten the hem and finish.' },
    caution: { ja: 'かおを描くと、ふくすけになります。描く作業はアニメーションには含みません。', en: 'Draw the face to finish. Drawing is a step outside the animation.' } },
], 1e-7); // ざぶとん折り2回で層が多いので、表示用の紙厚を薄くして継ぎ目を閉じる。
fukusukeModel.renderLayerSeparation = .00004; // 薄い紙厚のままだと3Dで表裏が消えるため、描画だけ広げる。
