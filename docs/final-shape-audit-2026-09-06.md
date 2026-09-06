# 完成形の再照合と新作 — 2026-09-06

対象は既存31作品と新作2作品、計33作品。おりがみくらぶの原典をブラウザーで直接開き、折り順、最後の輪郭、白面を出す場所、層の上下を比較した。以前の「一致」「良好」判定をそのまま引き継いでいない。

## 修正の要点

- 象の耳は胴体の下に隠れていた。面の層順を直し、耳と鼻の下の白いくさびを復元。原典は平面の簡単な象で、独立した4本の脚を折る立体作品ではない。
- 兜は帯の折る対象を誤っていた。前側の下辺を折り上げ、後ろの先は内側へ。くまのあごも、白い部分を含めた原典の輪郭に復元。
- コップは後ろのフタ→手前のフタの順。白い前フタが上になるのが正しい。裏面率だけで不良と判定しない。
- 通常の平畳み21作品を、180°の剛体回転と紙の厚みの管理へ変更。新作2作品も同じ管理を利用。ハートは折り線にまたがっていた面と動く頂点の欠落を修正。
- SVGの輪郭線に正しい座標系のclipPathを使い、既定カメラを正面に。立体作品は個別のカメラを保持。
- 新作「ピザ」7工程、「どんぐり」8工程。折り目を戻す操作と対向する角の操作は、わかりやすく工程を分けた。原典の描き足し(具・点)は最後の説明に含め、折った紙の形状と混同しない。
- 全作品から原典の折り図へリンク。バスは現行に対応する新版の図に訂正。外部の原典画像はアプリに複製していない。
- 完成時のカメラを作品の中央へ合わせ、記録ボタンを操作欄へ移動。完成形の下端をボタンが隠さないようにした。

## 全作品の確認結果

「裏面」は正面から紙の面を格子サンプリングした割合。全体の合否や原典のピクセル一致率ではない。パンダなど個別パレットや立体投影では、白い画素の割合とも異なる。

| 作品・原典 | 工程 | 裏面率 | 確認結果 |
|---|---:|---:|---|
| [どんぐり (acorn)](https://www.origami-club.com/easy/food/acom/acom2/zu.gif) | 8 | 22% | 新作。色面スタート、上下・左右の折り目を戻す。白い帽子を下にした原典の輪郭。 |
| [くまのかお (bear)](https://www.origami-club.com/rn-image/zu/bear.gif) | 9 | 28% | 修正。白いあごを復元し、口の六角形と耳の層順を確認。 |
| [ぶーつ (boots)](https://www.origami-club.com/rn-image/zu/boots.gif) | 5 | 0% | 確認。細長い筒と左へ出るつま先。色面、平畳みの層順を修正。 |
| [箱 (box)](https://www.origami-club.com/traditional/box/zu.gif) | 3 | 0% | 相違あり。現行は3工程の簡易トレイ、原典は7パネルの箱。再設計は未完。 |
| [ばす (bus)](https://www.origami-club.com/rn-image/zu/bus.gif) | 7 | 0% | 確認。現行に対応する原典は rn-image/zu/bus.gif。旧bass版とは別作品。参照を訂正。 |
| [くるま (car)](https://www.origami-club.com/rn-image/zu/car.gif) | 10 | 0% | 確認。車体と2つの車輪の輪郭、色面。窓は描き足す仕上げ。 |
| [ねこのかお (cat)](https://www.origami-club.com/easy/animal-face/cat/zu.gif) | 7 | 0% | 修正。既定カメラを正面にし、顔と耳の高さがつぶれない表示へ。 |
| [ひよこ (chick)](https://www.origami-club.com/rn-image/zu/chick.gif) | 7 | 0% | 修正。くちばしと胴の層をそろえ、不要な白い細片を解消。 |
| [鶴 (crane)](https://www.origami-club.com/rn-image/zu/crane.gif) | 15 | 19% | 相違あり。鳥基本形の一部の面がつぶれ、首が太く羽も原典と異なる。カメラだけでは直らない。画面にも再検証中と明記。 |
| [コップ (cup)](https://www.origami-club.com/fun/cup/zu.gif) | 6 | 50% | 修正。フタの前後順を訂正し、白い前フタを角の上に表示。口を開く際の辺長も検証。 |
| [犬 (dog)](https://www.origami-club.com/rn-image/zu/dogfase.gif) | 6 | 4% | 修正。耳は表色、白は口元の細い部分。旧表示の耳の白い露出を解消。 |
| [ぞう (elephant)](https://www.origami-club.com/rn-image/zu/elephant2.gif) | 7 | 13% | 修正。隠れていた耳を手前へ。鼻の下の白いくさびと平面の輪郭を照合。袋つぶしの途中は近似。 |
| [てがみ (envelope)](https://www.origami-club.com/rn-image/zu/letter.gif) | 7 | 0% | 修正。上のフラップが側面の上、先端が前帯の下に入る重なりへ。差し込みの曲面は小さな傾きで近似。 |
| [きつねのかお (fox)](https://www.origami-club.com/easy/animal-face/fox/zu.gif) | 6 | 0% | 確認。2つの尖った耳と菱形の顔。正面カメラと層順で形を保つ。 |
| [ハート (heart)](https://www.origami-club.com/rn-image/zu/easyheart.gif) | 7 | 0% | 修正。中央の面を折り線で分割し、上部の折りに欠けていた頂点を追加。 |
| [兜 (helmet)](https://www.origami-club.com/fun/kabuto/zu.gif) | 7 | 45% | 修正。帯を折る対象と奥の差し込み位置を訂正。白い帯、小さな中央三角、色付きの角。 |
| [ぱんだのかお (panda)](https://www.origami-club.com/easy/animal-face/panda/zu.gif) | 9 | 15% | 確認。原典の顔・耳・口の区切り。面の向きと色は保持。目は描き足す仕上げ。 |
| [ぺんぎん (penguin)](https://www.origami-club.com/rn-image/zu/penguin.gif) | 9 | 41% | 確認。色付きの頭と翼、白い腹。白い腹は意図した裏面。 |
| [ぴあの (piano)](https://www.origami-club.com/easy/other/piano/zu.gif) | 8 | 17% | 修正。白い鍵盤と灰色の両端。層順による三角の欠けを解消。鍵は描き足す仕上げ。 |
| [ピザ (pizza)](https://www.origami-club.com/easy/food/pizza/zu.gif) | 7 | 0% | 新作。裏返しを挟む2回の座布団折りと角の処理。8辺・中心へ集まる折り目・全体の色面を検証。具は描き足す仕上げ。 |
| [うさぎのかお (rabbit)](https://www.origami-club.com/easy/animal-face/rabbit/zu.gif) | 8 | 0% | 修正。長い耳の高さを正面から表示し、層間の不要な白い細片を解消。 |
| [おむすび (riceball)](https://www.origami-club.com/rn-image/zu/riceball.gif) | 6 | 19% | 確認。六角形の輪郭、白いご飯と色面の海苔。白面が必要な作品。 |
| [ろけっと (rocket)](https://www.origami-club.com/rn-image/zu/rocket.gif) | 8 | 83% | 確認。白い胴と色の先端。白面の多さは原典の意匠であり反転しない。 |
| [ふね (ship)](https://www.origami-club.com/rn-image/zu/ship.gif) | 3 | 37% | 確認。色付き船体と白い帆。片側に立つ帆と船底の輪郭。 |
| [手裏剣 (shuriken)](https://www.origami-club.com/fun/cross/zu.gif) | 9 | 0% | 確認。4つの先端、中央の交互の重なり、2枚の表色。前回の剛体折り修正を維持。 |
| [しんかんせん (sinkansen)](https://www.origami-club.com/rn-image/zu/sinkansen.gif) | 6 | 45% | 確認。低い車体と斜めの先頭、白い下帯。色は原典の領域に対応。 |
| [正方基本形 (square-base)](https://www.origami-club.com/rn-image/zu/crane.gif) | 5 | 0% | 中間形として確認。完成は色面の菱形。原典の袋開きとは別の折りすじ先行ルートで、途中の変形に近似。 |
| [おたまじゃくし (tadpole)](https://www.origami-club.com/rn-image/zu/tadpole.gif) | 4 | 0% | 完成輪郭を確認。胴と尾は色面。基本形を開く途中の近似は残る。 |
| [チューリップ (tulip)](https://www.origami-club.com/rn-image/zu/tulips.gif) | 6 | 0% | 修正。3つの先端と花の基部を確認。裏面の細片を解消。 |
| [かめ (turtle)](https://www.origami-club.com/rn-image/zu/turtle.gif) | 5 | 12% | 完成輪郭を確認。白い頭は原典の意図した配色。かぶせ折りの途中は近似。 |
| [水風船基本形 (waterbomb-base)](https://www.origami-club.com/fun/balloon/zu.gif) | 5 | 0% | 中間形として確認。完成は色面の三角。袋つぶしの途中に近似。 |
| [くじら (whale)](https://www.origami-club.com/rn-image/zu/whale.gif) | 6 | 11% | 既存の白い腹を残す決定済み配色を維持。尾の中割りの途中は近似。 |
| [ヨット (yacht)](https://www.origami-club.com/easy/vehicle/yacht/yacht2/yacht.gif) | 3 | 63% | 修正。白い帆と色付き船体の重なりを訂正。現行3工程に対応するyacht2版を参照。 |

## 残る課題

鶴は未修正の形状問題がある。鳥基本形の面分割、首を細くする折り、首・尾・羽を開く連動を再設計する必要がある。理想180°で基本形まで計算すると一部の面が線状につぶれるため、層順やカメラだけを直しても正しい鶴にはならない。一覧とナビに「再検証中」を表示した。

箱は原典の箱とは異なる簡易トレイ。正方基本形・水風船基本形・おたまじゃくし・象・かめ・くじらには、袋つぶしや中割り/かぶせ折りの途中で辺長が変わる既存の近似が残る。象の完成形を直したことは、この途中運動を解決したことではない。

新しい平畳みの層間移動は紙厚の表示用で、紙の衝突や摩擦、ポケット内部の曲げの物理シミュレーションではない。紙が折れる証明と誤解しない。

## 検証

- Node 24で68テスト成功。全33作品の1/4工程刻みの座標、折って戻す往復、SVG生成を確認。
- 平畳み23作品は全パネル内の全頂点ペアの距離を全工程で検証(誤差1e-8未満)。手裏剣とコップ開口は既存回帰も確認。
- 象の耳と胴の上下関係、兜の帯と下端、くまの白いあご、新作の全面積・輪郭・表裏を個別検証。
- TypeScript + Viteビルド成功。lintはエラーなし、既存のFast Refreshと旧solverの警告6件。
- ブラウザーで新作の全工程と完成形、象・兜の3D表示を確認。390×844のスマートフォン幅でも完成形と操作ボタンが重ならないことを確認。
- 通常のnpm testは環境の子プロセス起動制限で実行できず、同じテストを次のコマンドで実行した。

```powershell
node --import ./tools/register-typescript.mjs --test --test-isolation=none tests/origami.test.mjs
npm run build
npm run lint
npm run audit:models
npm run audit:references
```

監査HTMLは tools/.zu/gallery.html と tools/.zu/reference-comparison.html に生成する。ローカル専用でGitには含めない。
