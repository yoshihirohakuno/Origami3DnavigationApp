import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrigamiModel } from './engine/types';
import { computeFoldState } from './engine/fold';
import { computeNavigationState } from './engine/navigation';
import { guidedNavigation, initialGuidedState, type GuidedAction } from './engine/guidedNavigation';
import { buildStepDiagrams, FinalShapePreview } from './CreasePattern';
import { PaperScene } from './three/PaperScene';
import { CUP_GUIDE } from './guides/cupGuide';
import { CupCue } from './guides/CupCue';
import './GuidedNavigator.css';

function Words({ ja, en }: { ja: string; en: string }) {
  return <><span lang="ja">{ja}</span><small lang="en">{en}</small></>;
}
function Icon({ kind }: { kind: 'reset' | 'flip' | 'help' }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'reset' && <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>}
    {kind === 'flip' && <><path d="m8 6 5-2v16l-5-2ZM16 6q6 6 0 12M16 14v4h4M5 6q-6 6 0 12M5 10V6H1" /></>}
    {kind === 'help' && <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2M12 16h.01" /></>}
  </svg>;
}

/** Cup-only UI trial. Paper geometry stays in the existing six folds. */
export function GuidedNavigator({ model, onExit, onClassic, onComplete }: {
  model: OrigamiModel; onExit: () => void; onClassic: () => void; onComplete: () => void;
}) {
  const [state, setState] = useState(initialGuidedState);
  const [slow, setSlow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const stateRef = useRef(state);
  const slowRef = useRef(slow);
  const recordedRef = useRef(false);
  const viewerRef = useRef<HTMLElement>(null);
  const dispatch = useCallback((action: GuidedAction) => {
    const next = guidedNavigation(stateRef.current, action, model.steps.length);
    stateRef.current = next;
    setState(next);
  }, [model.steps.length]);
  const before = useMemo(() => buildStepDiagrams(model, 180, 'before'), [model]);
  const after = useMemo(() => buildStepDiagrams(model, 180, 'after'), [model]);
  useEffect(() => { slowRef.current = slow; }, [slow]);
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new PaperScene(canvasRef.current);
    sceneRef.current = scene;
    scene.setModel(model);
    let frame = 0, previous = performance.now();
    let lastState: typeof state | null = null;
    let pose = computeFoldState(model, 0);
    const loop = (now: number) => {
      if (stateRef.current.playing) dispatch({ type: 'tick', seconds: (now - previous) / 1000, slow: slowRef.current });
      previous = now;
      const current = stateRef.current;
      if (current !== lastState) {
        pose = current.fraction === 1 ? computeNavigationState(model, current.index + 1) : computeFoldState(model, current.index + current.fraction);
        lastState = current;
      }
      scene.update(pose);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const observer = new ResizeObserver(() => scene.resize());
    observer.observe(canvasRef.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scene.dispose(); sceneRef.current = null; };
  }, [model, dispatch]);
  useEffect(() => {
    if (state.playing && window.matchMedia('(max-width: 760px)').matches) viewerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [state.playing]);
  const step = model.steps[state.index];
  const guide = CUP_GUIDE[state.index];
  const confirm = () => {
    const result = guidedNavigation(stateRef.current, { type: 'next' }, model.steps.length);
    dispatch({ type: 'next' });
    if (result.complete && !recordedRef.current) { recordedRef.current = true; onComplete(); }
  };
  const allRunning = state.playing;
  const allPaused = state.sequence && !state.playing && !(state.index === model.steps.length - 1 && state.fraction === 1);
  const nextJa = state.complete ? '作品へ' : state.fraction < 1 ? '折る' : state.index === model.steps.length - 1 ? 'できた！' : '次へ';
  const nextEn = state.complete ? 'More' : state.fraction < 1 ? 'Fold' : state.index === model.steps.length - 1 ? 'Done' : 'Next';

  return <main className="guided-screen">
    <header className="guided-header">
      <button className="guided-back" onClick={onExit} aria-label="作品一覧へ / Back to library" title="作品一覧へ / Back to library">←</button>
      <div className="guided-brand"><b>折り紙ジェネレーター</b><small lang="en">Origami Generator</small></div>
      <details className="guided-settings"><summary aria-label="設定と使い方 / Settings and help" title="設定と使い方 / Settings and help"><Icon kind="help" /></summary><div>
        <p><Words ja="正方形の紙 1枚" en="One square sheet" /></p>
        <p><Words ja="ドラッグで回転・ピンチで拡大" en="Drag to rotate · Pinch to zoom" /></p>
        <p className="guided-paper-key"><i /> <Words ja="表" en="Front" /><i /> <Words ja="裏" en="Back" /></p>
        <label><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} /><Words ja="ゆっくり再生" en="Slow playback" /></label>
        <button onClick={onClassic}><Words ja="従来の画面" en="Classic view" /></button>
      </div></details>
    </header>
    <div className="guided-intro"><h1>{model.name.ja} <span lang="en">{model.name.en}</span></h1><span className="guided-material" aria-label="正方形の紙 1枚 / One square sheet" title="正方形の紙 1枚 / One square sheet"><i /> × 1</span></div>
    <div className="guided-layout">
      <section ref={viewerRef} className="guided-viewer" aria-label="回せる3Dの折り図 / Interactive 3D instructions">
        <div className="guided-canvas"><canvas ref={canvasRef} aria-label="ドラッグで回転、ピンチで拡大 / Drag to rotate, pinch to zoom" />
          <div className="guided-view-tools">
            <button onClick={() => sceneRef.current?.setViewAngle(model.cameraAngle ?? 0, true)} aria-label="正面に戻す / Reset view" title="正面に戻す / Reset view"><Icon kind="reset" /></button>
            <button onClick={() => sceneRef.current?.setViewAngle(180, true)} aria-label="裏側を見る / See the back" title="裏側を見る / See the back"><Icon kind="flip" /></button>
            <button onClick={() => sceneRef.current?.zoomBy(.8)} aria-label="拡大 / Zoom in" title="拡大 / Zoom in">＋</button>
            <button onClick={() => sceneRef.current?.zoomBy(1.25)} aria-label="縮小 / Zoom out" title="縮小 / Zoom out">−</button>
          </div>
        </div>
        <div className="guided-motion-controls">
          <button className="guided-playback" onClick={() => dispatch(allRunning ? { type: 'pause' } : { type: 'watchAll' })} aria-label={allRunning ? '再生を一時停止 / Pause playback' : allPaused ? '全工程の続きから再生 / Resume full preview' : '最初から全工程を見る / Play all folds from the start'}>
            <span aria-hidden="true">{allRunning ? 'Ⅱ' : '▶'}</span><Words ja={allRunning ? '一時停止' : allPaused ? '続きを見る' : '動きを見る'} en={allRunning ? 'Pause' : allPaused ? 'Resume all' : 'Play all'} />
          </button>
          <input className="guided-scrub" aria-label="全工程の再生位置 / Full preview progress" type="range" min="0" max={model.steps.length} step="0.01" value={state.index + state.fraction} onChange={e => dispatch({ type: 'seekAll', progress: Number(e.target.value) })} />
          <span className="guided-play-count" aria-hidden="true">{state.index + 1}/{model.steps.length}</span>
        </div>
      </section>
      <section className="guided-instruction" aria-label="今の工程 / Current step">
        <h2 className="guided-step-heading" aria-label={state.complete ? 'できあがり / Finished' : `工程 ${state.index + 1} / Step ${state.index + 1}`}><b>{state.complete ? '✓' : String(state.index + 1).padStart(2, '0')}</b><small>/ {model.steps.length}</small></h2>
        {state.complete ? <div className="guided-finished"><FinalShapePreview model={model} /><p><Words ja="できたね！" en="You did it!" /></p></div> : <>
          <div className="guided-shape-pair">
            <button className={state.fraction === 0 ? 'selected' : ''} onClick={() => dispatch({ type: 'move', target: 0 })} aria-pressed={state.fraction === 0}><Words ja="現在" en="Now" />{before[state.index]}</button>
            <span aria-hidden="true">→</span>
            <button className={state.fraction === 1 ? 'selected' : ''} onClick={() => dispatch({ type: 'move', target: 1 })} aria-pressed={state.fraction === 1}><Words ja="次" en="Next" />{after[state.index]}</button>
          </div>
          {guide && <div className="guided-cue-row" role="note" aria-label={`${guide.point.ja} / ${guide.point.en}`}><CupCue kind={guide.cue} /><Words ja={guide.badge.ja} en={guide.badge.en} />{guide.backView && <button onClick={() => sceneRef.current?.setViewAngle(180, true)} aria-label="裏の1枚を確認 / Check the back layer" title="裏の1枚を確認 / Check the back layer"><Icon kind="flip" /></button>}</div>}
        </>}
        <div className="guided-next-row"><button className="guided-previous" onClick={() => dispatch({ type: 'back' })} disabled={state.index === 0 && state.fraction === 0 && !state.complete} aria-label="戻る / Back" title="戻る / Back">←</button><button className="guided-next" onClick={state.complete ? onExit : confirm} disabled={state.playing}><Words ja={nextJa} en={nextEn} /><span aria-hidden="true">{state.complete ? '→' : state.index === model.steps.length - 1 && state.fraction === 1 ? '✓' : '→'}</span></button></div>
        {!state.complete && <details className="guided-detail" key={state.index}><summary><Icon kind="help" /><Words ja="ヒント" en="Hint" /></summary><div><p><Words ja={guide?.action.ja ?? step.description.ja} en={guide?.action.en ?? step.description.en} /></p>{guide ? <p><Words ja={guide.point.ja} en={guide.point.en} /></p> : step.caution && <p><Words ja={step.caution.ja} en={step.caution.en} /></p>}</div></details>}
      </section>
    </div>
  </main>;
}
