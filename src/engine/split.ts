import type { OrigamiModel } from './types';

/** 小数誤差を丸める(展開図座標用) */
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

/**
 * 2点 p-q を通る直線で、モデルの全ての面を分割する。
 * - 直線と辺の交点には頂点を自動追加(既存頂点と一致する場合は再利用)
 * - 直線をまたぐ面は2つの面に分割される(頂点の巡回順は保たれる)
 * - 既存の頂点番号は変わらないため、steps の参照はそのまま有効
 *
 * 折り線を展開図に埋め込むためのエディタ用ユーティリティ。
 */
export function splitFacesByLine(
  model: OrigamiModel,
  p: [number, number],
  q: [number, number],
): OrigamiModel {
  const EPS = 1e-4;
  const vertices = model.vertices.map((v) => [v[0], v[1]] as [number, number]);
  const side = (pt: [number, number]) =>
    (q[0] - p[0]) * (pt[1] - p[1]) - (q[1] - p[1]) * (pt[0] - p[0]);

  const cache = new Map<string, number>();
  const intersect = (a: number, b: number): number => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const A = vertices[a];
    const B = vertices[b];
    const sa = side(A);
    const sb = side(B);
    const t = sa / (sa - sb);
    const x = round6(A[0] + t * (B[0] - A[0]));
    const y = round6(A[1] + t * (B[1] - A[1]));
    for (let i = 0; i < vertices.length; i++) {
      if (Math.hypot(vertices[i][0] - x, vertices[i][1] - y) < EPS) {
        cache.set(key, i);
        return i;
      }
    }
    vertices.push([x, y]);
    cache.set(key, vertices.length - 1);
    return vertices.length - 1;
  };

  const faces: number[][] = [];
  for (const face of model.faces) {
    const sides = face.map((vi) => {
      const s = side(vertices[vi]);
      return Math.abs(s) < EPS ? 0 : Math.sign(s);
    });
    if (!sides.includes(1) || !sides.includes(-1)) {
      faces.push(face);
      continue;
    }
    const left: number[] = [];
    const right: number[] = [];
    for (let i = 0; i < face.length; i++) {
      const s = sides[i];
      if (s >= 0) left.push(face[i]);
      if (s <= 0) right.push(face[i]);
      const j = (i + 1) % face.length;
      if (sides[i] * sides[j] < 0) {
        const nv = intersect(face[i], face[j]);
        left.push(nv);
        right.push(nv);
      }
    }
    if (left.length >= 3) faces.push(left);
    if (right.length >= 3) faces.push(right);
  }

  return { ...model, vertices, faces };
}
