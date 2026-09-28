import { useEffect, useRef, useState } from 'react';
import type { OrigamiModel } from './engine/types';
import { computeFoldState } from './engine/fold';
import { fingerPocketPlayPoint } from './engine/fingerPockets';
import { PaperScene } from './three/PaperScene';
import { useLang } from './i18n';

export function FortuneTellerPreview({ model, onClose }: { model: OrigamiModel; onClose: () => void }) {
  const { L } = useLang();
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const value = useRef(0);
  const running = useRef(false);
  const [opening, setOpening] = useState(0);
  const [playing, setPlaying] = useState(false);
  const choose = (v: number) => { running.current = false; setPlaying(false); value.current = v; setOpening(v); };
  useEffect(() => {
    const el = dialog.current!;
    const focus = document.activeElement as HTMLElement | null;
    el.showModal();
    const scene = new PaperScene(canvas.current!);
    scene.setModel({ ...model, cameraPos: [0, .8, 5] });
    const finished = computeFoldState(model, model.steps.length);
    const nodes = model.steps.flatMap(s => s.folds).find(f => f.fingerPockets)?.fingerPockets ?? [];
    let raf = 0, previous = performance.now(), lastValue = NaN, phase = 0;
    let state = finished;
    const frame = (now: number) => {
      const dt = Math.min(.1, (now-previous)/1000); previous = now;
      if (running.current) {
        phase += dt * .9;
        value.current = Math.sin(phase);
        setOpening(value.current);
      } else phase = Math.asin(value.current);
      if (lastValue !== value.current) {
        const positions = finished.positions.map(p => p.clone());
        for (const [vi,x,y,sx,sy,outer] of nodes) positions[vi] = fingerPocketPlayPoint(x,y,sx,sy,outer,value.current);
        state = { ...finished, positions, guides: [] };
        lastValue = value.current;
      }
      scene.update(state);
      raf = requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(() => scene.resize()); resize.observe(canvas.current!);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); resize.disconnect(); scene.dispose(); el.close(); focus?.focus(); };
  }, [model]);
  return <dialog className="fortune-preview" ref={dialog} onCancel={onClose} aria-labelledby="fortune-preview-title">
    <div className="fortune-preview-heading"><h2 id="fortune-preview-title">{L({ja:'パクパク動かしてみよう',en:'Try your fortune teller'})}</h2><button className="btn-main" onClick={onClose}>{L({ja:'閉じる',en:'Close'})}</button></div>
    <p>{L({ja:'両手の親指と人差し指を、裏の四つの袋に1本ずつ入れます。指を2本ずつそろえ、いったん閉じてから開く向きを変えます。',en:'Put both thumbs and index fingers into the four pockets underneath. Move the fingers in pairs, closing the mouth before opening it in the other direction.'})}</p>
    <canvas ref={canvas} aria-label={L({ja:'完成したパクパク占いの3D開閉プレビュー',en:'3D opening and closing preview of the finished fortune teller'})} />
    <div className="fortune-preview-buttons">
      <button className="btn-main primary" onClick={() => { running.current = !running.current; setPlaying(running.current); }}>{L(playing ? {ja:'一時停止',en:'Pause'} : {ja:'パクパク再生',en:'Play'})}</button>
      <button className="btn-main" onClick={() => choose(1)}>{L({ja:'縦に開く',en:'Open vertically'})}</button>
      <button className="btn-main" onClick={() => choose(0)}>{L({ja:'口を閉じる',en:'Close mouth'})}</button>
      <button className="btn-main" onClick={() => choose(-1)}>{L({ja:'横に開く',en:'Open horizontally'})}</button>
    </div>
    <label className="fortune-preview-slider">{L({ja:'横に開く ← 閉じる → 縦に開く',en:'Horizontal ← Closed → Vertical'})}<input type="range" min="-1" max="1" step=".01" value={opening} onChange={e => choose(Number(e.target.value))} /></label>
    <p>{L({ja:'ドラッグして裏側も確認できます。指や紙のしなりは省略した動きの見本です。',en:'Drag to inspect the underside. This motion guide omits fingers and paper flexing.'})}</p>
  </dialog>;
}

