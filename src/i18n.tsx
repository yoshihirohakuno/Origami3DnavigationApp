import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LocalizedText } from './engine/types';

/**
 * 操作・折り方の表示言語。ブランドとライブラリの見出し・作品名は日英併記。
 * 作品データと案内文は LocalizedText{ja,en} で保持する。
 * 折り方の長い文章は選択言語、一覧の作品名は選択言語を主・もう一方を副に表示。
 */
export type Lang = 'ja' | 'en';

const STORAGE_KEY = 'origami-lang';

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ja' || saved === 'en') return saved;
  } catch {
    /* localStorage が使えない環境では自動判定にフォールバック */
  }
  const nav = typeof navigator === 'undefined' ? '' : navigator.language || '';
  return nav.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

/** UI 文言。作品データと同じ LocalizedText で持つ */
const DICT = {
  eyebrow: { ja: 'ORIGAMI NAVIGATION', en: 'ORIGAMI NAVIGATION' },
  heroLine1: { ja: '折り紙ジェネレーター', en: 'Origami Generator' },
  heroLine2: { ja: 'Origami Generator', en: '折り紙ジェネレーター' },
  heroSub: {
    ja: '一工程ずつ再生して、回して確かめながら折れます。',
    en: 'Play it step by step and turn it to any angle as you fold.',
  },
  rank: { ja: 'RANK', en: 'RANK' },
  folded: { ja: 'FOLDED', en: 'FOLDED' },
  selectModel: { ja: '作品を選ぶ', en: 'Select a model' },
  selectModelTag: { ja: 'SELECT A MODEL', en: 'SELECT A MODEL' },
  stepsMeta: { ja: `${'{n}'}工程`, en: `${'{n}'} steps` },
  minutesMeta: { ja: `${'{n}'}分`, en: `${'{n}'} min` },
  comingSoon: { ja: '準備中', en: 'COMING SOON' },
  libraryNote: {
    ja: `収録${'{n}'}作品。折り目をつけるためだけの「折る・戻す」は省略しています。`,
    en: `${'{n}'} models. Fold-and-unfold steps used only to make reference creases are omitted.`,
  },
  editorLink: { ja: 'モデルエディタ — 工程データ作成(β)', en: 'Model editor — build fold data (beta)' },
  backToLibrary: { ja: 'ライブラリへ戻る', en: 'Back to library' },
  complete: { ja: '完成', en: 'Complete' },
  toGo: { ja: `残り${'{n}'}工程`, en: `${'{n}'} to go` },
  front: { ja: '正面', en: 'Front' },
  markFolded: { ja: '完成を記録', en: 'Mark folded' },
  route: { ja: '工程', en: 'Route' },
  routeList: { ja: '工程一覧', en: 'Step list' },
  stepN: { ja: `工程${'{n}'}`, en: `Step ${'{n}'}` },
  stepComplete: { ja: 'この工程は完了', en: 'Step complete' },
  beforeFold: { ja: '折る前', en: 'Before folding' },
  stepInProgress: { ja: '折りの途中', en: 'Fold in progress' },
  reset: { ja: '最初から', en: 'Reset' },
  back: { ja: '戻る', en: 'Back' },
  next: { ja: '次へ', en: 'Next' },
  final: { ja: '完成形', en: 'Final' },
  play: { ja: '再生', en: 'Play' },
  pause: { ja: '一時停止', en: 'Pause' },
  stepSlider: { ja: '工程スライダー', en: 'Step slider' },
  completedEyebrow: { ja: 'COMPLETED', en: 'COMPLETED' },
  foldedUp: { ja: `「${'{name}'}」を折りあげました`, en: `You folded the ${'{name}'}.` },
  beautifully: { ja: 'きれいに折れました。', en: 'Beautifully folded.' },
  foldAgain: { ja: 'もう一度折る', en: 'Fold again' },
  library: { ja: 'ライブラリ', en: 'Library' },
  isComplete: { ja: `「${'{name}'}」— 完成です。`, en: `Your ${'{name}'} is complete.` },
  collapse: { ja: 'たたむ', en: 'Collapse' },
  collapseHint: { ja: 'つながった紙を動かす', en: 'move connected layers' },
  difficulty: { ja: '難易度', en: 'Difficulty' },
  langLabel: { ja: '言語', en: 'Language' },
  filterLabel: { ja: '種類でしぼる', en: 'Filter by kind' },
  filterKind: { ja: '種類', en: 'Kind' },
  filterLevel: { ja: '難易度', en: 'Level' },
  filterLevelLabel: { ja: '難易度でしぼる', en: 'Filter by level' },
  filterAll: { ja: 'すべて', en: 'All' },
  filterReset: { ja: 'しぼり込みを解除', en: 'Clear filters' },
  countModels: { ja: `${'{n}'}作品`, en: `${'{n}'} models` },
  noMatch: { ja: 'この種類の作品はまだありません。', en: 'No models in this category yet.' },
  levelPrefix: { ja: '難易度', en: 'Level' },
  hintTitle: { ja: '使い方', en: 'How it works' },
  hintDrag: { ja: '3Dはドラッグで回せます。ピンチ/ホイールで拡大。', en: 'Drag to turn the model. Pinch or scroll to zoom.' },
  hintSlider: { ja: 'スライダーで折りの途中まで戻せます。', en: 'Drag the slider to scrub through a fold.' },
  hintList: { ja: '工程を選ぶと、その折りを完了するまで再生します。', en: 'Select a step to play that fold through to completion.' },
  hintClose: { ja: 'はじめる', en: 'Got it' },
  showHint: { ja: '使い方', en: 'How it works' },
  hintKeys: {
    ja: 'キーボード: ← → で工程送り、スペースで再生、Esc で一覧へ。',
    en: 'Keys: ← → to step, Space to play, Esc for the library.',
  },
  share: { ja: '完成をシェア', en: 'Share it' },
  shareDone: { ja: 'シェアしました', en: 'Shared' },
  shareCopyHint: { ja: 'この文をコピーしてシェアしてください', en: 'Copy this text to share' },
  shareTitle: { ja: '折り紙ジェネレーター', en: 'Origami Generator' },
  shareText: {
    ja: `折り紙ジェネレーターで「${'{name}'}」を折りました。`,
    en: `I folded the ${'{name}'} with Origami Generator.`,
  },
} satisfies Record<string, LocalizedText>;

export type DictKey = keyof typeof DICT;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** UI 文言を引く。{n} / {name} は第2引数で置換する */
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  /** 作品データの LocalizedText を今の言語で読む */
  L: (text: LocalizedText) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    // ページ全体の言語属性とタイトルも合わせる(スクリーンリーダー・検索向け)
    document.documentElement.lang = lang;
    document.title =
      lang === 'ja'
        ? '折り紙ジェネレーター / Origami Generator'
        : 'Origami Generator / 折り紙ジェネレーター';
  }, [lang]);

  const value = useMemo<LangCtx>(() => {
    const setLang = (l: Lang) => {
      setLangState(l);
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* 保存できなくても表示は切り替わる */
      }
    };
    const t: LangCtx['t'] = (key, vars) => {
      let s = DICT[key][lang];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    };
    return { lang, setLang, t, L: (text) => text[lang] };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

/** ヘッダーに置く JA / EN の切り替え */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`lang-toggle${className ? ' ' + className : ''}`} role="group" aria-label={t('langLabel')}>
      {(['ja', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'on' : ''}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
        >
          {l === 'ja' ? '日本語' : 'EN'}
        </button>
      ))}
    </div>
  );
}

/**
 * このモジュールは React Context を作っているので、HMR で差し替わると
 * 既存のツリーが古い Context を参照し続けて useLang が例外を投げる
 * (開発中に文言を1語足しただけで画面が真っ暗になる)。
 * 変更時はページごと作り直す。
 */
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot?.invalidate();
  });
}
