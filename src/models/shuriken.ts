import type { FoldOp, FoldStep, OrigamiModel } from '../engine/types';
import { computeFoldState } from '../engine/fold';
import { mergeRigidPanels, withFlatLayers } from '../engine/flatLayers';

/**
 * 手裏剣: https://www.origami-club.com/fun/cross/zu.html
 * 白面から観音折り→半分→両端→端と直角の線で折り返す→裏返して配置→差し込む。
 * 2026-09-06: 旧版の❹は❸と平行で、❼❾は同じ翼を一回転させていた。
 * 実際は❹を直交する折り線で折り、❼❾ではできた三角の先端半分を折り込む。
 * 最終形の4頂点は (±h,∓3h)/(±3h,±h)、h=1/(4√2)。
 */
const V: [number, number][] = [];
const F: number[][] = [];
function id(x: number, y: number): number {
  const found = V.findIndex(p => Math.abs(p[0] - x) < 1e-8 && Math.abs(p[1] - y) < 1e-8);
  if (found >= 0) return found;
  V.push([x, y]);
  return V.length - 1;
}
// 両向きの対角線を用意。不要な分割は折り操作の確定後にmergeRigidPanelsで除く。
for (let x = -1; x < 1; x += 0.5) for (let y = -1; y < 1; y += 0.5) {
  const corners = [id(x, y), id(x + .5, y), id(x + .5, y + .5), id(x, y + .5)];
  const center = id(x + .25, y + .25);
  for (let i = 0; i < 4; i++) F.push([corners[i], corners[(i + 1) % 4], center]);
}

const captions: Pick<FoldStep, 'description' | 'caution'>[] = [
  { description: {
    ja: '2枚とも、左右のはしを中心線に合わせて折ります(かんのん折り)。',
    en: 'On both sheets, fold the left and right edges in to the center line.',
  }, caution: {
    ja: '2枚とも白い裏面を上にして始めます。色の面が外側になるように折ります。',
    en: 'Start with the white reverse side up on both sheets. The colored front will face outward.',
  } },
  { description: {
    ja: '中心線でさらに半分に折り、細い帯にします。',
    en: 'Fold in half again along the center line into a slim strip.',
  } },
  { description: {
    ja: '帯の上下のはしを斜め45°に折ります。2枚は左右対称(鏡写し)です。',
    en: 'Fold both ends of each strip at 45°. The two sheets mirror each other.',
  } },
  { description: {
    ja: '端の斜めのふちと直角になる折り線で、上下を反対向きに折り返します。',
    en: 'Fold the ends in opposite directions along creases perpendicular to the slanted edges.',
  }, caution: {
    ja: '2枚は鏡写しのまま。上下に三角がついた形になります。',
    en: 'Keep the units mirrored, with a triangle on each side.',
  } },
  { description: {
    ja: '朱をうらがえし、帯が縦になる向きで中央に置きます。',
    en: 'Flip the vermilion unit over and place it at the center with its band vertical.',
  } },
  { description: {
    ja: '藍の帯が横になるように向きを整え、朱の上に十字にかさねます。',
    en: 'Turn the indigo band horizontally and lay it across the vermilion one.',
  }, caution: {
    ja: '藍の折った三角が上を向いたまま。この下がポケットになります。',
    en: 'Keep the indigo folded triangles on top. The pockets are underneath them.',
  } },
  { description: {
    ja: '朱の三角の先を中央へ折り、藍のポケットへさしこみます。',
    en: 'Fold the vermilion triangular tips inward and tuck them into the indigo pockets.',
  }, caution: {
    ja: '三角の先端半分を折ります。',
    en: 'Fold the outer half of each triangle into its pocket.',
  } },
  { description: { ja: '全体をうらがえします。', en: 'Turn the whole piece over.' } },
  { description: {
    ja: '藍の三角の先も同じように朱へさしこんだら、手裏剣のできあがり。',
    en: 'Tuck the indigo triangular tips into the vermilion pockets to finish the shuriken.',
  }, caution: {
    ja: '向かい合う尖りが同じ色になり、中央で交互に重なります。',
    en: 'Opposite points share a color and the units interleave at the center.',
  } },
];

const unit: OrigamiModel = {
  id: 'unit', name: { ja: '', en: '' }, difficulty: 1, vertices: V, faces: F, steps: [],
};
function fold(a: [number, number], b: [number, number], predicate: (p: { x: number; y: number }) => boolean) {
  // 同時に折る上下・左右は、どちらも工程開始時の配置で選ぶ。
  const positions = computeFoldState(unit, unit.steps.length - 1).positions;
  unit.steps.at(-1)!.folds.push({
    axis: [id(...a), id(...b)], moving: positions.flatMap((p, i) => predicate(p) ? [i] : []),
    type: 'valley', angle: 180,
  });
}
unit.steps.push({ ...captions[0], folds: [] });
fold([-.5, 1], [-.5, -1], p => p.x < -.5 - 1e-8);
fold([.5, 1], [.5, -1], p => p.x > .5 + 1e-8);
unit.steps.push({ ...captions[1], folds: [] });
fold([0, 1], [0, -1], p => p.x < -1e-8);
unit.steps.push({ ...captions[2], folds: [] });
fold([0, 1], [.5, .5], p => p.x + p.y > 1 + 1e-8);
fold([0, -.5], [.5, -1], p => p.x + p.y < -.5 - 1e-8);
unit.steps.push({ ...captions[3], folds: [] });
fold([0, 0], [.5, .5], p => p.y - p.x > 1e-8);
fold([0, -.5], [.5, 0], p => p.y - p.x < -.5 - 1e-8);

const N = V.length;
const all = V.map((_, i) => i);
const source: OrigamiModel = {
  id: 'shuriken', name: { ja: '手裏剣', en: 'Shuriken' }, difficulty: 3,
  cameraAngle: 0, cameraPos: [0, -0.9, 4.6],
  vertices: [-1.2, 1.2].flatMap((offset, sheet) =>
    V.map(([x, y]): [number, number] => [offset + (sheet ? -x : x), y])),
  // 両方とも白面スタート。鏡映側だけ頂点の順番を戻す。
  faces: [...F.map(f => [...f].reverse()), ...F.map(f => f.map(i => i + N))],
  faceSheet: [...F.map(() => 0), ...F.map(() => 1)],
  sheetColors: [{ front: '#e0492f', back: '#f2ede3' }, { front: '#2f4b7c', back: '#f2ede3' }],
  steps: unit.steps.map(step => ({ ...step, folds: [
    ...step.folds,
    ...step.folds.map(op => ({ ...op, axis: op.axis.map(i => i + N) as [number, number],
      moving: op.moving.map(i => i + N) })),
  ] })),
};

function place(sheet: number, angle: number, spinZ: number, z: number) {
  const op: FoldOp = {
    axis: [id(0, 0) + sheet * N, id(0, -.5) + sheet * N], moving: all.map(i => i + sheet * N),
    type: 'assemble', angle, direction: 1, spinZ,
  };
  source.steps.push({ ...captions[source.steps.length], folds: [op] });
  const p = computeFoldState(source, source.steps.length).positions.slice(sheet * N, (sheet + 1) * N);
  op.translate = [
    -(Math.min(...p.map(v => v.x)) + Math.max(...p.map(v => v.x))) / 2,
    -(Math.min(...p.map(v => v.y)) + Math.max(...p.map(v => v.y))) / 2, z,
  ];
}
place(0, 180, -45, .0004);
place(1, 0, 45, .0028);

function tuck(sheet: number) {
  const p = computeFoldState(source, source.steps.length).positions;
  const folds: FoldOp[] = [[id(.5, .5), id(.5, 0)], [id(0, -.5), id(0, 0)]].map(ids => {
    const axis = ids.map(i => i + sheet * N) as [number, number];
    const a = p[axis[0]], b = p[axis[1]];
    const side = (v: { x: number; y: number }) => (b.x - a.x) * (v.y - a.y) - (b.y - a.y) * (v.x - a.x);
    const centerSide = side({ x: 0, y: 0 });
    return { axis, moving: all.map(i => i + sheet * N).filter(i => side(p[i]) * centerSide < -1e-8),
      type: 'valley', angle: 180 };
  });
  source.steps.push({ ...captions[source.steps.length], folds });
}
// うらがえす軸は紙面とは独立した縦軸。描画する面には使わない。
const flipAxis: [number, number] = [source.vertices.length, source.vertices.length + 1];
source.vertices.push([0, -.25], [0, .25]);
tuck(0);
source.steps.push({ ...captions[7], folds: [{
  axis: flipAxis, moving: all.concat(all.map(i => i + N)), type: 'assemble', angle: 180, direction: 1,
}] });
tuck(1);

// 0.02°の紙厚表現で中央の循環する層順を表す。ポケットの曲面変形は近似。
export const shurikenModel = withFlatLayers(mergeRigidPanels(source), [6, 8], 3);
