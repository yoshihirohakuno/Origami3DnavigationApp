import { flatSequence } from '../engine/flatSequence';

// 参考: easy/animal/owl/owl/zu.gif。❶の折り目づけを省略、❹は左右別。
// ❷は上の角から中心までの1/3の線(y=2/3)。❸は下の角を折り上げて、
// 先が❷の折り返しの先と同じ点(0,1/3)で出会う線(y=-1/3。図の実測も一致)。
// ❹は左右の角を中心へ(x=±1/2)。これで体は一辺1の正方形になり、折り図の完成と合う。
// ❺は下の折り返しの先だけを少し折り下げ、白い裏をくちばしとして出す。
// 折り線 y=.215 は図の実測(くちばしの幅が体の .236)。
const beak = 0.215;
export const owlModel = flatSequence({
  id: 'owl', name: { ja: 'ふくろう', en: 'Owl' }, difficulty: 1,
  sheetColors: [{ front: '#c98f52', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[-1,2/3],[1,2/3]], side: 1 }],
    description: { ja: '上の角を、中心までの3分の1の線で折り下げます。', en: 'Fold the top point down along the line one third of the way to the center.' },
    caution: { ja: '白い面を上にして、角を上下に向けて始めます。', en: 'Start white side up with the points at the top and bottom.' } },
  { moves: [{ line: [[-1,-1/3],[1,-1/3]], side: -1 }],
    description: { ja: '下の角を折り上げ、先を上の折り返しの先に合わせます。', en: 'Fold the bottom point up so its tip meets the tip of the top flap.' } },
  { moves: [{ line: [[-1/2,-1],[-1/2,1]], side: 1 }],
    description: { ja: '左の角を中央へ向けて、たての線で折ります。', en: 'Fold the left point in to the middle along a vertical line.' },
    caution: { ja: '左右を折ると、一辺のそろった正方形の体になります。', en: 'With both sides folded the body becomes a square.' } },
  { moves: [{ line: [[1/2,-1],[1/2,1]], side: -1 }],
    description: { ja: '右の角も同じように折ります。', en: 'Fold the right point in the same way.' } },
  { moves: [{ line: [[-1,beak],[1,beak]], side: 1, fromFold: 1 }],
    description: { ja: '下の折り返しの先だけを少し折り下げ、白いくちばしを出します。', en: 'Fold just the tip of the bottom flap down a little to show the white beak.' },
    caution: { ja: '目とはねを描くと、ふくろうになります。描く作業はアニメーションには含みません。', en: 'Draw the eyes and feathers to finish. Drawing is a step outside the animation.' } },
]);
