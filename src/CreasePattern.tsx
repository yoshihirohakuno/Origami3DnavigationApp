import { computeFoldState } from './engine/fold';
import type { OrigamiModel, FoldType } from './engine/types';

/** 折り種類ごとの表示色(UI全体で共通) */
export const FOLD_COLORS: Record<FoldType, string> = {
  valley: '#38bdf8',
  mountain: '#f43f5e',
  unfold: '#94a3b8',
  'inside-reverse': '#f59e0b',
  'outside-reverse': '#a78bfa',
};

/** 折り種類ごとの破線パターン(折り図の記法に準拠:谷=破線、山=一点鎖線) */
const FOLD_DASH: Record<FoldType, string | undefined> = {
  valley: '4 3',
  mountain: '6 2.5 1.5 2.5',
  unfold: '2 3',
  'inside-reverse': '4 3',
  'outside-reverse': '6 2.5 1.5 2.5',
};

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: 'boundary' | 'crease' | FoldType;
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

/** 展開図の全エッジを「輪郭/折り線(種類つき)」に分類する */
export function buildSegments(model: OrigamiModel): Segment[] {
  // 辺の出現回数を数える(1回=紙の輪郭、2回=折り線)
  const count = new Map<string, number>();
  for (const face of model.faces) {
    for (let i = 0; i < face.length; i++) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    }
  }
  const segs: Segment[] = [];
  for (const [key, n] of count) {
    const [a, b] = key.split('-').map(Number);
    const pa = model.vertices[a];
    const pb = model.vertices[b];
    let kind: Segment['kind'] = n === 1 ? 'boundary' : 'crease';
    if (n > 1) {
      // どの折りの折り線上にあるかで種類を決める
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

function segColor(kind: Segment['kind']): string {
  if (kind === 'boundary') return '#8b8e98';
  if (kind === 'crease') return '#4a4e58';
  return FOLD_COLORS[kind];
}

/**
 * 作品の工程データから展開図(folding diagram)をSVGで描く。
 * サムネイルとして使う:谷=シアン破線、山=ローズ一点鎖線、
 * 中割り=琥珀、かぶせ=菫。
 */
export function CreasePattern({ model, size = 96 }: { model: OrigamiModel; size?: number }) {
  const segs = buildSegments(model);
  const sx = (x: number) => 50 + x * 42;
  const sy = (y: number) => 50 - y * 42;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {segs.map((s, i) => (
        <line
          key={i}
          x1={sx(s.x1)}
          y1={sy(s.y1)}
          x2={sx(s.x2)}
          y2={sy(s.y2)}
          stroke={segColor(s.kind)}
          strokeWidth={s.kind === 'boundary' ? 1.4 : 1}
          strokeDasharray={s.kind === 'boundary' || s.kind === 'crease' ? undefined : FOLD_DASH[s.kind]}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function projectedArea(points: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/** 鶴だけは折り計算の投影ではなく、完成後として読める専用シルエットを使う */
export function CraneFinalPreview({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <polygon points="18,56 44,42 38,58" fill="#fbfaf7" stroke="#25262c" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="38,52 58,30 77,61 53,76" fill="#eda6a2" stroke="#25262c" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="44,52 32,87 58,72" fill="#f5c2bd" stroke="#25262c" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="54,43 68,22 83,18 73,29 83,35 67,34" fill="#eda6a2" stroke="#25262c" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M38 52 L54 43 L53 76 Z" fill="#fbfaf7" stroke="#25262c" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M31 60 C43 65 55 65 67 60" fill="none" stroke="#25262c" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

/** 作品カード用:工程を最後まで適用した完成形をSVGで描く */
export function FinalShapePreview({ model, size = 96 }: { model: OrigamiModel; size?: number }) {
  if (model.id === 'crane') return <CraneFinalPreview size={size} />;

  const state = computeFoldState(model, model.steps.length);
  const used = new Set<number>();
  for (const face of model.faces) {
    for (const vi of face) used.add(vi);
  }
  const points = [...used].map((vi) => state.positions[vi]);
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = 72 / Math.max(maxX - minX, maxY - minY, 0.001);
  const sx = (x: number) => 50 + (x - cx) * scale;
  const sy = (y: number) => 50 - (y - cy) * scale;

  const faces = model.faces
    .map((face, index) => {
      const ps = face.map((vi) => state.positions[vi]);
      const projected = ps.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
      const area = Math.abs(projectedArea(projected));
      const p0 = ps[0];
      const p1 = ps[1];
      const p2 = ps[2];
      const nz =
        (p1.x - p0.x) * (p2.y - p0.y) -
        (p1.y - p0.y) * (p2.x - p0.x);
      return {
        index,
        area,
        front: nz >= 0,
        z: ps.reduce((sum, p) => sum + p.z, 0) / ps.length,
        points: projected.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      };
    })
    .filter((face) => face.area > 0.1)
    .sort((a, b) => a.z - b.z);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {faces.map((face) => (
        <polygon
          key={face.index}
          points={face.points}
          fill={face.front ? '#eda6a2' : '#fbfaf7'}
          stroke="#25262c"
          strokeWidth="0.85"
          strokeLinejoin="round"
        />
      ))}
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
