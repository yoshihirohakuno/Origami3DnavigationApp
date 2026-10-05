import { useEffect, useRef, useState } from 'react';
import { computeFoldState, type FoldState } from '../engine/fold';
import { PaperScene } from '../three/PaperScene';
import { beetleStudy } from './beetleStudy';
import './beetleStudyPreview.css';

/** Isolated authoring workbench. Not imported by the public library or app. */
export function BeetleStudyPreview() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<PaperScene | null>(null);
  const pose = useRef<FoldState | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const limit = useRef(0);
  const current = useRef(time);
  const total = beetleStudy.steps.length;
  const index = Math.min(Math.floor(time), total - 1);
  const caption = beetleStudy.steps[index].description;

  useEffect(() => {
    const paper = new PaperScene(canvas.current!, { minDistance: .25 });
    paper.setModel(beetleStudy);
    pose.current = computeFoldState(beetleStudy, 0);
    paper.update(pose.current);
    scene.current = paper;
    let frame = 0;
    const draw = () => {
      if (pose.current) paper.update(pose.current);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const resize = () => paper.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
      scene.current = null;
      paper.dispose();
    };
  }, []);
  useEffect(() => {
    current.current = time;
    pose.current = computeFoldState(beetleStudy, time);
  }, [time]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous: number | undefined;
    const advance = (stamp: number) => {
      if (previous !== undefined) {
        // One operation per play, at one third of the normal navigator speed.
        current.current = Math.min(limit.current, current.current + Math.min(stamp - previous, 100) * .0003);
        setTime(current.current);
      }
      previous = stamp;
      if (current.current >= limit.current) setPlaying(false);
      else frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const jump = (value: number) => { setPlaying(false); setTime(value); };
  const play = () => {
    if (playing) { setPlaying(false); return; }
    limit.current = Math.min(total, Math.floor(time) + 1);
    if (limit.current > time) setPlaying(true);
  };
  return <main className="study-workbench">
    <header>
      <h1>カブトムシ・構造試作 <span lang="en">Beetle structure study</span></h1>
      <p role="status">未完成・作品一覧への追加前です。<span lang="en">Work in progress — not a released model.</span></p>
    </header>
    <div className="study-view"><canvas ref={canvas} aria-label="カブトムシの折り構造 / Beetle fold structure" /></div>
    <section className="study-controls" aria-label="試作の工程確認 / Study timeline">
      <div className="study-stage"><label>工程 / Operation <select aria-label="工程を選択 / Select operation" value={index} onChange={event => jump(Number(event.target.value))}>
        {beetleStudy.steps.map((step, i) => <option key={i} value={i}>{i + 1}. {step.description.ja}</option>)}
      </select></label><output>{time.toFixed(2)} / {total}</output></div>
      <p>{caption.ja}<span lang="en">{caption.en}</span></p>
      <input type="range" min={0} max={total} step={.01} value={time} aria-label="折りの進行度 / Fold progress" onChange={event => jump(Number(event.target.value))} />
      <div className="study-buttons">
        <button onClick={() => jump(0)}>最初 / Start</button>
        <button disabled={time <= 0} onClick={() => jump(Math.max(0, Math.ceil(time) - 1))}>戻る / Back</button>
        <button disabled={time >= total} onClick={play}>{playing ? '停止 / Pause' : '1工程をゆっくり再生 / Play one fold slowly'}</button>
        <button disabled={time >= total} onClick={() => jump(Math.min(total, Math.floor(time) + 1))}>次へ / Next</button>
        <button onClick={() => jump(total)}>最終状態 / Last pose</button>
        <button onClick={() => scene.current?.resetCamera()}>正面 / Front</button>
        <button onClick={() => scene.current?.setViewAngle(35)}>斜め / Angled</button>
        <button onClick={() => scene.current?.setViewAngle(75)}>横から / Side</button>
        <button onClick={() => scene.current?.setViewAngle(180)}>裏側 / Reverse side</button>
      </div>
    </section>
  </main>;
}
