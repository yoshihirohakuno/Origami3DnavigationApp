import * as THREE from 'three';
import type { OrigamiModel, FoldOp, FoldType } from './types';

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
const _tmp = new THREE.Vector3();

/**
 * 谷折り=+z(手前)へ動く回転符号を返す。
 * 折り開始時点の配置で、動く頂点が回転し始める向きのz成分から判定する。
 */
function foldSign(op: FoldOp, positions: THREE.Vector3[]): number {
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
  return op.type === 'valley' ? towardViewer : -towardViewer;
}

function rotateAbout(out: THREE.Vector3, origin: THREE.Vector3, q: THREE.Quaternion): void {
  out.sub(origin).applyQuaternion(q).add(origin);
}

/** 折り線から最も遠い動く頂点の回転軌道をサンプルする(矢印用) */
function buildArrowPath(
  op: FoldOp,
  sign: number,
  positions: THREE.Vector3[],
  p1: THREE.Vector3,
  axisDir: THREE.Vector3,
): THREE.Vector3[] {
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
    _q.setFromAxisAngle(axisDir, (total * s) / 8);
    const p = positions[far].clone();
    rotateAbout(p, p1, _q);
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
  const clamped = Math.max(0, Math.min(t, model.steps.length));
  // 静止中(tが整数)は「次の工程」を現在工程として予告表示する(完成時のみ最終工程)
  const stepIndex = Math.min(Math.floor(clamped), model.steps.length - 1);

  const guides: FoldGuide[] = [];
  const movingFaces = new Set<number>();
  let fraction = 0;

  for (let i = 0; i < model.steps.length; i++) {
    const step = model.steps[i];
    const a = Math.max(0, Math.min(clamped - i, 1));
    if (a <= 0 && i !== stepIndex) break;

    for (const op of step.folds) {
      const sign = foldSign(op, positions);
      const p1 = positions[op.axis[0]].clone();
      const p2 = positions[op.axis[1]].clone();
      const axisDir = new THREE.Vector3().subVectors(p2, p1).normalize();

      if (i === stepIndex) {
        guides.push({
          type: op.type,
          axisLine: [p1.clone(), p2.clone()],
          arrowPath: buildArrowPath(op, sign, positions, p1, axisDir),
        });
        const movingSet = new Set(op.moving);
        model.faces.forEach((face, fi) => {
          if (face.some((vi) => movingSet.has(vi))) movingFaces.add(fi);
        });
      }

      if (a > 0) {
        const angle = sign * THREE.MathUtils.degToRad(op.angle) * easeInOut(a);
        _q.setFromAxisAngle(axisDir, angle);
        for (const vi of op.moving) {
          rotateAbout(positions[vi], p1, _q);
        }
      }
    }
    if (i === stepIndex) fraction = a;
  }

  return { positions, stepIndex, fraction, guides, movingFaces };
}
