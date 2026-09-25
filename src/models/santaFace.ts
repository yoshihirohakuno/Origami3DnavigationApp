import { flatSequence } from '../engine/flatSequence';

// Reference: xmas/santaface3/zu.gif. Borders=.1; eyebrow pleat width=.06.
export const santaFaceModel = flatSequence({
  id: "santa-face", name: { ja: "サンタの顔", en: "Santa Face" }, difficulty: 3,
  sheetColors: [{ front: '#cb5a64', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], false, [
  { moves: [{"line":[[-0.9,-2],[-0.9,2]],"side":1}],
    caution: { ja: '色の面を上にして始めます。表示の折り線に合わせ、一工程ずつ折ります。', en: 'Start colored side up. Follow one displayed crease at a time.' },
    description: { ja: "左のふちを細く折り、白い帯を出します。", en: "Fold a narrow strip along the left edge to show white." } },
  { moves: [{"line":[[0.9,-2],[0.9,2]],"side":-1}],
    description: { ja: "右のふちも同じ幅で折ります。", en: "Fold the right edge by the same width." } },
  { moves: [{"line":[[0,-2],[0,2]],"side":1,"type":"assemble"}],
    description: { ja: "うらがえします。", en: "Turn the paper over." } },
  { moves: [{"line":[[-0.9,0.1],[0,1]],"side":1}],
    description: { ja: "左上の角を中心へ折り下げます。", en: "Fold the upper-left corner down to the center." } },
  { moves: [{"line":[[0,1],[0.9,0.1]],"side":1}],
    description: { ja: "右上の角も中心へ折り下げ、帽子にします。", en: "Fold the upper-right corner down to form the hat." } },
  { moves: [{"line":[[-2,-0.23],[2,-0.23]],"side":-1}],
    description: { ja: "下の部分を上へ折り上げます。", en: "Fold the lower part upward." } },
  { moves: [{"line":[[-2,-0.17],[2,-0.17]],"side":1,"fromFold":5}],
    description: { ja: "折り上げた部分だけを下へ返し、細いまゆの帯を残します。", en: "Fold only that flap down again, leaving a narrow eyebrow band." } },
  { moves: [{"line":[[-0.9,-0.55],[-0.57,-0.88]],"side":-1,"type":"mountain"}],
    description: { ja: "左下の角を後ろへ折り、ひげの角を整えます。", en: "Fold the lower-left corner behind to shape the beard." } },
  { moves: [{"line":[[0.57,-0.88],[0.9,-0.55]],"side":-1,"type":"mountain"}],
    description: { ja: "右下の角も後ろへ折ります。目と鼻は完成後に描けます。", en: "Fold the lower-right corner behind. Draw eyes and a nose afterward." } },
], 1e-8);
santaFaceModel.renderLayerSeparation = .00004;
