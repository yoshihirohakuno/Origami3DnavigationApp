import type { FoldStep, OrigamiModel } from '../engine/types';

/**
 * ぶーつ / Boots(全5工程)
 * https://www.origami-club.com/easy/clothes/boots/zu.html(作・図:新宮文明)
 *
 *   ❶ たて半分に折る(右半分を左へ)
 *   ❷ **上の1枚だけ**を、折った長方形の対角線で折る(はみ出した先が足になる)
 *   ❸ 下の帯を折り上げる(全部の層をまとめて)
 *   ❹ 足の先を縦の線で折る(つま先)
 *   ❺ うらがえす → ❻(折り図)できあがり
 *
 * 紙は [-1,1] の正方形。**白い面を上にして始める**(折り図❶が白、❷で桃色が出る)。
 *
 * 幾何の要点(tools/zu-measure.mjs で実測。パネル名は折り図の丸数字):
 * - ❶で右半分を左へ折る。**折り目は結果の右のふち**(折り図❷は左のふちが2本線=
 *   紙のはし、右のふちが1本線=折り目)。長方形は 1×2(実測 89×186、比 2.09)
 * - **❷の折り線は、折った長方形の対角線そのもの**(左上の角と右下の角を結ぶ)。
 *   折り図❷の破線の両端が長方形の角にぴったり乗る。展開図では❶の折り線で鏡映して
 *   紙の (1,1)-(0,-1)。**紙の左下の角は (0.6,-0.2) へ回って右へはみ出す**
 *   (折り図❸の実測 (0.587,-0.211)、❹の実測 (0.609,-0.2))。これが足になる
 * - **❸の折り線 y=-D、D=2/3**(折り図❸の破線の実測 0.671。帯の高さが 1/3 になる)。
 *   折り図❹の帯の比からは 0.63 が出るが、破線が引いてあるパネル❸の方を採った
 * - **❹の折り線は折り後の縦線 x=E、E=0.46**(折り図❹の実測 0.463)。目印はない。
 *   足の先 (0.6,-0.2) が (0.32,-0.2) へ回って、つま先が丸くなる
 * - ❺のうらがえしで、下の層の裏(桃)が正面に来る = 折り図❻の一面桃色
 *
 * 展開図への埋め方(ヨットと同じ「上の1枚だけ折る」型):
 * - ❶で動く右半分の折り線は、展開図では x を反転した位置に入れる
 * - ❷でさらに動いたフラップの折り線は、**❷の対角線で鏡映してから❶で鏡映**する。
 *   紙の下のふち (x,-1) は、折り後に ((3/5)x, (4x-5)/5) へ来るので:
 *   ❸の折り線がフラップを切る点は x=5(1-D)/4=5/12、❹の折り線は x=5E/3。
 *   紙の右のふち (1,y) は折り後に x=-1+4(1-y)/5 なので、❹の折り線は y=1-5(1+E)/4
 * - ❸は3枚(左半分・右半分・フラップ)をまとめて折るので、3枚それぞれに折り線を入れる
 */

/** ❸の折り線(帯の高さが 1/3。折り図❸の実測 0.671) */
const D = 2 / 3;
/** ❹の折り線(折り後の縦線 x=E。折り図❹の実測 0.463) */
const E = 0.46;

const V: [number, number][] = [
  [-1, 1], //  0: 左上の角
  [1, 1], //  1: 右上の角(❷の折り線の上端)
  [1, -1], //  2: 右下の角(❷で足の先へ、❹でつま先になる)
  [-1, -1], //  3: 左下の角
  [0, 1], //  4: ❶の折り線・上
  [0, -1], //  5: ❶の折り線・下(=❷の折り線の下端)
  [-1, -D], //  6: ❸の折り線・左のふち
  [0, -D], //  7: ❸の折り線・❶の折り線上
  [(1 - D) / 2, -D], //  8: ❸の折り線が❷の対角線と交わる点(右半分の層)
  [(5 * (1 - D)) / 4, -1], //  9: ❸の折り線・フラップ側の端(下のふち)
  [1, 1 - (5 * (1 + E)) / 4], // 10: ❹の折り線・右のふち
  [(5 * E) / 3, -1], // 11: ❹の折り線・下のふち
];

const F: number[][] = [
  [0, 4, 7, 6], // 0: 左半分の胴(動かない=完成形のうしろ側)
  [6, 7, 5, 3], // 1: 左半分の帯(❸で回る)
  [4, 1, 8, 7], // 2: 右半分の胴(❶で回る)
  [7, 8, 5], // 3: 右半分の帯(❶と❸で回る)
  [1, 10, 11, 9, 8], // 4: ❷のフラップ本体(足)
  [10, 2, 11], // 5: フラップの先(❹で回る=つま先)
  [8, 5, 9], // 6: フラップの帯側(❸で回る)
];

/** 反時計回り(表=+z)へ揃える */
function orient(f: number[]): number[] {
  let a = 0;
  for (let i = 0; i < f.length; i++) {
    const [x1, y1] = V[f[i]];
    const [x2, y2] = V[f[(i + 1) % f.length]];
    a += x1 * y2 - x2 * y1;
  }
  return a >= 0 ? f : [...f].reverse();
}

/** 白い面を上にして始める(面の初期向きを反転して表す) */
const backSideUp = (faces: number[][]) => faces.map((face) => [...face].reverse());

const ALL = V.map((_, i) => i);

const steps: FoldStep[] = [
  {
    // ❶ たて半分。右半分を左へ(折り目は結果の右のふち)
    folds: [{ axis: [4, 5], moving: [1, 2, 8, 9, 10, 11], type: 'valley', angle: 176 }],
    description: {
      ja: 'たて半分に折ります。',
      en: 'Fold in half lengthwise.',
    },
    caution: {
      ja: '白い面を上にして始めます。折り返した裏の色が出ます。',
      en: 'Start white side up; the colored reverse shows as you fold.',
    },
  },
  {
    // ❷ 上の1枚だけを、長方形の対角線で折る。軸は❶で動いていない 5 と、
    // 対角線の上端 1(❶で動くが、対角線上の頂点はほかに無い)
    folds: [{ axis: [1, 5], moving: [2, 9, 10, 11], type: 'valley', angle: 176 }],
    description: {
      ja: '上の1枚だけを、長方形の対角線で折ります。',
      en: 'Fold just the top sheet along the diagonal of the rectangle.',
    },
    caution: {
      ja: '折った先が右へはみ出します。これが足になります。',
      en: 'The corner sticks out to the right — that becomes the foot.',
    },
  },
  {
    // ❸ 下の帯を折り上げる。3枚(左半分・右半分・フラップ)をまとめて。
    // 軸は一度も動いていない 6・7
    folds: [{ axis: [6, 7], moving: [3, 5], type: 'valley', angle: 174 }],
    description: {
      ja: '下の帯を、折り上げます。',
      en: 'Fold the bottom band up.',
    },
    caution: {
      ja: '全部の層をまとめて折ります。いちばん下の層が前に出て、色の帯になります。',
      en: 'Fold every layer together; the bottom layer comes forward as a colored band.',
    },
  },
  {
    // ❹ 足の先を縦の線で折ってつま先に
    folds: [{ axis: [10, 11], moving: [2], type: 'valley', angle: 174 }],
    description: {
      ja: '足の先を、たての線で折ります。',
      en: 'Fold the tip of the foot along a vertical line.',
    },
  },
  {
    // ❺ うらがえす(下の層の裏=色の面が正面に来る)。軸は不動の 4・7
    folds: [{ axis: [4, 7], moving: ALL, type: 'assemble', angle: 180, direction: 1 }],
    description: {
      ja: 'うらがえします。ぶーつのできあがり。',
      en: 'Turn it over — the boot is done.',
    },
    caution: {
      ja: 'うらがえすと、一面が紙の色になります。',
      en: 'Turned over, the whole boot shows the colored side.',
    },
  },
];

export const bootsModel: OrigamiModel = {
  id: 'boots',
  name: { ja: 'ぶーつ', en: 'Boots' },
  difficulty: 1,
  cameraAngle: 0,
  vertices: V,
  faces: backSideUp(F.map(orient)),
  faceSheet: F.map(() => 0),
  // 折り図の桃色を実測(#fab3d8)。裏は紙の白
  sheetColors: [{ front: '#fab3d8', back: '#f6f2e8' }],
  steps,
};
