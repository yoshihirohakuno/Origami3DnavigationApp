/**
 * 「各工程で表・裏どちらの面が見えているか」を数値で出す点検ツール(2026-08-15 追加)。
 *
 * 折り図と突き合わせるときに使う。**山折り/谷折りの向き違い・表裏の初期向き違い・
 * 2枚重ねのフラップの層順の間違い**は、どれもこの数値に出る。
 *
 * 使い方(`npm run dev` でナビ画面を開き、ブラウザのコンソールから):
 *
 *   const { auditAll } = await import('/tools/audit-cover.mjs');
 *   console.log(await auditAll());
 *
 * 出力は作品ごとに「t=0(展開)から最終工程まで」の **`sheetColors.back` が
 * 見えている面積の割合(%)**。back はふつう白い裏面(ぱんだは炭、箱は内側の色)。
 *
 *   turtle       100 1 100 54 0 12
 *                 ↑t0(白面スタート)      ↑完成形(頭だけ白=12%)
 *
 * 読み方:
 * - t0 が 0 なら色面スタート、100 なら白面スタート。**折り図❶と一致するか**を見る
 * - 「折り目をつけて戻す」の直後は t0 と同じ値に戻るはず
 * - 各工程の値を折り図のパネルと見比べる。折り図が一面の色なのに 50 を超えていたら、
 *   だいたい層順(2枚重ねのフラップの前後)が入れ替わっていない
 *
 * 面の向きは Newell 法で多角形全体から求める(先頭3頂点が退化していても正しい)。
 * 見えている面は「その点を含む面のうち平面 z が最大のもの」で決める(描画と同じ)。
 */

const IDS = [
  'tulip', 'dog', 'cup', 'chick', 'squareBase', 'crane', 'shuriken', 'cat', 'fox',
  'rabbit', 'panda', 'bear', 'whale', 'helmet', 'heart', 'box', 'yacht', 'penguin',
  'ship', 'rocket', 'envelope', 'piano', 'turtle', 'sinkansen', 'boots',
];

/** 面の法線の z 成分(Newell法)。負なら back(裏)が見えている */
function normalZ(P, f) {
  let s = 0;
  for (let i = 0; i < f.length; i++) {
    const a = P[f[i]];
    const b = P[f[(i + 1) % f.length]];
    s += (a.x - b.x) * (a.y + b.y);
  }
  return s;
}

function inPolygon(P, f, x, y) {
  let c = false;
  for (let i = 0, j = f.length - 1; i < f.length; j = i++) {
    const a = P[f[i]];
    const b = P[f[j]];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/** 面の平面上の z(重心と Newell 法線から) */
function planeZ(P, f, x, y) {
  let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < f.length; i++) {
    const a = P[f[i]];
    const b = P[f[(i + 1) % f.length]];
    nx += (a.y - b.y) * (a.z + b.z);
    ny += (a.z - b.z) * (a.x + b.x);
    nz += (a.x - b.x) * (a.y + b.y);
    cx += a.x; cy += a.y; cz += a.z;
  }
  cx /= f.length; cy /= f.length; cz /= f.length;
  if (Math.abs(nz) < 1e-9) return cz;
  return cz - (nx * (x - cx) + ny * (y - cy)) / nz;
}

/** 工程 t の「裏面が見えている割合(%)」。detail:true なら面ごとの内訳も返す */
export async function coverage(model, t, { grid = 120, detail = false } = {}) {
  const { computeFoldState } = await import('/src/engine/fold.ts');
  const P = computeFoldState(model, t).positions;
  const xs = P.map((p) => p.x);
  const ys = P.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  let hit = 0, back = 0;
  const per = new Map();
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / grid;
      const y = y0 + ((y1 - y0) * (j + 0.5)) / grid;
      let best = -1;
      let bz = -Infinity;
      model.faces.forEach((f, fi) => {
        if (!inPolygon(P, f, x, y)) return;
        const z = planeZ(P, f, x, y);
        if (z > bz) { bz = z; best = fi; }
      });
      if (best < 0) continue;
      hit++;
      const isBack = normalZ(P, model.faces[best]) < 0;
      if (isBack) back++;
      if (detail) {
        const k = `${best}[${model.faces[best].join(',')}]:${isBack ? '裏' : '表'}`;
        per.set(k, (per.get(k) ?? 0) + 1);
      }
    }
  }
  const pct = hit ? Math.round((100 * back) / hit) : 0;
  if (!detail) return pct;
  const rows = [...per].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +((100 * v) / hit).toFixed(1)]);
  return { back: pct, faces: Object.fromEntries(rows) };
}

/** 1作品ぶん。t=0 から最終工程までの裏面% を配列で返す */
export async function auditModel(model, opts) {
  const out = [];
  for (let t = 0; t <= model.steps.length; t++) out.push(await coverage(model, t, opts));
  return out;
}

/** 全作品。表示用の文字列を返す */
export async function auditAll(opts) {
  const lines = [];
  for (const id of IDS) {
    const mod = await import(`/src/models/${id}.ts?audit=${Date.now()}`);
    const model = Object.values(mod).find((v) => v && v.steps && v.vertices);
    const a = await auditModel(model, opts);
    lines.push(model.id.padEnd(12) + a.join(' '));
  }
  return lines.join('\n');
}
