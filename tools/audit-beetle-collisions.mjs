import { beetleStudy as model } from '../src/experiments/beetleStudy.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from './panel-intersections.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const triangles=paperTriangles(model), findings=[];
const subdivisions=Number(process.argv[2]??8);
if(!Number.isInteger(subdivisions)||subdivisions<1||subdivisions>64)throw new Error('Use 1 to 64 samples per operation.');
for(let tick=0;tick<=model.steps.length*subdivisions;tick++){
 const time=tick/subdivisions;
 // Flat contacts are deliberately ignored by the geometric diagnostic.
 const pairs=intersectingPanels(triangles,computeFoldState(model,time).positions,5);
 if(pairs.length)findings.push({time,operation:Math.floor(time)+1,pairs});
}
mkdirSync('tools/.zu',{recursive:true});
writeFileSync('tools/.zu/beetle-crossings.json',JSON.stringify({model:model.id,findings},null,2));
console.log(JSON.stringify({samples:model.steps.length*subdivisions+1,samplesWithCrossings:findings.length,first:findings.slice(0,8)},null,2));
