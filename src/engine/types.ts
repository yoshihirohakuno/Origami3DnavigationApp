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
  /** 折る角度(度)。平畳みは180°。層順は rigidFolds などで別に管理する。 */
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
  /**
   * 面内回転(組み立て用、度)。`axis[0]` の現在位置を通る z 平行軸まわりに
   * `moving` 頂点を `spinZ * ease(a)` 度回す(+z から見て反時計回りが正)。
   * 軸回転 → spinZ → translate の順に適用。裏返して向きを変える工程で使う。
   */
  spinZ?: number;
  /** 工程内の実行区間。開いてから閉じるなど、順序のある操作に使う。 */
  timing?: [number, number];
  /** 層の厚み調整など、操作ガイドを出さない内部処理は false。 */
  guide?: boolean;
  /** Flexible paper motion: interpolate these vertices to a sampled surface pose. */
  targets?: [vertex: number, x: number, y: number, z: number][];
  /** Carry subdivision points with a coarse triangular panel (barycentric weights). */
  surfacePoints?: [vertex: number, a: number, b: number, c: number, u: number, v: number, w: number][];
  /** Four triangular panels of a square/waterbomb pocket. The rim rotates
   * about axis; the tip follows the sphere constraints against the fixed pivot. */
  pocket?: { rim: number; tip: number; pivot: number };
  /** Lift a petal while both shared edge points remain the intersection of
   * spheres about their crease anchor, the lifted tip and the adjacent tip. */
  petal?: { tip: number; sides: [point: number, anchor: number, neighbor: number][] };
}

/**
 * 1工程。公開ルートでは独立した操作を1つずつ案内する。
 * 連動する袋開き・紙厚の補正は、同じ工程内に複数の演算を持てる。
 */
export interface FoldStep {
  folds: FoldOp[];
  /** Consecutive slices of ONE coupled motion, covering [0,1]. Each slice repeats
   * the same folds; the engine evaluates only the current slice from their common
   * starting pose. This provides a stop while opening a pocket without unfolding it. */
  motionRange?: [number, number];
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
   * 見せたい時に指定(未指定時は正面 [0,0,5])。cameraAngle の
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
  /** Optional refined surface mesh. Face IDs still refer to the original paper panels. */
  triangles?: [face: number, a: number, b: number, c: number][];
  /** Rendered copies of the same material point must stay connected, including at creases. */
  vertexWelds?: number[][];
  /** Opt-in display-only layer spacing for exactly flat connected mechanisms. */
  renderLayerSeparation?: number;
}
