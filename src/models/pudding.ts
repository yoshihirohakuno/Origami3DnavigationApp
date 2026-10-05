import { flatSequence } from '../engine/flatSequence';

// easy/food/puddig/zu.gif: “1/4” labels the quarter-sized sheet cut in panel 1,
// not the depth of the fold. Start with that ready-cut square, without scissors.
// Panel 2: crease at (498-233)/(628-233) = .671 of the height; panel 3's
// color boundary gives .675. Hence y=-.35 on [-1,1]. The side creases meet
// the upper edge near its quarter points (x=±.5) and the lower corners.
const band = -.35;
export const puddingModel = flatSequence({
  id: 'pudding', name: { ja: 'プリン', en: 'Caramel Pudding' }, difficulty: 1,
  sheetColors: [{ front: '#d89a56', back: '#fff7de' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{ line: [[-1,band],[1,band]], side: -1 }],
    description: { ja: '下のふちを、紙の高さの約3分の1の線で折り上げます。', en: 'Fold the bottom edge up along a line about one third of the sheet height from the bottom.' },
    caution: { ja: '正方形1枚を、色の面を上にして始めます。色の面がカラメル、裏の面がプリンの部分になります。', en: 'Start with one square, colored side up. The colored side forms the caramel; the reverse forms the custard.' } },
  { moves: [{ line: [[-1,band],[-.5,1]], side: 1, type: 'mountain' }],
    description: { ja: '左の上の角を、下の左角から上のふちの4分の1へ結ぶ線で後ろへ折ります。', en: 'Fold the upper-left corner behind along the line from the lower-left corner to the quarter point on the top edge.' } },
  { moves: [{ line: [[1,band],[.5,1]], side: -1, type: 'mountain' }],
    description: { ja: '右の上の角も同じように後ろへ折り、台形のプリンにします。', en: 'Fold the upper-right corner behind in the same way to finish the trapezoid-shaped pudding.' } },
], 1e-8);
puddingModel.renderLayerSeparation = .00004;
