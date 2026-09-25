import { flatSequence } from '../engine/flatSequence';

// holloween/skeleton/skeleton/zu.gif. The two lower edge-to-center folds
// use exact 22.5-degree bisectors. Omit panel 1 (precrease only).
// Panel 3 forehead=.76. Panel 4 has a .05-wide upward pleat at A=-.14;
// its second line is at -.19 in the unfolded diagram, but at A+.05 AFTER
// folding up. The hanging tip then lies at T=-.90 (not the old -1).
// Panel 6 divides the hanging height into FIFTHS: d=(A-T)/5. Fold alternately
// at A-d and A four times. The last tip lands exactly at A-d, closing the teeth.
const k = 2-Math.SQRT2;
const shoulder = Math.SQRT2-1;
const A = -.14, T = -.9;
const d = (A-T)/5;
export const skullModel = flatSequence({
  id: 'skull', name: { ja: 'がいこつの顔', en: 'Skull' }, difficulty: 3,
  sheetColors: [{ front: '#deded4', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[0,-1],[-k,shoulder]], side: 1 }],
    description: { ja: '左下のふちを、たての中心線へ合わせます。', en: 'Fold the lower-left edge to the vertical center line.' },
    caution: { ja: '白い面を上にして始めます。下の角を動かさず、細長いたこ形に折ります。', en: 'Start white side up. Keep the bottom point fixed to form a long kite.' } },
  { moves: [{ line: [[k,shoulder],[0,-1]], side: 1 }],
    description: { ja: '右下のふちも中心線へ合わせます。', en: 'Fold the lower-right edge to the center line too.' } },
  { moves: [{ line: [[-1,.76],[1,.76]], side: 1 }],
    description: { ja: '上の角を小さく折り下げ、頭の上を平らにします。', en: 'Fold the top point down a little to flatten the top of the head.' } },
  { moves: [{ line: [[-1,A],[1,A]], side: -1 }],
    description: { ja: '下の細長い部分を、表示の横線で上へ折り上げます。', en: 'Fold the long lower point upward along the displayed horizontal line.' } },
  { moves: [{ line: [[-1,A+.05],[1,A+.05]], side: 1, fromFold: 3 }],
    description: { ja: '持ち上げた先を少し高い線で下へ折り返し、細い段を作ります。', en: 'Fold the lifted tip back down along the slightly higher line to make a narrow pleat.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえして、頭の表側を手前にします。', en: 'Turn the paper over to bring the front of the head toward you.' } },
  { moves: [{ line: [[-1,A-d],[1,A-d]], side: -1 }],
    description: { ja: '下に出た三角の先を、上へ折り上げます。', en: 'Fold the tip of the hanging triangle upward.' },
    caution: { ja: '頭の下のふちから、出ている三角の高さの5分の1だけ下で折ります。', en: 'Place the crease one fifth of the hanging triangle height below the bottom edge of the head.' } },
  { moves: [{ line: [[-1,A],[1,A]], side: 1, fromFold: 6 }],
    description: { ja: '頭の下のふちに合わせて、先を下へ折り返します。', en: 'Fold the tip back down along the bottom edge of the head.' } },
  { moves: [{ line: [[-1,A-d],[1,A-d]], side: -1, fromFold: 7 }],
    description: { ja: '歯の帯の下のふちで、残った先をもう一度上へ折ります。', en: 'Fold the remaining tip up again at the lower edge of the tooth band.' } },
  { moves: [{ line: [[-1,A],[1,A]], side: 1, fromFold: 8 }],
    description: { ja: '先を下へ折り返し、歯の帯にぴたりと収めて完成です。', en: 'Fold the tip down once more so it lands exactly on the lower edge of the tooth band.' },
    caution: { ja: 'じゃばらの線が歯になります。目と鼻は、折り終わってから描けます。', en: 'The pleat lines form the teeth. You can draw the eyes and nose after folding.' } },
], 1e-6);
// Keep physical paper thin; separate coincident layers only for WebGL rendering.
skullModel.renderLayerSeparation = .00004;
