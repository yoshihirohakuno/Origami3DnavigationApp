import type { OrigamiModel } from '../engine/types';
import { foldConnectedFlap } from '../engine/foldConnectedFlap';

/** Jo Nakashima's Devil Dragon v3 initial offset preparation, not a completed
 * dragon. The opposite corner meets the midpoint of the retained corner crease
 * rather than the missing original corner. Crease-only folds are omitted. */
let model: OrigamiModel={
  id:'dragon-base-study',name:{ja:'ドラゴン・ずらした三角基本形の試作',en:'Dragon offset triangle base study'},
  difficulty:5,vertices:[[-1,-1],[1,-1],[1,1],[-1,1],[0,0]],
  faces:[[3,2,4],[2,1,4],[1,0,4],[0,3,4]],steps:[],
  sheetColors:[{front:'#5b799d',back:'#fff3e7'}],renderLayerSeparation:.00004,
};
model=foldConnectedFlap(model,3,[-.75,.75],45,{
  description:{ja:'角を内側の印に合わせ、小さな三角を折ります。',en:'Fold the corner into a small triangle at the inner mark.'},
  caution:{ja:'白い面を上にします。角は紙の中心まで折りません。',en:'Start white side up. This corner does not reach the sheet center.'},
});
model=foldConnectedFlap(model,1,[.125,-.125],45,{
  description:{ja:'反対の角を、小さな三角の折り線の真ん中に合わせます。',en:'Bring the opposite corner to the midpoint of the small triangle crease.'},
  caution:{ja:'対角線より少しずらして折ります。二つの縁には幅の差が残ります。',en:'The crease is offset from the diagonal. The two edges retain different widths.'},
});
// These two retained folds are ordinary valley folds. Keep their exact
// computed directions while presenting the correct guide convention.
for(const step of model.steps)step.folds[0].type='valley';
model.steps.push({folds:[{axis:[4,2],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:-45}],
  description:{ja:'小さな三角が上にくる向きへ、紙全体を回します。',en:'Turn the whole sheet so the small triangle faces upward.'},
  caution:{ja:'基本形だけの未完成試作です。頭・腕・脚・翼・尾の仕上げはまだありません。',en:'Unfinished base study. Head, arms, legs, wings and tail are not shaped yet.'},
});
export const dragonBaseStudy=model;
