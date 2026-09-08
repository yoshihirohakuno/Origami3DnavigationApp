import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/butterfly/butterfly/zu.gif。❶の中心線の予備折りは省略。
// ❸は下辺中央(0,0)と上辺の中央より左(-.3,1)を結ぶ斜め折り。
// ❹は下の小角を (.16,0) と (-.046,.153) の線で折る(図からの比率)。
// ❺は面内の向き変更であり、裏返しではない。90°反時計回りに回す。
export const butterflyModel = flatSequence({
  id: 'butterfly', name: { ja: 'ちょうちょ', en: 'Butterfly' }, difficulty: 1,
  sheetColors: [{ front: '#efd75a', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,0],[1,0]], side: -1 }],
    description: { ja: '下のふちを上のふちに合わせ、横半分に折ります。', en: 'Fold the bottom edge up to the top edge.' },
    caution: { ja: '白い面を上にして始めます。色の面が外側になります。', en: 'Start white side up. The colored side will face outward.' } },
  { moves: [{ line: [[0,0],[-.3,1]], side: 1 }],
    description: { ja: '左側を斜めの線で右へ折り重ね、二枚の羽をずらします。', en: 'Fold the left side over to the right on a slant to stagger the two wings.' },
    caution: { ja: '下のふちの中央から、上のふちの中央より少し左へ向かう線で折ります。', en: 'Fold from the bottom midpoint toward a point slightly left of the top midpoint.' } },
  { moves: [{ line: [[.16,0],[-.046,.153]], side: 1 }],
    description: { ja: '下の小さな角を折り上げ、ちょうちょの頭にします。', en: 'Fold the small bottom corner up to make the head.' } },
]);
// Rotate the entire completed sheet without introducing another crease.
const rotationAxis = butterflyModel.vertices.length;
butterflyModel.vertices.push([0,0],[0,1]);
butterflyModel.steps.push({
  description: { ja: '全体を左へ90度回して完成です。小さな頭に目を描けます。', en: 'Rotate the whole piece 90 degrees counterclockwise to finish. You can draw an eye on the small head.' },
  folds: [{ axis: [rotationAxis,rotationAxis+1], moving: butterflyModel.vertices.map((_,i)=>i), type: 'assemble', angle: 0, spinZ: 90 }],
});
