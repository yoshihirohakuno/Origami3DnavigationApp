import { flatSequence } from '../engine/flatSequence';

// 参考: easy/human-face/mother/zu.gif(ははのかお)。❶の折り目づけを省略。
// ❷→1、❸→2、❹→3、❺→4–5、❻→6–7、❼→8、❽→9–10、❾→11。最後は顔を描いて完成。
// おとうさんと同じ型に見えるが、**❷の折り線が違う**。おとうさんは左上の角から
// (-1,1)-(1,.5)、おかあさんは上のふちの4分の1の折り目から (-.5,1)-(1,.5)。
// 破線の傾きの実測はおとうさん 4.26(厳密値4.0)、おかあさん 3.10(厳密値3.0)で、
// ❺のパネルの山の頂点 (0,5/6) とも合う(おとうさんは (0,.75))。
// ❻が横の髪を作る工程。折り図の矢印は左右とも紙の外へ向かい、
// **❺で折り込んだ1枚の下の角だけ**を、そのふちの外へ折り返す(`fromFold`)。
// 折り線は下の角から (0,-.25) へ。図の「1/2ぐらい」は4分の1の折り目と中心の折り目の
// ちょうど中間で、実測の交点も -.26。折り返した先は (∓.692,-.538) に出て、
// ❼のパネルの外形(∓.687,-.560)と合う。
// ❼は下を y=-.25 で折り上げる。横の髪の先は (∓.692,.038) に回り、
// ❽のパネルの左右の幅・先の高さの実測と一致する。
// ❽は下の左右の角を落とす(実測 (-.5,-.02)-(-.31,-.25)。❾の下のふちの幅 .62 とも合う)。
// この折り線を延ばすと横の髪を切ってしまうので、❻で出した三角は exceptFold で除く。
// ❾でうらがえすと、横の髪が色の面に変わる。
const chinX = 0.31;
const chinY = -0.02;
const hairApex = -0.25;
export const motherModel = flatSequence({
  id: 'mother', name: { ja: 'おかあさん', en: 'Mother' }, difficulty: 3,
  sheetColors: [{ front: '#b06c3c', back: '#fbfaf7' }],
}, [[-1,-1],[1,-1],[1,1],[-1,1]], true, [
  { moves: [{ line: [[-.5,1],[1,.5]], side: 1 }],
    description: { ja: '上のふちの4分の1の折り目から、右上を折り下げます。', en: 'Fold the top-right corner down along a line from the quarter crease on the top edge.' },
    caution: { ja: '白い面を上にして始めます。折り線の右のはしは、4分の1の折り目の高さです。', en: 'Start white side up. The right end of the crease sits at the quarter crease.' } },
  { moves: [{ line: [[.5,1],[-1,.5]], side: -1 }],
    description: { ja: '反対向きにも同じ線で折り下げ、山の形にします。', en: 'Fold down the other way along the mirror line to make a peak.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'うらがえします。', en: 'Turn it over.' },
    caution: { ja: 'うらがえすと、一面が色の面になります。', en: 'Turned over, the whole sheet shows the colored side.' } },
  { moves: [{ line: [[-.5,-1],[-.5,1]], side: 1 }],
    description: { ja: '左のふちを、中心へ向けて折ります。', en: 'Fold the left edge in toward the middle.' } },
  { moves: [{ line: [[.5,-1],[.5,1]], side: -1 }],
    description: { ja: '右のふちも中心へ折り、顔の幅を決めます。', en: 'Fold the right edge in as well to set the width of the face.' },
    caution: { ja: '折り返した白い面が顔、残った色の面が髪になります。', en: 'The white side turned up is the face; the colored side left showing is the hair.' } },
  { moves: [{ line: [[-.5,-1],[0,hairApex]], side: -1, fromFold: 3 }],
    description: { ja: '左に折り込んだ1枚の下の角を、外へ折り出します。', en: 'Fold the bottom corner of the left flap back out past the edge.' },
    caution: { ja: '下の1枚は折りません。出た三角が横の髪になります。', en: 'Leave the layer underneath flat. The triangle that comes out becomes the side hair.' } },
  { moves: [{ line: [[.5,-1],[0,hairApex]], side: 1, fromFold: 4 }],
    description: { ja: '右も同じように、下の角を外へ折り出します。', en: 'Fold the bottom corner of the right flap out in the same way.' },
    caution: { ja: '折り線の先は、4分の1の折り目と中心の折り目のちょうど中間です。', en: 'The creases meet halfway between the quarter crease and the center crease.' } },
  { moves: [{ line: [[-1,hairApex],[1,hairApex]], side: -1 }],
    description: { ja: '下を折り上げ、あごの高さを決めます。', en: 'Fold the bottom up to set the height of the chin.' },
    caution: { ja: '出した三角も一緒に上がり、白い裏を見せて横の髪になります。', en: 'The triangles come up with it, showing their white backs as the side hair.' } },
  { moves: [{ line: [[-.5,chinY],[-chinX,hairApex]], side: -1, exceptFold: 5 }],
    description: { ja: '左下の角を、ななめに折ります。', en: 'Fold the bottom-left corner in along a slant.' } },
  { moves: [{ line: [[.5,chinY],[chinX,hairApex]], side: 1, exceptFold: 6 }],
    description: { ja: '右下の角も、同じように折ります。', en: 'Fold the bottom-right corner in the same way.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: 1, type: 'assemble' }],
    description: { ja: 'もう一度うらがえしたら、あとは顔を描くだけです。', en: 'Turn it over once more, and all that is left is to draw the face.' },
    caution: { ja: '横の髪が色の面に変わります。目と鼻と口を描くと、おかあさんの顔になります。描く作業はアニメーションには含みません。', en: 'The side hair turns to the colored side. Draw the eyes, nose and mouth to finish. Drawing is a step outside the animation.' } },
], 1e-7); // 髪が何枚も重なるので、表示用の紙厚を薄くして継ぎ目を閉じる。
motherModel.renderLayerSeparation = .00004;
