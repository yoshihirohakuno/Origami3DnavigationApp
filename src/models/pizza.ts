import { flatSequence, type FlatMove } from '../engine/flatSequence';

// Reference: https://www.origami-club.com/easy/food/pizza/zu.html
// Two blintz folds, with a turnover between them, then tuck four tips behind.
// Toppings are drawn by the person folding; they are not extra pieces of paper.
const move = (a: [number, number], b: [number, number], type: FlatMove['type'] = 'valley'): FlatMove => ({ line: [a, b], side: 1, type });
export const pizzaModel = flatSequence({
  id: 'pizza', name: { ja: 'ピザ', en: 'Pizza' }, difficulty: 1,
  sheetColors: [{ front: '#f5c96b', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [move([-.5,.5],[.5,.5]), move([.5,-.5],[-.5,-.5])],
    description: { ja: '白い面を上にして、上と下の角を中心へ折ります。', en: 'Start white side up. Fold the top and bottom corners to the center.' } },
  { moves: [move([-.5,-.5],[-.5,.5]), move([.5,.5],[.5,-.5])],
    description: { ja: '左右の角も中心へ折って、正方形にします。', en: 'Fold the left and right corners to the center to make a square.' } },
  { moves: [move([0,-.5],[0,.5],'assemble')],
    description: { ja: '正方形を裏返します。', en: 'Turn the square over.' } },
  { moves: [move([0,.5],[.5,0]), move([0,-.5],[-.5,0])],
    description: { ja: '右上と左下の角を、もう一度中心へ折ります。', en: 'Fold the upper-right and lower-left corners to the center.' } },
  { moves: [move([-.5,0],[0,.5]), move([.5,0],[0,-.5])],
    description: { ja: '残りの角も中心へ折って、ひし形にします。', en: 'Fold the other two corners to the center to make a diamond.' } },
  { moves: [move([-.15,.35],[.15,.35],'mountain'), move([.15,-.35],[-.15,-.35],'mountain')],
    description: { ja: '上下のとがった先を、少しだけ後ろへ折ります。', en: 'Fold the top and bottom tips a little behind.' } },
  { moves: [move([-.35,-.15],[-.35,.15],'mountain'), move([.35,.15],[.35,-.15],'mountain')],
    description: { ja: '左右の先も後ろへ折って完成。好きな具を描きましょう。', en: 'Fold the side tips behind to finish. Draw your favorite toppings.' },
    caution: { ja: '表の色が外側になります。ペンで具を描く工程はアニメーションには含めていません。', en: 'The colored side faces out. Drawing toppings is a finishing step outside the animation.' } },
]);
