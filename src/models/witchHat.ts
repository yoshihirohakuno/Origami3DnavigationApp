import { flatSequence } from '../engine/flatSequence';

// holloween/witch's hat/witch's hat/zu.gif. Omit panels 1/2 (precreases).
// The lower horizontal crease meets both 22.5-degree side creases on the edge:
// y=1-sqrt(2), x=±(2-sqrt(2)). This is a landmark, not a guessed .4 crease.
// Panel 6 rolls the brim upward THREE times. Its three equally spaced lines
// are about a tenth of the triangle's height (sqrt(2)); panel 7 confirms the
// brim/full-height ratio ~.14 and the width/full-height ratio ~1.19.
const k = 2 - Math.SQRT2;
const bottom = 1 - Math.SQRT2;
const band = Math.SQRT2 / 10;
export const witchHatModel = flatSequence({
  id: 'witch-hat', name: { ja: '魔女の帽子', en: "Witch's Hat" }, difficulty: 3,
  sheetColors: [{ front: '#7966ad', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[-k,bottom],[k,bottom]], side: -1 }],
    description: { ja: '下の角を横の折り線で上へ折ります。', en: 'Fold the bottom point up along the horizontal line.' },
    caution: { ja: '白い面を上にして始めます。表示の線は、左右を細く折る線が下の辺と交わる高さです。', en: 'Start white side up. The displayed line joins the points where the later side folds meet the lower edges.' } },
  { moves: [{ line: [[-k,bottom],[0,1]], side: 1 }],
    description: { ja: '左上のふちを中心線へ合わせ、細く折ります。', en: 'Fold the upper-left edge to the center line.' } },
  { moves: [{ line: [[0,1],[k,bottom]], side: 1 }],
    description: { ja: '右上のふちも中心線へ合わせます。', en: 'Fold the upper-right edge to the center line as well.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえして、つばを折る面を手前にします。', en: 'Turn the paper over to fold the brim on this side.' } },
  ...[1,2,3].map((n) => ({
    moves: [{ line: [[-1,bottom+n*band],[1,bottom+n*band]] as [[number,number],[number,number]], side: -1 as const }],
    description: {
      ja: n===3 ? '同じ幅でもう一段折り上げ、つばを仕上げます。' : `下の帯を${n===1?'一段':'もう一段'}、上へ折り上げます。`,
      en: n===3 ? 'Roll the same width upward once more to finish the brim.' : `Roll the bottom band upward ${n===1?'once':'a second time'}.`,
    },
    caution: {
      ja: n===3 ? 'とがった部分とつばに色の面が出たら完成です。' : '折り戻さず、下のふちを同じ幅ずつ上へ巻くように折ります。',
      en: n===3 ? 'The colored side faces outward on the crown and brim.' : 'Keep rolling upward in equal widths; do not unfold the previous turn.',
    },
  })),
], 2e-6);
