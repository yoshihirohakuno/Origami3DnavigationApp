import { flatSequence } from '../engine/flatSequence';

// Reference: xmas/cap/cap2/zu.gif. Flat display variant: rolled brim and side folds; omit the pocket insertion and opening into a cone.
export const santaCapModel = flatSequence({
  id: "santa-cap", name: { ja: "サンタの帽子", en: "Santa Cap" }, difficulty: 3,
  sheetColors: [{ front: '#bc627c', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], false, [
  { moves: [{"line":[[-2,-0.5],[2,-0.5]],"side":-1}],
    caution: { ja: '色の面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start colored side up. Follow one displayed crease at a time.' },
    description: { ja: "下の角を中心へ合わせ、白い三角を出します。", en: "Fold the bottom point to the center to show a white triangle." } },
  { moves: [{"line":[[-2,-0.25],[2,-0.25]],"side":-1}],
    description: { ja: "下のふちをもう一段上へ折ります。", en: "Roll the lower edge upward one more turn." } },
  { moves: [{"line":[[-2,0],[2,0]],"side":-1}],
    description: { ja: "下の帯をさらに上へ折り、白いつばを出します。", en: "Roll the lower band upward again to show the white brim." } },
  { moves: [{"line":[[-2,0.92],[2,0.92]],"side":1}],
    description: { ja: "上の先を小さく折り、白い飾りにします。", en: "Fold the top tip down a little for the white pom-pom." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
  { moves: [{"line":[[-0.4142135624,0],[0,1]],"side":1}],
    description: { ja: "左の辺を内側へ折り、帽子を細くします。", en: "Fold the left edge inward to narrow the cap." } },
  { moves: [{"line":[[0,1],[0.4142135624,0]],"side":1}],
    description: { ja: "右の辺も内側へ折ります。", en: "Fold the right edge inward as well." } },
  { moves: [{"line":[[-2,-0.18],[2,-0.18]],"side":-1}],
    description: { ja: "下に出た先を上へ折り、すそを整えます。", en: "Fold the protruding lower tips up to level the brim." } },
  { moves: [{"line":[[-2,-0.08],[2,-0.08]],"side":1,"fromFold":7}],
    description: { ja: "折り上げた先だけを下へ返し、つばの段を残します。", en: "Fold only those tips back down, leaving a brim pleat." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
  { moves: [{"line":[[-2,0.12],[2,0.12]],"side":-1,"type":"mountain"}],
    description: { ja: "つばの下の余りを後ろへ折り、細い白い帯に整えます。", en: "Fold the excess below the brim behind to leave a narrow white band." } },
  { moves: [{ line: [[-.4142135623730951,0],[0,1]], side: 1, type: 'mountain' }],
    description: { ja: '左につばから出た角を後ろへ折り込みます。', en: 'Tuck the corner protruding from the left brim behind.' } },
  { moves: [{ line: [[0,1],[.4142135623730951,0]], side: 1, type: 'mountain' }],
    description: { ja: '右につばから出た角も後ろへ折ります。', en: 'Tuck the protruding right brim corner behind too.' } },
  { moves: [{"line":[[-0.25,0.54],[0.25,0.72]],"side":1}],
    description: { ja: "上の先を斜めに折って、帽子を横へ曲げます。", en: "Fold the upper tip diagonally to bend the cap sideways." } },
], 1e-8);
santaCapModel.renderLayerSeparation = .00004;
