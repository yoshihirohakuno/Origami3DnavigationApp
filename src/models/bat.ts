import { flatSequence } from '../engine/flatSequence';

// Reference: holloween/bat2/bat2/zu.gif. The vertical precrease (panel 1)
// is omitted. Each wing folds inward and then outward on a DIFFERENT crease;
// these shape-making pleats must not be removed as crease preparation.
// Diamond radius 1. Panel 3: horizontal crease at .43 of triangle height;
// panel 4 confirms the folded tip just below the base (2H-1 = -.14).
// Panel 4 wing creases are exact 45-degree diagonals through (0,H).
// Panel 5: outer hinges meet the sides at y=0 and the center at Q=.29.
// H and Q are measured proportions, not a quarter/third landmark.
const H = .43;
const Q = .29;

export const batModel = flatSequence({
  id: 'bat', name: { ja: 'こうもり', en: 'Bat' }, difficulty: 3,
  sheetColors: [{ front: '#8274b0', back: '#fbfaf7' }],
}, [[0, 1], [-1, 0], [0, -1], [1, 0]], true, [
  { moves: [{ line: [[-1, 0], [1, 0]], side: -1 }],
    description: { ja: '下の角を上の角へ合わせ、三角に折ります。', en: 'Fold the bottom corner up to the top corner to make a triangle.' },
    caution: { ja: '白い面を上にして始めます。左右の角を水平にそろえます。', en: 'Start white side up, with the left and right points level.' } },
  { moves: [{ line: [[-1, H], [1, H]], side: 1 }],
    description: { ja: '上の角を、2枚重ねたまま下へ折ります。', en: 'Fold the top point down through both layers.' },
    caution: { ja: '先が下のふちを少し越える位置です。表示の横の折り線に合わせます。', en: 'The tip extends a little below the bottom edge. Use the displayed horizontal fold line.' } },
  { moves: [{ line: [[-H, 0], [0, H]], side: 1 }],
    description: { ja: '左の羽を斜めに折り下げ、中心側へ寄せます。', en: 'Fold the left wing diagonally down toward the center.' } },
  { moves: [{ line: [[0, H], [H, 0]], side: 1 }],
    description: { ja: '右の羽も斜めに折り下げます。', en: 'Fold the right wing diagonally down as well.' },
    caution: { ja: '左右の羽先の高さをそろえます。', en: 'Keep the two wing tips at the same height.' } },
  { moves: [{ line: [[-H, 0], [0, Q]], side: -1, fromFold: 2 }],
    description: { ja: '左の羽を、少し低い斜めの線で外へ折り返します。', en: 'Fold the left wing outward along the slightly lower diagonal.' },
    caution: { ja: '前の折り線には戻しません。2本の線の間に段を残し、羽を広げます。', en: 'Use a new crease, leaving a pleat between the two lines to spread the wing.' } },
  { moves: [{ line: [[0, Q], [H, 0]], side: -1, fromFold: 3 }],
    description: { ja: '右の羽も外へ折り返し、左右の形をそろえます。', en: 'Fold the right wing outward to match the left.' } },
  { moves: [{ line: [[0, -1], [0, 1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえして、中央の顔の部分を手前にします。', en: 'Turn the paper over to bring the face to the front.' } },
  { moves: [{ line: [[-1, Q], [1, Q]], side: 1, exceptFold: [4, 5] }],
    description: { ja: '中央の小さな角だけを折り下げ、顔と2つの耳を作ります。', en: 'Fold only the small central point down to shape the face and two ears.' },
    caution: { ja: '広げた左右の羽は動かしません。', en: 'Keep both spread wings in place.' } },
  { moves: [{ line: [[0, -1], [0, 1]], side: 1, type: 'mountain' }],
    description: { ja: '中央を少しだけ後ろへ曲げ、羽に立体感をつけて完成です。', en: 'Bend the center slightly backward to give the wings depth and finish.' },
    caution: { ja: '半分に閉じず、羽を広げたままにします。目は完成後に描けます。', en: 'Keep the wings spread rather than closing them together. You can draw eyes afterward.' } },
], 2e-6); // Keep the many coincident crease copies below .001 separation.
// Panel 8 explicitly asks for a slight bend, not a closed 180-degree fold.
const bend = batModel.steps.at(-1)!;
bend.folds = bend.folds.filter(op => op.guide !== false);
bend.folds[0].angle = 16;
