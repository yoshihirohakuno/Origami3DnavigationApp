import { flatSequence } from '../engine/flatSequence';

// 参考: easy/food/tea/zu.gif。❶は折り目づけだけなので省略し、❷→1、❸→2、❹→3–4、
// ❺→5、❻→6、❼→7、❽が完成。色の面を上にして始める。
// ❷ 下のふちを折り上げ、上に色の帯を残す(折り線 y=-.043。❷の破線は中心線の
//    7.5px 下、帯は15〜16px=高さの .086 で、❸❹❺❻のパネルと一致する)
// ❸ うらがえす。表は一面白になる(折り図❹のパネルが白一色なのと合う)
// ❹ 左のふちを中心の折り目へ(x=-.5。**厳密**。❺の外形が幅ちょうど1.5になる)。
//    ここは紙が2枚あり、上に出るのは❷で折り上げた1枚。先に下の1枚、次に上の1枚を
//    動かして層の順を作る(❻でその上の1枚だけを折るため)
// ❹ 右は (1,.914)-(.5215,-.043) でななめに左へ。上の端は色の帯の線が右のふちと
//    出会う点(1,2c+1)、傾きは実測 dx/dy=-0.5。❺の三角の三つの角が実測と3px以内で合う
// ❺ 左下の角を落とす((-.5,.346)-(-.343,-.043)。目印なし。❺❻の両パネルで一致)
// ❻ **上の1枚だけ**を、その1枚の対角線で折る。❹で折り返した紙は
//    [-.5,0]×[-.043,.914] の長方形で、(-.5,.914)-(0,-.043) はその対角線(厳密)。
//    折り返すと裏の色が出て、左へはみ出した三角が取っ手になる
// ❼ うらがえして完成。取っ手は右を向く
const lip = 0.043;
const band = 1 - 2 * lip;
export const teaModel = flatSequence({
  id: 'tea', name: { ja: 'こうちゃ', en: 'Black Tea' }, difficulty: 2,
  sheetColors: [{ front: '#dda063', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{ line: [[-1,-lip],[1,-lip]], side: -1 }],
    description: { ja: '下のふちを折り上げ、上に色の帯を少しだけ残します。', en: 'Fold the bottom edge up, leaving a narrow band of color along the top.' },
    caution: { ja: '色の面を上にして始めます。残した帯がカップのふちになります。', en: 'Start colored side up. The band you leave becomes the rim of the cup.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '左右を返して、うらを上にします。', en: 'Turn the paper over, left to right.' },
    caution: { ja: '折り上げた紙が下になるので、表は一面白になります。', en: 'The folded strip goes underneath, so this side is all white.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1, fromFold: 0 },
            { line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、まんなかの折り目に合わせて折ります。', en: 'Fold the left edge in to the center crease.' },
    caution: { ja: '2枚が重なって折り返り、上の1枚だけが白く見えます。', en: 'Two layers turn together; only the upper one shows, and it is white.' } },
  { moves: [{ line: [[1,band],[.5215,-lip]], side: 1 }],
    description: { ja: '右側を、ななめの線で左へ折ります。', en: 'Fold the right side over to the left along a slanted line.' },
    caution: { ja: '折り線の上の端は、帯の線が右のふちと出会うところです。', en: 'The crease starts where the line of the band meets the right edge.' } },
  { moves: [{ line: [[-.5,.346],[-.343,-lip]], side: -1 }],
    description: { ja: '左下の角を、ななめに折り上げます。', en: 'Fold the bottom-left corner up along a slant.' },
    caution: { ja: 'ここでカップの下がすぼまります。目印はありません。', en: 'This tapers the bottom of the cup. There is no landmark.' } },
  { moves: [{ line: [[-.5,band],[0,-lip]], side: 1, fromFold: 2 }],
    description: { ja: '折り返した紙の上の1枚だけを、その対角線で左へ折ります。', en: 'Fold just the upper of the two turned-back layers out to the left, along its diagonal.' },
    caution: { ja: '裏の色が出て、左にはみ出した三角が取っ手になります。', en: 'The colored back shows, and the triangle that sticks out becomes the handle.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度うらがえしたら、こうちゃのできあがりです。', en: 'Turn it over once more and the tea is done.' },
    caution: { ja: '取っ手が右にくる向きが表です。', en: 'The side with the handle on the right is the front.' } },
]);
