import { useEffect, useRef, useState } from 'react';
import type { OrigamiModel } from './engine/types';
import { computeFoldState } from './engine/fold';
import { PaperScene } from './three/PaperScene';

interface Props {
  model: OrigamiModel;
  onExit: () => void;
  onComplete: () => void;
}

interface UiState {
  t: number;
  stepIndex: number;
  fraction: number;
}

/** タイムライン移動速度(工程/秒) */
const PLAY_SPEED = 0.9;

export function Navigator({ model, onExit, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const tRef = useRef(0);
  const targetRef = useRef(0);
  const playingRef = useRef(false);
  const [ui, setUi] = useState<UiState>({ t: 0, stepIndex: 0, fraction: 0 });
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);

  const total = model.steps.length;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const scene = new PaperScene(canvas);
    scene.setModel(model);
    sceneRef.current = scene;
    tRef.current = 0;
    targetRef.current = 0;

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = tRef.current;
      const target = targetRef.current;
      if (t !== target) {
        const d = Math.sign(target - t) * PLAY_SPEED * dt;
        tRef.current = Math.abs(target - t) <= Math.abs(d) ? target : t + d;
      } else if (playingRef.current && t >= total) {
        playingRef.current = false;
        setPlaying(false);
      }
      const state = computeFoldState(model, tRef.current);
      scene.update(state);
      setUi({ t: tRef.current, stepIndex: state.stepIndex, fraction: state.fraction });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);

    // ダブルタップ/ダブルクリックで正面表示に戻す
    let lastTap = 0;
    const onTap = () => {
      const now = performance.now();
      if (now - lastTap < 300) scene.resetCamera();
      lastTap = now;
    };
    canvas.addEventListener('pointerdown', onTap);

    // 検証用フック(E2E・デバッグでタイムラインを直接操作する)
    (window as unknown as Record<string, unknown>).__origami = {
      setT: (v: number) => {
        tRef.current = v;
        targetRef.current = v;
      },
      getT: () => tRef.current,
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onTap);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [model, total]);

  const goTo = (target: number, immediate = false) => {
    targetRef.current = Math.max(0, Math.min(target, total));
    if (immediate) tRef.current = targetRef.current;
    playingRef.current = false;
    setPlaying(false);
  };
  const next = () => goTo(Math.min(Math.floor(tRef.current + 1e-6) + 1, total));
  const prev = () => {
    const t = tRef.current;
    goTo(Math.abs(t - Math.round(t)) < 1e-6 ? Math.round(t) - 1 : Math.floor(t));
  };
  const togglePlay = () => {
    if (playingRef.current) {
      targetRef.current = tRef.current;
      playingRef.current = false;
      setPlaying(false);
    } else {
      if (tRef.current >= total) tRef.current = 0;
      targetRef.current = total;
      playingRef.current = true;
      setPlaying(true);
    }
  };

  const step = model.steps[ui.stepIndex];
  // バッジは工程の代表折り(複数同時折りは同種の前提)
  const foldType = step.folds[0].type;
  const finished = ui.t >= total;
  const left = total - ui.stepIndex - (ui.fraction >= 1 ? 1 : 0);

  return (
    <div className="screen nav-screen">
      <header className="nav-header">
        <button className="icon-btn" onClick={onExit} aria-label="ライブラリへ戻る / Back to library">
          ←
        </button>
        <div className="nav-title">
          <strong className="serif">
            {model.name.ja} <em>{model.name.en}</em>
          </strong>
          <span>{finished ? '完成 COMPLETE' : `残り${left}工程 ・ ${left} TO GO`}</span>
        </div>
        <div className="step-counter">
          <em>{String(Math.min(ui.stepIndex + 1, total)).padStart(2, '0')}</em>
          <span>/ {String(total).padStart(2, '0')}</span>
        </div>
      </header>

      <div className="progress-track">
        {model.steps.map((_, i) => {
          const f = Math.max(0, Math.min(ui.t - i, 1));
          return (
            <div key={i} className="seg">
              <div style={{ width: `${f * 100}%` }} />
            </div>
          );
        })}
      </div>

      <div className="canvas-wrap">
        <canvas ref={canvasRef} />
        <div className={`fold-badge ${foldType}`}>
          <i />
          <div>
            <strong>{foldType === 'valley' ? '谷折り' : '山折り'}</strong>
            <span>{foldType === 'valley' ? 'VALLEY ・ TOWARD YOU' : 'MOUNTAIN ・ BEHIND'}</span>
          </div>
        </div>
        <button className="view-reset" onClick={() => sceneRef.current?.resetCamera()}>
          正面 FRONT
        </button>
        {finished && !done && (
          <div className="finish-float">
            <button
              className="btn-done"
              onClick={() => {
                onComplete();
                setDone(true);
              }}
            >
              完成を記録 <em>MARK FOLDED</em>
            </button>
          </div>
        )}
      </div>

      <div className="step-card">
        <p className="step-label">
          {finished ? 'COMPLETE' : `STEP ${String(ui.stepIndex + 1).padStart(2, '0')}`}
        </p>
        <p className="step-desc">
          {finished ? `「${model.name.ja}」— 完成です。` : step.description.ja}
        </p>
        <p className="step-desc-en">
          {finished ? `Your ${model.name.en} is complete.` : step.description.en}
        </p>
        {!finished && step.caution && (
          <p className="step-caution">
            ※ {step.caution.ja} — {step.caution.en}
          </p>
        )}
      </div>

      <div className="controls">
        <input
          className="timeline"
          type="range"
          min={0}
          max={total}
          step={0.01}
          value={ui.t}
          onChange={(e) => goTo(Number(e.target.value), true)}
          aria-label="工程スライダー / Step slider"
        />
        <div className="btn-row">
          <button className="btn-sub" onClick={() => goTo(0)}>
            最初から<em>RESET</em>
          </button>
          <button className="btn-main" onClick={prev} disabled={ui.t <= 0}>
            戻る<em>BACK</em>
          </button>
          <button className="btn-play" onClick={togglePlay} aria-label={playing ? '一時停止 / Pause' : '再生 / Play'}>
            {playing ? '❙❙' : '▶'}
          </button>
          <button className="btn-main primary" onClick={next} disabled={finished}>
            次へ<em>NEXT</em>
          </button>
          <button className="btn-sub" onClick={() => goTo(total)}>
            完成形<em>FINAL</em>
          </button>
        </div>
      </div>

      {done && (
        <div className="overlay">
          <div className="overlay-card">
            <p className="overlay-eyebrow">COMPLETED</p>
            <h2 className="serif">完成</h2>
            <p>
              「{model.name.ja}」を折りあげました
              <br />
              Beautifully folded.
            </p>
            <button
              className="btn-main primary"
              onClick={() => {
                setDone(false);
                goTo(0, true);
              }}
            >
              もう一度折る<em>FOLD AGAIN</em>
            </button>
            <button className="btn-sub" onClick={onExit}>
              ライブラリへ戻る<em>LIBRARY</em>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
