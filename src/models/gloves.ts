import { flatSequence } from '../engine/flatSequence';

// 参考: easy/clothes/gloves/gloves/zu.gif(てぶくろ)。❶の折り目づけを省略。
// ❷→1、❸→2、❹→3、❺→4–5(左右別)、❻→6、❼が完成。
// ❷ 下のふちをよこの中心線へ折り上げる(折り線 y=-.5。図の破線の実測 .751)。
//    折り返した色の面が、てぶくろの口の帯になる。
// ❸ たて半分。右を左へ(折り図❹のパネルは右のふちが1本線=折り目、左が2本線=紙のはし)。
// ❹ **手前の紙(❸で回った右半分)だけ**を、左上の角から下のふちへ向かう線で折り上げる。
//    下のふちに落ちる点は幅の .86(図❹の破線の実測 .855、図❺の折り目の実測 .86)。
//    目印はない。折り上げた先が右へ .29 はみ出し、これが親指になる。
//    **奥の紙を一緒に折ると色が変わる**。折り図❺は、めくれた紙が白、その下が
//    帯より上は白・帯は色、という塗り分けで、手前だけを折ったときの層と一致する。
// ❺ 上の両角を45°に折る(角から幅の .2。折り図❼の実測は左右とも .2×.2)。
// ❻ うらがえす。親指が左を向き、折り図❼の姿になる。
const thumb = 0.86;
const corner = 0.2;
export const glovesModel = flatSequence({
  id: 'gloves', name: { ja: 'てぶくろ', en: 'Gloves' }, difficulty: 2,
  sheetColors: [{ front: '#fab3d8', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,-.5],[1,-.5]], side: -1 }],
    description: { ja: '下のふちを、よこの中心線に合わせて折り上げます。', en: 'Fold the bottom edge up to the horizontal center line.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が、てぶくろの口の帯になります。', en: 'Start white side up. The colored side turned up becomes the cuff band.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: -1 }],
    description: { ja: 'たて半分に、右を左へ折ります。', en: 'Fold it in half lengthwise, right over left.' } },
  { moves: [{ line: [[-1,1],[-1+thumb,-.5]], side: -1, fromFold: 1 }],
    description: { ja: '手前の紙だけを、左上の角から下のふちへ向かう線で折り上げます。', en: 'Fold just the near sheet up along a line from the top-left corner to the bottom edge.' },
    caution: { ja: '折り上げた先が右へはみ出します。これが親指になります。奥の紙は折りません。', en: 'The tip juts out to the right and becomes the thumb. Leave the far sheet flat.' } },
  { moves: [{ line: [[-corner,1],[0,1-corner]], side: 1 }],
    description: { ja: '右上の角を、ななめに折ります。', en: 'Fold the top-right corner down along a slant.' } },
  { moves: [{ line: [[-1,1-corner],[-1+corner,1]], side: 1 }],
    description: { ja: '左上の角も、同じように折ります。', en: 'Fold the top-left corner down in the same way.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえしたら、てぶくろのできあがりです。', en: 'Turn it over and the glove is done.' },
    caution: { ja: 'うらがえすと、親指が左を向きます。', en: 'Turned over, the thumb points to the left.' } },
]);
