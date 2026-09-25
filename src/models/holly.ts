import { flatSequence } from '../engine/flatSequence';

// Reference: xmas/holly/holly2/zu.gif. Four-layer rolled band with two oblique shaping folds.
export const hollyModel = flatSequence({
  id: "holly", name: { ja: "ひいらぎの葉", en: "Holly Leaves" }, difficulty: 3,
  sheetColors: [{ front: '#659653', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{"line":[[-2,0.5],[2,0.5]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "上の角を中心へ折ります。", en: "Fold the top corner to the center." } },
  { moves: [{"line":[[-2,-0.5],[2,-0.5]],"side":-1}],
    description: { ja: "下の角を中心へ折ります。", en: "Fold the bottom corner to the center." } },
  { moves: [{"line":[[-2,0.25],[2,0.25]],"side":1}],
    description: { ja: "上の辺をもう一度中心へ折ります。", en: "Fold the upper edge to the center again." } },
  { moves: [{"line":[[-2,-0.25],[2,-0.25]],"side":-1}],
    description: { ja: "下の辺も中心へ折り、細い帯にします。", en: "Fold the lower edge to the center to form a narrow band." } },
  { moves: [{"line":[[-0.5,-0.25],[0,0.25]],"side":1}],
    description: { ja: "帯の左側を斜めに折り下げ、1枚目の葉にします。", en: "Fold the left side of the band diagonally down for the first leaf." } },
  { moves: [{"line":[[0,0.25],[0.5,-0.25]],"side":1}],
    description: { ja: "右側も斜めに折り下げ、2枚の葉を開きます。", en: "Fold the right side diagonally down to spread the two leaves." } },
], 1e-8);
hollyModel.renderLayerSeparation = .00004;
