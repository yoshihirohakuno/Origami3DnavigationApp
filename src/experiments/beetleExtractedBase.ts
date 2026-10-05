import type { OrigamiModel } from '../engine/types';
import { computeFoldState } from '../engine/fold';
import { foldFlap } from '../engine/foldFlap';
import { createBeetlePetalBase } from './beetlePetalBase';

/** Development-only alternative to the old straight tip-out folds.
 * Reverse a whole corner kite together with its shared shoulder. Split the
 * inner body panels on the real hinge so the shoulder can move without tearing.
 * Existing petal tips stay raised until extraction ends, keeping them out of
 * the hinge's path. Parking the remaining quadrants is structural preparation,
 * not a guide-crease fold and unfold. This is not a finished beetle. */
let model: OrigamiModel = createBeetlePetalBase(true);
export const extractedBaseStart = model.steps.length;
export const extractedKiteSteps: number[] = [];
export const extractedLayerFlipSteps: number[] = [];
export const extractedKitePoints = [[9,3],[10,5],[11,7],[12,1]] as const;
for (const [corner,joint,sx,sy] of [[9,3,1,1],[10,5,-1,1],[11,7,-1,-1],[12,1,1,-1]]) {
  const p=computeFoldState(model,model.steps.length).positions;
  // Each original square quadrant is one layer in the folded base. Keep the
  // active quadrant flat; fold both halves of the other three beside the spine.
  const sets=[-1,1].map(side=>p.flatMap((v,i)=>v.x*side>1e-8&&
    !(model.vertices[i][0]*sx>=-1e-8&&model.vertices[i][1]*sy>=-1e-8)?[i]:[]));
  for (let j=0;j<2;j++) model.steps.push({
    description:{ja:j===0?'他の層の左半分を背中の中心線でよけます。':'他の層の右半分もよけ、開く層を平らに残します。',
      en:j===0?'Hold the left halves of the other layers aside along the spine.':'Hold their right halves aside, leaving the active layer flat.'},
    folds:[{axis:[0,22],moving:sets[j],angle:90,direction:j===0?1:-1,type:'valley'}],
  });
  // The blintz corner's two halves initially lie underneath the body.
  // Reverse them on their original material edges before extracting the
  // inner corner. Merely flipping the little point leaves these layers below.
  const outerPairs: Record<number, [number, number][]> = {
    9:[[21,2],[23,4]],10:[[25,4],[27,6]],11:[[29,6],[31,8]],12:[[33,8],[35,2]],
  };
  for(const [rim,edge] of outerPairs[corner]) {
    const pose=computeFoldState(model,model.steps.length).positions;
    extractedLayerFlipSteps.push(model.steps.length);
    model.steps.push({
      description:{ja:'内側に重なった一枚を、もとの辺で表側へ返します。',en:'Turn the inner layer onto the front along its original edge.'},
      folds:[{axis:[joint,edge],moving:[rim],angle:180,type:'valley',direction:pose[rim].x>0?-1:1}],
    });
  }
  extractedKiteSteps.push(model.steps.length);
  model=foldFlap(model,joint,[0,-.5],0,{
    description:{ja:'内側の角を出すのと同時に、付け根の層を折り返します。',
      en:'Extract the inner corner while reversing its connected shoulder layer.'},
  },'back',false,-1,f=>f.includes(joint)&&!f.includes(corner));
  model.steps.at(-1)!.folds[0].moving.push(corner);
  for (let j=1;j>=0;j--) model.steps.push({
    description:{ja:j===1?'よけた右側の層を重ね直します。':'左側の層も重ね直します。',
      en:j===1?'Restack the layers on the right.':'Restack the layers on the left.'},
    folds:[{axis:[0,22],moving:sets[j],angle:90,direction:j===0?-1:1,type:'valley'}],
  });
}
export const extractedBaseLowerStart=model.steps.length;
// Use the petal's actual root. Folding at the side-tuck height (1-sqrt(2))
// shortened these four tips and made later narrowing pull their neighboring tips.
for (const b of [2,4,6,8]) model=foldFlap(model,b,[0,-.5],0,{
  description:{ja:'花弁折りの付け根で先を下げ、他の先端と揃えます。',en:'Fold the petal down at its root, aligning it with the other tips.'},
});
model.faces=model.faces.map(f=>{
  const [p,q,r]=f.map(i=>model.vertices[i]);
  return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])<0?f:[...f].reverse();
});
model.id='beetle-extracted-base-study';
model.name={ja:'カブトムシ用・八先端の基本形',en:'Eight-point beetle base'};
model.faceSheet=model.faces.map(()=>0);
model.renderLayerSeparation=.00004;
model.renderLayerDepthTolerance=5e-7;
model.renderCoherentPanels=true;
model.steps.at(-1)!.caution={ja:'基本形の構造試作です。完成作品ではありません。',
  en:'Unfinished base structure study; this is not a finished beetle.'};
export const beetleExtractedBase=model;
