import { Vector3 } from 'three';
import { easeInOut, type FoldGuide, type FoldState } from '../engine/fold';
import type { OrigamiModel } from '../engine/types';

/** Private mechanism research, not a finished rose. The extra diagonal lets
 * the central square bend while the surrounding faces remain rigid.
 * Kinematics: Hull & Urbanski, arXiv:1809.04899, case 1 / curve A.
 * The eventual rose's additional pleats, petals and bottom are not here yet. */
export function createRoseTwistStudy(halfDiagonal = .25) {
  if (!Number.isFinite(halfDiagonal) || halfDiagonal <= 0 || halfDiagonal >= .5) {
    throw new Error('Rose twist: central half-diagonal must be between 0 and .5');
  }
  const h = halfDiagonal;
  // 0..3: v1 (bottom), v2 (top), v3 (left), v4 (right).
  // 4..11: boundary crease ends; 12..15: original corners.
  const vertices: [number, number][] = [[0,-h],[0,h],[-h,0],[h,0],
    [0,1],[1,h],[1,0],[h,-1],[0,-1],[-1,-h],[-1,0],[-h,1],
    [1,1],[1,-1],[-1,-1],[-1,1]];
  const faces = [[2,0,3],[2,3,1],[1,3,6,5],[1,5,12,4],
    [3,0,8,7],[3,7,13,6],[0,2,10,9],[0,9,14,8],[2,1,4,11],[2,11,15,10]];
  const model: OrigamiModel = {
    id: 'rose-twist-study',
    name: { ja: 'バラ・中央ねじりの構造試作', en: 'Rose central twist mechanism study' },
    difficulty: 4,
    vertices,
    faces,
    // Captions for six pauses in TWO coupled motions. This private adapter
    // supplies the poses; empty rotations are never registered as a public route.
    steps: Array.from({ length: 6 }, (_, index) => ({
      folds: [],
      description: index < 4
        ? { ja: '中央を曲げながら、周りの四つの折りを一緒に進めます。', en: 'Bend the center while the four surrounding folds move together.' }
        : { ja: '重なった折りを保ち、中心を開いて四角に整えます。', en: 'Keep the surrounding folds closed while opening the center into a square.' },
      caution: { ja: 'ねじりだけの未完成試作です。花びらと底の仕上げはまだありません。', en: 'Unfinished twist-only study. Petals and bottom finishing are not implemented.' },
    })),
    sheetColors: [{ front: '#d96b89', back: '#fff3ee' }],
    cameraPos: [0,-2,4],
    // Cyclic flat overlaps cannot have a single total layer ordering. Preserve
    // physical contact here rather than offsetting connected facets apart.
    renderLayerSeparation: 0,
  };

  function poseAt(time: number): Vector3[] {
    const t = Math.max(0, Math.min(Number.isNaN(time) ? 0 : time, 6));
    const stage = Math.min(Math.floor(t), 5);
    const fraction = easeInOut(t - stage);
    const twist = stage < 4 ? (stage + fraction) / 4 : 1;
    const opening = stage < 4 ? 0 : (stage - 4 + fraction) / 2;
    const theta = Math.PI * twist;
    const phi = twist === 1 ? Math.PI : 2 * Math.atan((Math.SQRT2 - 1) * Math.tan(theta / 2));
    // Sign is reversed from the paper's zeta because our fixed triangle is
    // below the added diagonal. Using the other sign stretches the rectangles.
    const zeta = twist === 1 ? Math.PI * (1 - opening)
      : -2 * Math.atan((Math.SQRT2 - 2) * Math.tan(theta / 2));
    const p = vertices.map(([x,y]) => new Vector3(x,y,0));
    const turn = (ids: number[], a: number, b: number, angle: number) => {
      const origin = p[a].clone(), axis = p[b].clone().sub(origin).normalize();
      for (const i of ids) p[i].sub(origin).applyAxisAngle(axis, angle).add(origin);
    };
    turn([1,4,5,6,11],2,3,zeta);
    turn([9,10],2,0,theta);
    turn([7,8],0,3,phi);
    turn([4,11],1,2,phi);
    turn([5,6],3,1,theta);
    // Each boundary corner is the fourth point of its exact rectangle. The
    // linked angles keep its two incident edges perpendicular at every pose.
    for (const [corner,a,b,c] of [[12,4,5,1],[13,6,7,3],[14,8,9,0],[15,10,11,2]]) {
      p[corner].copy(p[a]).add(p[b]).sub(p[c]);
    }
    return p;
  }

  function stateAt(_: OrigamiModel, time: number): FoldState {
    const t = Math.max(0, Math.min(Number.isNaN(time) ? 0 : time, 6));
    const stepIndex = Math.min(Math.floor(t), 5);
    const fraction = t - stepIndex;
    const positions = poseAt(t);
    const from = poseAt(stepIndex), to = poseAt(stepIndex + 1);
    const movingFaces = new Set(faces.flatMap((face, i) =>
      face.some(v => from[v].distanceToSquared(to[v]) > 1e-14) ? [i] : []));
    const guides: FoldGuide[] = t >= 6 ? [] : (stepIndex < 4
      ? [[2,0,9],[0,3,7],[1,2,4],[3,1,6],[2,3,1]]
      : [[2,3,1]]).map(([a,b,point], i) => ({
        type: stepIndex < 4 && i === 4 ? 'valley' : 'mountain',
        axisLine: [positions[a].clone(), positions[b].clone()],
        arrowPath: Array.from({ length: 17 }, (_, sample) => poseAt(stepIndex + sample / 16)[point]),
      }));
    return { positions, stepIndex, fraction, guides, movingFaces };
  }
  return { model, stateAt, poseAt };
}

export const roseTwistStudy = createRoseTwistStudy();
