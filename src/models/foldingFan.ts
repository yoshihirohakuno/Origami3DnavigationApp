import type { OrigamiModel } from '../engine/types';
// A square folded diagonally, then radial accordion pleats through both layers.
const n=12,vertices:[number,number][]=[[-1,-1],[1,1]],faces:number[][]=[];
for(let i=0;i<=n;i++){
  const a=i*Math.PI/(2*n),r=2/(Math.cos(a)+Math.sin(a));
  vertices.push([-1+r*Math.cos(a),-1+r*Math.sin(a)]);
}
for(let i=0;i<n;i++)faces.push([0,i+3,i+2],[1,i+2,i+3]);
export const foldingFanModel:OrigamiModel={id:'folding-fan',name:{ja:'放射折りの扇子',en:'Radial Pleated Fan'},difficulty:2,
  renderLayerSeparation:.00004,vertices,faces,faceSheet:faces.map(()=>0),sheetColors:[{front:'#488b9e',back:'#e5f0e6'}],cameraPos:[0,0,5],steps:[
  {folds:[{axis:[2,n+2],moving:[1],type:'valley',angle:180}],description:{ja:'正方形を対角線で半分に折り、三角にします。',en:'Fold the square diagonally in half into a triangle.'},caution:{ja:'白い面を上にして始めます。三角の直角の頂点を扇の要にします。',en:'Start white side up. The right-angle corner of the triangle will be the fan pivot.'}}
]};
for(let i=1;i<n;i++)foldingFanModel.steps.push({folds:[{axis:[0,i+2],moving:vertices.flatMap((_,j)=>j>i+2?[j]:[]),type:i%2?'valley':'mountain',angle:65,direction:i%2?1:-1}],
  description:{ja:`${i}本目の放射線を${i%2?'谷':'山'}折りし、二枚重ねでひだを作ります。`,en:`Pleat both layers along radial crease ${i}, using ${i%2?'a valley':'a mountain'} fold.`},
  ...(i===1?{caution:{ja:'ひだを少し開いた状態で進めます。左右の端を寄せると閉じ、離すと開く扇になります。',en:'Keep the pleats partly open. Bring the outer edges together to close the fan, or apart to open it.'}}:{})});
foldingFanModel.steps.push({folds:[{axis:[0,2],moving:vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ:45}],description:{ja:'要を下に向けて、扇子のできあがりです。',en:'Turn the pivot downward to finish the fan.'}});
