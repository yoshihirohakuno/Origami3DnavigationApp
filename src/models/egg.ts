import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/egg/egg/zu.gif。❶の予備折りを省略、❷❺は一角ずつ。
// ❷は上角の二等分線。下の角を中央へ折る線y=-1/√2、上角はy=.4。
// ❺の微小な角処理は図の比率に基づく。上幅約.50、最大幅約.96、高さ約1.11。
// ❼の中央は閉じきらず、山折り16°で卵の浅い立体感を出す。
// 図は無彩色の紙。ここでは色面を確認しやすい淡い殻色を使う。
const k = 2 - Math.SQRT2;
const bottom = -Math.SQRT1_2;
const crown = .6 * (Math.SQRT2 - 1);
export const eggModel = flatSequence({
  id: 'egg', name: { ja: 'たまご', en: 'Egg' }, difficulty: 1,
  sheetColors: [{ front: '#e9d7b4', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[-k,k-1],[0,1]], side: 1 }],
    description: { ja: '左上のふちを、たての中心線に合わせて折ります。', en: 'Fold the upper-left edge to the vertical center line.' },
    caution: { ja: '白い面を上にして、角を上へ向けます。上の角を動かさずに折ります。', en: 'Start white side up with a corner at the top. Keep that top point in place.' } },
  { moves: [{ line: [[0,1],[k,k-1]], side: 1 }],
    description: { ja: '右上のふちも中心線へ折り、細いひし形にします。', en: 'Fold the upper-right edge to the center line to make a narrow kite.' } },
  { moves: [{ line: [[-1,bottom],[1,bottom]], side: -1 }],
    description: { ja: '下の角を、左右の角を結ぶ横線まで折り上げます。', en: 'Fold the bottom point up to the line joining the side corners.' } },
  { moves: [{ line: [[-1,.4],[1,.4]], side: 1 }],
    description: { ja: '上のとがった角を、表示の横線で折り下げます。', en: 'Fold the pointed top down along the displayed horizontal line.' },
    caution: { ja: '上の角から紙全体の高さの約3割の位置で折ります。', en: 'Place the fold about three tenths of the full paper height below the top point.' } },
  { moves: [{ line: [[-crown-.1,.16],[-crown+.055,.4]], side: 1 }],
    description: { ja: '左上の小さな角を内側へ折り、肩を丸くします。', en: 'Fold the small upper-left corner inward to soften the shoulder.' } },
  { moves: [{ line: [[crown-.055,.4],[crown+.1,.16]], side: 1 }],
    description: { ja: '右上の小さな角も内側へ折ります。', en: 'Fold the small upper-right corner inward too.' } },
  { moves: [{ line: [[-.48,-.64],[-.48,-.16]], side: 1 }],
    description: { ja: '左に出ている角を少し折り込みます。', en: 'Tuck in the point sticking out on the left.' } },
  { moves: [{ line: [[.48,-.16],[.48,-.64]], side: 1 }],
    description: { ja: '右に出ている角も少し折り込みます。', en: 'Tuck in the point sticking out on the right.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '裏返して、折り込んだ角を裏側に隠します。', en: 'Turn it over to hide the tucked corners on the back.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: -1, type: 'mountain' }],
    description: { ja: '中心線で少しだけ後ろへ曲げ、ふくらみをつけて完成です。', en: 'Bend it back slightly along the center line to give the egg a gentle curve.' },
    caution: { ja: '半分には閉じません。浅く曲げて形を整えます。', en: 'Keep it mostly open; only a shallow bend is needed.' } },
], 1e-6); // Eight successive tucks need smaller display spacing to keep seams closed.
// All earlier poses are flat. Only this final shaping fold stops short of 180°.
const rounding = eggModel.steps.at(-1)!;
rounding.folds = rounding.folds.filter(op => op.guide !== false);
rounding.folds[0].angle = 16;
eggModel.renderLayerSeparation = .00004;
