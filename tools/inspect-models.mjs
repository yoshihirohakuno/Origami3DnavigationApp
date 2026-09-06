// Run with npm run audit:models (Node 24).
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FinalShapePreview } from '../src/CreasePattern.tsx';
import { computeFoldState } from '../src/engine/fold.ts';
import { auditModel } from './audit-cover.mjs';

mkdirSync('tools/.zu', { recursive: true });
const reports = [], cards = [];
for (const file of readdirSync('src/models').filter(f => f.endsWith('.ts'))) {
  const mod = await import(`../src/models/${file}`);
  const m = Object.values(mod).find(v => v?.steps && v?.vertices);
  if (!m) continue;
  const edges = m.faces.flatMap(f => f.map((a, i) => [a, f[(i + 1) % f.length]]));
  const orig = computeFoldState(m, 0).positions;
  let worst = { error: 0 }, roundTrips = [];
  for (let t = 0; t <= m.steps.length; t += 0.25) {
    const p = computeFoldState(m, t).positions;
    for (const [a,b] of edges) {
      const error = Math.abs(p[a].distanceTo(p[b]) - orig[a].distanceTo(orig[b]));
      if (error > worst.error) worst = { error, t, edge: [a,b] };
    }
  }
  m.steps.forEach((s,i) => {
    if (s.folds.every(o => o.type === 'unfold') && i > 0) {
      const before = computeFoldState(m, i - 1).positions;
      const after = computeFoldState(m, i + 1).positions;
      roundTrips.push({ step: i + 1, error: Math.max(...before.map((p,j) => p.distanceTo(after[j]))) });
    }
  });
  const back = await auditModel(m, {grid:60});
  reports.push({id:m.id, name:m.name.ja, steps:m.steps.length, back, worst, roundTrips});
  console.log(m.id.padEnd(15), 'edge', worst.error.toFixed(3), 't',worst.t, 'unfold', Math.max(0,...roundTrips.map(x => x.error)).toFixed(4));
  cards.push(`<article><h3>${m.name.ja} / ${m.id}</h3>${renderToStaticMarkup(createElement(FinalShapePreview,{model:m,size:190}))}<p>裏面 ${back.at(-1)}%</p></article>`);
}
writeFileSync('tools/.zu/audit-results.json', JSON.stringify(reports,null,2));
writeFileSync('tools/.zu/gallery.html', `<meta charset="utf-8"><style>body{background:#15171c;color:#eee;font:13px sans-serif;margin:12px}main{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}article{background:#24272e;text-align:center}h3{font-size:12px;margin:8px}p{margin:4px}</style><main>${cards.join('')}</main>`);
