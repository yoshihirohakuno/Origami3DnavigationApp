import type { OrigamiModel } from './engine/types';

const VALLEY = '#38bdf8';
const MOUNTAIN = '#f43f5e';

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: 'boundary' | 'valley' | 'mountain' | 'crease';
}

/** 点pが直線(a-b)上にあるか(展開図2D) */
function onLine(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): boolean {
  const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  return Math.abs(cross) < 1e-6;
}

function buildSegments(model: OrigamiModel): Segment[] {
  // 辺の出現回数を数える(1回=紙の輪郭、2回=折り線)
  const count = new Map<string, [number, number]>();
  for (const face of model.faces) {
    for (let i = 0; i < face.length; i++) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const cur = count.get(key);
      count.set(key, cur ? [cur[0], cur[1] + 1] : [a < b ? a : b, 1]);
    }
  }
  const segs: Segment[] = [];
  for (const [key, [, n]] of count) {
    const [a, b] = key.split('-').map(Number);
    const pa = model.vertices[a];
    const pb = model.vertices[b];
    let kind: Segment['kind'] = n === 1 ? 'boundary' : 'crease';
    if (n > 1) {
      // どの折りの折り線上にあるかで山/谷の色を決める
      outer: for (const step of model.steps) {
        for (const op of step.folds) {
          const qa = model.vertices[op.axis[0]];
          const qb = model.vertices[op.axis[1]];
          if (onLine(pa, qa, qb) && onLine(pb, qa, qb)) {
            kind = op.type;
            break outer;
          }
        }
      }
    }
    segs.push({ x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1], kind });
  }
  return segs;
}

/**
 * 作品の工程データから展開図(folding diagram)をSVGで描く。
 * サムネイルとして使う:谷折り=シアン破線、山折り=ローズ一点鎖線。
 */
export function CreasePattern({ model, size = 96 }: { model: OrigamiModel; size?: number }) {
  const segs = buildSegments(model);
  const sx = (x: number) => 50 + x * 42;
  const sy = (y: number) => 50 - y * 42;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {segs.map((s, i) => {
        const stroke =
          s.kind === 'valley' ? VALLEY : s.kind === 'mountain' ? MOUNTAIN : s.kind === 'boundary' ? '#8b8e98' : '#4a4e58';
        const dash =
          s.kind === 'valley' ? '4 3' : s.kind === 'mountain' ? '6 2.5 1.5 2.5' : undefined;
        return (
          <line
            key={i}
            x1={sx(s.x1)}
            y1={sy(s.y1)}
            x2={sx(s.x2)}
            y2={sy(s.y2)}
            stroke={stroke}
            strokeWidth={s.kind === 'boundary' ? 1.4 : 1}
            strokeDasharray={dash}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** 準備中作品用の汎用展開図(正方形+対角線) */
export function GenericPattern({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x="15" y="15" width="70" height="70" fill="none" stroke="#4a4e58" strokeWidth="1.4" />
      <line x1="15" y1="15" x2="85" y2="85" stroke="#3a3d46" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="85" y1="15" x2="15" y2="85" stroke="#3a3d46" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="50" y1="15" x2="50" y2="85" stroke="#33363e" strokeWidth="1" strokeDasharray="6 2.5 1.5 2.5" />
    </svg>
  );
}
