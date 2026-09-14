import { flatSequence } from '../engine/flatSequence';

// 参考: easy/food/coffee/zu.gif。最後に手前の取っ手を起こす動きを独立した工程にする。
// 目印のある折りは❹だけで、
// ほかは実測になる(折り図自身も「8mmぐらい」と書いていて厳密ではない)。
// ❶ 下のふちを折り上げ、上に色の帯を残す。帯は紙(高さ2)の .227 なので折り線 y=-.114。
//    ❷❸❹のパネルはどれも高さ255px・帯52pxで一致する
// ❷ 右をななめに左へ折る。折り線は上のふちの .750、下のふちの .215。
//    ❸❹のパネルに残る折り返しのふち(この折り線そのもの)の実測が .750/.215 で一致する。
//    ❷のパネルの破線だけは .774/.244 と6pxずれるので、外形の出る2枚を採った
// ❸ 上のふちの中央から右下へ折り下げる。折り線 (0,1)-(.813,.5)(実測 dx/dy=1.626)。
//    ❹のパネルの外形が、この線と❷の折り線の交点 (.579,.644) で折れているのと一致する
// ❹ たての中心線で右半分を後ろへ折る(厳密。❺の胴が幅ちょうど1になる)
const lip = 0.114;
export const coffeeModel = flatSequence({
  id: 'coffee', name: { ja: 'こーひー', en: 'Coffee' }, difficulty: 2,
  sheetColors: [{ front: '#dd8a54', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{ line: [[-1,-lip],[1,-lip]], side: -1 }],
    description: { ja: '下のふちを折り上げ、上に色の帯を少しだけ残します。', en: 'Fold the bottom edge up, leaving a narrow band of color along the top.' },
    caution: { ja: '色の面を上にして始めます。残した帯がカップのふちになります。', en: 'Start colored side up. The band you leave becomes the rim of the cup.' } },
  { moves: [{ line: [[.75,1],[.215,-lip]], side: 1 }],
    description: { ja: '右のふちを、ななめの線で左へ折ります。', en: 'Fold the right edge over to the left along a slanted line.' },
    caution: { ja: '目印はありません。折り図の線のとおりに、上を少し右にして折ります。', en: 'There is no landmark. Follow the line in the diagram, leaning a little to the right at the top.' } },
  { moves: [{ line: [[0,1],[.813,.5]], side: 1 }],
    description: { ja: '上のふちの中央から、右上を折り下げます。', en: 'Fold the top-right corner down along a line from the middle of the top edge.' },
    caution: { ja: '折り返した角の裏が出て、色の三角が見えます。', en: 'The back of the folded corner shows, so a triangle of color appears.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: -1, type: 'mountain' }],
    description: { ja: '中心線で右半分を後ろへ折ります。', en: 'Fold the right half behind along the center line.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, fromFold: 1, exceptFold: 3 }],
    description: { ja: '手前の白い三角だけを右へ起こし、取っ手を出して完成です。', en: 'Open only the white triangle in front out to the right to finish the handle.' },
    caution: { ja: 'カップの胴は動かさず、中心線を軸に三角を開きます。', en: 'Keep the cup body still and open the triangle around the center line.' } },
]);
