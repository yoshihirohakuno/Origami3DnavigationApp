/**
 * 折り紙工程データの型定義。
 * 作品は「頂点(展開図座標)+面+工程の列」で表現し、
 * 3D形状は工程を順番に適用して計算する(動画・画像は持たない)。
 */

export type FoldType = 'valley' | 'mountain';

/** 日英併記テキスト */
export interface LocalizedText {
  ja: string;
  en: string;
}

/** 1本の折り(回転軸+回転する頂点集合) */
export interface FoldOp {
  /** 折り線を定義する2頂点のインデックス(折り線上にある頂点) */
  axis: [number, number];
  /** この折りで回転する頂点のインデックス(折り線上の頂点は含めなくてよい) */
  moving: number[];
  /** 谷折り=手前(+z)へ / 山折り=奥(-z)へ。回転の符号はエンジンが自動決定する */
  type: FoldType;
  /** 折る角度(度)。180に近いほど平らに畳まれる。層の重なりを避けるため175前後を推奨 */
  angle: number;
}

/**
 * 1工程。複数の折りを同時に実行できる
 * (左右対称の折り、将来的には中割り折りなどの連動した折りに使う)。
 */
export interface FoldStep {
  folds: FoldOp[];
  /** 工程の説明文(短く) */
  description: LocalizedText;
  /** 注意ポイント(任意) */
  caution?: LocalizedText;
}

export interface OrigamiModel {
  id: string;
  name: LocalizedText;
  /** 難易度 1〜5 */
  difficulty: number;
  /** 展開図上の頂点座標。紙は一辺2程度の正方形を想定 */
  vertices: [number, number][];
  /** 面(頂点インデックスの多角形、表(+z)から見て反時計回り) */
  faces: number[][];
  steps: FoldStep[];
}
