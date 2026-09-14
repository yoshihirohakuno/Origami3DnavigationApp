import { flatSequence } from '../engine/flatSequence';

// 参考: traditional/cicada/cicada/zu.gif。❷❸❻は左右別。
// ❶ ひし形を横の対角線で半分に折り、三角にする(y=0)
// ❷ 下の両角を上の角へ折り上げる。折り線は下辺の中点(0,0)と斜辺の中点(±.5,.5)を結ぶ
//    線(厳密。角が頂点(0,1)にちょうど重なる)。ここで正方形(ひし形)になる
// ❸ 左右の先を少し外側へ開いて下へ折る。横の角 y=.5 から中心 y=.46 へ結ぶ。
//    完成図の3本の下端を保つため、2枚を同じ中央点に重ねない。
// ❹ 上の1枚だけを y=.628 で折り下げる(目印なし。図の実測)
// ❺ 残りの1枚を y=.669 で折り下げる。2枚の差がはねの段になる(同じく実測)
// ❻ 左右の角を後ろへ折る。折り線は上で中心寄り、下で外側へ広がる。
//    (±.14,.669)-(±.30,.27) は図の実測。全層を折っても中央の下端は動かない。
const wingFront = 0.628;
const wingBack = 0.669;
export const cicadaModel = flatSequence({
  id: 'cicada', name: { ja: 'せみ', en: 'Cicada' }, difficulty: 1,
  sheetColors: [{ front: '#c08457', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[-1,0],[1,0]], side: -1 }],
    description: { ja: '下の角を上の角に合わせて折り、三角にします。', en: 'Fold the bottom point up to the top point to make a triangle.' },
    caution: { ja: '白い面を上にして、角を上下に向けて始めます。', en: 'Start white side up with the points at the top and bottom.' } },
  { moves: [{ line: [[0,0],[-.5,.5]], side: 1 }],
    description: { ja: '左下の角を、上の角に合わせて折り上げます。', en: 'Fold the bottom-left corner up to meet the top point.' },
    caution: { ja: '折り線は、下のふちの中央と左の斜辺の中央を結びます。', en: 'The crease joins the middle of the bottom edge to the middle of the left slanted edge.' } },
  { moves: [{ line: [[0,0],[.5,.5]], side: -1 }],
    description: { ja: '右下の角も同じように折り上げ、四角にします。', en: 'Fold the bottom-right corner up the same way to make a square.' } },
  { moves: [{ line: [[-.5,.5],[0,.46]], side: 1, fromFold: 1 }],
    description: { ja: '折り上げた左の先を、少し外側へ開くように下へ折ります。', en: 'Fold the raised left tip down, spreading it slightly outward.' },
    caution: { ja: '先を中央の下の角より少し左へ出します。土台は折りません。', en: 'Let the tip extend slightly left of the bottom corner. Leave the base flat.' } },
  { moves: [{ line: [[0,.46],[.5,.5]], side: 1, fromFold: 2 }],
    description: { ja: '右の先も同じように下へ折ります。', en: 'Fold the right tip down in the same way.' } },
  { moves: [{ line: [[-1,wingFront],[1,wingFront]], side: 1, fromFold: 0 }],
    description: { ja: '手前の1枚だけを折り下げ、上のはねを作ります。', en: 'Fold just the front layer down to make the upper wing.' },
    caution: { ja: '折り下げた白い裏がせみの背中になります。', en: 'The white back you turn down becomes the cicada’s back.' } },
  { moves: [{ line: [[-1,wingBack],[1,wingBack]], side: 1 }],
    description: { ja: '残った1枚を、少し高い線で折り下げます。', en: 'Fold the remaining layer down along a slightly higher line.' },
    caution: { ja: '2枚の差が、はねの段になります。', en: 'The gap between the two layers makes the step of the wings.' } },
  { moves: [{ line: [[-.14,wingBack],[-.30,.27]], side: -1, type: 'mountain' }],
    description: { ja: '左の角をななめに後ろへ折り、胴を細くします。', en: 'Fold the left corner diagonally behind to narrow the body.' },
    caution: { ja: '折り線は、上は中心寄り、下は外側へ広がる向きです。', en: 'The crease starts near the center at the top and slopes outward toward the bottom.' } },
  { moves: [{ line: [[.14,wingBack],[.30,.27]], side: 1, type: 'mountain' }],
    description: { ja: '右の角も後ろへ折り、左右の形をそろえて完成です。', en: 'Fold the right corner behind to match the left and finish the cicada.' },
    caution: { ja: '目を描くと、せみらしくなります。描く作業はアニメーションには含みません。', en: 'Draw the eyes to finish. Drawing is a step outside the animation.' } },
], 1e-6); // 4層の上にさらに2枚を折り下げるので、表示用の紙厚を薄くして継ぎ目を閉じる。
cicadaModel.renderLayerSeparation = .00004;
