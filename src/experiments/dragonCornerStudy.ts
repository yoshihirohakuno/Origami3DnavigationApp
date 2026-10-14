import type { OrigamiModel } from '../engine/types';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';

// Keep the upper preparation corner open. Its square joins both wing strips:
// fold the strip roots first, carrying the square. The old narrow-strip
// sequence folds this square away and is not yet joined to this route.
// Closing both roots simultaneously makes them pass through one another.
let model: OrigamiModel={
  id:'dragon-corner-study',name:{ja:'ドラゴン・上の角の試作',en:'Dragon upper-corner study'},
  difficulty:5,
  vertices:[[-1,-1],[1,-1],[1,1],[-1,1],[0,0],[-.75,.75],[-1,.75],[-.75,1],[-.75,-1],[1,.75]],
  faces:[[3,7,5],[3,5,6],[0,6,5,8],[5,7,2,9],[8,5,4],[5,9,4],[9,1,4],[1,8,4]],steps:[],
  sheetColors:[{front:'#5b799d',back:'#fff3e7'}],renderLayerSeparation:.00004,renderCoherentPanels:true,
};
model=foldConnectedFlap(model,1,[.125,-.125],45,{
  description:{ja:'白い面を上にし、反対の角を内側の印へ合わせます。',en:'Start white side up and bring the opposite corner to the inner mark.'},
  caution:{ja:'上の角は開いたままにします。折り目を付けるだけの往復は省略します。',en:'Keep the upper corner open. Crease-marking detours are omitted.'},
});
model.steps[0].folds[0].type='valley';
model.steps.push({folds:[{axis:[4,2],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:-45}],
  description:{ja:'開いた角が上にくる向きへ、紙全体を回します。',en:'Turn the sheet so the open corner faces upward.'},
});
const inner=1.5/Math.SQRT2;
for(const [seed,degrees,ja,en]of [[0,45,'左','left'],[2,-45,'右','right']] as const){
  model=foldConnectedFlap(model,seed,[0,inner],degrees,{
    description:{ja:`${ja}の帯を${seed===0?'奥':'手前'}へ折り、上の角も一緒に動かします。`,en:`Fold the ${en} strip ${seed===0?'away from':'toward'} you, carrying the upper corner with it.`},
    caution:{ja:'上の角は帯につながっています。一緒に動かします。',en:'The upper corner is connected to the strip. Carry it along.'},
  },seed===0?'back':'front');
  model.steps.at(-1)!.folds[0].type=seed===0?'mountain':'valley';
}

model=foldConnectedFlap(model,3,[0,1.25/Math.SQRT2],0,{
  description:{ja:'手前の白い角を半分まで持ち上げます。',en:'Lift the front white corner halfway.'},
  caution:{ja:'奥の角は動かさず、手前の一枚だけを持ち上げます。',en:'Keep the rear corner still and lift only the front layer.'},
});
const opening=model.steps.pop()!;
opening.folds[0].type='valley';
model.steps.push({...opening,motionRange:[0,.5]},
  {...opening,motionRange:[.5,1],
    description:{ja:'持ち上げた角を上まで開きます。',en:'Open the lifted corner all the way upward.'},
    caution:{ja:'未完成の試作です。細い帯の仕上げ、中央の折り込み、頭・腕・脚・翼の展開・尾は未完成です。',
      en:'Unfinished study. Strip finishing, the central tuck, head, arms, legs, wing opening and tail are unfinished.'},
  });
export const dragonCornerStudy=model;
