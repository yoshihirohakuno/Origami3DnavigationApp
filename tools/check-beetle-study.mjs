import {beetleStudy as m,beetleLandmarks} from '../src/experiments/beetleStudy.ts';
import {computeFoldState} from '../src/engine/fold.ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FinalShapePreview} from '../src/CreasePattern.tsx';
import {writeFileSync,mkdirSync} from 'node:fs';
const initial=computeFoldState(m,0).positions;
console.log({operations:m.steps.length,vertices:m.vertices.length,faces:m.faces.length});
let worst={error:0};
for(let t=0;t<=m.steps.length;t+=.125){const p=computeFoldState(m,t).positions;for(const f of m.faces)for(const a of f)for(const b of f){const error=Math.abs(p[a].distanceTo(p[b])-initial[a].distanceTo(initial[b]));if(error>worst.error)worst={error,t,a,b};}}
console.log(worst);
const final=computeFoldState(m,m.steps.length).positions;
console.log(Object.fromEntries(Object.entries(beetleLandmarks).map(([key,v])=>[key,[v].flat().map(i=>[i,...final[i].toArray()])])));
mkdirSync('tools/.zu',{recursive:true});
writeFileSync('tools/.zu/beetle-study.html',`<meta charset="utf-8"><body style="background:#faf9f3">${renderToStaticMarkup(createElement(FinalShapePreview,{model:m,size:600}))}</body>`);
