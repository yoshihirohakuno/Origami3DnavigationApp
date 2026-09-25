import { flatSequence } from '../engine/flatSequence';

// Reference: sea/flounder/zu.gif. Work the mirrored sides separately on the open sheet; omit the temporary half-fold and reopen.
export const flounderModel = flatSequence({
  id: "flounder", name: { ja: "ヒラメ", en: "Flounder" }, difficulty: 3,
  sheetColors: [{ front: '#c3a35d', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{"line":[[-1,0],[0.41421356237309515,0.5857864376269049]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "上の辺を左の角から斜めに折り、細い三角にします。", en: "Fold the upper edge diagonally from the left point." } },
  { moves: [{"line":[[0.41421356237309515,-0.5857864376269049],[-1,0]],"side":1}],
    description: { ja: "下側も対称に折ります。", en: "Fold the lower side symmetrically." } },
  { moves: [{"line":[[-0.43,0],[0.41421356237309515,0.5857864376269049]],"side":-1,"fromFold":0}],
    description: { ja: "上側の三角の先を折り返します。", en: "Fold the upper triangular tip back." } },
  { moves: [{"line":[[0.41421356237309515,-0.5857864376269049],[-0.43,0]],"side":-1,"fromFold":1}],
    description: { ja: "下側の先も折り返します。", en: "Fold the lower triangular tip back." } },
  { moves: [{"line":[[-0.007260233051173903,0.5854075062332207],[0.4035547794152676,0.8399279723355685]],"side":1,"fromFold":2}],
    description: { ja: "上に出た小さな角を内側へ折ります。", en: "Fold the small upper protruding point inward." } },
  { moves: [{"line":[[-0.007260233051173903,-0.5854075062332207],[-0.4180752455176154,-0.3308870401308729]],"side":1,"fromFold":3}],
    description: { ja: "下に出た小さな角も内側へ折ります。", en: "Fold the small lower protruding point inward." } },
  { moves: [{"line":[[-0.15,0.42],[1,0]],"side":1}],
    description: { ja: "上のふちを細く内側へ折り、ひれを整えます。", en: "Fold the upper edge narrowly inward to shape the fin." } },
  { moves: [{"line":[[1,0],[-0.15,-0.42]],"side":1}],
    description: { ja: "下のふちも細く内側へ折ります。", en: "Fold the lower edge narrowly inward." } },
  { moves: [{"line":[[-0.52,-2],[-0.52,2]],"side":1}],
    description: { ja: "左の先を内側へ折り、尾の付け根を作ります。", en: "Fold the left tip inward for the tail root." } },
  { moves: [{"line":[[-0.43,-2],[-0.43,2]],"side":-1,"fromFold":8}],
    description: { ja: "左の先だけを外へ折り返し、尾を残します。", en: "Fold just that tip outward again, leaving a tail pleat." } },
  { moves: [{"line":[[-0.75,-2],[-0.75,2]],"side":1}],
    description: { ja: "尾の鋭い先を少し内側へ折ります。", en: "Fold the sharp tail point slightly inward." } },
  { moves: [{"line":[[0.78,-2],[0.78,2]],"side":-1}],
    description: { ja: "右の先を内側へ折り、頭を平らにします。", en: "Fold the right point inward to flatten the head." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
], 1e-8);
flounderModel.renderLayerSeparation = .00004;
