import { flatSequence } from '../engine/flatSequence';

// Flat variation inspired by xmas/santa/santa2/zu.gif. Keep the face white
// by tucking only the tiny free tips; preserve offset brim and beard pleats.
export const pointedSantaModel = flatSequence({
  id: "pointed-santa", name: { ja: "とんがり帽子のサンタ", en: "Pointed-hat Santa" }, difficulty: 3,
  sheetColors: [{ front: '#ba5962', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{"line":[[-0.5857864376269049,-0.41421356237309515],[0,1]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "左上の辺を中心線へ合わせます。", en: "Fold the upper-left edge to the center." } },
  { moves: [{"line":[[0,1],[0.5857864376269049,-0.41421356237309515]],"side":1}],
    description: { ja: "右上の辺も中心線へ合わせます。", en: "Fold the upper-right edge to the center." } },
  { moves: [{"line":[[-0.5857864376269049,-0.41421356237309515],[0,-0.08]],"side":-1,"fromFold":0}],
    description: { ja: "左の一枚の下の角を上へ折ります。", en: "Fold the lower corner of the left flap upward." } },
  { moves: [{"line":[[0,-0.08],[0.5857864376269049,-0.41421356237309515]],"side":-1,"fromFold":1}],
    description: { ja: "右の一枚の下の角も上へ折ります。", en: "Fold the lower corner of the right flap upward." } },
  { moves: [{ line: [[-1,-.04],[1,-.04]], side: 1, fromFold: 2 }],
    description: { ja: "左の小さな先を下へ折り返します。", en: "Fold the small left tip back down." } },
  { moves: [{ line: [[-1,-.04],[1,-.04]], side: 1, fromFold: 3 }],
    description: { ja: "右の小さな先も下へ折り返します。", en: "Fold the small right tip back down." } },
  { moves: [{"line":[[-2,-0.05],[2,-0.05]],"side":1}],
    description: { ja: "上の帽子をいったん下へ折ります。", en: "Fold the upper hat downward." } },
  { moves: [{"line":[[-2,-0.1],[2,-0.1]],"side":-1,"fromFold":6}],
    description: { ja: "帽子だけを上へ折り返し、白いつばを残します。", en: "Fold only the hat back upward, leaving a white brim." } },
  { moves: [{"line":[[-2,-0.58],[2,-0.58]],"side":-1}],
    description: { ja: "下のひげを上へ折ります。", en: "Fold the lower beard upward." } },
  { moves: [{"line":[[-2,-0.53],[2,-0.53]],"side":1,"fromFold":8}],
    description: { ja: "ひげの先を下へ返し、細い段を残します。", en: "Fold the beard tip down again, leaving a narrow pleat." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
  { moves: [{"line":[[-0.35,-2],[-0.35,2]],"side":1}],
    description: { ja: "左の顔のふちを内側へ折ります。", en: "Fold the left edge of the face inward." } },
  { moves: [{"line":[[0.35,-2],[0.35,2]],"side":-1}],
    description: { ja: "右のふちも内側へ折ります。", en: "Fold the right edge inward." } },
  { moves: [{"line":[[-2,0.08],[2,0.08]],"side":1}],
    description: { ja: "帽子の上を下へ折ります。", en: "Fold the upper hat downward." } },
  { moves: [{"line":[[-0.35,0.07],[0.35,-0.15]],"side":-1,"fromFold":13}],
    description: { ja: "帽子の先だけを斜めに折り返します。", en: "Fold only the hat tip back along the diagonal." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
], 1e-8);
pointedSantaModel.renderLayerSeparation = .00004;
