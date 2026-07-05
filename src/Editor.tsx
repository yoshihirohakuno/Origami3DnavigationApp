import { useEffect, useRef, useState } from 'react';
import type { OrigamiModel } from './engine/types';
import { computeFoldState } from './engine/fold';
import { PaperScene } from './three/PaperScene';
import { buildSegments, FOLD_COLORS } from './CreasePattern';
import { tulipModel } from './models/tulip';
import { dogModel } from './models/dog';
import { cupModel } from './models/cup';
import { birdModel } from './models/bird';

const PRESETS: OrigamiModel[] = [tulipModel, dogModel, cupModel, birdModel];

/**
 * 工程データ作成ツール(β)。
 * 左:モデルJSONの編集 / 中:頂点番号つき展開図(クリックで番号を収集)/
 * 右:3Dライブプレビュー(タイムラインスライダー付き)。
 */
export function Editor({ onExit }: { onExit: () => void }) {
  const [text, setText] = useState(() => JSON.stringify(tulipModel, null, 2));
  const [model, setModel] = useState<OrigamiModel>(tulipModel);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [tUi, setTUi] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const tRef = useRef(0);
  const modelRef = useRef(model);

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

  const applyModel = (m: OrigamiModel) => {
    setModel(m);
    modelRef.current = m;
    sceneRef.current?.setModel(m);
    tRef.current = Math.min(tRef.current, m.steps.length);
    setTUi(tRef.current);
    setPicked([]);
    setError('');
  };

  const apply = () => {
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
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setText(JSON.stringify(preset, null, 2));
    applyModel(preset);
  };

  const total = model.steps.length;
  const stepIndex = Math.min(Math.floor(tUi), total - 1);
  const step = model.steps[stepIndex];
  const segs = buildSegments(model);
  const sx = (x: number) => 150 + x * 118;
  const sy = (y: number) => 150 - y * 118;

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
          <span>JSON ・ CREASE PATTERN ・ 3D PREVIEW</span>
        </div>
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
        </select>
      </header>

      <div className="editor-body">
        <section className="ed-json">
          <p className="panel-label">
            JSON <span>・ 工程データ</span>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            aria-label="モデルJSON"
          />
          <div className="ed-json-foot">
            <button className="btn-main primary" onClick={apply}>
              反映<em>APPLY</em>
            </button>
            {error && <p className="ed-error">⚠ {error}</p>}
          </div>
        </section>

        <section className="ed-sheet">
          <p className="panel-label">
            CREASE PATTERN <span>・ 展開図(頂点クリックで番号を収集)</span>
          </p>
          <svg viewBox="0 0 300 300" className="sheet-svg">
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
            {model.vertices.map(([x, y], i) => (
              <g
                key={`v${i}`}
                className="sheet-vertex"
                onClick={() => setPicked((p) => [...p, i])}
              >
                <circle cx={sx(x)} cy={sy(y)} r={6} />
                <text x={sx(x) + 8} y={sy(y) - 7}>
                  {i}
                </text>
              </g>
            ))}
          </svg>
          <div className="picked-bar">
            <code>[{picked.join(', ')}]</code>
            <button className="btn-sub" onClick={() => navigator.clipboard.writeText(`[${picked.join(', ')}]`)}>
              コピー<em>COPY</em>
            </button>
            <button className="btn-sub" onClick={() => setPicked([])}>
              クリア<em>CLEAR</em>
            </button>
          </div>
        </section>

        <section className="ed-3d">
          <canvas ref={canvasRef} />
          <div className="ed-3d-foot">
            <p className="step-label">
              STEP {String(stepIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} —{' '}
              {step?.description.ja ?? ''}
            </p>
            <input
              className="timeline"
              type="range"
              min={0}
              max={total}
              step={0.01}
              value={tUi}
              onChange={(e) => {
                const v = Number(e.target.value);
                tRef.current = v;
                setTUi(v);
              }}
              aria-label="タイムライン / Timeline"
              style={{
                backgroundImage: `linear-gradient(to right, var(--accent) ${(tUi / total) * 100}%, var(--border) ${(tUi / total) * 100}%)`,
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
