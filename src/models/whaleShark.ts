import { flatSequence } from '../engine/flatSequence';

// Reference: sea/whale-shark/zu.gif. Back-side pleats leave colored fins after turning over.
export const whaleSharkModel = flatSequence({
  id: "whale-shark", name: { ja: "ジンベエザメ", en: "Whale Shark" }, difficulty: 3,
  sheetColors: [{ front: '#559bc2', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{"line":[[-2,0.3333333333333333],[2,0.3333333333333333]],"side":1}],
    caution: { ja: '白い面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start white side up. Follow one displayed crease at a time.' },
    description: { ja: "上の角を、紙の高さの3分の1の線で下へ折ります。", en: "Fold the top point down along the one-third-height line." } },
  { moves: [{"line":[[-2,-0.3333333333333333],[2,-0.3333333333333333]],"side":-1}],
    description: { ja: "下の角も同じ幅で上へ折ります。", en: "Fold the bottom point up by the same amount." } },
  { moves: [{"line":[[-2,0.14],[2,0.14]],"side":-1,"fromFold":0}],
    description: { ja: "上から折った一枚の先を上へ折り返し、ひれを出します。", en: "Fold the tip of the upper flap back up to form a fin." } },
  { moves: [{"line":[[-2,-0.14],[2,-0.14]],"side":1,"fromFold":1}],
    description: { ja: "下から折った一枚の先を下へ折り返します。", en: "Fold the tip of the lower flap back down." } },
  { moves: [{"line":[[-0.78,-2],[-0.78,2]],"side":1}],
    description: { ja: "左の角を内側へ折り、頭を平らにします。", en: "Fold the left point inward to flatten the head." } },
  { moves: [{"line":[[0.4,0.3333333333333333],[1,0]],"side":1}],
    description: { ja: "右上の辺を中心へ寄せ、尾を細くします。", en: "Fold the upper-right edge inward to narrow the tail." } },
  { moves: [{"line":[[1,0],[0.4,-0.3333333333333333]],"side":1}],
    description: { ja: "右下の辺も中心へ寄せます。", en: "Fold the lower-right edge inward." } },
  { moves: [{"line":[[-0.73,-2],[-0.73,2]],"side":-1,"fromFold":4}],
    description: { ja: "頭の小さな先だけを外へ折り返し、口の段を作ります。", en: "Fold just the small head tip outward to make the mouth pleat." } },
  { moves: [{"line":[[-2,0],[2,0]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえして、色の面を手前にします。", en: "Turn over to show the colored side." } },
  { moves: [{"line":[[0.8,0.2],[0.92,-0.16]],"side":1}],
    description: { ja: "尾の先を斜めに折り、尾びれを仕上げます。目と模様は後から描けます。", en: "Fold the tail tip diagonally to finish. Add eyes and spots afterward." } },
], 1e-8);
whaleSharkModel.renderLayerSeparation = .00004;
