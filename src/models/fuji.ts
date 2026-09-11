import { flatSequence } from '../engine/flatSequence';

// 参考: easy/other/fuji/fuji/zu.gif。❶の折り目づけを省略。❷→1、❸→2、❹→3、❺→4、❻→5。
// 角を上にした正方形を横の対角線で半分に折り、三角の山にする。
// ❸は頂点から高さの1/4(y=.75)で折り下げ、白い裏を雪にする。
// ❹は折り下げた先だけを y=.65 で折り上げ、頂上のふちから少し出す(図の実測 .649)。
// ❺は出た先を山のふち(y=.75)で後ろへ折る。完成の雪は y=.65〜.74、図の実測と一致する。
export const fujiModel = flatSequence({
  id: 'fuji', name: { ja: 'ふじさん', en: 'Mount Fuji' }, difficulty: 1,
  sheetColors: [{ front: '#c8913a', back: '#fbfaf7' }],
}, [[0,1],[-1,0],[0,-1],[1,0]], true, [
  { moves: [{ line: [[-1,0],[1,0]], side: -1 }],
    description: { ja: '下の角を上の角に合わせて折り、三角にします。', en: 'Fold the bottom point up to the top point to make a triangle.' },
    caution: { ja: '白い面を上にして、角を上下に向けて始めます。', en: 'Start white side up with the points at the top and bottom.' } },
  { moves: [{ line: [[-1,.75],[1,.75]], side: 1, fromFold: 0 }],
    description: { ja: '手前の1枚だけ、上の角を高さの4分の1の線で折り下げます。', en: 'Fold just the front layer of the top point down, a quarter of the way down.' },
    caution: { ja: '奥の1枚は立てたままにします。折り下げた白い裏と、奥の白い面が雪になります。', en: 'Leave the back layer standing. The white back you turn down, and the white layer behind it, become the snow.' } },
  { moves: [{ line: [[-1,.65],[1,.65]], side: -1, fromFold: 1 }],
    description: { ja: '折り下げた先だけを折り上げ、頂上から少し出します。', en: 'Fold just the turned-down tip back up so it pokes above the summit.' },
    caution: { ja: '山の本体は折りません。ここで雪のぎざぎざができます。', en: 'Leave the body of the mountain flat. This makes the zigzag edge of the snow.' } },
  { moves: [{ line: [[-1,.75],[1,.75]], side: 1, type: 'mountain' }],
    description: { ja: '頂上から出ている白い角を、山のふちで後ろへ折ります。', en: 'Fold the white points above the summit behind, along the edge of the mountain.' },
    caution: { ja: '奥に立てていた角も一緒に折ります。ここで頂上が平らになります。', en: 'This takes the standing back layer with it, leaving a flat summit.' } },
  { moves: [{ line: [[0,-1],[0,1]], side: -1, type: 'mountain' }],
    description: { ja: '中心線で少しだけ後ろへ曲げ、山の厚みを出したら完成です。', en: 'Bend it back slightly along the center line to give the mountain depth.' },
    caution: { ja: '半分には閉じません。浅く曲げて形を整えます。', en: 'Keep it mostly open; only a shallow bend is needed.' } },
]);
// 最後は平らに閉じず、浅い山折りで立体感だけを出す(たまごと同じ扱い)。
const bend = fujiModel.steps.at(-1)!;
bend.folds = bend.folds.filter(op => op.guide !== false);
bend.folds[0].angle = 16;
