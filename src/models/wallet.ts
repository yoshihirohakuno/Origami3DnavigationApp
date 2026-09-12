import { flatSequence } from '../engine/flatSequence';

// 参考: traditional/cly/zu.gif(さいふ)。❶の折り目づけを省略、❷❸は上下・左右で別。
// ❷は上下のふちを中心線へ(y=±.5)、❸は左右のふちを中心線へ後ろ折り(x=±.5)。
// どちらも「ふちを中心の折り目に合わせる」ので厳密値。図の実測も帯 202×99px に対して
// 縦の破線が ±.495 で一致する。❹は半分に折って、幅1・高さ.5 のさいふになる。
export const walletModel = flatSequence({
  id: 'wallet', name: { ja: 'さいふ', en: 'Wallet' }, difficulty: 1,
  sheetColors: [{ front: '#6fa8d6', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,.5],[1,.5]], side: 1 }],
    description: { ja: '上のふちを中心線に合わせて折ります。', en: 'Fold the top edge in to the center line.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が外側になります。', en: 'Start white side up. The colored side turned up becomes the outside.' } },
  { moves: [{ line: [[-1,-.5],[1,-.5]], side: -1 }],
    description: { ja: '下のふちも中心線に合わせて折り、横長の帯にします。', en: 'Fold the bottom edge in to the center line to make a wide strip.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1, type: 'mountain' }],
    description: { ja: '左のふちを、中心線に合わせて後ろへ折ります。', en: 'Fold the left edge behind to the center line.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1, type: 'mountain' }],
    description: { ja: '右のふちも後ろへ折り、正方形にします。', en: 'Fold the right edge behind as well to make a square.' } },
  { moves: [{ line: [[-1,0],[1,0]], side: 1 }],
    description: { ja: '上半分を下へ折ったら、さいふのできあがりです。', en: 'Fold the top half down and the wallet is done.' },
    caution: { ja: '後ろへ折ったふちが内側のポケットになります。', en: 'The edges folded behind become the pockets inside.' } },
]);
