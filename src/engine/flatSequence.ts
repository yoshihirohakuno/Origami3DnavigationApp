import type { FoldOp, FoldStep, LocalizedText, OrigamiModel } from './types';
import { withRigidFolds } from './rigidFolds';

type Point = [number, number];
export interface FlatMove {
  line: [Point, Point];
  side: 1 | -1;
  type?: 'valley' | 'mountain' | 'unfold' | 'assemble';
}
interface FlatStep {
  moves: FlatMove[];
  description: LocalizedText;
  caution?: LocalizedText;
}
interface Panel {
  points: { initial: Point; current: Point }[];
  history: number[];
}
const EPS = 1e-9;

/** Author ordinary flat folds in the coordinates visible at that step.
 * Every later crease is pulled back into the original paper by interpolation.
 * Thus animation rotates complete panels, including all later crease vertices.
 * This is for convex paper and whole-stack folds, not squash/reverse/pocket folds.
 * An unfold step must immediately undo a single fold from the previous step.
 */
export function flatSequence(
  metadata: Pick<OrigamiModel, 'id' | 'name' | 'difficulty' | 'sheetColors'>,
  outline: Point[], whiteUp: boolean, sequence: FlatStep[],
): OrigamiModel {
  let panels: Panel[] = [{ points: outline.map(p => ({ initial: [...p], current: [...p] })), history: [] }];
  const operations: FlatMove[] = [];
  const stepOps: number[][] = [];
  for (const step of sequence) {
    const indices: number[] = [];
    for (const move of step.moves) {
      const index = operations.length;
      operations.push(move); indices.push(index);
      const [a, b] = move.line, dx = b[0] - a[0], dy = b[1] - a[1], d2 = dx * dx + dy * dy;
      if (d2 < EPS) throw new Error(`${metadata.id}: empty crease`);
      const signed = (p: Point) => dx * (p[1] - a[1]) - dy * (p[0] - a[0]);
      const reflect = (p: Point): Point => {
        const s = signed(p) / d2;
        return [p[0] + 2 * dy * s, p[1] - 2 * dx * s];
      };
      panels = panels.flatMap(panel => {
        const signs = panel.points.map(p => signed(p.current));
        const crosses = signs.some(s => s > EPS) && signs.some(s => s < -EPS);
        const pieces: Panel[] = [];
        if (crosses && move.type !== 'assemble') {
          for (const half of [1, -1]) {
            const points: Panel['points'] = [];
            panel.points.forEach((p, i) => {
              const j = (i + 1) % panel.points.length, q = panel.points[j];
              if (half * signs[i] >= -EPS) points.push(p);
              if (signs[i] * signs[j] < -EPS * EPS) {
                const t = signs[i] / (signs[i] - signs[j]);
                const mix = (u: Point, v: Point): Point => [u[0] + t * (v[0] - u[0]), u[1] + t * (v[1] - u[1])];
                points.push({ initial: mix(p.initial, q.initial), current: mix(p.current, q.current) });
              }
            });
            pieces.push({ points, history: panel.history });
          }
        } else pieces.push(panel);
        return pieces.map(piece => {
          const moving = move.type === 'unfold' ? piece.history.includes(index - 1)
            : move.type === 'assemble' || piece.points.some(p => move.side * signed(p.current) > EPS);
          return moving ? {
            points: piece.points.map(p => ({ initial: p.initial, current: reflect(p.current) })),
            history: [...piece.history, index],
          } : piece;
        });
      });
    }
    stepOps.push(indices);
  }
  const model: OrigamiModel = { ...metadata, vertices: [], faces: [], steps: [] };
  const moving = operations.map(() => [] as number[]);
  for (const panel of panels) {
    const face = panel.points.map(p => {
      const vi = model.vertices.length;
      model.vertices.push(p.initial);
      for (const op of panel.history) moving[op].push(vi);
      return vi;
    });
    model.faces.push(whiteUp ? face.reverse() : face);
  }
  if (model.sheetColors) model.faceSheet = model.faces.map(() => 0);
  const folds: FoldOp[] = operations.map((op, i) => {
    const a = model.vertices.length;
    model.vertices.push(...op.line);
    return { axis: [a, a + 1], moving: moving[i], type: op.type ?? 'valley', angle: 180,
      ...(op.type === 'assemble' ? { direction: 1 as const } : {}) };
  });
  model.steps = sequence.map((step, i): FoldStep => ({
    description: step.description, caution: step.caution, folds: stepOps[i].map(j => folds[j]),
  }));
  return withRigidFolds(model);
}
