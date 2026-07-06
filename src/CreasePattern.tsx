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
