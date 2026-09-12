import { flatSequence } from '../engine/flatSequence';

// 参考: easy/clothes/vest/vest/zu.gif(べすと)。はんずぼんと同じ作者・同じ組み立てで、
// 角を折るのが上、できるVがえりもとになる。
// ❶は「はさみで半分に切る」工程なので、たて1・よこ2の紙から始める。
// ❷は上の両角をななめに折り下げる。折り線の上端は上のふちの角から紙幅の10分の1
//    (図の実測 .102)、下端は横のふちの上から高さの .58(実測。はんずぼんの
//    ちょうど半分より深く、Vえりになる)。完成の実測は .60 で、破線を引いてある
//    ❷のパネルの方を採った。
// ❸は左右のふちを中心線へ(x=±.5。図の縦の破線の実測 .251・.751)。
//    よこ2の紙が幅1になるので、完成はたてよこ1の正方形(折り図❹も 157×158px)。
// ❷の三角は❸で紙にはさまれて表に出ない(折り重ねると層の順が逆になる)。
const shoulder = 0.8;
const neck = -0.08;
export const vestModel = flatSequence({
  id: 'vest', name: { ja: 'べすと', en: 'Vest' }, difficulty: 1,
  sheetColors: [{ front: '#7ecee2', back: '#fbfaf7' }],
}, [[-1,-.5],[1,-.5],[1,.5],[-1,.5]], true, [
  { moves: [{ line: [[-1,neck],[-shoulder,.5]], side: 1 }],
    description: { ja: '左上の角を、ななめに折り下げます。', en: 'Fold the top-left corner down along a slant.' },
    caution: { ja: '正方形を半分に切った、よこ長の紙を白い面を上にして始めます。折り線は上の角の少し内側から、左のふちの中ほどより少し下へ向けます。', en: 'Start with half a square sheet, white side up. The crease runs from just inside the top corner down to a little below the middle of the left edge.' } },
  { moves: [{ line: [[1,neck],[shoulder,.5]], side: -1 }],
    description: { ja: '右上の角も、同じように折り下げます。', en: 'Fold the top-right corner down in the same way.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、中心線に合わせて折ります。', en: 'Fold the left edge in to the center line.' },
    caution: { ja: '折り下げた三角は、この折りで内側にはさまれて見えなくなります。', en: 'The corner you turned down gets tucked inside and disappears from view.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1 }],
    description: { ja: '右のふちも中心線へ折ったら、べすとのできあがりです。', en: 'Fold the right edge in to the center line and the vest is done.' },
    caution: { ja: '中央に出る白いVが、えりもとになります。', en: 'The white V that opens at the center is the neckline.' } },
]);
