import { flatSequence } from '../engine/flatSequence';

// 参考: easy/human-face/father/zu.gif(ちちのかお)。❶の折り目づけを省略。
// ❷→1、❸→2、❹→3、❺→4–5、❻→6、❼→7–8、❽→9。最後は顔を描いて完成。
const jaw = 0.25;
export const fatherModel = flatSequence({
  id: 'father', name: { ja: 'おとうさん', en: 'Father' }, difficulty: 2,
  sheetColors: [{ front: '#5b5f66', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,1],[1,.5]], side: 1 }],
    description: { ja: '左上の角から右のふちへ向かう線で、上を折り下げます。', en: 'Fold the top down along a line from the top-left corner to the right edge.' },
    caution: { ja: '白い面を上にして始めます。折り線の右のはしは、4分の1の折り目の高さです。', en: 'Start white side up. The right end of the crease sits at the quarter crease.' } },
  { moves: [{ line: [[1,1],[-1,.5]], side: -1 }],
    description: { ja: '反対向きにも同じ線で折り下げ、山の形にします。', en: 'Fold down the other way along the mirror line to make a peak.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえします。', en: 'Turn it over.' },
    caution: { ja: 'うらがえすと、一面が色の面になります。', en: 'Turned over, the whole sheet shows the colored side.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、中心へ向けて折ります。', en: 'Fold the left edge in toward the middle.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1 }],
    description: { ja: '右のふちも中心へ折り、顔の幅を決めます。', en: 'Fold the right edge in as well to set the width of the face.' },
    caution: { ja: '折り返した白い面が顔、残った色の面が髪になります。', en: 'The white side turned up is the face; the colored side left showing is the hair.' } },
  { moves: [{ line: [[-1,-.5],[1,-.5]], side: -1 }],
    description: { ja: '下を、4分の1の折り目で折り上げます。', en: 'Fold the bottom up at the quarter crease.' } },
  { moves: [{ line: [[-.5,-.5+jaw],[-.5+jaw,-.5]], side: -1 }],
    description: { ja: '左下の角を、ななめに折ります。', en: 'Fold the bottom-left corner in along a slant.' } },
  { moves: [{ line: [[.5,-.5+jaw],[.5-jaw,-.5]], side: 1 }],
    description: { ja: '右下の角も、同じように折ります。', en: 'Fold the bottom-right corner in the same way.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度うらがえしたら、あとは顔を描くだけです。', en: 'Turn it over once more, and all that is left is to draw the face.' },
    caution: { ja: '目と鼻と口を描くと、おとうさんの顔になります。描く作業はアニメーションには含みません。', en: 'Draw the eyes, nose and mouth to finish. Drawing is a step outside the animation.' } },
], 1e-7); // 髪が何枚も重なるので、表示用の紙厚を薄くして継ぎ目を閉じる。
fatherModel.renderLayerSeparation = .00004;
