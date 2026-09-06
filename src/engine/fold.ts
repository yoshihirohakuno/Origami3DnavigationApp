import * as THREE from 'three';
import type { OrigamiModel, FoldOp, FoldType } from './types';
import { petalSide } from './petal';

/** イージング(工程内アニメーション用) */
export function easeInOut(a: number): number {
  return a < 0.5 ? 2 * a * a : 1 - (-2 * a + 2) ** 2 / 2;
}

/** 現在工程の1本の折りに対する表示ガイド(折り線+方向矢印) */
export interface FoldGuide {
  type: FoldType;
  /** 折り線の3D位置(始点・終点) */
  axisLine: [THREE.Vector3, THREE.Vector3];
  /** 動く代表頂点の軌跡(矢印表示用)。回転角0→目標角を等分サンプル */
  arrowPath: THREE.Vector3[];
}

export interface FoldState {
  /** 各頂点の現在の3D位置 */
  positions: THREE.Vector3[];
  /** 現在の工程(tが整数=静止中は「次の工程」を予告表示する) */
  stepIndex: number;
  /** 現在工程の進行度 0〜1 */
  fraction: number;
  /** 現在工程の各折りのガイド */
  guides: FoldGuide[];
  /** 現在工程で動く面のインデックス集合(ハイライト用) */
  movingFaces: Set<number>;
}

const _axisDir = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qSpin = new THREE.Quaternion();
const _tmp = new THREE.Vector3();
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** 紙の厚みだけを補う移動には、折り線や矢印を出さない。 */
export function isGuideFold(op: FoldOp): boolean {
  return op.guide ?? !(op.type === 'assemble' && op.angle === 0 && !op.spinZ &&
    op.translate?.[0] === 0 && op.translate?.[1] === 0);
}

/**
 * 谷折り=+z(手前)へ動く回転符号を返す。
 * 折り開始時点の配置で、動く頂点が回転し始める向きのz成分から判定する。
 */
export function foldSign(op: FoldOp, positions: THREE.Vector3[]): number {
  if (op.direction) return op.direction;
  const p1 = positions[op.axis[0]];
  const p2 = positions[op.axis[1]];
  _axisDir.subVectors(p2, p1).normalize();
  let best = 0;
  let bestAbs = 1e-6;
  for (const vi of op.moving) {
    _tmp.subVectors(positions[vi], p1);
    // 角速度ベクトル(axis × r)のz成分:正なら+θで手前へ動き出す
    const vz = _axisDir.x * _tmp.y - _axisDir.y * _tmp.x;
    if (Math.abs(vz) > bestAbs) {
      bestAbs = Math.abs(vz);
      best = vz;
    }
  }
  const towardViewer = best > 0 ? 1 : -1;
  if (op.type === 'inside-reverse' || op.type === 'outside-reverse') {
    return op.sweep === 'back' ? -towardViewer : towardViewer;
  }
  return op.type === 'valley' ? towardViewer : -towardViewer;
}

function rotateAbout(out: THREE.Vector3, origin: THREE.Vector3, q: THREE.Quaternion): void {
  out.sub(origin).applyQuaternion(q).add(origin);
}

/** 折り線から最も遠い動く頂点の回転(+平行移動)軌道をサンプルする(矢印用) */
function buildArrowPath(
  op: FoldOp,
  sign: number,
  positions: THREE.Vector3[],
  p1: THREE.Vector3,
  axisDir: THREE.Vector3,
  range: [number, number] = [0, 1],
): THREE.Vector3[] {
  if (op.pocket) return buildArrowPath({ ...op, pocket: undefined, moving: [op.pocket.rim] }, sign, positions, p1, axisDir, range);
  if (op.petal) return buildArrowPath({ ...op, petal: undefined, moving: [op.petal.tip] }, sign, positions, p1, axisDir, range);
  if (op.targets?.length) {
    const target = op.targets.reduce((best, p) => {
      const distance = (v: typeof p) => positions[v[0]].distanceToSquared(new THREE.Vector3(v[1], v[2], v[3]));
      return distance(p) > distance(best) ? p : best;
    });
    const end = new THREE.Vector3(target[1], target[2], target[3]);
    return Array.from({ length: 9 }, (_, i) => positions[target[0]].clone().lerp(end, range[0] + (range[1] - range[0]) * i / 8));
  }
  const translate = op.translate;
  // 平行移動が主体の組み立てでは、移動量が最大に見える頂点(=軸から遠い頂点)より
  // 単純に代表頂点でよいが、既存同様「軸から最も遠い頂点」を採用する
  let far = op.moving[0];
  let farDist = -1;
  for (const vi of op.moving) {
    _tmp.subVectors(positions[vi], p1);
    const d = _tmp.clone().projectOnVector(axisDir).sub(_tmp).length();
    if (d > farDist) {
      farDist = d;
      far = vi;
    }
  }
  const path: THREE.Vector3[] = [];
  const total = sign * THREE.MathUtils.degToRad(op.angle);
  for (let s = 0; s <= 8; s++) {
    const f = range[0] + (range[1] - range[0]) * s / 8;
    _q.setFromAxisAngle(axisDir, total * f);
    const p = positions[far].clone();
    rotateAbout(p, p1, _q);
    if (op.spinZ) {
      _qSpin.setFromAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(op.spinZ) * f);
      rotateAbout(p, p1, _qSpin);
    }
    if (translate) {
      p.x += translate[0] * f;
      p.y += translate[1] * f;
      p.z += translate[2] * f;
    }
    path.push(p);
  }
  return path;
}

/**
 * タイムライン位置 t(0=展開状態、k=工程kまで完了)における全頂点位置を計算する。
 * 毎フレーム呼ばれる前提(頂点数十個規模なので十分軽い)。
 */
export function computeFoldState(model: OrigamiModel, t: number): FoldState {
  const positions = model.vertices.map(([x, y]) => new THREE.Vector3(x, y, 0));
  const clamped = Math.max(0, Math.min(Number.isNaN(t) ? 0 : t, model.steps.length));
  // 静止中(tが整数)は「次の工程」を現在工程として予告表示する(完成時のみ最終工程)
  const stepIndex = Math.min(Math.floor(clamped), model.steps.length - 1);

  const guides: FoldGuide[] = [];
  const movingFaces = new Set<number>();
  let fraction = 0;

  for (let i = 0; i < model.steps.length; i++) {
    const step = model.steps[i];
    const a = Math.max(0, Math.min(clamped - i, 1));
    if (a <= 0 && i !== stepIndex) break;
    // Completed slices are represented by the current continuation, not applied
    // a second time. At the boundary the next slice starts at the same pose.
    if (a === 1 && model.steps[i + 1]?.motionRange?.[0]) continue;
    const [from, to] = step.motionRange ?? [0, 1];
    const motion = from + (to - from) * a;

    for (const op of step.folds) {
      const [start, end] = op.timing ?? [0, 1];
      const progress = Math.max(0, Math.min((motion - start) / (end - start), 1));
      const sign = foldSign(op, positions);
      const p1 = positions[op.axis[0]].clone();
      const p2 = positions[op.axis[1]].clone();
      const axisDir = new THREE.Vector3().subVectors(p2, p1).normalize();

      if (i === stepIndex && a < 1 && motion >= start && motion < end && isGuideFold(op)) {
        guides.push({
          type: op.type,
          axisLine: [p1.clone(), p2.clone()],
          arrowPath: buildArrowPath(op, sign, positions, p1, axisDir,
            [from, to].map(v => easeInOut(Math.max(0, Math.min((v - start) / (end - start), 1)))) as [number, number]),
        });
        const movingSet = new Set(op.moving);
        for (const [vi, a, b, c, u, v, w] of op.surfacePoints ?? []) {
          if ([[a,u],[b,v],[c,w]].some(([anchor, weight]) => weight > 1e-8 && movingSet.has(anchor))) movingSet.add(vi);
        }
        model.faces.forEach((face, fi) => {
          if (face.some((vi) => movingSet.has(vi))) movingFaces.add(fi);
        });
      }

      if (progress > 0) {
        const e = easeInOut(progress);
        const angle = sign * THREE.MathUtils.degToRad(op.angle) * e;
        _q.setFromAxisAngle(axisDir, angle);
        if (op.spinZ) _qSpin.setFromAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(op.spinZ) * e);
        const tr = op.translate;
        const beforeTip = op.petal ? positions[op.petal.tip].clone() : undefined;
        for (const vi of op.pocket ? [op.pocket.rim] : op.petal ? [op.petal.tip] : op.moving) {
          rotateAbout(positions[vi], p1, _q);
          if (op.spinZ) rotateAbout(positions[vi], p1, _qSpin);
          if (tr) {
            positions[vi].x += tr[0] * e;
            positions[vi].y += tr[1] * e;
            positions[vi].z += tr[2] * e;
          }
        }
        if (op.petal) for (const [point, anchor, neighbor] of op.petal.sides) {
          positions[point].copy(petalSide(positions[point], positions[anchor], positions[neighbor],
            beforeTip!, positions[op.petal.tip]));
        }
        if (op.pocket) {
          // The hinge endpoint is one intersection of the tip's three spheres.
          // Reflect it through the plane of the two rim vectors to get the other
          // intersection. Unlike two chained rotations, this preserves all four
          // triangular panels while the pocket is open.
          const pivot = positions[op.pocket.pivot].clone().sub(p1);
          const rim = positions[op.pocket.rim].clone().sub(p1);
          const normal = pivot.cross(rim).normalize();
          const hinge = p2.clone().sub(p1);
          if (normal.lengthSq() > 1e-12) positions[op.pocket.tip].copy(hinge)
            .addScaledVector(normal, -2 * hinge.dot(normal)).add(p1);
        }
        for (const [vi, x, y, z] of op.targets ?? []) positions[vi].lerp(_tmp.set(x, y, z), e);
        for (const [vi, a, b, c, u, v, w] of op.surfacePoints ?? []) {
          positions[vi].copy(positions[a]).multiplyScalar(u)
            .addScaledVector(positions[b], v).addScaledVector(positions[c], w);
        }
      }
    }
    if (i === stepIndex) fraction = a;
  }

  for (const weld of model.vertexWelds ?? []) {
    // A crease wraps over the frontmost participating layer. Averaging depths
    // buries the crease under intervening flaps and makes their reverse poke through.
    const front = weld.reduce((a, b) => positions[b].z > positions[a].z ? b : a);
    _tmp.copy(positions[front]);
    for (const vi of weld) positions[vi].copy(_tmp);
  }
  return { positions, stepIndex, fraction, guides, movingFaces };
}
