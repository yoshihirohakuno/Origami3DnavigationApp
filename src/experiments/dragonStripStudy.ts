import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import { dragonCornerStudy } from './dragonCornerStudy';
import type { OrigamiModel } from '../engine/types';

// Devil Dragon v3 diagrams 21–30: crease-only detours are omitted, but the
// whole-sheet turnover after them is essential. It puts the colored surface
// on the outside before folding the strip roots. The old studies omit it.
let model:OrigamiModel={...dragonCornerStudy,
  id:'dragon-strip-study',name:{ja:'ドラゴン・細い帯と白い角の試作',en:'Dragon narrow strips and white corner study'},
  steps:dragonCornerStudy.steps.slice(0,2),
  renderFoldStack:true,
};
const root=1.5/Math.SQRT2,width=.5/Math.SQRT2;
model.steps.push({folds:[{axis:[4,1],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:180,direction:1}],
  description:{ja:'紙全体を裏返し、色の面を上にします。',en:'Turn the whole sheet over, colored side up.'}});
for(const [seed,degrees,ja,en]of [[2,45,'左','left'],[0,-45,'右','right']] as const){
  model=foldConnectedFlap(model,seed,[0,root],degrees,{
    description:{ja:`${ja}の帯を手前へ折り、上の角を一緒に動かします。`,en:`Fold the ${en} strip toward you, carrying the upper corner.`},
  },'front');
  model.steps.at(-1)!.folds[0].type='valley';
}
for(const side of [0,1])for(const [j,quarter]of [.75,.5,.25].entries()){
  const positions=computeFoldState(model,model.steps.length).positions;
  const intercept=root-quarter*width;
  const seeds=model.vertices.flatMap(([x,y],i)=>{
    const inStrip=side===0?y>=.75-1e-9:x<=-.75+1e-9;
    const across=positions[i].y+(side===0?-positions[i].x:positions[i].x)-intercept;
    return inStrip&&across < -1e-8?[i]:[];
  });
  // All coincident layers of this original strip must travel together.
  // A single tip ceases to identify them once it lands on a later hinge.
  model=foldConnectedFlap(model,seeds,[0,intercept],side===0?45:-45,{
    description:{ja:`${side===0?'左':'右'}の帯を、外から${j+1}本目の線で重ねます。`,
      en:`Fold the ${side===0?'left':'right'} strip at crease ${j+1} from the free edge.`},
    caution:{ja:'帯の重なった層を一緒に動かします。',en:'Carry the stacked strip layers together.'},
  });
  model.steps.at(-1)!.folds[0].type='valley';
}
model=foldConnectedFlap(model,5,[0,1.25/Math.SQRT2],0,{
  description:{ja:'中央の角を下へ折り、白いひし形を出します。',en:'Fold the central corner down to reveal the white diamond.'},
});
model.steps.at(-1)!.folds[0].type='valley';
model.steps.at(-1)!.caution={
  ja:'未完成の試作です。中央の袋の形成・固定、頭・腕・脚・翼の展開・尾は未完成です。',
  en:'Unfinished study. Central pocket formation and locking, head, arms, legs, wing opening and tail are unfinished.',
};
export const dragonStripStudy=model;
