import type { ReactElement } from 'react';
import { computeFoldState } from './engine/fold';
import type { OrigamiModel, FoldType } from './engine/types';

/** 折り種類ごとの表示色(UI全体で共通) */
export const FOLD_COLORS: Record<FoldType, string> = {
  valley: '#38bdf8',
  mountain: '#f43f5e',
  unfold: '#94a3b8',
  'inside-reverse': '#f59e0b',
  'outside-reverse': '#a78bfa',
  assemble: '#c084fc',
};

/** 折り種類ごとの破線パターン(折り図の記法に準拠:谷=破線、山=一点鎖線) */
const FOLD_DASH: Record<FoldType, string | undefined> = {
  valley: '4 3',
  mountain: '6 2.5 1.5 2.5',
  unfold: '2 3',
  'inside-reverse': '4 3',
  'outside-reverse': '6 2.5 1.5 2.5',
  assemble: undefined,
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

/** 手裏剣だけは組み上げ星形を専用シルエットで描く(朱×藍の風車状4つ尖り) */
export function ShurikenFinalPreview({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // 上向きの風車ブレードを90°ずつ回して4枚。対で朱/藍に塗り分ける。
  const blade = '50,50 67,45 50,7 46,43';
  const colors = ['#e0492f', '#2f4b7c', '#e0492f', '#2f4b7c'];
  return (
    <svg className={className} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {colors.map((c, i) => (
        <polygon
          key={i}
          points={blade}
          fill={c}
          stroke="#25262c"
          strokeWidth="1.2"
          strokeLinejoin="round"
          transform={`rotate(${i * 90} 50 50)`}
        />
      ))}
      <rect
        x="44"
        y="44"
        width="12"
        height="12"
        transform="rotate(45 50 50)"
        fill="#1c1d22"
        stroke="#25262c"
        strokeWidth="1"
      />
    </svg>
  );
}

/** 紙の色の既定値(PaperScene の COLOR_FRONT / COLOR_BACK と合わせる) */
const PAPER_FRONT = '#eda6a2';
const PAPER_BACK = '#fbfaf7';

type Point3 = { x: number; y: number; z: number };
/** 平行投影の視点(視点座標の3軸)。null なら真正面(xy をそのまま使う) */
type View = { xAxis: number[]; yAxis: number[]; zAxis: number[] } | null;
/** SVG(100×100)への収め方。全工程で共通にすると紙の大きさが跳ねない */
interface Frame {
  cx: number;
  cy: number;
  scale: number;
}

/** 面に使われている頂点の一覧(展開図には使わない頂点が混ざることがある) */
function usedVertices(model: OrigamiModel): number[] {
  const used = new Set<number>();
  for (const face of model.faces) {
    for (const vi of face) used.add(vi);
  }
  return [...used];
}

/**
 * 立体の作品(箱・コップ)は真正面から見ると平らな四角にしか見えないので、
 * ナビ画面の既定カメラ(cameraPos を cameraAngle で水平回転)と同じ向きから
 * 平行投影する。平畳みの作品は真正面(xy そのまま)。
 * 完成形の z の広がりで判定し、工程の途中でも同じ視点を使う。
 */
function viewFor(model: OrigamiModel): View {
  const state = computeFoldState(model, model.steps.length);
  const zs = usedVertices(model).map((vi) => state.positions[vi].z);
  if (Math.max(...zs) - Math.min(...zs) <= 0.2) return null;
  const base = model.cameraPos ?? [0, -2.4, 4.0];
  const a = ((model.cameraAngle ?? 0) * Math.PI) / 180;
  // PaperScene.setViewAngle と同じ回転(垂直軸まわり)
  const eye = [
    base[0] * Math.cos(a) + base[2] * Math.sin(a),
    base[1],
    -base[0] * Math.sin(a) + base[2] * Math.cos(a),
  ];
  const norm = (v: number[]) => {
    const l = Math.hypot(...v) || 1;
    return v.map((c) => c / l);
  };
  const cross = (u: number[], v: number[]) => [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const zAxis = norm(eye); // 視線の逆向き(手前がプラス)
  const xAxis = norm(cross([0, 1, 0], zAxis));
  const yAxis = cross(zAxis, xAxis);
  return { xAxis, yAxis, zAxis };
}

/** 視点座標へ潰す(x=右, y=上) */
function flatten(p: Point3, view: View): { x: number; y: number } {
  return view
    ? {
        x: p.x * view.xAxis[0] + p.y * view.xAxis[1] + p.z * view.xAxis[2],
        y: p.x * view.yAxis[0] + p.y * view.yAxis[1] + p.z * view.yAxis[2],
      }
    : { x: p.x, y: p.y };
}

/** 奥から手前へ並べるための深さ(視点座標の z。平畳みならモデルの z) */
function depthOf(ps: Point3[], view: View): number {
  const d = view
    ? ps.map((p) => p.x * view.zAxis[0] + p.y * view.zAxis[1] + p.z * view.zAxis[2])
    : ps.map((p) => p.z);
  return d.reduce((s, v) => s + v, 0) / d.length;
}

/** 与えた状態(複数可)がすべて収まる枠を作る。fill は 100 のうち紙が占める幅 */
function frameFor(states: Point3[][], view: View, fill: number): Frame {
  const points = states.flat().map((p) => flatten(p, view));
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    scale: fill / Math.max(maxX - minX, maxY - minY, 0.001),
  };
}

const toSvgX = (x: number, frame: Frame) => 50 + (x - frame.cx) * frame.scale;
const toSvgY = (y: number, frame: Frame) => 50 - (y - frame.cy) * frame.scale;

/** 紙をSVGのポリゴン列にする(奥から手前の順。表裏で色を変える) */
function polygonsOf(
  model: OrigamiModel,
  positions: Point3[],
  view: View,
  frame: Frame,
  edge: { color: string; width: number } = { color: '#25262c', width: 0.85 },
): ReactElement[] {
  // 作品ごとの紙色(sheetColors)を使う。ハート・箱・くじら・兜などは
  // 既定の「薄い赤/白」ではないので、既定色のままだと完成形が無色に見える
  const sheetColorOf = (faceIndex: number): { front: string; back: string } => {
    const sheet = model.faceSheet?.[faceIndex] ?? 0;
    return model.sheetColors?.[sheet] ?? { front: PAPER_FRONT, back: PAPER_BACK };
  };

  return model.faces
    .map((face, index) => {
      const ps = face.map((vi) => positions[vi]);
      const fp = ps.map((p) => flatten(p, view)); // 視点座標
      const projected = fp.map((p) => ({ x: toSvgX(p.x, frame), y: toSvgY(p.y, frame) }));
      const area = Math.abs(projectedArea(projected));
      // 視点から見た表裏(視点座標での回り方)
      const nz =
        (fp[1].x - fp[0].x) * (fp[2].y - fp[0].y) - (fp[1].y - fp[0].y) * (fp[2].x - fp[0].x);
      const colors = sheetColorOf(index);
      return {
        index,
        area,
        fill: nz >= 0 ? colors.front : colors.back,
        depth: depthOf(ps, view),
        points: projected.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      };
    })
    .filter((face) => face.area > 0.1)
    .sort((a, b) => a.depth - b.depth)
    .map((face) => (
      <polygon
        key={face.index}
        points={face.points}
        fill={face.fill}
        stroke={edge.color}
        strokeWidth={edge.width}
        strokeLinejoin="round"
      />
    ));
}

/** 作品カード用:工程を最後まで適用した完成形をSVGで描く */
export function FinalShapePreview({ model, size = 96 }: { model: OrigamiModel; size?: number }) {
  // 鶴は手描きSVGをやめて工程データから描く(2026-08-10)。15工程の完成形が
  // 実装済みで、立体なのでナビ画面と同じ視点から投影すれば実物と同じ形になる。
  // 手描きSVGは羽・首の形が実際の折りと違っていた
  if (model.id === 'shuriken') return <ShurikenFinalPreview size={size} />;

  const view = viewFor(model);
  const state = computeFoldState(model, model.steps.length);
  const positions = state.positions;
  const frame = frameFor([usedVertices(model).map((vi) => positions[vi])], view, 72);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {polygonsOf(model, positions, view, frame)}
    </svg>
  );
}

/**
 * 工程一覧用の折り図サムネイル。各工程を **折る前** の形(=その工程を押したとき
 * 画面に出る状態)で描き、これから折る線を折り種類の色と破線で重ねる。
 * 折り図と同じ「紙+これから入れる折り線」の見せ方になる。
 *
 * 枠(中心)は全工程で共通なので、一覧を上から下へ見ると紙が同じ場所で
 * 畳まれて小さくなっていくのが分かる。ただし畳んだ形が枠に対して小さく
 * なりすぎる作品(手裏剣は2枚を離して並べるので展開図が特に広い)では
 * 見えなくなるため、共通の縮尺の 2.2 倍までは工程ごとに寄る。
 *
 * 工程数ぶん computeFoldState を回すため、呼び出し側で作品ごとに1回だけ
 * 作って使い回すこと(ナビ画面は毎フレーム再描画されるため)。
 */
export function buildStepDiagrams(model: OrigamiModel, size = 44): ReactElement[] {
  const view = viewFor(model);
  // 各工程の「折る前」= t が 0..N-1 の状態。枠は完成形(t=N)も入れて決める
  const states = model.steps.map((_, i) => computeFoldState(model, i).positions);
  const finalPositions = computeFoldState(model, model.steps.length).positions;
  const used = usedVertices(model);
  const FILL = 82;
  const common = frameFor(
    [...states, finalPositions].map((ps) => used.map((vi) => ps[vi])),
    view,
    FILL,
  );

  return model.steps.map((step, i) => {
    const positions = states[i];
    // 共通の中心を保ったままこの工程の紙が枠いっぱいに入る縮尺(寄れる上限)
    const offset = used
      .map((vi) => flatten(positions[vi], view))
      .reduce((m, p) => Math.max(m, Math.abs(p.x - common.cx), Math.abs(p.y - common.cy)), 0.001);
    const frame: Frame = {
      cx: common.cx,
      cy: common.cy,
      scale: Math.min(FILL / 2 / offset, common.scale * 2.2),
    };
    const line = (p: Point3) => {
      const f = flatten(p, view);
      return { x: toSvgX(f.x, frame), y: toSvgY(f.y, frame) };
    };
    return (
      <svg key={i} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {/* 面の境目(=すでについている折りすじ)は細く薄く。小さいサムネイルでは
            事前分割の線まで濃く出ると網目に見えて形が読めなくなる */}
        {polygonsOf(model, positions, view, frame, { color: 'rgba(37,38,44,0.4)', width: 0.5 })}
        {step.folds.map((op, k) => {
          const a = line(positions[op.axis[0]]);
          const b = line(positions[op.axis[1]]);
          return (
            <line
              key={k}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={FOLD_COLORS[op.type]}
              strokeWidth="2.2"
              strokeDasharray={FOLD_DASH[op.type]}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  });
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
