import { useState } from 'react';
import { Navigator } from './Navigator';
import { GuidedNavigator } from './GuidedNavigator';
import { Editor } from './Editor';
import type { OrigamiModel } from './engine/types';
import { FinalShapePreview, GenericPattern } from './CreasePattern';
import { LangToggle, useLang } from './i18n';
import { CATEGORIES, categoryOf, levelLabel, usedLevels } from './catalog';
import type { CategoryId } from './catalog';
import { MODEL_NOTES } from './modelReferences';
import { MODELS } from './modelLibrary';
import './App.css';

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
    if (raw) {
      const value = JSON.parse(raw);
      if (value && Number.isSafeInteger(value.total) && value.total >= 0 &&
          value.byModel && typeof value.byModel === 'object' && !Array.isArray(value.byModel) &&
          Object.values(value.byModel).every(n => Number.isSafeInteger(n) && Number(n) >= 0)) {
        return value as Records;
      }
    }
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
  const [current, setCurrent] = useState<OrigamiModel | null>(() => new URLSearchParams(location.search).get('model') === 'cup' ? MODELS.find(m => m.id === 'cup') ?? null : null);
  const [guided, setGuided] = useState(() => new URLSearchParams(location.search).get('view') === 'guided');
  const showGuided = () => {
    setCurrent(MODELS.find(m => m.id === 'cup')!); setGuided(true);
    const url = new URL(location.href); url.searchParams.set('model', 'cup'); url.searchParams.set('view', 'guided'); history.replaceState(null, '', url);
  };
  const exitModel = () => {
    setCurrent(null); setGuided(false);
    const url = new URL(location.href); url.searchParams.delete('model'); url.searchParams.delete('view'); history.replaceState(null, '', url);
  };
  const showClassic = () => {
    setGuided(false);
    const url = new URL(location.href); url.searchParams.set('view', 'classic'); history.replaceState(null, '', url);
  };
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
      try { localStorage.setItem('origami-records', JSON.stringify(next)); } catch {
        // Storage can be disabled; still keep the completion for this session.
      }
      return next;
    });
  };

  if (editing) {
    return <Editor onExit={() => setEditing(false)} />;
  }

  if (current) {
    if (guided && current.id === 'cup') return <GuidedNavigator model={current} onExit={exitModel} onClassic={showClassic} onComplete={() => recordComplete(current)} />;
    return (
      <Navigator
        model={current}
        onExit={exitModel}
        onTryGuided={current.id === 'cup' ? showGuided : undefined}
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
      <header className="lib-header">
        <div className="lib-header-top">
          <p className="eyebrow">
            <span className="rule" />
            PAPER, PLAY & POSSIBILITY
          </p>
          <LangToggle />
        </div>
        <div className="family-hero">
          <div className="hero-copy">
            <p className="hero-kicker">いちまいの紙から、いっしょに。<span lang="en">A little paper. A little wonder.</span></p>
            <h1><span lang="ja">折り紙ジェネレーター</span><span className="brand-english" lang="en">Origami Generator</span></h1>
            <p className="hero-en"><span lang="ja">好きな作品を選んで、ひと折りずつ。<br />親子で「できた！」を楽しもう。</span><span lang="en">Pick a favorite, follow each fold, and share the joy of making.</span></p>
            <a className="start-link" href="#model-library">作品をえらぶ <span lang="en">Let’s fold</span> <span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-paper" aria-hidden="true">
            <div className="paper-orbit" />
            <svg viewBox="0 0 360 300" fill="none">
              <path d="M40 209Q69 268 124 246" stroke="#d8b64f" strokeWidth="2" strokeDasharray="5 8" />
              <path d="M68 100L179 156L293 69L221 201L179 156L132 202Z" fill="#6aa78d" />
              <path d="M68 100L179 156L132 202Z" fill="#a3d3b7" />
              <path d="M179 156L293 69L202 170Z" fill="#d4ead9" />
              <path d="M132 202L179 156L202 170L221 201L161 187Z" fill="#438b72" />
              <path d="M221 201L277 216L245 167Z" fill="#89bca3" />
              <path d="M277 216L245 167L283 189Z" fill="#c6e1cf" />
              <path d="M79 54L84 67L98 72L84 77L79 91L74 77L60 72L74 67Z" fill="#efc966" />
              <circle cx="298" cy="131" r="7" fill="#efb6a6" />
              <path d="M240 38L249 43L244 52L235 47Z" fill="#aebfe3" />
              <path d="M65 178L53 181M58 170L60 189" stroke="#e49b87" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="paper-note">小さな「できた！」を、毎日に。<small>A little win, one fold at a time.</small></span>
          </div>
        </div>
        <div className="record-chip">
          <span className="chip-key">あなたのきろく / YOUR JOURNEY</span>
          <span className="chip-label">{L(rankTitle)}</span>
          <span className="chip-sep" />
          <span className="chip-key">できた作品 / FOLDED</span>
          <span className="chip-label">{records.total}</span>
        </div>
      </header>

      <h2 className="section-title" id="model-library">
        <span>今日は、なにを折ろう？</span>
        <span className="en" lang="en">What will you make today?</span>
        <span className="line" />
      </h2>

      <div className="guided-trial-banner">
        <p>ひと折りずつ、いっしょに。<small lang="en">A new way to fold along. Try the guided paper cup.</small></p>
        <button onClick={showGuided}>コップで新しい案内を試す →<small lang="en">Try the guided cup →</small></button>
      </div>
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
                <span>{c.label.ja}<small lang="en">{c.label.en}</small></span>
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
            <span>すべて<small lang="en">All</small></span>
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
                <span>{levelLabel(lv).ja}<small lang="en">{levelLabel(lv).en}</small></span>
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
            <div className="work-en" lang={lang === 'ja' ? 'en' : 'ja'}>{lang === 'ja' ? m.name.en : m.name.ja}</div>
            {MODEL_NOTES[m.id] && <div className="model-note">{L(MODEL_NOTES[m.id])}</div>}
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
