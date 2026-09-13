import { flatSequence } from '../engine/flatSequence';

// 参考: easy/human-face/boy/zu.gif(おとこのこのかお)。❶の折り目づけを省略。
// ❷→1–2、❸→3–4、❹→5、❺→6、❻→7–8、❼→9–10。最後は顔を描いて完成。
// ❷ 上の両角を紙の中心へ折る。折り線は上のふちの中央 (0,1) と横のふちの中央 (±1,0)
//    を結ぶ線(厳密。角がちょうど中心に乗り、色の面が髪になる)。
// ❸ 左右のふちを4分の1で後ろへ折る(x=±.5。折り図❹の幅が元の半分で一致)。
// ❹ 上の三角を、❸の折り目とぶつかる高さ y=.5 で後ろへ折る
//    (折り図❺の高さ1.5と一致。ここで髪の生えぎわが平らになる)。
// ❺ 下を後ろへ折る。折り図❺の「1/3」は、髪の下の白い部分(高さ1)の3分の1を指す
//    ので折り線は y=-2/3(折り図❻の高さ 1.167 と一致)。
// ❻ 上の両角を45°に落とす(角から .165。折り図❼の実測)。
// ❼ 下の両角も落とす。こちらは45°ではなく、よこ .235・たて .362(折り図❽の実測)。
const brow = 0.165;
const jawX = 0.235;
const jawY = 0.362;
const chin = -2 / 3;
export const boyModel = flatSequence({
  id: 'boy', name: { ja: 'おとこのこ', en: 'Boy' }, difficulty: 2,
  sheetColors: [{ front: '#4a3b32', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[0,1],[-1,0]], side: -1 }],
    description: { ja: '左上の角を、紙の中心に合わせて折ります。', en: 'Fold the top-left corner in to the center of the paper.' },
    caution: { ja: '白い面を上にして始めます。折り返した色の面が髪になります。', en: 'Start white side up. The colored side turned up becomes the hair.' } },
  { moves: [{ line: [[0,1],[1,0]], side: 1 }],
    description: { ja: '右上の角も、同じように折ります。', en: 'Fold the top-right corner in the same way.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1, type: 'mountain' }],
    description: { ja: '左のふちを、4分の1のところで後ろへ折ります。', en: 'Fold the left edge behind at the quarter line.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1, type: 'mountain' }],
    description: { ja: '右のふちも後ろへ折り、顔の幅を決めます。', en: 'Fold the right edge behind as well to set the width of the face.' } },
  { moves: [{ line: [[-1,.5],[1,.5]], side: 1, type: 'mountain' }],
    description: { ja: '上に出ている三角を、後ろへ折ります。', en: 'Fold the point at the top behind.' },
    caution: { ja: '折り線は、左右の折り目とぶつかるところを結びます。髪の生えぎわが平らになります。', en: 'The crease joins the points where the side folds meet. This flattens the hairline.' } },
  { moves: [{ line: [[-1,chin],[1,chin]], side: -1, type: 'mountain' }],
    description: { ja: '下を、白い部分の3分の1だけ後ろへ折ります。', en: 'Fold the bottom behind by one third of the white part.' } },
  { moves: [{ line: [[-.5,.5-brow],[-.5+brow,.5]], side: 1, type: 'mountain' }],
    description: { ja: '左上の角を、ななめに後ろへ折ります。', en: 'Fold the top-left corner behind along a slant.' } },
  { moves: [{ line: [[.5-brow,.5],[.5,.5-brow]], side: 1, type: 'mountain' }],
    description: { ja: '右上の角も、後ろへ折ります。', en: 'Fold the top-right corner behind as well.' } },
  { moves: [{ line: [[-.5,chin+jawY],[-.5+jawX,chin]], side: -1, type: 'mountain' }],
    description: { ja: '左下の角も、後ろへ折ります。', en: 'Fold the bottom-left corner behind.' } },
  { moves: [{ line: [[.5,chin+jawY],[.5-jawX,chin]], side: 1, type: 'mountain' }],
    description: { ja: '右下の角も後ろへ折ったら、あとは顔を描くだけです。', en: 'Fold the bottom-right corner behind, and all that is left is to draw the face.' },
    caution: { ja: '目と鼻と口を描くと、おとこのこの顔になります。描く作業はアニメーションには含みません。', en: 'Draw the eyes, nose and mouth to finish. Drawing is a step outside the animation.' } },
], 1e-7); // 10枚以上が重なるので、表示用の紙厚を薄くして継ぎ目を閉じる。
