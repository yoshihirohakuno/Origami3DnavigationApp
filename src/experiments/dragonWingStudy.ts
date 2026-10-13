import { computeFoldState } from '../engine/fold';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';
import type { OrigamiModel } from '../engine/types';
import { dragonBaseStudy } from './dragonBaseStudy';

/** Retained four-panel pleats for the two long wing strips. This material
 * comparison studies the narrow strips seen in Devil Dragon v3 diagram 30.
 * Its white upper diamond and subsequent central pocket are NOT reproduced.
 * Crease-marking/opening detours are omitted. Every added fold stays folded. */
let model: OrigamiModel={...dragonBaseStudy,
  id:'dragon-wing-study',
  name:{ja:'ドラゴン・翼の帯の段折りの試作',en:'Dragon wing-strip pleat study'},
};
const inner=1.5/Math.SQRT2, width=.5/Math.SQRT2;
export const dragonWingPleatRanges: readonly [number,number][]=[[3,7],[7,11]];

for(const side of [0,1]){
  const ja=side===0?'左':'右',en=side===0?'left':'right';
  // Fold from the free edge towards the root. The quarter-width creases are
  // spatially parallel, but consecutive folds carry DIFFERENT material layers.
  for(const [j,quarter]of [.75,.5,.25,0].entries()){
    const positions=computeFoldState(model,model.steps.length).positions;
    const intercept=inner+quarter*width;
    // A free corner alone is insufficient: after the second fold it sits on
    // the hinge, while earlier quarter-panels are separate coincident layers.
    // Select every layer of THIS original wing strip on the moving side.
    // x=-.75 / y=.75 are material boundaries, not face colors or pose guesses.
    const seeds=model.vertices.flatMap(([x,y],i)=>{
      const inStrip=side===0?x<=-.75+1e-9:y>=.75-1e-9;
      const across=positions[i].y+(side===0?-positions[i].x:positions[i].x)-intercept;
      return inStrip&&across>1e-8?[i]:[];
    });
    model=foldConnectedFlap(model,seeds,[0,intercept],side===0?45:-45,{
      description:j===3?{
        ja:`${ja}の細い帯を、三角の縁に沿って内側へ折ります。`,
        en:`Fold the narrow ${en} strip inward along the triangle edge.`,
      }:{
        ja:`${ja}の帯を、外側から${j+1}本目の線で折ります。`,
        en:`Fold the ${en} strip at crease ${j+1}, working in from its free edge.`,
      },
      caution:{
        ja:'重なった帯を一緒に動かします。大きな三角の面は動かしません。',
        en:'Carry the stacked strip layers together. Keep the large triangle still.',
      },
    });
    model.steps.at(-1)!.folds[0].type='valley';
  }
}
model.steps.at(-1)!.caution={
  ja:'未完成の材料比較です。見本の上部の白いひし形と中央の袋は未再現です。頭・腕・脚・翼の展開・尾も未完成です。',
  en:'Unfinished material comparison. Upper-corner layer order does not yet reproduce the white diamond or central pocket. Head, arms, legs, wing opening and tail are unfinished.',
};
export const dragonWingStudy=model;
