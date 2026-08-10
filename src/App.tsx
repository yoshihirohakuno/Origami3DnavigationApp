import { useState } from 'react';
import { Navigator } from './Navigator';
import { Editor } from './Editor';
import { dogModel } from './models/dog';
import { cupModel } from './models/cup';
import { tulipModel } from './models/tulip';
import { chickModel } from './models/chick';
import { squareBaseModel } from './models/squareBase';
import { craneModel } from './models/crane';
import { shurikenModel } from './models/shuriken';
import { catModel } from './models/cat';
import { foxModel } from './models/fox';
import { rabbitModel } from './models/rabbit';
import { pandaModel } from './models/panda';
import { whaleModel } from './models/whale';
import { bearModel } from './models/bear';
import { helmetModel } from './models/helmet';
import { heartModel } from './models/heart';
import { boxModel } from './models/box';
import type { OrigamiModel } from './engine/types';
import { FinalShapePreview, GenericPattern } from './CreasePattern';
import { LangToggle, useLang } from './i18n';
import './App.css';

const MODELS: OrigamiModel[] = [
  tulipModel,
  dogModel,
  cupModel,
  chickModel,
  squareBaseModel,
  craneModel,
  shurikenModel,
  catModel,
  foxModel,
  rabbitModel,
  pandaModel,
  bearModel,
  whaleModel,
  helmetModel,
  heartModel,
  boxModel,
];

/** 準備中の作品(ライブラリの見せ方確認用プレースホルダ)。全作品実装済みで現在は空 */
const COMING_SOON: { ja: string; en: string; difficulty: number }[] = [];

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

function titleFor(total: number): { ja: string; en: string } {
  for (const [n, ja, en] of TITLES) {
    if (total >= n) return { ja, en };
  }
  return { ja: '称号未取得', en: 'Unranked' };
}

function Difficulty({ n }: { n: number }) {
  const { t } = useLang();
  return (
    <span className="dots" aria-label={`${t('difficulty')} ${n}/5`}>
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
  const { t, L, lang } = useLang();
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

  const rankTitle = titleFor(records.total);

  return (
    <div className="screen library-screen">
      <div className="header-deco" aria-hidden="true">
        <GenericPattern size={300} />
      </div>

      <header className="lib-header">
        <div className="lib-header-top">
          <p className="eyebrow">
            <span className="rule" />
            {t('eyebrow')}
          </p>
          <LangToggle />
        </div>
        <h1 className={`serif${lang === 'en' ? ' latin' : ''}`}>
          {t('heroLine1')}
          {lang === 'ja' ? <br /> : ' '}
          {t('heroLine2')}
        </h1>
        <p className="hero-en">{t('heroSub')}</p>
        <div className="record-chip">
          <span className="chip-key">{t('rank')}</span>
          <span className="chip-label">{L(rankTitle)}</span>
          <span className="chip-sep" />
          <span className="chip-key">{t('folded')}</span>
          <span className="chip-label">{records.total}</span>
        </div>
      </header>

      <h2 className="section-title">
        <span>{t('selectModel')}</span>
        {lang === 'ja' && <span className="en">{t('selectModelTag')}</span>}
        <span className="line" />
      </h2>

      <div className="card-grid">
        {MODELS.map((m, i) => (
          <button key={m.id} className="work-card" onClick={() => setCurrent(m)}>
            <span className="card-index">{String(i + 1).padStart(2, '0')}</span>
            <div className="thumb">
              <Corners />
              <FinalShapePreview model={m} />
            </div>
            <div className="work-row">
              <span className={`work-name serif${L(m.name).length > 3 ? ' long' : ''}`}>
                {L(m.name)}
              </span>
              <Difficulty n={m.difficulty} />
            </div>
            {lang === 'ja' && <div className="work-en">{m.name.en}</div>}
            <div className="work-meta">
              {t('stepsMeta', { n: m.steps.length })} ・ {t('minutesMeta', { n: m.steps.length })}
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
              <span className={`work-name serif${L(m).length > 3 ? ' long' : ''}`}>{L(m)}</span>
              <Difficulty n={m.difficulty} />
            </div>
            <div className="work-meta">{t('comingSoon')}</div>
          </div>
        ))}
      </div>

      <p className="footnote">
        {t('libraryNote', { n: MODELS.length })}
        <button className="editor-link" onClick={() => setEditing(true)}>
          {t('editorLink')}
        </button>
      </p>
    </div>
  );
}
