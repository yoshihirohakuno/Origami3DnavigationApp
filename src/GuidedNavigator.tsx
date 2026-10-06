import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrigamiModel } from './engine/types';
import { computeFoldState } from './engine/fold';
import { computeNavigationState } from './engine/navigation';
import { guidedNavigation, initialGuidedState, type GuidedAction } from './engine/guidedNavigation';
import { buildStepDiagrams, FinalShapePreview } from './CreasePattern';
import { PaperScene } from './three/PaperScene';
import { CUP_GUIDE } from './guides/cupGuide';
import './GuidedNavigator.css';

function Words({ ja, en }: { ja: string; en: string }) {
  return <><span lang="ja">{ja}</span><small lang="en">{en}</small></>;
}

/** Cup-only UI trial. Reuses the existing paper and six validated actions. */
export function GuidedNavigator({ model, onExit, onClassic, onComplete }: {
  model: OrigamiModel; onExit: () => void; onClassic: () => void; onComplete: () => void;
}) {
  const [state, setState] = useState(initialGuidedState);
  const [slow, setSlow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<PaperScene | null>(null);
  const stateRef = useRef(state);
  const slowRef = useRef(slow);
  const dispatch = useCallback((action: GuidedAction) => {
    const next = guidedNavigation(stateRef.current, action, model.steps.length);
    stateRef.current = next;
    setState(next);
  }, [model.steps.length]);
  const recordedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const instructionRef = useRef<HTMLElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const before = useMemo(() => buildStepDiagrams(model, 160, 'before'), [model]);
  const after = useMemo(() => buildStepDiagrams(model, 160, 'after'), [model]);
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
      // Draw the interpolated paper in this frame, as in the classic navigator.
      scene.update(pose);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const observer = new ResizeObserver(() => scene.resize());
    observer.observe(canvasRef.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scene.dispose(); sceneRef.current = null; };
  }, [model, dispatch]);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (instructionRef.current) instructionRef.current.scrollTop = 0;
    if (state.index > 0 && !state.complete && window.matchMedia('(max-width: 760px)').matches) viewerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [state.index, state.complete]);
  useEffect(() => {
    if (state.playing && window.matchMedia('(max-width: 760px)').matches) viewerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [state.playing]);
  const step = model.steps[state.index];
  const guide = CUP_GUIDE[state.index];
  const action = guide?.action ?? step.description;
  const replay = () => dispatch({ type: 'replay' });
  const confirm = () => {
    const result = guidedNavigation(stateRef.current, { type: 'next' }, model.steps.length);
    dispatch({ type: 'next' });
    if (result.complete && !recordedRef.current) {
      recordedRef.current = true;
      onComplete();
    }
  };
  const nextJa = state.complete ? 'ほかの作品へ' : state.playing ? '動きを見てみよう…' : state.fraction < 1 ? state.fraction > 0 ? '続きを見る ▶' : '折る動きを見る ▶' : state.index === model.steps.length - 1 ? 'できた！記録する' : '次の工程へ →';
  const nextEn = state.complete ? 'Explore more' : state.playing ? 'Watch this fold…' : state.fraction < 1 ? state.fraction > 0 ? 'Resume this fold ▶' : 'Show this fold ▶' : state.index === model.steps.length - 1 ? 'Finished · Save' : 'Next fold →';

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
        <div className="guided-viewer-top"><span>3D GUIDE</span><span>{state.fraction === 0 ? '折る前 / Before' : state.fraction === 1 ? '折り終わり / After' : '折り途中 / In motion'}</span></div>
        <div className="guided-mobile-instruction" aria-hidden="true"><b>{String(state.index + 1).padStart(2, '0')} / {model.steps.length}</b><div><p><Words ja={state.complete ? 'コップができたね！' : action.ja} en={state.complete ? 'Your paper cup is ready!' : action.en} /></p>{!state.complete && guide && <p className="guided-mobile-point"><Words ja={`ポイント：${guide.point.ja}`} en={guide.point.en} /></p>}</div></div>
        <div className="guided-canvas"><canvas ref={canvasRef} aria-label="ドラッグで回転、ピンチで拡大 / Drag to rotate, pinch to zoom" />
          <div className="guided-legend"><span className="paper-front" />表 / Front <span className="paper-back" />裏 / Back</div>
        </div>
        {!state.complete && <div className="guided-motion-controls">
          <button className="guided-playback" onClick={() => dispatch({ type: state.playing ? 'pause' : 'play' })}><span aria-hidden="true">{state.playing ? 'Ⅱ' : '▶'}</span><Words ja={state.playing ? '一時停止' : state.fraction > 0 && state.fraction < 1 ? '続きを見る' : '動きを見る'} en={state.playing ? 'Pause' : state.fraction > 0 && state.fraction < 1 ? 'Resume' : 'Play fold'} /></button>
          <label className="guided-scrub"><span>指で動きを確かめる / Scrub this fold</span><input aria-label="今の折りの進み具合 / Current fold progress" type="range" min="0" max="1" step="0.01" value={state.fraction} onChange={e => dispatch({ type: 'pose', fraction: Number(e.target.value) })} /></label>
          <button className="guided-repeat" onClick={replay} aria-label="もう一度再生 / Replay this fold">↻</button>
          <label className="guided-slow"><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} /><Words ja="ゆっくり" en="Slow" /></label>
        </div>}
        <div className="guided-view-tools">
          <button onClick={() => sceneRef.current?.setViewAngle(model.cameraAngle ?? 0, true)}><Words ja="正面に戻す" en="Reset view" /></button>
          <button onClick={() => sceneRef.current?.setViewAngle(180, true)}><Words ja="裏側を見る" en="See the back" /></button>
          <button className="guided-zoom" onClick={() => sceneRef.current?.zoomBy(.8)} aria-label="拡大 / Zoom in">＋</button>
          <button className="guided-zoom" onClick={() => sceneRef.current?.zoomBy(1.25)} aria-label="縮小 / Zoom out">−</button>
          <p><Words ja="矢印の方向へ折ろう。ドラッグで回転できます。" en="Follow the arrow. Drag to rotate; pinch to zoom." /></p>
        </div>
      </section>
      <section ref={instructionRef} className="guided-instruction" aria-label="今の工程 / Current step">
        <div className="guided-step-heading"><span className="guided-step-number">{String(state.index + 1).padStart(2, '0')}</span>
          <div><p>{state.complete ? 'できあがり！ / You did it!' : 'いまの工程 / CURRENT STEP'}</p><span>{state.index + 1} / {model.steps.length}</span></div>
        </div>
        <h2 ref={headingRef} tabIndex={-1}>{state.complete ? 'コップができたね！' : action.ja}</h2>
        <p className="guided-description-en" lang="en">{state.complete ? 'Your paper cup is ready!' : action.en}</p>
        {state.complete ? <div className="guided-finished"><FinalShapePreview model={model} /><p><Words ja="完成をきろくしました。" en="Your finished cup has been recorded." /></p></div> : <>
          {guide && <div className="guided-tip">
            <div className="guided-tip-copy"><span className="guided-tip-label">ここがポイント / ONE THING TO WATCH</span><p><Words ja={guide.point.ja} en={guide.point.en} /></p></div>
            <span className="guided-tip-badge"><Words ja={guide.badge.ja} en={guide.badge.en} /></span>
          </div>}
          {guide?.backView && <button className="guided-tip-view" onClick={() => sceneRef.current?.setViewAngle(180, true)}><Words ja="裏から1枚を確認する" en="Check the back layer" /></button>}
          <div className="guided-shape-pair">
            <button className={state.fraction === 0 ? 'selected' : ''} onClick={() => dispatch({ type: 'move', target: 0 })} aria-pressed={state.fraction === 0}><Words ja="現在の形" en="Start shape" />{before[state.index]}</button>
            <span aria-hidden="true">→</span>
            <button className={state.fraction === 1 ? 'selected' : ''} onClick={() => dispatch({ type: 'move', target: 1 })} aria-pressed={state.fraction === 1}><Words ja="次の形" en="Next shape" />{after[state.index]}</button>
          </div>
          <details className="guided-detail"><summary>くわしく見る / More detail</summary><p><Words ja={step.description.ja} en={step.description.en} /></p>{step.caution && <p><Words ja={step.caution.ja} en={step.caution.en} /></p>}</details>
          <p className="guided-check"><Words ja="手元の紙が見本と同じ形になったら…" en="When your paper matches the goal…" /></p>
        </>}
        <div className="guided-next-row"><button className="guided-previous" onClick={() => dispatch({ type: 'back' })} disabled={state.index === 0 && state.fraction === 0 && !state.complete}><Words ja="戻る" en="Back" /></button>
          <button className="guided-next" onClick={state.complete ? onExit : confirm} disabled={state.playing}><Words ja={nextJa} en={nextEn} /></button></div>
      </section>
    </div>
    <footer className="guided-footer">あわてなくて大丈夫。自分のペースで折ろう。 <span lang="en">Take your time. Every fold is a little discovery.</span></footer>
  </main>;
}
