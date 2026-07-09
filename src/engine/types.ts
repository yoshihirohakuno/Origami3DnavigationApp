/**
 * 折り紙工程データの型定義。
 * 作品は「頂点(展開図座標)+面+工程の列」で表現し、
 * 3D形状は工程を順番に適用して計算する(動画・画像は持たない)。
 */

/**
 * 折りの種類。
 * inside-reverse(中割り折り)/ outside-reverse(かぶせ折り)は、
 * ほぼ平らに畳まれた多層フラップを折り線を軸に約180°回転させる表現。
 * レイヤーの前後が入れ替わるため、見える面の色も実物と同様になる。
 */
export type FoldType =
  | 'valley'
  | 'mountain'
  | 'unfold'
  | 'inside-reverse'
  | 'outside-reverse'
  | 'assemble';

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
  /** 谷折り=手前(+z)へ / 山折り=奥(-z)へ / 開く=折りを戻す。回転の符号はエンジンが自動決定する */
  type: FoldType;
  /** 折る角度(度)。180に近いほど平らに畳まれる。層の重なりを避けるため175前後を推奨 */
  angle: number;
  /** 中割り/かぶせ折りの回す向き(省略時 front=手前側を通す) */
  sweep?: 'front' | 'back';
  /**
   * 回転符号の明示指定(axis[0]→axis[1] 方向の右ねじ)。
   * 基本形のたたみ込みなど、連鎖回転で山谷の自動判定が使えない場合に使う。
   */
  direction?: 1 | -1;
  /**
   * 剛体の平行移動(組み立て用)。指定すると回転後の `moving` 頂点へ
   * `translate * ease(a)` を加算する(回転と併用可、単独でも可)。
   * 2枚組みのユニットを中心へ寄せて交差させる工程で使う。
   */
  translate?: [number, number, number];
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
  /** 既定カメラの水平回転角(度)。立体的な完成形を斜めから見せる時に指定 */
  cameraAngle?: number;
  /**
   * 既定カメラ位置の上書き [x,y,z]。平らな作品(手裏剣など)を正面寄りから
   * 見せたい時に指定(未指定時は全体既定の斜め見下ろし)。cameraAngle の
   * 水平回転はこの位置に対して適用される。
   */
  cameraPos?: [number, number, number];
  /** 難易度 1〜5 */
  difficulty: number;
  /** 展開図上の頂点座標。紙は一辺2程度の正方形を想定 */
  vertices: [number, number][];
  /** 面(頂点インデックスの多角形、表(+z)から見て反時計回り) */
  faces: number[][];
  steps: FoldStep[];
  /**
   * 2枚組み(モジュラー)用。各面がどのシート由来かを 0/1… で示す
   * (長さ=faces数)。指定時は `sheetColors` の色で塗り分ける。
   */
  faceSheet?: number[];
  /** シートごとの表裏色(faceSheet と対応)。未指定時はグローバル色。 */
  sheetColors?: { front: string; back: string }[];
}
