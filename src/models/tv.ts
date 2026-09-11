import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/tv/tv/zu.gif。❶〜❸の折り目づけを省略、❺は左右別。
// ❹❺は「ふちを4分の1の折り目に合わせる」ので折り線は ±.75。
// ❻の下だけは深く、折り線 y=-.64(図の実測。完成の下の帯が広くボタンが載る)。
// 白い面から始めるので、折り返した色の面が枠、残した白い面が画面になる。
export const tvModel = flatSequence({
  id: 'tv', name: { ja: 'テレビ', en: 'Television' }, difficulty: 1,
  sheetColors: [{ front: '#6fb3d2', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,.75],[1,.75]], side: 1 }],
    description: { ja: '上のふちを、4分の1の折り目に合わせて折ります。', en: 'Fold the top edge down to the quarter crease.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が枠になります。', en: 'Start white side up. The colored side turned up becomes the frame.' } },
  { moves: [{ line: [[-.75,-1],[-.75,1]], side: 1 }],
    description: { ja: '左のふちも同じように折ります。', en: 'Fold the left edge in the same way.' } },
  { moves: [{ line: [[.75,-1],[.75,1]], side: -1 }],
    description: { ja: '右のふちも折り、左右の枠をそろえます。', en: 'Fold the right edge to match the left.' } },
  { moves: [{ line: [[-1,-.64],[1,-.64]], side: -1 }],
    description: { ja: '下のふちは少し広めに折り上げ、完成です。', en: 'Fold the bottom edge up a little deeper to finish.' },
    caution: { ja: '下の枠だけ広くします。ボタンを描くと、てれびになります。描く作業はアニメーションには含みません。', en: 'The bottom frame is the wide one. Draw the buttons to finish; drawing is a step outside the animation.' } },
]);
