import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { OrigamiModel } from './engine/types';
import { computeFoldState } from './engine/fold';
import { computeNavigationState } from './engine/navigation';
import { guidedNavigation, initialGuidedState, type GuidedAction } from './engine/guidedNavigation';
import { buildStepDiagrams, FinalShapePreview } from './CreasePattern';
import { PaperScene } from './three/PaperScene';
import './GuidedNavigator.css';

function Words({ ja, en }: { ja: string; en: string }) {
  return <><span lang="ja">{ja}</span><small lang="en">{en}</small></>;
}

/** Cup-only UI trial. Reuses the existing paper and six validated actions. */
export function GuidedNavigator({ model, onExit, onClassic, onComplete }: {
  model: OrigamiModel; onExit: () => void; onClassic: () => void; onComplete: () => void;
}) {
  const [state, dispatch] = useReducer((s: typeof initialGuidedState, a: GuidedAction) => guidedNavigation(s, a, model.steps.length), initialGuidedState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const stateRef = useRef(state);
  const recordedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const instructionRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const before = useMemo(() => buildStepDiagrams(model, 160, 'before'), [model]);
  const after = useMemo(() => buildStepDiagrams(model, 160, 'after'), [model]);
  const pose = useMemo(() => state.fraction === 1
    ? computeNavigationState(model, state.index + 1)
    : computeFoldState(model, state.index + state.fraction), [model, state.index, state.fraction]);
  const poseRef = useRef(pose);
  useEffect(() => { stateRef.current = state; poseRef.current = pose; }, [state, pose]);
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new PaperScene(canvasRef.current);
    sceneRef.current = scene;
    scene.setModel(model);
    let frame = 0, previous = 0;
    const loop = (now: number) => {
      if (stateRef.current.playing && previous) dispatch({ type: 'tick', seconds: (now - previous) / 1000 });
      previous = now;
      scene.update(poseRef.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const observer = new ResizeObserver(() => scene.resize());
    observer.observe(canvasRef.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scene.dispose(); sceneRef.current = null; };
  }, [model]);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (instructionRef.current) instructionRef.current.scrollTop = 0;
    if (state.index > 0 && !state.complete && window.matchMedia('(max-width: 760px)').matches) viewerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [state.index, state.complete]);
  const step = model.steps[state.index];
  const replay = () => dispatch({ type: 'play', reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  const confirm = () => {
    if (state.index === model.steps.length - 1 && !recordedRef.current) {
      recordedRef.current = true;
      onComplete();
    }
    dispatch({ type: 'next' });
  };

  return <main className="guided-screen">
    <header className="guided-header">
      <button className="guided-back" onClick={onExit} aria-label="作品一覧へ / Back to library">←</button>
      <div className="guided-brand"><b>折り紙ジェネレーター</b><small lang="en">Origami Generator</small></div>
      <button className="guided-classic" onClick={onClassic}><Words ja="従来の画面へ" en="Classic view" /></button>
    </header>
    <div className="guided-intro">
      <div><p className="guided-eyebrow">LET’S FOLD TOGETHER</p><h1>{model.name.ja} <span lang="en">{model.name.en}</span></h1></div>
      <div className="guided-material"><Words ja="用意するもの：正方形の紙 1枚" en="You need: one square sheet of paper" /></div>
    </div>
    <div className="guided-layout">
      <section ref={viewerRef} className="guided-viewer" aria-label="回せる3Dの折り図 / Interactive 3D instructions">
        <div className="guided-viewer-top"><span>3D GUIDE</span><span>ひと折りずつ / One fold at a time</span></div>
        <div className="guided-mobile-instruction" aria-hidden="true"><b>{String(state.index + 1).padStart(2, '0')} / {model.steps.length}</b><p><Words ja={state.complete ? 'コップができたね！' : step.description.ja} en={state.complete ? 'Your paper cup is ready!' : step.description.en} /></p></div>
        <div className="guided-canvas"><canvas ref={canvasRef} aria-label="ドラッグで回転、ピンチで拡大 / Drag to rotate, pinch to zoom" />
          <div className="guided-legend"><span className="paper-front" />表 / Front <span className="paper-back" />裏 / Back</div>
          {!state.complete && <button className="guided-replay" onClick={state.playing ? () => dispatch({ type: 'pause' }) : replay}><span aria-hidden="true">{state.playing ? 'Ⅱ' : '▷'}</span><Words ja={state.playing ? 'いったん止める' : '動きをゆっくり見る'} en={state.playing ? 'Pause this fold' : 'Watch this fold · Replay'} /></button>}
        </div>
        <div className="guided-view-tools">
          <button onClick={() => sceneRef.current?.resetCamera()}><Words ja="正面に戻す" en="Reset view" /></button>
          <button onClick={() => sceneRef.current?.setViewAngle(180, true)}><Words ja="裏側を見る" en="See the back" /></button>
          <button className="guided-zoom" onClick={() => sceneRef.current?.zoomBy(.8)} aria-label="拡大 / Zoom in">＋</button>
          <button className="guided-zoom" onClick={() => sceneRef.current?.zoomBy(1.25)} aria-label="縮小 / Zoom out">−</button>
          <p><Words ja="矢印の方向へ折ろう。ドラッグで回転できます。" en="Follow the arrow. Drag to rotate; pinch to zoom." /></p>
        </div>
      </section>
      <section ref={instructionRef} className="guided-instruction" aria-label="今の工程 / Current step">
        <div className="guided-step-heading"><span className="guided-step-number">{String(state.index + 1).padStart(2, '0')}</span>
          <div><p>{state.complete ? 'できあがり！ / You did it!' : `いまのひと折り / STEP ${state.index + 1}`}</p><span>{state.complete ? model.steps.length : state.index} / {model.steps.length} 工程できた / folds done</span></div>
        </div>
        <ol className="guided-progress" aria-label="折った工程 / Confirmed folds">{model.steps.map((_, i) => <li key={i} className={state.complete || i < state.index ? 'confirmed' : i === state.index ? 'active' : ''} aria-current={!state.complete && i === state.index ? 'step' : undefined}>{state.complete || i < state.index ? '✓' : i + 1}</li>)}</ol>
        <h2 ref={headingRef} tabIndex={-1}>{state.complete ? 'コップができたね！' : step.description.ja}</h2>
        <p className="guided-description-en" lang="en">{state.complete ? 'Your paper cup is ready!' : step.description.en}</p>
        {state.complete ? <div className="guided-finished"><FinalShapePreview model={model} /><p><Words ja="完成をきろくしました。" en="Your finished cup has been recorded." /></p></div> : <>
          <div className="guided-shape-pair">
            <button className={state.fraction === 0 ? 'selected' : ''} onClick={() => dispatch({ type: 'pose', fraction: 0 })} aria-pressed={state.fraction === 0}><Words ja="折る前" en="Before" />{before[state.index]}</button>
            <span aria-hidden="true">→</span>
            <button className={state.fraction === 1 ? 'selected' : ''} onClick={() => dispatch({ type: 'pose', fraction: 1 })} aria-pressed={state.fraction === 1}><Words ja="この形にしよう" en="Your goal" />{after[state.index]}</button>
          </div>
          {step.caution && <div className="guided-tip"><span aria-hidden="true">✦</span><p><Words ja={step.caution.ja} en={step.caution.en} /></p></div>}
          <label className="guided-scrub"><span>動きを手で進める / Scrub this fold</span><input aria-label="今の折りの進み具合 / Current fold progress" type="range" min="0" max="1" step="0.01" value={state.fraction} onChange={e => dispatch({ type: 'pose', fraction: Number(e.target.value) })} /></label>
          <p className="guided-check"><Words ja="手元の紙が見本と同じ形になったら…" en="When your paper matches the goal…" /></p>
        </>}
        <div className="guided-next-row"><button className="guided-previous" onClick={() => dispatch({ type: 'back' })} disabled={state.index === 0 && !state.complete}><Words ja="ひとつ戻る" en="Previous" /></button>
          <button className="guided-next" onClick={state.complete ? onExit : confirm}><Words ja={state.complete ? 'ほかの作品へ' : state.index === model.steps.length - 1 ? 'できあがり！' : '折れた！次へ →'} en={state.complete ? 'Explore more' : state.index === model.steps.length - 1 ? 'I finished my cup!' : 'Done! Next fold →'} /></button></div>
      </section>
    </div>
    <footer className="guided-footer">あわてなくて大丈夫。自分のペースで折ろう。 <span lang="en">Take your time. Every fold is a little discovery.</span></footer>
  </main>;
}
