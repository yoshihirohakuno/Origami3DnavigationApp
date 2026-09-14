import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/snail/snail/zu.gif。❶の折り目づけを省略。
// ❷→1、❸→2、❹→3、❺→4、❻→5、❼→6、❽→7、❾が完成(からを描く)。
// 色の面を上にして始める(折り図❸の折り返しが白い)。
// ❷ 左上の角を、45°の線 (-1,0)-(0,1) で折る(**厳密**)
// ❸ 下半分を、よこの中心線で折り上げる(**厳密**)。折り返した白が上に出て、
//    ❷で欠けた左上の角も埋まり、たて1・よこ2の白い長方形になる(折り図❹と一致)
// ❹ **手前の1枚だけ**を、長方形の対角線 (-1,1)-(1,0) で折る(**厳密**)。
//    下の1枚を折らないので、折り図❺のように右上が色の面のまま残り、
//    折り返した先が下へ .6 はみ出す(❺のパネルの外形 2×1.6 と一致)
// ❺ はみ出した先を、下のふち y=0 で折り上げる(**厳密**)
// ❻ 右側を、(.45,1)-(1,0) の線で左へ折る(下のはしは右下の角。上は実測)。
//    折り図❼の右のふちが .455 で切れているのと一致する
// ❼ 左側を、(-.93,1)-(-.57,0) の線で右へ折る(実測)
// ❽ うらがえして完成。右上に色の面が三角に残り、ここがからになる
export const snailModel = flatSequence({
  id: 'snail', name: { ja: 'かたつむり', en: 'Snail' }, difficulty: 2,
  sheetColors: [{ front: '#c9848c', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{ line: [[-1,0],[0,1]], side: 1 }],
    description: { ja: '左上の角を、45°の線で折り下げます。', en: 'Fold the top-left corner down along a 45° line.' },
    caution: { ja: '色の面を上にして始めます。折り返した白い裏が出ます。', en: 'Start colored side up. The white back shows where you fold.' } },
  { moves: [{ line: [[-1,0],[1,0]], side: -1 }],
    description: { ja: '下半分を、よこの折り目で折り上げます。', en: 'Fold the bottom half up along the horizontal crease.' },
    caution: { ja: '白い裏が上になり、欠けた角も埋まって長方形になります。', en: 'The white back comes up and fills the missing corner, making a rectangle.' } },
  { moves: [{ line: [[-1,1],[1,0]], side: 1, fromFold: 1 }],
    description: { ja: '手前の1枚だけを、長方形の対角線で折ります。', en: 'Fold just the front layer along the diagonal of the rectangle.' },
    caution: { ja: '下の1枚は折りません。右上に色の面が残り、先は下へはみ出します。', en: 'Leave the layer underneath. Color stays at the top right and the tip juts out below.' } },
  { moves: [{ line: [[-1,0],[1,0]], side: -1 }],
    description: { ja: 'はみ出した先を、下のふちで折り上げます。', en: 'Fold the jutting tip back up along the bottom edge.' } },
  { moves: [{ line: [[.45,1],[1,0]], side: 1 }],
    description: { ja: '右側を、ななめの線で左へ折ります。', en: 'Fold the right side over to the left along a slant.' },
    caution: { ja: '折り線の下のはしは、右下の角です。', en: 'The crease ends at the bottom-right corner.' } },
  { moves: [{ line: [[-.93,1],[-.57,0]], side: -1 }],
    description: { ja: '左側も、ななめの線で右へ折ります。', en: 'Fold the left side over to the right along a slant as well.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえしたら、かたつむりのできあがりです。', en: 'Turn it over and the snail is done.' },
    caution: { ja: '右上に残る色の面がからです。うずまきを描くと仕上がります。描く作業はアニメーションには含みません。', en: 'The colored triangle at the top right is the shell. Draw a spiral to finish; drawing is a step outside the animation.' } },
]);
