import { dragonStripStudy } from './dragonStripStudy';
import { triangularPetalStudy } from './triangularPetalStudy';
import { computeFoldState, foldSign } from '../engine/fold';

// Exact paper mechanism, not a claim that the reference's complete crease
// pattern has been reconstructed. The root offset and side creases remain
// provisional until the material layers in diagrams 37–39 are matched.
// 1/8 is a provisional root inset, still awaiting reference material matching.
// For that inset, the three circle constraints close in the plane when the
// half-width is (28 - 5*sqrt(7))/24. It is derived, not tuned to a screenshot.
const model=triangularPetalStudy(dragonStripStudy,5,44,38,1/8,(28-5*Math.sqrt(7))/24);
model.steps.push({folds:[{axis:[9,8],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:180,direction:1}],
  description:{ja:'中央の形をつぶさず、紙全体を裏返します。',en:'Turn the whole sheet over without flattening the central shape.'}});
const p=computeFoldState(model,model.steps.length).positions;
if(model.faces.some(f=>f.some(i=>p[i].x< -1e-8)&&f.some(i=>p[i].x>1e-8)))
  throw new Error('Dragon center crease must divide every crossing panel before the body fold');
const fold={axis:[1,4] as [number,number],moving:p.flatMap((v,i)=>v.x< -1e-8?[i]:[]),type:'valley' as const,angle:180};
model.steps.push({folds:[{...fold,direction:foldSign(fold,p) as 1|-1}],
  description:{ja:'左の半分を右へ重ね、三角を半分に折ります。',en:'Bring the left half over the right half to fold the triangle in half.'},
  caution:{ja:'未完成の構造比較です。中央の折り位置と層を見本と照合中です。次の袋つぶし、頭・腕・脚・翼・尾は未完成です。',
    en:'Unfinished mechanism comparison. Central creases and layers are under review. The next squash, head, arms, legs, wings and tail are unfinished.'}});
export const dragonCentralStudy=model;
