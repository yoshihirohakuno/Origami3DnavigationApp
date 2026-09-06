import type { OrigamiModel } from '../engine/types';
import { withPanelLayers } from '../engine/layeredModel';

/**
 * コップ / Cup — 全6工程。
 * 原典 https://www.origami-club.com/fun/cup/zu.html
 * 半分→左右の角→後ろのフタ→手前のフタ→口を開く。
 * 2026-09-06: 原典❹は後ろ、❺は手前。白い前フタが左右の色付きの角を覆う。
 * 完成の白い割合は約50%であり、裏面を一律15%未満にする旧判定は誤り。
 * 左右の折り線は s=2-√2, √2-1, 3-2√2 の厳密値。
 * withPanelLayers で前後の重なりを定義し、最後に前後の壁を12°ずつ開く。
 * 左右の折り込んだ角も前壁に付随させるため、開く途中で辺長は変わらない。
 * 口の曲面は平面パネルによる近似。正面より少し上のカメラで開口を見せる。
 */
const S = 2 - Math.SQRT2; // ≈ 0.5858(フタ折り線の高さ)
const X_TOP = Math.SQRT2 - 1; // ≈ 0.4142(折り線上端のx)
const X_BASE = 3 - 2 * Math.SQRT2; // ≈ 0.1716(折り線下端のx)
const OPEN = 12; // ❻ 原典の浅い口の開きに合わせる(前後の層それぞれ)
const source: OrigamiModel = {
  id: 'cup',
  name: { ja: 'コップ', en: 'Cup' },
  difficulty: 2,
  // 口の中が見えるように、少し上から見下ろす
  cameraPos: [0, 0.9, 4.2],
  vertices: [
    [0, 1], //  0: 上の角(工程5で手前へ折るフタ)
    [1, 0], //  1: 右の角
    [0, -1], //  2: 下の角(工程1で上へ、工程4で後ろのフタに)
    [-1, 0], //  3: 左の角
    [X_BASE, 0], //  4: 右折り線・軸上の端点
    [X_TOP, S], //  5: 右折り線・上端(右上辺上)
    [X_TOP, -S], //  6: 右折り線の鏡映(右下辺上)
    [-X_BASE, 0], //  7: 左折り線・軸上の端点
    [-X_TOP, S], //  8: 左折り線・上端(左上辺上)
    [-X_TOP, -S], //  9: 左折り線の鏡映(左下辺上)
    // 2026-08-15 追加: 角のフラップは2枚重ねで、折ると前後が入れ替わる(下の層が前に出る)。
    // 折り線の端点 6/9 は中央の面と共有していて動かせないので、**角の面だけの複製**を作り、
    // ❷❸で上の層の折り線(4-5 / 7-8)を軸に回して z を反転させる。
    // これをしないと上の層(裏=白)が前に残り、折り図❹(全面が紙の色)と逆になる
    [X_TOP, -S], // 10: 6 の複製(右の角の面だけが使う)
    [-X_TOP, -S], // 11: 9 の複製(左の角の面だけ)
  ],
  faces: [
    // 下半分(工程1で手前に折り上げる側)
    [2, 6, 9], // 下の角(手前フタになる)
    [1, 4, 10], // 右角(下層。複製頂点10)
    [3, 11, 7], // 左角(下層。複製頂点11)
    [4, 7, 9, 6], // 中央(下層)
    // 上半分
    [0, 8, 5], // 上の角(裏フタ)
    [1, 5, 4], // 右角(上層)
    [3, 7, 8], // 左角(上層)
    [4, 5, 8, 7], // 中央(上層)
  ],
  steps: [
    {
      folds: [{ axis: [3, 1], moving: [2, 6, 9, 10, 11], type: 'mountain', angle: 177 }],
      description: {
        ja: '下の角を上の角に合わせて、半分に折ります。',
        en: 'Fold in half, bringing the bottom corner up to the top.',
      },
      caution: {
        ja: '下半分を奥へ回します。こうすると外側が紙の表の色になります。',
        en: 'Take the bottom half behind so the outside shows the front of the paper.',
      },
    },
    {
      // 軸は**上の層の折り線 4-5**(z=0)。複製10も回して z を反転させ、下の層を前に出す
      folds: [{ axis: [4, 5], moving: [1, 10], type: 'valley', angle: 175 }],
      description: {
        ja: '右の角を、反対側の斜め辺に届くまで谷折りします。',
        en: 'Valley-fold the right corner across until it reaches the opposite slanted edge.',
      },
      caution: {
        ja: '2枚重ねたまま折ります。',
        en: 'Fold both layers together.',
      },
    },
    {
      folds: [{ axis: [7, 8], moving: [3, 11], type: 'valley', angle: 173 }],
      description: {
        ja: '左の角も同じように、反対側へ谷折りして重ねます。',
        en: 'Valley-fold the left corner across the same way, overlapping the first.',
      },
    },
    {
      folds: [{ axis: [6, 9], moving: [2], type: 'mountain', angle: 180 }],
      description: {
        ja: '後ろのフタを、裏側へ折り下げます。',
        en: 'Fold the back flap down behind the cup.',
      },
      caution: {
        ja: '奥の1枚だけ折ります。',
        en: 'Fold the back layer only.',
      },
    },
    {
      folds: [{ axis: [5, 8], moving: [0], type: 'valley', angle: 180 }],
      description: {
        ja: '手前のフタを、折った左右の角にかぶせます。',
        en: 'Fold the front flap down over the two folded corners.',
      },
      caution: {
        ja: '手前の1枚だけ折ります。白い三角が正面に出ます。',
        en: 'Fold the front layer only. A white triangle appears on the front.',
      },
    },
    {
      // ❻ 口を開く。底の折り線(動かない 7-4)を軸に、前の層を手前・奥の層を奥へ
      folds: [
        // 左右の角は❷❸で前側へ重ね済み。口を開くときも前壁と一緒に動かす。
        { axis: [7, 4], moving: [0, 5, 8, 1, 3, 10, 11], type: 'valley', angle: OPEN },
        { axis: [7, 4], moving: [2, 6, 9], type: 'mountain', angle: OPEN },
      ],
      description: {
        ja: '口を開いて、コップの形にします。できあがり。',
        en: 'Open the mouth into a cup. Done.',
      },
      caution: {
        ja: '前後の紙をそっと離して、口を少し開きます。',
        en: 'Gently separate the front and back to open the mouth a little.',
      },
    },
  ],
};

export const cupModel = withPanelLayers(source, [
  [[0, 1, 2, 3], [4, 5, 6, 7]],
  [[0, 2, 3], [4, 6, 7], [5], [1]],
  [[0, 3], [4, 7], [5], [1], [6], [2]],
  [[0], [3], [4, 7], [5], [1], [6], [2]],
  [[0], [3], [7], [5], [1], [6], [2], [4]],
  undefined,
]);
