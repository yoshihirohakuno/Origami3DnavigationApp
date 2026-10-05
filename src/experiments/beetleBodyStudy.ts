import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { foldFlap } from '../engine/foldFlap';
import type { OrigamiModel } from '../engine/types';
import { beetleSourceBase } from './beetleSourceBase';

/** Faceted body-shell comparison, not a finished beetle. The inner pages
 * and front shoulders bend on the spine; the flat appendages are preserved.
 * Rotating entire material halves instead intersects the pleated leg roots. */
export function createBeetleBodyShell(base:OrigamiModel,backCapDepth=.08){
if(!Number.isFinite(backCapDepth)||backCapDepth<=0||backCapDepth>=.25)throw new Error('Invalid body back-cap depth');
let model:OrigamiModel=structuredClone(base);
const basePose=computeFoldState(model,model.steps.length).positions;
function bodyPageSeed(diagonal:number,side:1|-1){
 const face=model.faces.find(f=>f.includes(0)&&f.includes(diagonal)&&f.some(i=>basePose[i].x*side>.01));
 if(!face)throw new Error('Missing inner body page');
 return face.reduce((best,i)=>basePose[i].x*side>basePose[best].x*side?i:best,face[0]);
}
// These are points on the two opposed inner diagonal fans, not coincident
// vertices belonging to a horn or to a different paper layer.
const beetleBodyPageSeeds=[bodyPageSeed(51,1),bodyPageSeed(51,-1),bodyPageSeed(57,1),bodyPageSeed(57,-1)];
const beetleBodyCapStart=model.steps.length;
model=foldConnectedFlap(model,0,[0,-backCapDepth],0,{
 description:{ja:'背中の閉じた先を、平らなうちに内側へ折ります。',en:'Tuck the closed back point inward while the body is flat.'},
 caution:{ja:'立体に開く前に、背中の先を整えます。',en:'Shape this point before opening the body in 3D.'},
},'back');

// Refine the actual folded material along the spine, including the broad
// front shoulders. Removing the temporary authoring operation retains its
// material bindings; the new creases bend only during the opening below.
model=foldFlap(model,2,[0,0],90,{description:{ja:'',en:''}},'front',false,1);
model.steps.pop();
const p=computeFoldState(model,model.steps.length).positions;
const used=[...new Set(model.faces.flat())];
const graph=new Map(used.filter(i=>Math.abs(p[i].x)>1e-8).map(i=>[i,new Set<number>()]));
for(const face of model.faces){
 const points=face.filter(i=>graph.has(i));
 for(const a of points)for(const b of points)graph.get(a)!.add(b);
}
function page(seed:number){
 if(!graph.has(seed))throw new Error('The body page seed lies on the hinge');
 const moving=new Set([seed]),queue=[seed];
 while(queue.length)for(const i of graph.get(queue.pop()!)!)if(!moving.has(i)){moving.add(i);queue.push(i);}
 return [...moving];
}
const beetleBodyPages=beetleBodyPageSeeds.map(page);
if(new Set(beetleBodyPages.flat()).size!==beetleBodyPages.flat().length)throw new Error('Body pages must be distinct');
if(beetleBodyPages.flat().some(i=>i<13))throw new Error('Opening the body must leave appendage tips and joints in place');
const beetleBodyOpenStart=model.steps.length;
const beetleBodyOpeningAngle=20;
model.steps.push({
 description:{ja:'胴体の内側の層を開き、背中に厚みをつけます。',en:'Open the inner body layers to give the back depth.'},
 caution:{ja:'内側の層と前脚の付け根が一緒に曲がります。丸みは直線の折り面で近似した、未完成の構造試作です。袋の開き方、表裏と角の仕上げを確認中です。',en:'The inner layers and front shoulders bend together. This unfinished study approximates the curved back with straight folded panels. Pocket opening, paper sides and horn shaping remain under review.'},
 folds:beetleBodyPages.map((moving,j)=>({axis:[0,9],moving,type:'valley',angle:beetleBodyOpeningAngle,direction:([1,-1,-1,1] as const)[j]})),
});
model.id='beetle-body-study';
model.name={ja:'カブトムシ・背中の立体化試作',en:'Beetle body-shell study'};
return {model,beetleBodyPageSeeds,beetleBodyCapStart,beetleBodyPages,beetleBodyOpenStart,beetleBodyOpeningAngle};
}
const body=createBeetleBodyShell(beetleSourceBase);
export const {beetleBodyPageSeeds,beetleBodyCapStart,beetleBodyPages,beetleBodyOpenStart,beetleBodyOpeningAngle}=body;
export const beetleBodyStudy=body.model;
