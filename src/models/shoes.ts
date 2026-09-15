import { flatSequence } from '../engine/flatSequence';

// 参考: easy/clothes/shoes(rn-image/zu/shoes.gif)。❶の折り目づけを省略。
// ❷→1、❸→2、❹→3、❺→4、❻→5、❼が完成。
// ❷ 上のふちを**後ろへ**折る。折り線 y=.84(❸❹のパネルに残る中心の折り目の位置から
//    逆算。❸の高さ 177px・中心線 80px、❹の高さ 177px・中心線 79px でどちらも .84)。
//    谷折りだと❸❹のパネルに色が出るので山折り。
// ❸ 左のふちを中心の折り目へ(x=-.5。**厳密**。❹の外形が幅ちょうど1.5になる)
// ❹ 下のふちを、❷で後ろへ折った紙のはしに合わせて折り上げる。
//    折り線 y=-.16 は **a-1**(a=.84)にあたり、下のふち -1 がちょうど 2a-1=.68 に届く。
//    ❹の破線の実測 -.163、❺の高さ 1.013・帯 .166 のどれとも合う
// ❺ 右上の角を落とす。折り線 (.203,.84)-(1,.282)(実測。45°ではない)
// ❻ うらがえして完成。
// **折り図の塗り分けは一致しない**。❹と❻のパネルは上の帯が全幅で白、❺のパネルだけ
// 左半分が色になっている。どの折り方でも❺の塗りは作れないので、2枚が一致する
// 「全幅で白」を採った(docs/handoff.md に記録)。
const lip = 0.84;
export const shoesModel = flatSequence({
  id: 'shoes', name: { ja: 'シューズ', en: 'Shoes' }, difficulty: 2,
  sheetColors: [{ front: '#5b8f4e', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,lip],[1,lip]], side: 1, type: 'mountain' }],
    description: { ja: '上のふちを、少しだけ後ろへ折ります。', en: 'Fold the top edge a little way behind.' },
    caution: { ja: '白い面を上にして始めます。後ろへ折るので、表は白いままです。', en: 'Start white side up. Folding behind leaves this side white.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、まんなかの折り目に合わせて折ります。', en: 'Fold the left edge in to the center crease.' },
    caution: { ja: '折り返した色の面が出ます。上のはしだけは、後ろの紙が出て白いままです。', en: 'The colored side turns up, except at the top where the layer folded behind shows white.' } },
  { moves: [{ line: [[-1,lip-1],[1,lip-1]], side: -1 }],
    description: { ja: '下のふちを、後ろへ折った紙のはしまで折り上げます。', en: 'Fold the bottom edge up as far as the edge of the layer folded behind.' },
    caution: { ja: '上に白い帯が残ります。ここがくつの口になります。', en: 'A white band is left at the top. That becomes the opening of the shoe.' } },
  { moves: [{ line: [[.203,lip],[1,.282]], side: 1 }],
    description: { ja: '右上の角を、ななめに折ります。', en: 'Fold the top-right corner down along a slant.' },
    caution: { ja: '目印はありません。折り図の線のとおりに折ります。', en: 'There is no landmark; follow the line in the diagram.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえしたら、しゅーずのできあがりです。', en: 'Turn it over and the shoe is done.' },
    caution: { ja: 'ななめに落とした角がつま先、白い帯が口になります。', en: 'The slanted corner is the toe and the white band is the opening.' } },
]);
