import { useEffect, useRef, useState } from 'react';
import type { OrigamiModel, FoldType } from './engine/types';
import { computeFoldState } from './engine/fold';
import { PaperScene } from './three/PaperScene';
import { LangToggle, useLang } from './i18n';

/** 折り種類の名前と、動く向きの補足(バッジの2行) */
const FOLD_LABEL: Record<FoldType, { ja: string; en: string }> = {
  valley: { ja: '谷折り', en: 'Valley fold' },
  mountain: { ja: '山折り', en: 'Mountain fold' },
  unfold: { ja: '開く', en: 'Unfold' },
  'inside-reverse': { ja: '中割り折り', en: 'Inside reverse' },
  'outside-reverse': { ja: 'かぶせ折り', en: 'Outside reverse' },
  assemble: { ja: '組み立て', en: 'Assemble' },
};

const FOLD_HINT: Record<FoldType, { ja: string; en: string }> = {
  valley: { ja: '手前へ', en: 'toward you' },
  mountain: { ja: '奥へ', en: 'behind' },
  unfold: { ja: '折り目をつけて戻す', en: 'crease, then open' },
  'inside-reverse': { ja: '中へ割り入れる', en: 'tuck inside' },
  'outside-reverse': { ja: '外へかぶせる', en: 'wrap outside' },
  assemble: { ja: '重ねる・回す', en: 'layer and turn' },
};

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
  const { t, L, lang } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const tRef = useRef(0);
  const targetRef = useRef(0);
  const playingRef = useRef(false);
  const [ui, setUi] = useState<UiState>({ t: 0, stepIndex: 0, fraction: 0 });
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  // 初回だけ操作のヒントを出す(3Dが回せる/スライダーで途中を見られる、が伝わらないため)
  const [hint, setHint] = useState(() => {
    try {
      return localStorage.getItem('origami-hint-seen') !== '1';
    } catch {
      return false;
    }
  });
  const closeHint = () => {
    setHint(false);
    try {
      localStorage.setItem('origami-hint-seen', '1');
    } catch {
      /* 保存できなくてもその場は閉じる */
    }
  };

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
    // 完成時に「完了を記録」ボタンが出る等でウィンドウリサイズを伴わずに
    // canvasの表示サイズが変わるため、要素自体のサイズ変化も監視する
    const ro = new ResizeObserver(() => scene.resize());
    ro.observe(canvas);

    // ダブルタップ/ダブルクリックで正面表示に戻す
    let lastTap = 0;
    const onTap = () => {
      const now = performance.now();
      if (now - lastTap < 300) scene.resetCamera();
      lastTap = now;
    };
    canvas.addEventListener('pointerdown', onTap);

    // 検証用フック(E2E・デバッグでタイムライン・カメラを直接操作する)
    (window as unknown as Record<string, unknown>).__origami = {
      setT: (v: number) => {
        tRef.current = v;
        targetRef.current = v;
      },
      getT: () => tRef.current,
      setView: (deg: number) => sceneRef.current?.setViewAngle(deg),
      getPositions: () =>
        computeFoldState(model, tRef.current).positions.map((p) => [
          Math.round(p.x * 1000) / 1000,
          Math.round(p.y * 1000) / 1000,
          Math.round(p.z * 1000) / 1000,
        ]),
      // モデルの面データ(層順のデバッグ用)
      getModel: () => ({ faces: model.faces, faceSheet: model.faceSheet }),
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
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
  // バッジは工程の代表折り。山谷が混在する工程は「たたむ」と表示する
  const foldType = step.folds[0].type;
  const mixed = step.folds.some((f) => f.type !== foldType);
  const finished = ui.t >= total;
  const left = total - ui.stepIndex - (ui.fraction >= 1 ? 1 : 0);
  const pct = (ui.t / total) * 100;

  return (
    <div className="screen nav-screen">
      <header className="nav-header">
        <button className="icon-btn" onClick={onExit} aria-label={t('backToLibrary')}>
          ←
        </button>
        <div className="nav-title">
          <strong className="serif">{L(model.name)}</strong>
          <span>{finished ? t('complete') : t('toGo', { n: left })}</span>
        </div>
        <LangToggle className="compact" />
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
        <div className={`fold-badge ${mixed ? 'mixed' : foldType}`}>
          <i />
          <div>
            <strong>{mixed ? t('collapse') : L(FOLD_LABEL[foldType])}</strong>
            <span>{mixed ? t('collapseHint') : L(FOLD_HINT[foldType])}</span>
          </div>
        </div>
        <button className="view-reset" onClick={() => sceneRef.current?.resetCamera()}>
          {t('front')}
        </button>
        {!hint && (
          <button className="hint-open" onClick={() => setHint(true)} title={t('showHint')}>
            ?
          </button>
        )}
        {hint && (
          <div className="hint-card" role="dialog" aria-label={t('hintTitle')}>
            <p className="hint-title">{t('hintTitle')}</p>
            <ul>
              <li>{t('hintDrag')}</li>
              <li>{t('hintSlider')}</li>
              <li>{t('hintList')}</li>
            </ul>
            <button className="btn-main primary" onClick={closeHint}>
              {t('hintClose')}
            </button>
          </div>
        )}
        {finished && !done && (
          <div className="finish-float">
            <button
              className="btn-done"
              onClick={() => {
                onComplete();
                setDone(true);
              }}
            >
              {t('markFolded')}
            </button>
          </div>
        )}
      </div>

      <aside className="step-panel">
        <p className="panel-label">
          ROUTE{lang === 'ja' && <span>・ {t('route')}</span>}
        </p>
        <ol className="step-list">
          {model.steps.map((s, i) => {
            const cls =
              ui.t >= i + 1 - 1e-6 ? 'done' : i === ui.stepIndex ? 'current' : '';
            return (
              <li key={i} className={cls}>
                <button onClick={() => goTo(i)}>
                  <span className="sl-num">{String(i + 1).padStart(2, '0')}</span>
                  <i className={`sl-dot ${s.folds[0].type}`} />
                  <span className="sl-text">{L(s.description)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="step-card">
        <p className="step-label">
          {finished ? 'COMPLETE' : `STEP ${String(ui.stepIndex + 1).padStart(2, '0')}`}
        </p>
        <p className="step-desc">
          {finished ? t('isComplete', { name: L(model.name) }) : L(step.description)}
        </p>
        {!finished && step.caution && <p className="step-caution">※ {L(step.caution)}</p>}
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
          aria-label={t('stepSlider')}
          style={{
            backgroundImage: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`,
            backgroundSize: '100% 2px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="btn-row">
          <button className="btn-sub" onClick={() => goTo(0)}>
            {t('reset')}
          </button>
          <button className="btn-main" onClick={prev} disabled={ui.t <= 0}>
            {t('back')}
          </button>
          <button className="btn-play" onClick={togglePlay} aria-label={playing ? t('pause') : t('play')}>
            {playing ? '❙❙' : '▶'}
          </button>
          <button className="btn-main primary" onClick={next} disabled={finished}>
            {t('next')}
          </button>
          <button className="btn-sub" onClick={() => goTo(total)}>
            {t('final')}
          </button>
        </div>
      </div>

      {done && (
        <div className="overlay">
          <div className="overlay-card">
            <p className="overlay-eyebrow">{t('completedEyebrow')}</p>
            <h2 className="serif">{t('complete')}</h2>
            <p>
              {t('foldedUp', { name: L(model.name) })}
              <br />
              {t('beautifully')}
            </p>
            <button
              className="btn-main primary"
              onClick={() => {
                setDone(false);
                goTo(0, true);
              }}
            >
              {t('foldAgain')}
            </button>
            <button className="btn-sub" onClick={onExit}>
              {t('library')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
