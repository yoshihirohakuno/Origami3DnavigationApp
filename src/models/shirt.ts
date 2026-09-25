import { flatSequence } from '../engine/flatSequence';

// Reference: fashion/shirt/shirt/zu.gif. Four independent flap folds; no crease-preparation steps.
export const shirtModel = flatSequence({
  id: "shirt", name: { ja: "開襟シャツ", en: "Open-collar Shirt" }, difficulty: 3,
  sheetColors: [{ front: '#5194b3', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{"line":[[-0.5,-2],[-0.5,2]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "左の辺を中心へ合わせます。", en: "Fold the left edge to the center." } },
  { moves: [{"line":[[0.5,-2],[0.5,2]],"side":-1}],
    description: { ja: "右の辺を中心へ合わせます。", en: "Fold the right edge to the center." } },
  { moves: [{"line":[[-0.28,1],[0,0]],"side":1,"fromFold":0}],
    description: { ja: "左上の一枚を外へ開き、襟を作ります。", en: "Fold the upper-left flap outward for the collar." } },
  { moves: [{"line":[[0,0],[0.28,1]],"side":1,"fromFold":1}],
    description: { ja: "右上の一枚も外へ折ります。", en: "Fold the upper-right flap outward." } },
  { moves: [{"line":[[0,0],[-0.5,-1]],"side":1,"fromFold":0}],
    description: { ja: "左下の一枚を斜めに外へ折り、袖を広げます。", en: "Fold the lower-left flap diagonally outward for a sleeve." } },
  { moves: [{"line":[[0.5,-1],[0,0]],"side":1,"fromFold":1}],
    description: { ja: "右下の一枚も外へ広げます。", en: "Fold the lower-right flap outward." } },
  { moves: [{"line":[[-2,0],[2,0]],"side":-1,"type":"mountain"}],
    description: { ja: "下の部分を後ろへ半分に折り上げます。", en: "Fold the lower part upward behind the shirt." } },
  { moves: [{"line":[[-0.5,0.82],[-0.32,1]],"side":1,"type":"mountain"}],
    description: { ja: "左肩の小さな角を後ろへ折ります。", en: "Fold the small left shoulder corner behind." } },
  { moves: [{"line":[[0.32,1],[0.5,0.82]],"side":1,"type":"mountain"}],
    description: { ja: "右肩の角も後ろへ折って仕上げます。", en: "Fold the right shoulder corner behind to finish." } },
], 1e-8);
shirtModel.renderLayerSeparation = .00004;
