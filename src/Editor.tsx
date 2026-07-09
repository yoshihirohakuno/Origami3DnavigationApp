import { useEffect, useRef, useState } from 'react';
import type { OrigamiModel, FoldOp, FoldType } from './engine/types';
import { computeFoldState } from './engine/fold';
import { splitFacesByLine } from './engine/split';
import { PaperScene } from './three/PaperScene';
import { buildSegments, FOLD_COLORS } from './CreasePattern';
import { tulipModel } from './models/tulip';
import { dogModel } from './models/dog';
import { cupModel } from './models/cup';
import { birdModel } from './models/bird';
import { squareBaseModel } from './models/squareBase';

const PRESETS: OrigamiModel[] = [tulipModel, dogModel, cupModel, birdModel, squareBaseModel];

const TYPE_LABEL: Record<FoldType, string> = {
  valley: '谷折り',
  mountain: '山折り',
  unfold: '開く',
  'inside-reverse': '中割り折り',
  'outside-reverse': 'かぶせ折り',
  assemble: '組み立て',
};

/** 空の新規モデル(一辺2のひし形) */
const EMPTY_MODEL: OrigamiModel = {
  id: 'untitled',
  name: { ja: '無題', en: 'Untitled' },
  difficulty: 1,
  vertices: [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ],
  faces: [[0, 1, 2, 3]],
  steps: [],
};

type Point = [number, number];

/**
 * 工程データ作成ツール(β)。
 * 左:工程ビルダー/JSONタブ、中:展開図(頂点選択・折り線分割)、右:3Dプレビュー。
 */
export function Editor({ onExit }: { onExit: () => void }) {
  const [model, setModel] = useState<OrigamiModel>(tulipModel);
  const [text, setText] = useState(() => JSON.stringify(tulipModel, null, 2));
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'steps' | 'json'>('steps');
  const [mode, setMode] = useState<'pick' | 'line'>('pick');
  const [picked, setPicked] = useState<number[]>([]);
  const [linePts, setLinePts] = useState<Point[]>([]);
  const [tUi, setTUi] = useState(0);
  // 工程ドラフト
  const [draftFolds, setDraftFolds] = useState<FoldOp[]>([]);
  const [draftAxis, setDraftAxis] = useState<[number, number] | null>(null);
  const [draftMoving, setDraftMoving] = useState<number[]>([]);
  const [draftType, setDraftType] = useState<FoldType>('valley');
  const [draftAngle, setDraftAngle] = useState(175);
  const [draftSweep, setDraftSweep] = useState<'front' | 'back'>('front');
  const [descJa, setDescJa] = useState('');
  const [descEn, setDescEn] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const tRef = useRef(0);
  const modelRef = useRef(model);
  const historyRef = useRef<OrigamiModel[]>([]);

  useEffect(() => {
    const scene = new PaperScene(canvasRef.current!);
    sceneRef.current = scene;
    scene.setModel(modelRef.current);
    let raf = 0;
    const loop = () => {
      scene.update(computeFoldState(modelRef.current, tRef.current));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  /** モデルを差し替えて全ビュー(3D・JSON)を同期する */
  const applyModel = (m: OrigamiModel, pushHistory = true) => {
    if (pushHistory) {
      historyRef.current.push(modelRef.current);
      if (historyRef.current.length > 30) historyRef.current.shift();
    }
    setModel(m);
    modelRef.current = m;
    sceneRef.current?.setModel(m);
    setText(JSON.stringify(m, null, 2));
    tRef.current = Math.min(tRef.current, m.steps.length);
    setTUi(tRef.current);
    setError('');
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (prev) applyModel(prev, false);
  };

  const applyJson = () => {
    try {
      const m = JSON.parse(text) as OrigamiModel;
      if (!Array.isArray(m.vertices) || !Array.isArray(m.faces) || !Array.isArray(m.steps)) {
        throw new Error('vertices / faces / steps は必須です');
      }
      const nv = m.vertices.length;
      m.faces.forEach((f, i) => {
        if (f.length < 3) throw new Error(`faces[${i}] は3頂点以上必要です`);
        f.forEach((v) => {
          if (!Number.isInteger(v) || v < 0 || v >= nv)
            throw new Error(`faces[${i}] の頂点番号 ${v} が範囲外です`);
        });
      });
      m.steps.forEach((s, i) => {
        if (!Array.isArray(s.folds) || s.folds.length === 0)
          throw new Error(`steps[${i}] に folds がありません`);
        s.folds.forEach((op) => {
          [...op.axis, ...op.moving].forEach((v) => {
            if (!Number.isInteger(v) || v < 0 || v >= nv)
              throw new Error(`steps[${i}] の頂点番号 ${v} が範囲外です`);
          });
        });
      });
      applyModel(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const loadPreset = (id: string) => {
    const preset = id === 'empty' ? EMPTY_MODEL : PRESETS.find((p) => p.id === id);
    if (!preset) return;
    historyRef.current = [];
    setPicked([]);
    setLinePts([]);
    setDraftFolds([]);
    setDraftAxis(null);
    setDraftMoving([]);
    applyModel(preset, false);
  };

  // ---- 折り線ツール ----
  const splitByLine = () => {
    if (linePts.length !== 2) return;
    applyModel(splitFacesByLine(modelRef.current, linePts[0], linePts[1]));
    setLinePts([]);
  };

  // ---- 工程ビルダー ----
  const addFoldToDraft = () => {
    if (!draftAxis) return;
    const op: FoldOp = {
      axis: draftAxis,
      moving: draftMoving,
      type: draftType,
      angle: draftAngle,
      ...(draftType === 'inside-reverse' || draftType === 'outside-reverse'
        ? { sweep: draftSweep }
        : {}),
    };
    setDraftFolds((f) => [...f, op]);
    setDraftAxis(null);
    setDraftMoving([]);
    setPicked([]);
  };

  const addStep = () => {
    if (draftFolds.length === 0) return;
    const m = modelRef.current;
    const next: OrigamiModel = {
      ...m,
      steps: [
        ...m.steps,
        {
          folds: draftFolds,
          description: { ja: descJa || '(説明未入力)', en: descEn || '(no description)' },
        },
      ],
    };
    applyModel(next);
    setDraftFolds([]);
    setDescJa('');
    setDescEn('');
    tRef.current = next.steps.length;
    setTUi(next.steps.length);
  };

  const deleteStep = (i: number) => {
    const m = modelRef.current;
    applyModel({ ...m, steps: m.steps.filter((_, k) => k !== i) });
  };

  const moveStep = (i: number, dir: -1 | 1) => {
    const m = modelRef.current;
    const j = i + dir;
    if (j < 0 || j >= m.steps.length) return;
    const steps = [...m.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    applyModel({ ...m, steps });
  };

  // ---- 展開図ビュー ----
  const total = model.steps.length;
  const stepIndex = total > 0 ? Math.min(Math.floor(tUi), total - 1) : 0;
  const segs = buildSegments(model);
  const sx = (x: number) => 150 + x * 118;
  const sy = (y: number) => 150 - y * 118;

  const onSheetClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'line') return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const sc = Math.min(rect.width, rect.height) / 300;
    const ox = (rect.width - 300 * sc) / 2;
    const oy = (rect.height - 300 * sc) / 2;
    const px = (e.clientX - rect.left - ox) / sc;
    const py = (e.clientY - rect.top - oy) / sc;
    let x = (px - 150) / 118;
    let y = (150 - py) / 118;
    // 近くの頂点にスナップ
    for (const [vx, vy] of model.vertices) {
      if (Math.hypot(vx - x, vy - y) < 0.06) {
        x = vx;
        y = vy;
        break;
      }
    }
    x = Math.round(x * 1000) / 1000;
    y = Math.round(y * 1000) / 1000;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    setLinePts((pts) => (pts.length >= 2 ? [[x, y]] : [...pts, [x, y]]));
  };

  const setLineCoord = (pi: number, ci: number, v: number) => {
    setLinePts((pts) => pts.map((p, i) => (i === pi ? ((p.map((c, j) => (j === ci ? v : c)) as unknown) as Point) : p)));
  };

  // 折り線プレビュー(直線を viewBox の端まで延長)
  const linePreview =
    linePts.length === 2
      ? (() => {
          const [a, b] = linePts;
          const d: Point = [b[0] - a[0], b[1] - a[1]];
          const len = Math.hypot(d[0], d[1]) || 1;
          const u: Point = [d[0] / len, d[1] / len];
          return {
            x1: sx(a[0] - u[0] * 4),
            y1: sy(a[1] - u[1] * 4),
            x2: sx(a[0] + u[0] * 4),
            y2: sy(a[1] + u[1] * 4),
          };
        })()
      : null;

  return (
    <div className="screen editor-screen">
      <header className="nav-header editor-header">
        <button className="icon-btn" onClick={onExit} aria-label="ライブラリへ戻る">
          ←
        </button>
        <div className="nav-title">
          <strong className="serif">
            工程データ作成 <em>MODEL EDITOR (β)</em>
          </strong>
          <span>
            {model.name.ja} ・ 頂点{model.vertices.length} ・ 面{model.faces.length} ・ 工程{total}
          </span>
        </div>
        <button className="btn-sub" onClick={undo} disabled={historyRef.current.length === 0}>
          元に戻す<em>UNDO</em>
        </button>
        <select
          className="preset-select"
          defaultValue={tulipModel.id}
          onChange={(e) => loadPreset(e.target.value)}
          aria-label="プリセット読込 / Load preset"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.ja} / {p.name.en}
            </option>
          ))}
          <option value="empty">新規(正方形) / New</option>
        </select>
      </header>

      <div className="editor-body">
        <section className="ed-left">
          <div className="ed-tabs">
            <button className={tab === 'steps' ? 'on' : ''} onClick={() => setTab('steps')}>
              工程 STEPS
            </button>
            <button className={tab === 'json' ? 'on' : ''} onClick={() => setTab('json')}>
              JSON
            </button>
          </div>

          {tab === 'json' ? (
            <>
              <textarea
                className="ed-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                aria-label="モデルJSON"
              />
              <div className="ed-json-foot">
                <button className="btn-main primary" onClick={applyJson}>
                  反映<em>APPLY</em>
                </button>
                <button className="btn-sub" onClick={() => navigator.clipboard.writeText(text)}>
                  コピー<em>COPY</em>
                </button>
                {error && <p className="ed-error">⚠ {error}</p>}
              </div>
            </>
          ) : (
            <div className="ed-steps">
              <ol className="ed-step-list">
                {model.steps.map((s, i) => (
                  <li key={i}>
                    <span className="sl-num">{String(i + 1).padStart(2, '0')}</span>
                    <i className={`sl-dot ${s.folds[0].type}`} />
                    <span className="ed-step-text">
                      {s.description.ja}
                      <em>
                        {s.folds
                          .map((f) => `${TYPE_LABEL[f.type]} [${f.axis.join(',')}] ${f.angle}°`)
                          .join(' + ')}
                      </em>
                    </span>
                    <span className="ed-step-ops">
                      <button onClick={() => moveStep(i, -1)} aria-label="上へ">
                        ↑
                      </button>
                      <button onClick={() => moveStep(i, 1)} aria-label="下へ">
                        ↓
                      </button>
                      <button onClick={() => deleteStep(i)} aria-label="削除">
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
                {model.steps.length === 0 && <li className="ed-empty">工程はまだありません</li>}
              </ol>

              <div className="ed-draft">
                <p className="panel-label">
                  NEW STEP <span>・ 新しい工程</span>
                </p>
                {draftFolds.length > 0 && (
                  <ul className="ed-draft-folds">
                    {draftFolds.map((f, i) => (
                      <li key={i}>
                        <i className={`sl-dot ${f.type}`} />
                        {TYPE_LABEL[f.type]} 軸[{f.axis.join(',')}] 動[{f.moving.join(',')}] {f.angle}°
                        <button onClick={() => setDraftFolds((d) => d.filter((_, k) => k !== i))}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="ed-form-row">
                  <button
                    className="btn-sub"
                    disabled={picked.length !== 2}
                    onClick={() => {
                      setDraftAxis([picked[0], picked[1]]);
                      setPicked([]);
                    }}
                  >
                    軸←選択<em>AXIS</em>
                  </button>
                  <code>{draftAxis ? `[${draftAxis.join(', ')}]` : '軸: 2頂点を選択'}</code>
                </div>
                <div className="ed-form-row">
                  <button
                    className="btn-sub"
                    disabled={picked.length === 0}
                    onClick={() => {
                      setDraftMoving(picked);
                      setPicked([]);
                    }}
                  >
                    動く頂点←選択<em>MOVING</em>
                  </button>
                  <code>{draftMoving.length ? `[${draftMoving.join(', ')}]` : '動く側の頂点を選択'}</code>
                </div>
                <div className="ed-form-row">
                  <select value={draftType} onChange={(e) => setDraftType(e.target.value as FoldType)}>
                    {(Object.keys(TYPE_LABEL) as FoldType[]).map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={draftAngle}
                    min={1}
                    max={180}
                    onChange={(e) => setDraftAngle(Number(e.target.value))}
                    aria-label="角度"
                  />
                  <span className="ed-unit">°</span>
                  {(draftType === 'inside-reverse' || draftType === 'outside-reverse') && (
                    <select value={draftSweep} onChange={(e) => setDraftSweep(e.target.value as 'front' | 'back')}>
                      <option value="front">手前へ回す</option>
                      <option value="back">後ろへ回す</option>
                    </select>
                  )}
                  <button className="btn-sub" disabled={!draftAxis} onClick={addFoldToDraft}>
                    折りを追加<em>ADD FOLD</em>
                  </button>
                </div>
                <input
                  className="ed-text"
                  placeholder="説明(日本語)"
                  value={descJa}
                  onChange={(e) => setDescJa(e.target.value)}
                />
                <input
                  className="ed-text"
                  placeholder="Description (English)"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                />
                <button className="btn-main primary ed-add-step" disabled={draftFolds.length === 0} onClick={addStep}>
                  工程を追加<em>ADD STEP</em>
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="ed-sheet">
          <div className="sheet-toolbar">
            <button className={mode === 'pick' ? 'on' : ''} onClick={() => setMode('pick')}>
              選択 PICK
            </button>
            <button className={mode === 'line' ? 'on' : ''} onClick={() => setMode('line')}>
              折り線 CREASE
            </button>
            {mode === 'line' && (
              <span className="sheet-hint">2点クリックで直線を指定 → 面を分割</span>
            )}
          </div>
          <svg viewBox="0 0 300 300" className="sheet-svg" onClick={onSheetClick}>
            {model.faces.map((f, i) => (
              <polygon
                key={`f${i}`}
                points={f.map((v) => `${sx(model.vertices[v][0])},${sy(model.vertices[v][1])}`).join(' ')}
                fill="rgba(255,255,255,0.025)"
                stroke="none"
              />
            ))}
            {segs.map((s, i) => (
              <line
                key={`s${i}`}
                x1={sx(s.x1)}
                y1={sy(s.y1)}
                x2={sx(s.x2)}
                y2={sy(s.y2)}
                stroke={
                  s.kind === 'boundary' ? '#8b8e98' : s.kind === 'crease' ? '#4a4e58' : FOLD_COLORS[s.kind]
                }
                strokeWidth={s.kind === 'boundary' ? 1.6 : 1.1}
                strokeDasharray={s.kind === 'boundary' || s.kind === 'crease' ? undefined : '5 3.5'}
              />
            ))}
            {linePreview && (
              <line
                x1={linePreview.x1}
                y1={linePreview.y1}
                x2={linePreview.x2}
                y2={linePreview.y2}
                stroke="var(--accent)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
            {linePts.map(([x, y], i) => (
              <rect
                key={`lp${i}`}
                x={sx(x) - 3}
                y={sy(y) - 3}
                width={6}
                height={6}
                fill="var(--accent)"
                transform={`rotate(45 ${sx(x)} ${sy(y)})`}
              />
            ))}
            {model.vertices.map(([x, y], i) => (
              <g
                key={`v${i}`}
                className={`sheet-vertex${picked.includes(i) ? ' picked' : ''}`}
                onClick={(e) => {
                  if (mode !== 'pick') return;
                  e.stopPropagation();
                  setPicked((p) => (p.includes(i) ? p.filter((k) => k !== i) : [...p, i]));
                }}
              >
                <circle cx={sx(x)} cy={sy(y)} r={6} />
                <text x={sx(x) + 8} y={sy(y) - 7}>
                  {i}
                </text>
              </g>
            ))}
          </svg>
          <div className="picked-bar">
            {mode === 'pick' ? (
              <>
                <code>[{picked.join(', ')}]</code>
                <button
                  className="btn-sub"
                  onClick={() => navigator.clipboard.writeText(`[${picked.join(', ')}]`)}
                >
                  コピー<em>COPY</em>
                </button>
                <button className="btn-sub" onClick={() => setPicked([])}>
                  クリア<em>CLEAR</em>
                </button>
              </>
            ) : (
              <>
                {linePts.map(([x, y], pi) => (
                  <span key={pi} className="line-coord">
                    P{pi + 1}
                    <input
                      type="number"
                      step={0.001}
                      value={x}
                      onChange={(e) => setLineCoord(pi, 0, Number(e.target.value))}
                    />
                    <input
                      type="number"
                      step={0.001}
                      value={y}
                      onChange={(e) => setLineCoord(pi, 1, Number(e.target.value))}
                    />
                  </span>
                ))}
                <button className="btn-main primary ed-split" disabled={linePts.length !== 2} onClick={splitByLine}>
                  面を分割<em>SPLIT</em>
                </button>
                <button className="btn-sub" onClick={() => setLinePts([])}>
                  クリア<em>CLEAR</em>
                </button>
              </>
            )}
          </div>
        </section>

        <section className="ed-3d">
          <canvas ref={canvasRef} />
          <div className="ed-3d-foot">
            <p className="step-label">
              {total > 0
                ? `STEP ${String(stepIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')} — ${model.steps[stepIndex]?.description.ja ?? ''}`
                : 'NO STEPS'}
            </p>
            <input
              className="timeline"
              type="range"
              min={0}
              max={Math.max(total, 0.01)}
              step={0.01}
              value={tUi}
              onChange={(e) => {
                const v = Number(e.target.value);
                tRef.current = v;
                setTUi(v);
              }}
              aria-label="タイムライン / Timeline"
              style={{
                backgroundImage: `linear-gradient(to right, var(--accent) ${(tUi / Math.max(total, 0.01)) * 100}%, var(--border) ${(tUi / Math.max(total, 0.01)) * 100}%)`,
                backgroundSize: '100% 2px',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
