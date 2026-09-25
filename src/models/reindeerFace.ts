import { flatSequence } from '../engine/flatSequence';

// Reference: xmas/reindeerface3/zu.gif panels 1-8. One sheet for the head; optional glued accessories omitted.
export const reindeerFaceModel = flatSequence({
  id: "reindeer-face", name: { ja: "トナカイの顔", en: "Reindeer Face" }, difficulty: 3,
  sheetColors: [{ front: '#b8854e', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{"line":[[-2,0],[2,0]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "上の角を下へ合わせ、三角に折ります。", en: "Fold the top corner down to make a triangle." } },
  { moves: [{"line":[[-2,-0.1],[2,-0.1]],"side":1}],
    description: { ja: "上の長いふちを細く折り下げます。", en: "Fold the long upper edge down in a narrow band." } },
  { moves: [{"line":[[-0.28,-0.1],[-0.5,-0.65]],"side":-1}],
    description: { ja: "左の角を斜めに内側へ折ります。", en: "Fold the left point diagonally inward." } },
  { moves: [{"line":[[-0.13517241379310352,-0.23793103448275857],[-0.2951724137931034,-0.6379310344827587]],"side":1,"fromFold":2}],
    description: { ja: "左の角だけを外へ折り返し、角を作ります。", en: "Fold just that point outward again to form an antler." } },
  { moves: [{"line":[[0.5,-0.65],[0.28,-0.1]],"side":-1}],
    description: { ja: "右の角を斜めに内側へ折ります。", en: "Fold the right point diagonally inward." } },
  { moves: [{"line":[[0.2951724137931034,-0.6379310344827587],[0.13517241379310352,-0.23793103448275857]],"side":1,"fromFold":4}],
    description: { ja: "右の角も外へ折り返します。", en: "Fold that point outward for the other antler." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
  { moves: [{"line":[[-2,-0.76],[2,-0.76]],"side":-1,"exceptFold":0}],
    description: { ja: "手前の一枚の下の先を上へ折り、白い口元を出します。", en: "Lift the bottom tip of the front layer to show the white muzzle." } },
  { moves: [{"line":[[-2,-0.76],[2,-0.76]],"side":-1,"type":"mountain","fromFold":0}],
    description: { ja: "奥の一枚の下の先を後ろへ折ります。", en: "Tuck the bottom point of the back layer behind." } },
  { moves: [{"line":[[-2,-0.6],[2,-0.6]],"side":1,"fromFold":7}],
    description: { ja: "口元の上の小さな先を下へ折り、鼻にします。", en: "Fold the small upper muzzle tip down for the nose." } },
], 1e-8);
reindeerFaceModel.renderLayerSeparation = .00004;
