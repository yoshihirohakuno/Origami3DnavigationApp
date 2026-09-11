import { flatSequence } from '../engine/flatSequence';

// 参考: easy/sea/octopus/zu.gif。❶の折り目づけを省略、❷❸は左右別。
// ❸は帯の中心と下の角を結ぶ線で、手前の1枚だけを外へ折り出す(足のすそ)。
// 下の角は (±.5,-1) から (±.8,-.6) へ出る。両方の層を折ると中央が欠ける。
// 最後は上のふちを紙の高さの1/3だけ下げ、頭の帯にする。
export const octopusModel = flatSequence({
  id: 'octopus', name: { ja: 'たこ', en: 'Octopus' }, difficulty: 1,
  sheetColors: [{ front: '#e8798c', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを中心線に合わせて折ります。', en: 'Fold the left edge in to the center line.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が体になります。', en: 'Start white side up. The colored side turned up becomes the body.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1 }],
    description: { ja: '右のふちも中心線に合わせて折り、細い帯にします。', en: 'Fold the right edge in to the center line to make a narrow strip.' } },
  { moves: [{ line: [[0,0],[-.5,-1]], side: 1, fromFold: 0 }],
    description: { ja: '帯の中心と左下の角を結ぶ線で、手前の紙だけを左へ折り出します。', en: 'Along the line from the center of the strip to the bottom-left corner, fold just the front flap out to the left.' },
    caution: { ja: '下にある紙は折りません。開いた三角がたこの足のすそになります。', en: 'Leave the layer underneath in place. The opened triangle becomes the skirt of the legs.' } },
  { moves: [{ line: [[0,0],[.5,-1]], side: -1, fromFold: 1 }],
    description: { ja: '右下も同じように、手前の紙だけを右へ折り出します。', en: 'Fold just the front flap out to the right in the same way.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: '全体を裏返します。', en: 'Turn the whole piece over.' } },
  { moves: [{ line: [[-1,1/3],[1,1/3]], side: 1 }],
    description: { ja: '上のふちを、紙の高さの3分の1だけ下へ折ります。', en: 'Fold the top edge down by one third of the paper height.' },
    caution: { ja: '顔と足を描くとたこになります。描く作業はアニメーションには含みません。', en: 'Draw the face and legs to finish. Drawing is a step outside the animation.' } },
]);
