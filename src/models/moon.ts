import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/moon/moon/zu.gif(つき)。❶の折り目づけを省略。
// ❷→1、❸→2–3、❹→4、❺→5、❻→6–7、❼→8、❽が完成。
// ❷ 左のふちを少しだけ折り返す(折り線 x=-.8。❷の破線も❸の帯の幅も紙幅の1/10)。
// ❸ 右の両角を中心へ。折り線は上のふちの中央 (0,±1) と右のふちの中央 (1,0) を
//    結ぶ45°線(厳密。右のふちがちょうど横の中心線に乗り、右が三角の先になる)。
// ❹ その三角の先を、たての中心線 x=0 で左へ折る。先は紙の左のふちより外へ出る。
// ❺ 出た先を x=-.4 でもう一度右へ折り返す(段折り)。先は x=.2 まで戻る
//    (折り図❻の実測 .19)。ここで三日月のふくらみができる。
// ❻ 左上と左下の角をななめに折る。目印はなく、折り図❼の外形の実測から
//    左上は (-.3,1)-(-.8,.4)、左下は (-.64,-1)-(-.8,-.52)。左右で深さが違う。
// ❼ うらがえすと先が左を向き、折り図❽の姿になる。目と口は描いて仕上げる。
const edge = 0.8;
const pleat = -0.4;
export const moonModel = flatSequence({
  id: 'moon', name: { ja: 'つき', en: 'Moon' }, difficulty: 2,
  sheetColors: [{ front: '#eccb43', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-edge,-1],[-edge,1]], side: 1 }],
    description: { ja: '左のふちを、少しだけ折り返します。', en: 'Turn the left edge over a little.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が細い帯になります。', en: 'Start white side up. The colored side turned over makes a narrow band.' } },
  { moves: [{ line: [[0,1],[1,0]], side: 1 }],
    description: { ja: '右上の角を、中心へ向けて折ります。', en: 'Fold the top-right corner in toward the middle.' },
    caution: { ja: '折り線は、上のふちの中央と右のふちの中央を結びます。', en: 'The crease joins the middle of the top edge to the middle of the right edge.' } },
  { moves: [{ line: [[0,-1],[1,0]], side: -1 }],
    description: { ja: '右下の角も同じように折り、右を三角の先にします。', en: 'Fold the bottom-right corner the same way to bring the right side to a point.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: -1 }],
    description: { ja: '三角の先を、たての中心線で左へ折ります。', en: 'Fold the point over to the left along the vertical center line.' },
    caution: { ja: '先は紙の左のふちより外へ出ます。', en: 'The point reaches past the left edge of the paper.' } },
  { moves: [{ line: [[pleat,-1],[pleat,1]], side: 1, fromFold: 3 }],
    description: { ja: '折った先を、もう一度右へ折り返します。', en: 'Fold the point back to the right once more.' },
    caution: { ja: '段折りになり、ここが月のふくらみになります。', en: 'This makes a pleat, and the bulge becomes the curve of the moon.' } },
  { moves: [{ line: [[-.3,1],[-edge,.4]], side: -1 }],
    description: { ja: '左上の角を、ななめに折ります。', en: 'Fold the top-left corner in along a slant.' } },
  { moves: [{ line: [[-.64,-1],[-edge,-.52]], side: 1 }],
    description: { ja: '左下の角も、少し浅くななめに折ります。', en: 'Fold the bottom-left corner in as well, a little shallower.' } },
  { moves: [{ line: [[pleat,-1],[pleat,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえしたら、つきのできあがりです。', en: 'Turn it over and the moon is done.' },
    caution: { ja: '目と口を描くと、つきの顔になります。描く作業はアニメーションには含みません。', en: 'Draw the eye and mouth to finish. Drawing is a step outside the animation.' } },
], 1e-6); // 段折りの上にさらに角を折るので、表示用の紙厚を薄くして継ぎ目を閉じる。
