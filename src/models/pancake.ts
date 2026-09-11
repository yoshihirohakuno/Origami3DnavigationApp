import { flatSequence } from '../engine/flatSequence';

// 参考: easy/food/pancake/zu.gif。❶→1、❷→2、❸→3〜6(四隅を一つずつ)、❹→7。
// 二つ折り2回で四半分の正方形(一辺1)。その四隅を45°で落とすと正八角形になる。
// 実測の切り落とし長は一辺の .288、正八角形の厳密値 (2-√2)/2 = .2929 と一致する。
// ❺❻のバターは紙をちぎって作るため、ここには含めない。
const cut = (2 - Math.SQRT2) / 2;
export const pancakeModel = flatSequence({
  id: 'pancake', name: { ja: 'ホットケーキ', en: 'Pancake' }, difficulty: 1,
  sheetColors: [{ front: '#d79a5b', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,0],[1,0]], side: 1 }],
    description: { ja: '上半分を下へ折り、横長の長方形にします。', en: 'Fold the top half down into a wide rectangle.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が焼き色になります。', en: 'Start white side up. The colored side turned up becomes the baked surface.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: -1 }],
    description: { ja: '右半分を左へ折り、小さな正方形にします。', en: 'Fold the right half over to the left into a small square.' } },
  { moves: [{ line: [[-1+cut,-1],[-1,-1+cut]], side: 1 }],
    description: { ja: '左下の角を斜めに折ります。', en: 'Fold the bottom-left corner in along the diagonal.' },
    caution: { ja: '一辺の約3割を落とすと、四隅そろえたとき正八角形になります。', en: 'Take about three tenths of each side so the four corners leave a regular octagon.' } },
  { moves: [{ line: [[-1,-cut],[-1+cut,0]], side: 1 }],
    description: { ja: '左上の角も同じように折ります。', en: 'Fold the top-left corner in the same way.' } },
  { moves: [{ line: [[-cut,0],[0,-cut]], side: 1 }],
    description: { ja: '右上の角を折ります。', en: 'Fold the top-right corner in.' } },
  { moves: [{ line: [[0,-1+cut],[-cut,-1]], side: 1 }],
    description: { ja: '右下の角も折り、八角形にします。', en: 'Fold the bottom-right corner in to complete the octagon.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '裏返して、折り目のない面を上にしたら完成です。', en: 'Turn it over so the smooth side faces up.' },
    caution: { ja: '折り図のバターは紙をちぎって作ります。この作業はアニメーションには含みません。', en: 'The butter in the diagram is torn from another sheet, a step outside the animation.' } },
], 1e-6); // 四つ折りの上に四隅を折るので、表示用の紙厚を薄くして継ぎ目を閉じる。
