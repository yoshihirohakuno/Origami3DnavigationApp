import { flatSequence } from '../engine/flatSequence';

// 参考: easy/clothes/shorts/shorts/zu.gif(はんずぼん)。
// ❶は正方形をはさみで半分に切る工程なので、たて1・よこ2の紙から始める。
// ❷は下の両角をななめに折り上げる。折り線の上端は横のふちのちょうど中点
//    (図の実測 .498・.503)、下端は下の角から紙幅の10分の1だけ内側
//    (実測 .097・.104)。目印のない、形を決めるための折り。
// ❸は左右のふちを中心線に合わせて折る(x=±.5)。よこ2の紙が幅1になるので、
//    たてよこ1の正方形のズボンになる(折り図❹も正方形 143×143px)。
// ❷で折り上げた三角は❸で紙にはさまれて表には出ない(折り重ねると順が逆になる)。
// 左右の斜めのふちが中心で出会い、下に白いVのすきまができる = 両足のあいだ。
// 完成の実測もこれと合う(Vの先が高さの .48、すその開きが幅の .37)。
const leg = 0.8;
export const shortsModel = flatSequence({
  id: 'shorts', name: { ja: 'はんずぼん', en: 'Shorts' }, difficulty: 1,
  sheetColors: [{ front: '#7ecee2', back: '#fbfaf7' }],
}, [[-1,-.5],[1,-.5],[1,.5],[-1,.5]], true, [
  { moves: [{ line: [[-1,0],[-leg,-.5]], side: -1 }],
    description: { ja: '左下の角を、ななめに折り上げます。', en: 'Fold the bottom-left corner up along a slant.' },
    caution: { ja: '正方形を半分に切った、よこ長の紙を白い面を上にして始めます。折り線は左のふちの中ほどから、下の角の少し内側へ向けます。', en: 'Start with half a square sheet, white side up. The crease runs from the middle of the left edge to a point just inside the bottom corner.' } },
  { moves: [{ line: [[1,0],[leg,-.5]], side: 1 }],
    description: { ja: '右下の角も、同じように折り上げます。', en: 'Fold the bottom-right corner up in the same way.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、中心線に合わせて折ります。', en: 'Fold the left edge in to the center line.' },
    caution: { ja: '折り上げた三角は、この折りで内側にはさまれて見えなくなります。', en: 'The corner you turned up gets tucked inside and disappears from view.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1 }],
    description: { ja: '右のふちも中心線へ折ったら、はんずぼんのできあがりです。', en: 'Fold the right edge in to the center line and the shorts are done.' },
    caution: { ja: '中央に出る白いVのすきまが、両足のあいだになります。', en: 'The white V that opens at the center is the gap between the two legs.' } },
]);
