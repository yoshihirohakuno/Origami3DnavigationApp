import { computeFoldState } from './fold';
import type { FoldOp, FoldStep, OrigamiModel } from './types';

/**
 * 多層の平畳み用。各面を剛体として回し、折る束の層順を反転する。
 * 折り線上の点も層ごとに持つため、前の折りの厚みを取り残さない。
 * 軸に使う元頂点は厚みゼロの幾何、描画面は専用頂点で保持する。
 * 折る向きにある束の最外層を蝶番にし、180°回転後の高さを補う。
 * 現在は手裏剣専用。立体折り・袋つぶしには適用しない。
 */
export function withFlatLayers(source: OrigamiModel, tuckSteps: readonly number[]): OrigamiModel {
  const model: OrigamiModel = {
    ...source,
    vertices: source.vertices.map(p => [...p]),
    faces: [],
    steps: [],
  };
  model.faces = source.faces.map(face => face.map(vi => {
    model.vertices.push([...source.vertices[vi]]);
    return model.vertices.length - 1;
  }));

  for (const step of source.steps) {
    const compiled: FoldStep = { ...step, folds: [] };
    model.steps.push(compiled);
    for (const fold of step.folds) {
      const positions = computeFoldState(model, model.steps.length).positions;
      const origin = positions[fold.axis[0]];
      const axis = positions[fold.axis[1]].clone().sub(origin).normalize();
      const moving = new Set(fold.moving);
      const affected = source.faces.flatMap((face, fi) => {
        const rotates = face.some(vi => moving.has(vi) &&
          positions[vi].clone().sub(origin).cross(axis).length() > 1e-7);
        const translates = fold.type === 'assemble' && face.every(vi => moving.has(vi));
        return rotates || translates ? [fi] : [];
      });
      const layers = affected.flatMap(fi => model.faces[fi]);
      const op: FoldOp = { ...fold, moving: [...new Set([...fold.moving, ...layers])] };

      // 差し込みは翼を少し開いて閉じる。344°の一周回転をさせない。
      // ポケットの内部の変形は、この平面モデルでは小さな開閉で案内する。
      if (tuckSteps.includes(model.steps.length - 1)) {
        compiled.folds.push(
          { ...op, type: 'assemble', angle: 25, timing: [0, 0.45] },
          { ...op, type: 'assemble', angle: 25, direction: fold.direction === 1 ? -1 : 1,
            timing: [0.45, 1] },
        );
        continue;
      }

      if (fold.type !== 'assemble') {
        op.angle = 180;
        compiled.folds.push(op);
        const sheets = new Set(affected.map(fi => source.faceSheet?.[fi] ?? 0));
        const heights = model.faces.flatMap((face, fi) =>
          sheets.has(source.faceSheet?.[fi] ?? 0) ? face.map(vi => positions[vi].z) : []);
        const hinge = fold.type === 'valley'
          ? Math.max(...heights) + 0.0001
          : Math.min(...heights) - 0.0001;
        compiled.folds.push({
          axis: fold.axis, moving: layers, type: 'assemble', angle: 0,
          direction: 1, translate: [0, 0, 2 * (hinge - origin.z)], guide: false,
        });
      } else {
        compiled.folds.push(op);
      }
    }
  }
  return model;
}
