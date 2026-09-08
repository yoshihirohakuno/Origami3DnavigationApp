import { flatSequence } from '../engine/flatSequence';

// 参考: easy/food/watermelon2/zu.gif。❶の折り目づけを省略、❹は左右別。
// 下の帯は原紙の高さの1/8を折る(y=-.75)。白い帯の上端y=-.5と
// 上辺中央(0,1)を結ぶ線で左右を折る。最後の裏返しで継ぎ目を裏へ。
export const watermelonModel = flatSequence({
  id: 'watermelon', name: { ja: 'すいか', en: 'Watermelon' }, difficulty: 1,
  sheetColors: [{ front: '#ee6479', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{ line: [[-1,-.75],[1,-.75]], side: -1 }],
    description: { ja: '下のふちを少し折り上げ、白い皮の帯を作ります。', en: 'Fold the bottom edge up a little to make the white rind.' },
    caution: { ja: '色の面を上にして始めます。下から紙の高さの8分の1の線で折ります。', en: 'Start colored side up. Fold at one eighth of the paper height from the bottom.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '全体を裏返して、白い面を手前にします。', en: 'Turn the whole piece over so the white side faces you.' } },
  { moves: [{ line: [[-1,-.5],[0,1]], side: 1 }],
    description: { ja: '左上の角を、表示の斜めの線で内側へ折ります。', en: 'Fold the upper-left corner inward along the displayed sloping line.' },
    caution: { ja: '折り線は、上のふちの中央と、左のふちの下から4分の1の点を結びます。', en: 'Join the midpoint of the top edge to the point one quarter of the way up the left edge.' } },
  { moves: [{ line: [[0,1],[1,-.5]], side: 1 }],
    description: { ja: '右上の角も同じように折り、三角の実を作ります。', en: 'Fold the upper-right corner inward to form the triangular fruit.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '裏返して完成です。赤い面に種を描いてみましょう。', en: 'Turn it over to finish. Draw seeds on the red face.' },
    caution: { ja: '白い帯は皮です。種を描く作業はアニメーションには含みません。', en: 'The white strip is the rind. Drawing seeds is a finishing step outside the animation.' } },
]);
