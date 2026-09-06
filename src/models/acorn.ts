import { flatSequence, type FlatMove } from '../engine/flatSequence';

// Reference: https://www.origami-club.com/easy/food/acom/acom2/index.html
// The original shows the point up and the white cup at the bottom.
const move = (a: [number, number], b: [number, number], side: 1 | -1, type: FlatMove['type'] = 'valley'): FlatMove => ({ line: [a, b], side, type });
export const acornModel = flatSequence({
  id: 'acorn', name: { ja: 'どんぐり', en: 'Acorn' }, difficulty: 1,
  sheetColors: [{ front: '#d99e57', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], false, [
  { moves: [move([0,-1],[0,1],1)], description: { ja: '色の面を上にして、たて半分に折ります。', en: 'Start colored side up and fold in half vertically.' } },
  { moves: [move([0,-1],[0,1],-1,'unfold')], description: { ja: '開いて、たての折り目を残します。', en: 'Open it to leave a vertical crease.' } },
  { moves: [move([-1,0],[1,0],-1)], description: { ja: 'よこ半分にも折ります。', en: 'Fold in half horizontally.' } },
  { moves: [move([-1,0],[1,0],1,'unfold')], description: { ja: '開いて、中心の目印をつけます。', en: 'Open it again to mark the center.' } },
  { moves: [move([-.5,-.5],[.5,-.5],-1)], description: { ja: '下の角を中心まで折り上げます。', en: 'Fold the bottom corner up to the center.' } },
  { moves: [move([-.75,-.25],[.75,-.25],-1)], description: { ja: '下のふちを、よこの中心線まで折り上げます。', en: 'Fold the bottom edge up to the horizontal center crease.' } },
  { moves: [move([-.4,-.25],[-.4,.6],1,'mountain'),move([.4,.6],[.4,-.25],1,'mountain')],
    description: { ja: '左右を後ろへ折り、どんぐりを細くします。', en: 'Fold both sides behind to narrow the acorn.' } },
  { moves: [move([-.4,-.1],[-.25,-.25],-1,'mountain'),move([.25,-.25],[.4,-.1],-1,'mountain')],
    description: { ja: '下の両角を少し後ろへ折って完成です。', en: 'Fold the two bottom corners a little behind to finish.' },
    caution: { ja: '白い部分はどんぐりの帽子です。下に向け、点を描いて仕上げます。', en: 'The white cup points down. Finish by drawing small dots on it.' } },
]);
