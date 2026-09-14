import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/water-bottle/water-bottle/zu.gif(すいとう)。
// ❶→1、❷→2、❸→3–4、❹→5–6、❺→7、❻が完成(ひもは描いて仕上げる)。
// ❶ 上のふちをよこの中心線へ折り下げる(y=.5。折り図❷の高さ1.5と一致。厳密)。
//    色の面を上にして始めるので、折り返した白い裏がふたになる。
// ❷ うらがえす。裏から見ると一面が白。
// ❸ 左右のふちを中心へ(x=±.5。折り図❸の破線の実測 -.487・.517。厳密)。
//    折り返した面は、ふたの高さより下だけ色が出る。
// ❹ 上の両角を後ろへ落として、ふたを細くする。折り線は上のふちの (±1/3,.5) と
//    横のふちの (±.5,-1/3) を結ぶ(折り図❹の破線の実測 .165×.826、
//    折り図❺の外形 .198×.814、完成図 .152×.848。1/6×5/6 を採った)。
// ❺ もう一度うらがえすと、折り図❻の姿になる。
const cap = 1 / 3;
export const waterBottleModel = flatSequence({
  id: 'water-bottle', name: { ja: 'すいとう', en: 'Water Bottle' }, difficulty: 2,
  sheetColors: [{ front: '#8ec9dc', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{ line: [[-1,.5],[1,.5]], side: 1 }],
    description: { ja: '上のふちを、よこの中心線に合わせて折り下げます。', en: 'Fold the top edge down to the horizontal center line.' },
    caution: { ja: '色の面を上にして始めます。折り返した白い裏が、すいとうのふたになります。', en: 'Start colored side up. The white reverse turned down becomes the cap.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえします。', en: 'Turn it over.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、中心へ向けて折ります。', en: 'Fold the left edge in toward the middle.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1 }],
    description: { ja: '右のふちも中心へ折り、細長い形にします。', en: 'Fold the right edge in as well to make a tall narrow shape.' },
    caution: { ja: 'ふたの高さより下だけ、色の面が出ます。', en: 'The colored side shows only below the height of the cap.' } },
  { moves: [{ line: [[-cap,.5],[-.5,-cap]], side: -1, type: 'mountain' }],
    description: { ja: '左上の角を、ながいななめの線で後ろへ折ります。', en: 'Fold the top-left corner behind along a long slant.' } },
  { moves: [{ line: [[cap,.5],[.5,-cap]], side: 1, type: 'mountain' }],
    description: { ja: '右上の角も後ろへ折り、ふたを細くします。', en: 'Fold the top-right corner behind as well to narrow the cap.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度うらがえしたら、すいとうのできあがりです。', en: 'Turn it over once more and the water bottle is done.' },
    caution: { ja: 'ひもを描いて肩からさげると、すいとうらしくなります。描く作業はアニメーションには含みません。', en: 'Draw a strap over the shoulder to finish. Drawing is a step outside the animation.' } },
]);
