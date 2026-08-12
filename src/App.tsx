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
import { yachtModel } from './models/yacht';
import { penguinModel } from './models/penguin';
import type { OrigamiModel } from './engine/types';
import { FinalShapePreview, GenericPattern } from './CreasePattern';
import { LangToggle, useLang } from './i18n';
import { CATEGORIES, categoryOf, levelLabel, usedLevels } from './catalog';
import type { CategoryId } from './catalog';
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
  yachtModel,
  penguinModel,
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
  const { t, L } = useLang();
  // ドットだけでは差が伝わらないので、呼び名(初級/中級…)も添える
  return (
    <span className="level" aria-label={`${t('difficulty')} ${n}/5 — ${L(levelLabel(n))}`}>
      <span className="dots" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={i < n ? 'on' : ''} />
        ))}
      </span>
      <span className={`level-text lv${n}`}>{L(levelLabel(n))}</span>
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
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');
  const [level, setLevel] = useState<number | 'all'>('all');
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
  const matchesKind = (m: OrigamiModel) => filter === 'all' || categoryOf(m.id) === filter;
  const matchesLevel = (m: OrigamiModel) => level === 'all' || m.difficulty === level;
  const shown = MODELS.filter((m) => matchesKind(m) && matchesLevel(m));
  // 件数は「相手の絞り込みを適用した数」を出す(選ぶ前に結果が読める)
  const kindCount = (id: CategoryId | 'all') =>
    MODELS.filter((m) => (id === 'all' || categoryOf(m.id) === id) && matchesLevel(m)).length;
  const levelCount = (lv: number | 'all') =>
    MODELS.filter((m) => matchesKind(m) && (lv === 'all' || m.difficulty === lv)).length;
  const filtered = filter !== 'all' || level !== 'all';

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
          {/* 行の途中で折れると読みにくいので、行ごとに nowrap で包む */}
          <span>{t('heroLine1')}</span>
          {lang === 'ja' ? <br /> : ' '}
          <span>{t('heroLine2')}</span>
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

      <div className="filters">
        <div className="filter-row" role="group" aria-label={t('filterLabel')}>
          <span className="filter-key">{t('filterKind')}</span>
          {CATEGORIES.map((c) => {
            // 全体で0件の分類はそもそも出さない(相手の絞り込みで0になった場合は
            // 押せない状態で残し、絞り込みの当たりが読めるようにする)
            const inCatalog =
              c.id === 'all' ? MODELS.length : MODELS.filter((m) => categoryOf(m.id) === c.id).length;
            if (inCatalog === 0) return null;
            const n = kindCount(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`chip${filter === c.id ? ' on' : ''}${n === 0 ? ' off' : ''}`}
                aria-pressed={filter === c.id}
                disabled={n === 0 && filter !== c.id}
                onClick={() => setFilter(c.id)}
              >
                {L(c.label)}
                <em>{n}</em>
              </button>
            );
          })}
        </div>

        <div className="filter-row" role="group" aria-label={t('filterLevelLabel')}>
          <span className="filter-key">{t('filterLevel')}</span>
          <button
            type="button"
            className={`chip${level === 'all' ? ' on' : ''}`}
            aria-pressed={level === 'all'}
            onClick={() => setLevel('all')}
          >
            {t('filterAll')}
            <em>{levelCount('all')}</em>
          </button>
          {usedLevels(MODELS).map((lv) => {
            const n = levelCount(lv);
            return (
              <button
                key={lv}
                type="button"
                className={`chip${level === lv ? ' on' : ''}${n === 0 ? ' off' : ''}`}
                aria-pressed={level === lv}
                disabled={n === 0 && level !== lv}
                onClick={() => setLevel(lv)}
              >
                {L(levelLabel(lv))}
                <em>{n}</em>
              </button>
            );
          })}
          {filtered && (
            <button
              type="button"
              className="chip clear"
              onClick={() => {
                setFilter('all');
                setLevel('all');
              }}
            >
              {t('filterReset')}
            </button>
          )}
        </div>
      </div>

      <div className="card-grid">
        {shown.map((m) => (
          <button key={m.id} className="work-card" onClick={() => setCurrent(m)}>
            <span className="card-index">{String(MODELS.indexOf(m) + 1).padStart(2, '0')}</span>
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
              {t('stepsMeta', { n: m.steps.length })}
              {lang === 'ja' ? ' ・ ' : ' · '}
              {t('minutesMeta', { n: m.steps.length })}
              {records.byModel[m.id] ? `${lang === 'ja' ? ' ・ ' : ' · '}×${records.byModel[m.id]}` : ''}
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
        {shown.length === 0 && <p className="empty-note">{t('noMatch')}</p>}
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
