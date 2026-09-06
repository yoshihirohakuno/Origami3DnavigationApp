// Offline contact sheet; original artwork is opened on its publisher's site.
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FinalShapePreview } from '../src/CreasePattern.tsx';
import { MODEL_NOTES, referenceOf } from '../src/modelReferences.ts';

mkdirSync('tools/.zu', { recursive: true });
const models = [];
for (const file of readdirSync('src/models').filter(f => f.endsWith('.ts'))) {
  const mod = await import(`../src/models/${file}`);
  const model = Object.values(mod).find(v => v?.steps && v?.vertices);
  if (model) models.push(model);
}
let previewId = 0;
const svg = model => renderToStaticMarkup(createElement(FinalShapePreview, { model, size: 300 }), { identifierPrefix: `review-${previewId++}-` });
const nav = models.map(m => `<a href="#${m.id}">${m.name.ja}</a>`).join(' ');
const pages = models.map(m => `<section id="${m.id}"><header><b>${m.name.ja} / ${m.id}</b><a href="${referenceOf(m.id)}" target="_blank" rel="noopener noreferrer">原典の折り図を別タブで開く ↗</a></header>${MODEL_NOTES[m.id] ? `<p>${MODEL_NOTES[m.id].ja}</p>` : ''}<main><div><h3>現在の完成形</h3>${svg(m)}</div><div><h3>正面</h3>${svg({ ...m, cameraAngle: 0, cameraPos: [0,0,5] })}</div></main><footer>${m.steps.map((s,i) => `<figure>${svg({ ...m, steps: m.steps.slice(0,i+1), cameraAngle:0, cameraPos:[0,0,5] })}<figcaption>${i+1}. ${s.description.ja}</figcaption></figure>`).join('')}</footer></section>`).join('');
writeFileSync('tools/.zu/reference-comparison.html', `<meta charset="utf-8"><title>原典と実モデルの照合</title><style>html{scroll-padding-top:85px}body{background:#181b20;color:#eee;font:13px sans-serif;margin:0}nav{position:sticky;top:0;background:#252931;z-index:2;padding:8px;line-height:1.8}a{color:#9bd5ff;margin-right:12px}header{display:flex;flex-wrap:wrap;gap:24px;font-size:18px;padding:12px}section{border-bottom:2px solid #777;padding:0 20px 28px}main{display:flex;gap:24px;justify-content:center}main>div{text-align:center}main svg{max-width:100%;height:250px}h3{margin:6px}footer{display:flex;gap:8px;overflow:auto}figure{width:150px;flex-shrink:0;margin:12px 0}figure svg{width:150px;height:130px}figcaption{font-size:12px;line-height:1.5}</style><nav>${nav}</nav>${pages}`);
console.log(`Review ${models.length} models: http://127.0.0.1:5173/tools/.zu/reference-comparison.html`);
