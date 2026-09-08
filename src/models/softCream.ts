import { flatSequence } from '../engine/flatSequence';

// 参考: easy/food/soft-cream2/zu.gif。❶を左右の2工程に分ける。
// コーンの折り線は下角の二等分線: 上の斜辺との交点は (±(2-√2), √2-1)。
// ❸の上角は y=.75 で下げ、❹は別の線 y=.65 で折り返す。
// これはクリームの輪郭を作る段折りで、折り目づけの打ち消しではない。
const k = 2 - Math.SQRT2;
export const softCreamModel = flatSequence({
  id: 'soft-cream', name: { ja: 'ソフトクリーム', en: 'Soft Serve' }, difficulty: 1,
  sheetColors: [{ front: '#efbc62', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[0,-1],[-k,1-k]], side: 1 }],
    description: { ja: '左下のふちを、たての中心線に合わせて折ります。', en: 'Fold the lower-left edge to the vertical center line.' },
    caution: { ja: '白い面を上にして、角を下へ向けます。下の角を動かさずに折ります。', en: 'Start white side up with a corner pointing down. Keep that bottom point in place.' } },
  { moves: [{ line: [[k,1-k],[0,-1]], side: 1 }],
    description: { ja: '右下のふちも中心線に合わせ、細いコーンを作ります。', en: 'Fold the lower-right edge to the center line to form the cone.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '全体を裏返して、色の面を手前にします。', en: 'Turn the whole piece over so the colored side faces you.' } },
  { moves: [{ line: [[-1,.75],[1,.75]], side: 1 }],
    description: { ja: '上の角を、表示の横線で手前へ折り下げます。', en: 'Fold the top point down along the displayed horizontal line.' },
    caution: { ja: '先端から下の角までの長さの、約8分の1の位置で折ります。', en: 'Place the fold about one eighth of the total height below the top point.' } },
  { moves: [{ line: [[-1,.65],[1,.65]], side: -1, fromFold: 3 }],
    description: { ja: '下げた小さな先だけを、少し下の線で上へ折り返します。', en: 'Fold just the small lowered tip upward along the slightly lower line.' },
    caution: { ja: '最初の折り線には戻しません。少し幅を残す段折りです。', en: 'Use a new, lower fold line, leaving a narrow pleat.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度裏返して、白いクリームと色のコーンが見えたら完成です。', en: 'Turn it over again to reveal the white cream above the colored cone.' } },
]);
