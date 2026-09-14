import { flatSequence } from '../engine/flatSequence';

// 参考: easy/human-face/girl/zu.gif(おんなのこのかお)。❶の折り目づけを省略。
// ❷→1、❸→2–3、❹→4–5、❺→6、❻→7–8。最後は顔を描いて完成。
// ❷ 上のふちをよこの中心線へ折る(y=.5。折り図❸の高さ1.5と帯の .5 で一致)。
//    折り返した色の面が前髪になる。
// ❸ 上の両角を45°に折り下げる。角から .7(折り図❹の上のふちが .6 幅、
//    完成図の上のふちも .6 幅で一致)。折った先は y=-.2 まで下がり、横の髪になる。
// ❹ 左右のふちを4分の1で後ろへ折る(x=±.5)。ここで顔の幅が1になる。
// ❺ 下を後ろへ折る(y=-2/3。完成図の高さ 1.167 と一致。おとこのこと同じ位置)。
// ❻ 下の両角を後ろへ折る。よこ .2・たて .31(完成図の実測)。あごになる。
const cut = 0.7;
const jawX = 0.2;
const jawY = 0.31;
const chin = -2 / 3;
export const girlModel = flatSequence({
  id: 'girl', name: { ja: 'おんなのこ', en: 'Girl' }, difficulty: 2,
  sheetColors: [{ front: '#cb8f48', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-1,.5],[1,.5]], side: 1 }],
    description: { ja: '上のふちを、よこの中心線に合わせて折り下げます。', en: 'Fold the top edge down to the horizontal center line.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が前髪になります。', en: 'Start white side up. The colored side turned down becomes the fringe.' } },
  { moves: [{ line: [[-1+cut,.5],[-1,.5-cut]], side: -1 }],
    description: { ja: '左上の角を、ななめに折り下げます。', en: 'Fold the top-left corner down along a slant.' },
    caution: { ja: '折り下げた先が横の髪になります。', en: 'The corner you turn down becomes the hair at the side.' } },
  { moves: [{ line: [[1-cut,.5],[1,.5-cut]], side: 1 }],
    description: { ja: '右上の角も、同じように折り下げます。', en: 'Fold the top-right corner down in the same way.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1, type: 'mountain' }],
    description: { ja: '左のふちを、4分の1のところで後ろへ折ります。', en: 'Fold the left edge behind at the quarter line.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1, type: 'mountain' }],
    description: { ja: '右のふちも後ろへ折り、顔の幅を決めます。', en: 'Fold the right edge behind as well to set the width of the face.' } },
  { moves: [{ line: [[-1,chin],[1,chin]], side: -1, type: 'mountain' }],
    description: { ja: '下を、後ろへ折ります。', en: 'Fold the bottom behind.' } },
  { moves: [{ line: [[-.5,chin+jawY],[-.5+jawX,chin]], side: -1, type: 'mountain' }],
    description: { ja: '左下の角を、後ろへ折ります。', en: 'Fold the bottom-left corner behind.' } },
  { moves: [{ line: [[.5,chin+jawY],[.5-jawX,chin]], side: 1, type: 'mountain' }],
    description: { ja: '右下の角も後ろへ折ったら、あとは顔を描くだけです。', en: 'Fold the bottom-right corner behind, and all that is left is to draw the face.' },
    caution: { ja: '目と口を描くと、おんなのこの顔になります。描く作業はアニメーションには含みません。', en: 'Draw the eyes and mouth to finish. Drawing is a step outside the animation.' } },
], 1e-7);
girlModel.renderLayerSeparation = .00004;
