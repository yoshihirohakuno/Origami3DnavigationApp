import { flatSequence } from '../engine/flatSequence';

// Reference: fashion/baseball/baseball/zu.gif. White jersey, colored placket and sleeve rims.
export const baseballJerseyModel = flatSequence({
  id: "baseball-jersey", name: { ja: "野球のユニフォーム", en: "Baseball Jersey" }, difficulty: 3,
  sheetColors: [{ front: '#4aa8cd', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{"line":[[-0.92,-2],[-0.92,2]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "左のふちを細く折り、色の帯を出します。", en: "Fold a narrow colored strip along the left edge." } },
  { moves: [{"line":[[0.92,-2],[0.92,2]],"side":-1}],
    description: { ja: "右のふちも同じ幅で折ります。", en: "Fold the right edge by the same width." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
  { moves: [{"line":[[-0.46,-2],[-0.46,2]],"side":1}],
    description: { ja: "左の辺を中心線へ合わせます。", en: "Fold the left edge to the center line." } },
  { moves: [{"line":[[0.46,-2],[0.46,2]],"side":-1}],
    description: { ja: "右の辺も中心線へ合わせます。", en: "Fold the right edge to the center line." } },
  { moves: [{"line":[[0,0],[-0.46,-1]],"side":1,"fromFold":3}],
    description: { ja: "左下の一枚を外へ折り、袖を出します。", en: "Fold the lower-left flap outward for the sleeve." } },
  { moves: [{"line":[[0.46,-1],[0,0]],"side":1,"fromFold":4}],
    description: { ja: "右下の一枚も外へ折ります。", en: "Fold the lower-right flap outward." } },
  { moves: [{"line":[[-2,0],[2,0]],"side":-1,"type":"mountain"}],
    description: { ja: "下半分を後ろへ折り上げ、袖を両側へ出します。", en: "Fold the lower half up behind the shirt, keeping the sleeves spread." } },
  { moves: [{"line":[[-0.16,1],[0,0.84]],"side":1,"fromFold":3}],
    description: { ja: "左の襟の角を斜めに折ります。", en: "Fold the left collar corner diagonally." } },
  { moves: [{"line":[[0,0.84],[0.16,1]],"side":1,"fromFold":4}],
    description: { ja: "右の襟も折って、首元をV字にします。", en: "Fold the right collar corner to form a V neck." } },
  { moves: [{"line":[[-0.46,0.8],[-0.26,1]],"side":1,"type":"mountain"}],
    description: { ja: "左肩の角を後ろへ折ります。", en: "Fold the left shoulder corner behind." } },
  { moves: [{"line":[[0.26,1],[0.46,0.8]],"side":1,"type":"mountain"}],
    description: { ja: "右肩も後ろへ折ります。背番号はあとで描けます。", en: "Fold the right shoulder corner behind. Add a number afterward." } },
], 1e-8);
baseballJerseyModel.renderLayerSeparation = .00004;
