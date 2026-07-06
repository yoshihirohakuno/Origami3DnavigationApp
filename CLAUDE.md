# おりがみナビ / Origami Navi

折り紙の折り方を3Dで工程ナビゲーションするスマホ+PC向けWebアプリ(折り紙版Google Maps)。
Vite + React + TypeScript + three.js。リモート: https://github.com/yoshihirohakuno/Origami3DnavigationApp

## 現在の状態と次の作業

**次の作業 = 鶴の完成。** 手順・確立済み手法・層順の解析結果は README.md の
「引き継ぎメモ:鶴の続き」セクションに詳細があるので必ず先に読むこと。
要約: 正方基本形まで完成済み → 花弁折り(petal fold)を「既知の平坦終状態への
連鎖±180°回転」で作る(前面フラップ=S1+S2)→ 鶴の基本形 → 中割り折りで首・尾・頭 → 翼。

## アーキテクチャ(詳細は README)

- 作品 = 工程データ(`src/models/*.ts`)。展開図頂点+面+工程列。動画・画像は持たない
- エンジン: `src/engine/fold.ts` — タイムライン位置tから毎フレーム全頂点をクォータニオン回転で計算。
  1工程に複数の折り(FoldOp)。工程内は連鎖適用(後のopの軸は前のopの移動後の位置)
- 折り種類: valley / mountain / inside-reverse(中割り=約180°回転で層が入替わる)/ outside-reverse。
  `direction: 1|-1` で回転符号を明示可(基本形のたたみ込み用)
- 面は折り線で必ず事前分割(`src/engine/split.ts` = エディタの面分割ツール)
- 描画: `src/three/PaperScene.ts`(React非依存)。UI: Navigator.tsx(ナビ画面)、Editor.tsx(工程データ作成ツール)

## 作業ルール

- デザイン: 大人向けダーク和モダン(墨#0e0f12+朱#e0492f、Shippori Mincho / Space Grotesk)。
  絵文字・ポップな装飾は使わない。全テキストは日英併記(`LocalizedText { ja, en }`)
- 検証: `npx tsc -b` → `npm run dev` でブラウザ確認。ナビ画面では
  `window.__origami.setT(t)` でタイムラインを直接操作できる(E2E検証用フック)
- 幾何の検証: `node tools/solve-collapse.mjs`(基本形の符号・層順ソルバ)。
  新しい折りたたみも同様のソルバを tools/ に足して総当たりで解く
- 折り先が辺・折り線に重なる座標は厳密値で計算する(近似だとはみ出す。例: コップの s=2-√2)
- **作業が一段落したら必ずコミットして origin/main にプッシュする**(ユーザーの常時指示)
