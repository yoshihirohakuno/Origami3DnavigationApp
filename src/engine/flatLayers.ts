import { computeFoldState } from './fold';
import type { FoldOp, FoldStep, OrigamiModel } from './types';

/**
 * 多層の平畳み用。各面を剛体として回し、折る束の層順を反転する。
 * 折り線上の点も層ごとに持つため、前の折りの厚みを取り残さない。
 * 軸に使う元頂点は厚みゼロの幾何、描画面は専用頂点で保持する。
 * 折る向きにある束の最外層を蝶番にし、180°回転後の高さを補う。
 * 現在は手裏剣専用。立体折り・袋つぶしには適用しない。
 */
export function withFlatLayers(source: OrigamiModel, tuckSteps: readonly number[], reliefStep?: number): OrigamiModel {
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
    const beforeStep = computeFoldState(model, model.steps.length).positions;
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

      // 先端の三角を180°折り、2枚の中間面を通ってポケットへ入れる。
      // 紙厚によるごく浅いV字を残す。最後の三角は直交する2束の傾きを打ち消し、
      // 中央が「片方の帯を重ねただけ」にならず、交互に重なるようにする。
      if (tuckSteps.includes(model.steps.length - 1)) {
        const sheet = source.faceSheet?.[affected[0]] ?? 0;
        const otherVertices = [...new Set(source.faces.flatMap((face, fi) =>
          (source.faceSheet?.[fi] ?? 0) !== sheet ? face : []))];
        const otherZ = otherVertices.reduce((sum, vi) => sum + positions[vi].z, 0) / otherVertices.length;
        compiled.folds.push(
          { ...fold, angle: 180, guide: false },
          { ...op, moving: layers, angle: 180 + Math.SQRT2 * 0.02, timing: [0, 0.9] },
          { axis: fold.axis, moving: layers, type: 'assemble', angle: 0, direction: 1,
            translate: [0, 0, otherZ - origin.z], guide: false, timing: [0.65, 1] },
        );
        continue;
      }

      if (fold.type !== 'assemble') {
        op.angle = 180;
        if (model.steps.length - 1 === reliefStep) {
          compiled.folds.push(
            { ...op, moving: fold.moving, guide: false },
            { ...op, moving: layers, angle: 179.98 },
          );
        } else compiled.folds.push(op);
        const sheets = new Set(affected.map(fi => source.faceSheet?.[fi] ?? 0));
        const heights = model.faces.flatMap((face, fi) =>
          sheets.has(source.faceSheet?.[fi] ?? 0) ? face.map(vi => beforeStep[vi].z) : []);
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

/** 同じ折りを受ける隣接三角形を一面にまとめ、作図用の格子を紙に表示しない。 */
export function mergeRigidPanels(source: OrigamiModel): OrigamiModel {
  const signatures = source.faces.map((_, fi) => `${source.faceSheet?.[fi] ?? 0}:`);
  source.steps.forEach((step, si) => {
    const positions = computeFoldState(source, si).positions;
    for (const op of step.folds) {
      if (op.type === 'assemble') continue;
      const moving = new Set(op.moving), origin = positions[op.axis[0]];
      const axis = positions[op.axis[1]].clone().sub(origin).normalize();
      source.faces.forEach((face, fi) => {
        signatures[fi] += face.some(vi => moving.has(vi) &&
          positions[vi].clone().sub(origin).cross(axis).length() > 1e-7) ? '1' : '0';
      });
    }
  });
  const groups = new Map<string, number[]>();
  signatures.forEach((key, fi) => groups.set(key, [...(groups.get(key) ?? []), fi]));
  const faces: number[][] = [], faceSheet: number[] = [];
  for (const group of groups.values()) {
    const edges = new Map<string, [number, number]>();
    for (const fi of group) source.faces[fi].forEach((a, i, face) => {
      const b = face[(i + 1) % face.length];
      if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]);
    });
    while (edges.size) {
      const first = edges.values().next().value!;
      const face = [first[0]];
      let current = first;
      do {
        edges.delete(`${current[0]},${current[1]}`);
        if (current[1] === face[0]) break;
        face.push(current[1]);
        const next = [...edges.values()].find(edge => edge[0] === current[1]);
        if (!next) throw new Error('Open boundary in rigid paper panel');
        current = next;
      } while (edges.size);
      faces.push(face);
      faceSheet.push(source.faceSheet?.[group[0]] ?? 0);
    }
  }
  return { ...source, faces, faceSheet };
}
