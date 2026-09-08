import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/house2/house2/zu.gif の❷。中心の折り目づけは省略。
// 上辺の中央と左右の辺の中央を結ぶ45°の線。左右を別々に折る。
// 白面から始めるので、折り返した色面が屋根、残した白面が壁になる。
export const houseModel = flatSequence({
  id: 'house', name: { ja: 'いえ', en: 'House' }, difficulty: 1,
  sheetColors: [{ front: '#e995b5', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,0],[0,1]], side: 1 }],
    description: { ja: '左上の角を紙の中心へ折り、屋根の左半分を作ります。', en: 'Fold the top-left corner to the center to form the left half of the roof.' },
    caution: { ja: '白い面を上にして始めます。折り線は、上のふちの中央と左のふちの中央を結びます。', en: 'Start white side up. The fold joins the midpoints of the top and left edges.' } },
  { moves: [{ line: [[0,1],[1,0]], side: 1 }],
    description: { ja: '右上の角も中心へ折り、屋根をそろえて完成です。', en: 'Fold the top-right corner to the center to complete the roof.' },
    caution: { ja: '白い壁にドアや窓を描くと、おうちになります。描く作業はアニメーションには含みません。', en: 'Draw a door and windows on the white walls. Drawing is a finishing step outside the animation.' } },
]);
