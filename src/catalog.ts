import type { LocalizedText } from './engine/types';

/**
 * ライブラリの分類と難易度ラベル(2026-08-10 追加)。
 *
 * 作品データ(src/models/*.ts)は幾何と工程だけに集中させたいので、
 * 「見せ方のための分類」はここに一覧で持つ。作品を足したら CATEGORY_OF に
 * 1行足すだけでよい(足し忘れると 'other' 扱いになり、絞り込みの「すべて」には
 * 出るので画面から消えることはない)。
 */

export type CategoryId =
  | 'face'
  | 'animal'
  | 'vehicle'
  | 'useful'
  | 'play'
  | 'decorate'
  | 'basic'
  | 'other';

export const CATEGORIES: { id: CategoryId | 'all'; label: LocalizedText }[] = [
  { id: 'all', label: { ja: 'すべて', en: 'All' } },
  { id: 'face', label: { ja: 'かお', en: 'Faces' } },
  { id: 'animal', label: { ja: 'どうぶつ', en: 'Animals' } },
  { id: 'vehicle', label: { ja: 'のりもの', en: 'Vehicles' } },
  { id: 'useful', label: { ja: 'つかう', en: 'Useful' } },
  { id: 'play', label: { ja: 'あそぶ', en: 'Play' } },
  { id: 'decorate', label: { ja: 'かざる', en: 'Decorate' } },
  { id: 'basic', label: { ja: 'きほん', en: 'Basics' } },
];

export const CATEGORY_OF: Record<string, CategoryId> = {
  dog: 'face',
  cat: 'face',
  fox: 'face',
  rabbit: 'face',
  panda: 'face',
  bear: 'face',
  chick: 'animal',
  penguin: 'animal',
  whale: 'animal',
  crane: 'animal',
  yacht: 'vehicle',
  ship: 'vehicle',
  rocket: 'vehicle',
  cup: 'useful',
  box: 'useful',
  shuriken: 'play',
  helmet: 'play',
  tulip: 'decorate',
  heart: 'decorate',
  'square-base': 'basic',
};

export function categoryOf(id: string): CategoryId {
  return CATEGORY_OF[id] ?? 'other';
}

/**
 * 難易度(1〜5)の呼び名。ドット5個だけだと差が伝わらないので文字でも出す。
 * 数値は「工程数 + 層の扱いの難しさ」でつけている:
 *   1 = 1〜2層の平畳み(6〜7工程)
 *   2 = 帯や立体、層の折り分けが入る(6〜9工程)
 *   3 = 中心を越えるフラップや2枚組み(9工程)
 *   5 = 基本形から作る多工程(15工程)
 */
export const LEVEL_LABEL: Record<number, LocalizedText> = {
  1: { ja: '初級', en: 'Easy' },
  2: { ja: '中級', en: 'Medium' },
  3: { ja: '上級', en: 'Hard' },
  4: { ja: '熟練', en: 'Advanced' },
  5: { ja: '名人', en: 'Master' },
};

export function levelLabel(n: number): LocalizedText {
  return LEVEL_LABEL[n] ?? LEVEL_LABEL[1];
}

/** 実際に使われている難易度を小さい順に返す(絞り込みチップ用) */
export function usedLevels(models: { difficulty: number }[]): number[] {
  return [...new Set(models.map((m) => m.difficulty))].sort((a, b) => a - b);
}
