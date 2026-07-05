import { useState } from 'react';
import { Navigator } from './Navigator';
import { Editor } from './Editor';
import { dogModel } from './models/dog';
import { cupModel } from './models/cup';
import { tulipModel } from './models/tulip';
import { birdModel } from './models/bird';
import type { OrigamiModel } from './engine/types';
import { CreasePattern, GenericPattern } from './CreasePattern';
import './App.css';

const MODELS: OrigamiModel[] = [tulipModel, dogModel, cupModel, birdModel];

/** 準備中の作品(ライブラリの見せ方確認用プレースホルダ) */
const COMING_SOON = [
  { ja: '鶴', en: 'Crane', difficulty: 3 },
  { ja: '手裏剣', en: 'Shuriken', difficulty: 2 },
  { ja: '箱', en: 'Box', difficulty: 2 },
  { ja: '兜', en: 'Helmet', difficulty: 2 },
  { ja: 'ハート', en: 'Heart', difficulty: 2 },
];

const TITLES: [number, string, string][] = [
  [100, '神折り職人', 'Grandmaster'],
  [50, '折り紙マスター', 'Master'],
  [30, 'オリガミスト上級', 'Expert'],
  [15, 'オリガミスト中級', 'Adept'],
  [5, 'オリガミスト初級', 'Novice'],
  [1, 'オリガミスト見習い', 'Apprentice'],
];

interface Records {
  total: number;
  byModel: Record<string, number>;
}

function loadRecords(): Records {
  try {
    const raw = localStorage.getItem('origami-records');
    if (raw) return JSON.parse(raw) as Records;
  } catch {
    /* 破損時は初期値へ */
  }
  return { total: 0, byModel: {} };
}

function titleFor(total: number): [string, string] {
  for (const [n, ja, en] of TITLES) {
    if (total >= n) return [ja, en];
  }
  return ['称号未取得', 'Unranked'];
}

function Difficulty({ n }: { n: number }) {
  return (
    <span className="dots" aria-label={`難易度 / Difficulty ${n}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  );
}

/** 設計図風のコーナーマーク */
function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  );
}

export default function App() {
  const [current, setCurrent] = useState<OrigamiModel | null>(null);
  const [editing, setEditing] = useState(false);
  const [records, setRecords] = useState<Records>(loadRecords);

  const recordComplete = (model: OrigamiModel) => {
    setRecords((prev) => {
      const next: Records = {
        total: prev.total + 1,
        byModel: { ...prev.byModel, [model.id]: (prev.byModel[model.id] ?? 0) + 1 },
      };
      localStorage.setItem('origami-records', JSON.stringify(next));
      return next;
    });
  };

  if (editing) {
    return <Editor onExit={() => setEditing(false)} />;
  }

  if (current) {
    return (
      <Navigator
        model={current}
        onExit={() => setCurrent(null)}
        onComplete={() => recordComplete(current)}
      />
    );
  }

  const [titleJa, titleEn] = titleFor(records.total);

  return (
    <div className="screen library-screen">
      <div className="header-deco" aria-hidden="true">
        <GenericPattern size={300} />
      </div>

      <header className="lib-header">
        <p className="eyebrow">
          <span className="rule" />
          ORIGAMI NAVIGATION
        </p>
        <h1 className="serif">
          折り紙、<br />道順で。
        </h1>
        <p className="hero-en">Every fold, turn by turn.</p>
        <div className="record-chip">
          <span className="chip-key">RANK</span>
          <span className="chip-label">
            {titleJa} <em>{titleEn}</em>
          </span>
          <span className="chip-sep" />
          <span className="chip-key">FOLDED</span>
          <span className="chip-label">{records.total}</span>
        </div>
      </header>

      <h2 className="section-title">
        <span>作品を選ぶ</span>
        <span className="en">SELECT A MODEL</span>
        <span className="line" />
      </h2>

      <div className="card-grid">
        {MODELS.map((m, i) => (
          <button key={m.id} className="work-card" onClick={() => setCurrent(m)}>
            <span className="card-index">{String(i + 1).padStart(2, '0')}</span>
            <div className="thumb">
              <Corners />
              <CreasePattern model={m} />
            </div>
            <div className="work-row">
              <span className={`work-name serif${m.name.ja.length > 3 ? ' long' : ''}`}>
                {m.name.ja}
              </span>
              <Difficulty n={m.difficulty} />
            </div>
            <div className="work-en">{m.name.en}</div>
            <div className="work-meta">
              {m.steps.length} STEPS ・ {m.steps.length} MIN
              {records.byModel[m.id] ? ` ・ ×${records.byModel[m.id]}` : ''}
            </div>
          </button>
        ))}
        {COMING_SOON.map((m, i) => (
          <div key={m.ja} className="work-card disabled">
            <span className="card-index">{String(MODELS.length + i + 1).padStart(2, '0')}</span>
            <div className="thumb">
              <Corners />
              <GenericPattern />
            </div>
            <div className="work-row">
              <span className={`work-name serif${m.ja.length > 3 ? ' long' : ''}`}>{m.ja}</span>
              <Difficulty n={m.difficulty} />
            </div>
            <div className="work-en">{m.en}</div>
            <div className="work-meta">COMING SOON ・ 準備中</div>
          </div>
        ))}
      </div>

      <p className="footnote">
        PROTOTYPE — 収録4作品 / 4 models available.
        <button className="editor-link" onClick={() => setEditing(true)}>
          MODEL EDITOR — 工程データ作成(β)
        </button>
      </p>
    </div>
  );
}
