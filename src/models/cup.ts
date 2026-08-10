import type { OrigamiModel } from '../engine/types';

/**
 * コップ / Cup(6工程)
 * 半分折り→左右の角を反対側へ→前後のフタを畳む→口を開く、の古典作品。
 * 工程1〜5は1軸折りで、前後レイヤーの折り分け(工程4・5)を含む。
 *
 * 工程2・3の折り線は s = 2-√2 ≈ 0.5858 を使った古典の厳密解:
 * 角(±1,0)の折り先が反対側の折り線の上端(∓(√2-1), s)にぴったり重なり、
 * フタの折り線(y=s)とあわせて、はみ出しのない台形のコップになる。
 *
 * 2026-08-10 修正: ❶を山折り(下半分を奥へ)に変更。谷折りだと手前へ回った下半分が
 * 裏返って**胴が白く**なり、「動かない側が常に表を向く」という全作品共通の方針と
 * 逆だった(自動点検で完成形の45%が裏の白と判明)。あわせて前後のフタ(❹❺)と
 * ❻で開く層を入れ替えた。
 *
 * 2026-08-09 追加: ❻「口を開く」。工程5までは平畳みなので、完成形が平たい台形で
 * コップに見えなかった(実物は口を開いて使う=原典の完成図も口が開いている)。
 * 前後の層を、コップの底の折り線(y=0、動かない頂点 7-4 を軸)まわりに
 * ±OPEN° 回して口を開く。箱と同じ「平畳みで止めない立体の折り」。
 * - 前の層(❶で動かない上半分: 0/5/8)を手前へ、後ろの層(2/6/9)を奥へ
 * - 左右の角(1/3)は前後の層で共有する1点(実物でも側面のタブは1枚)。
 *   そのため側面の小さな三角だけ辺が約4%伸びる。紙が円錐状に曲がる分を
 *   平面の面で近似しているためで、見た目の破綻はない
 * - 口の中が見えるよう、カメラは上から見下ろす位置に置く(cameraPos)
 */
const S = 2 - Math.SQRT2; // ≈ 0.5858(フタ折り線の高さ)
const X_TOP = Math.SQRT2 - 1; // ≈ 0.4142(折り線上端のx)
const X_BASE = 3 - 2 * Math.SQRT2; // ≈ 0.1716(折り線下端のx)
const OPEN = 20; // ❻ 口を開く角度(前後の層それぞれ)
export const cupModel: OrigamiModel = {
  id: 'cup',
  name: { ja: 'コップ', en: 'Cup' },
  difficulty: 2,
  // 口の中が見えるように、少し上から見下ろす
  cameraPos: [0, 1.7, 4.2],
  vertices: [
    [0, 1], //  0: 上の角(最後に裏へ折るフタ)
    [1, 0], //  1: 右の角
    [0, -1], //  2: 下の角(工程1で上へ、工程4で手前フタに)
    [-1, 0], //  3: 左の角
    [X_BASE, 0], //  4: 右折り線・軸上の端点
    [X_TOP, S], //  5: 右折り線・上端(右上辺上)
    [X_TOP, -S], //  6: 右折り線の鏡映(右下辺上)
    [-X_BASE, 0], //  7: 左折り線・軸上の端点
    [-X_TOP, S], //  8: 左折り線・上端(左上辺上)
    [-X_TOP, -S], //  9: 左折り線の鏡映(左下辺上)
  ],
  faces: [
    // 下半分(工程1で手前に折り上げる側)
    [2, 6, 9], // 下の角(手前フタになる)
    [1, 4, 6], // 右角(下層)
    [3, 9, 7], // 左角(下層)
    [4, 7, 9, 6], // 中央(下層)
    // 上半分
    [0, 8, 5], // 上の角(裏フタ)
    [1, 5, 4], // 右角(上層)
    [3, 7, 8], // 左角(上層)
    [4, 5, 8, 7], // 中央(上層)
  ],
  steps: [
    {
      folds: [{ axis: [3, 1], moving: [2, 6, 9], type: 'mountain', angle: 177 }],
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
      folds: [{ axis: [4, 6], moving: [1], type: 'valley', angle: 175 }],
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
      folds: [{ axis: [7, 9], moving: [3], type: 'valley', angle: 173 }],
      description: {
        ja: '左の角も同じように、反対側へ谷折りして重ねます。',
        en: 'Valley-fold the left corner across the same way, overlapping the first.',
      },
    },
    {
      folds: [{ axis: [5, 8], moving: [0], type: 'valley', angle: 172 }],
      description: {
        ja: '手前のフタを、折った角にかぶせるように谷折りします。',
        en: 'Valley-fold the front flap down over the folded corners.',
      },
      caution: {
        ja: '手前の1枚だけ折ります。',
        en: 'Fold the front layer only.',
      },
    },
    {
      folds: [{ axis: [6, 9], moving: [2], type: 'mountain', angle: 172 }],
      description: {
        ja: '後ろのフタも、裏側へ山折りします。',
        en: 'Mountain-fold the back flap behind as well.',
      },
      caution: {
        ja: '奥の1枚だけ折ります。これで平らなコップの形になります。',
        en: 'Fold the back layer only. The flat cup shape is now finished.',
      },
    },
    {
      // ❻ 口を開く。底の折り線(動かない 7-4)を軸に、前の層を手前・奥の層を奥へ
      folds: [
        { axis: [7, 4], moving: [0, 5, 8], type: 'valley', angle: OPEN },
        { axis: [7, 4], moving: [2, 6, 9], type: 'mountain', angle: OPEN },
      ],
      description: {
        ja: '口を開いて、コップの形にします。できあがり。',
        en: 'Open the mouth into a cup. Done.',
      },
      caution: {
        ja: '底の折り線を折り目にして、前後の紙を左右に開きます。水も入ります。',
        en: 'Spread the front and back apart along the bottom crease — it even holds water.',
      },
    },
  ],
};
