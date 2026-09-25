import { flatSequence } from '../engine/flatSequence';

// holloween/franken/franken/zu.gif. Panel 1 is only crease preparation.
// Hair: top to center (.5); fold back at one third of this .5-high triangle
// measured FROM ITS TOP (1/3), then down at .5. Three colored points remain.
// Panels 5/6 form a genuine offset pleat: -.09 down, then -.18 back up.
// Panel 5's line is ~.09 below the original center, and panel 6's spacing
// confirms the same distance. Panel 7 side lines are x=±.46 (inside hair ends).
// Bottom tuck at -.8 agrees with panel 8 and the final width/height ~.83.
export const frankenModel = flatSequence({
  id: 'franken', name: { ja: 'フランケンシュタインの顔', en: 'Frankenstein Face' }, difficulty: 3,
  sheetColors: [{ front: '#596374', back: '#eef0e8' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[-1,.5],[1,.5]], side: 1 }],
    description: { ja: '上の角を紙の中心へ合わせて折り下げます。', en: 'Fold the top corner down to the center of the paper.' },
    caution: { ja: '白い面を上にして始めます。色の面で髪、白い面で顔を作ります。', en: 'Start white side up. The colored side makes the hair, and the white side makes the face.' } },
  { moves: [{ line: [[-1,1/3],[1,1/3]], side: -1, fromFold: 0 }],
    description: { ja: '髪の三角の先だけを、上へ折り返します。', en: 'Fold just the tip of the hair triangle back upward.' },
    caution: { ja: '折り線は、色の三角の上のふちから高さの3分の1の位置です。下の大きな紙は折りません。', en: 'The crease lies one third of the colored triangle height below its top edge. Leave the large sheet beneath it in place.' } },
  { moves: [{ line: [[-1,.5],[1,.5]], side: 1, fromFold: 1 }],
    description: { ja: '飛び出した先を下へ折り、髪のぎざぎざを作ります。', en: 'Fold the protruding tip down to make the zigzag hairline.' } },
  { moves: [{ line: [[-1,-.09],[1,-.09]], side: 1 }],
    description: { ja: '中央より少し下の線で、上半分を手前へ折り下げます。', en: 'Fold the upper part down along the line just below the center.' } },
  { moves: [{ line: [[-1,-.18],[1,-.18]], side: -1, fromFold: 3 }],
    description: { ja: '折り下げた部分だけを、少し低い線で上へ折り返します。', en: 'Fold only that flap back upward along the slightly lower line.' },
    caution: { ja: '細い段を残します。この横のふちが顔の中ほどにできます。', en: 'Leave a narrow pleat. Its horizontal edge crosses the middle of the face.' } },
  { moves: [{ line: [[-.46,-1],[-.46,1]], side: 1, type: 'mountain' }],
    description: { ja: '左のふちを後ろへ折り、顔の幅を整えます。', en: 'Fold the left edge behind to shape the width of the face.' } },
  { moves: [{ line: [[.46,-1],[.46,1]], side: -1, type: 'mountain' }],
    description: { ja: '右のふちも後ろへ折ります。', en: 'Fold the right edge behind as well.' } },
  { moves: [{ line: [[-1,-.8],[1,-.8]], side: -1, type: 'mountain' }],
    description: { ja: '下のとがった角を後ろへ折り、あごを平らにします。', en: 'Fold the bottom point behind to flatten the chin.' },
    caution: { ja: '髪の3つのぎざぎざと、白い顔が出たら完成です。目・口・きずは後から描けます。', en: 'Finish with three zigzags of hair above the white face. You can draw eyes, a mouth and a scar afterward.' } },
], 2e-6);
