import type { OrigamiModel, FoldOp } from '../engine/types';
import { computeFoldState } from '../engine/fold';

const vertices: [number,number][] = [], faces: number[][] = [];
const point = (x:number,y:number) => {
  let i=vertices.findIndex(p=>Math.abs(p[0]-x)<1e-9&&Math.abs(p[1]-y)<1e-9);
  if(i<0){i=vertices.length;vertices.push([x,y]);}return i;
};
for(let x=-1;x<1;x+=.5)for(let y=-1;y<1;y+=.5){
  const edge=[point(x,y),point(x+.5,y),point(x+.5,y+.5),point(x,y+.5)],c=point(x+.25,y+.25);
  for(let i=0;i<4;i++)faces.push([c,edge[(i+1)%4],edge[i]]);
}
const model: OrigamiModel = {id:'fortune-teller',name:{ja:'パクパク占い',en:'Fortune Teller'},difficulty:3,
  renderLayerSeparation:.00004,vertices,faces,steps:[],faceSheet:faces.map(()=>0),sheetColors:[{front:'#df9b67',back:'#fff4df'}],cameraPos:[2,3,5]};
function fold(a:[number,number],b:[number,number],side:number,ja:string,en:string,turn=false){
  const p=computeFoldState(model,model.steps.length).positions;
  const find=(q:[number,number])=>p.findIndex(v=>Math.hypot(v.x-q[0],v.y-q[1])<1e-7);
  const op:FoldOp={axis:[find(a),find(b)],moving:p.flatMap((v,i)=>turn||side*((b[0]-a[0])*(v.y-a[1])-(b[1]-a[1])*(v.x-a[0]))>1e-8?[i]:[]),type:turn?'assemble':'valley',angle:180};
  model.steps.push({folds:[op],description:{ja,en}});
}
fold([0,1],[1,0],1,'右上の角を中心へ折ります。','Fold the top-right corner to the center.');
fold([-1,0],[0,1],1,'左上の角を中心へ折ります。','Fold the top-left corner to the center.');
fold([0,-1],[-1,0],1,'左下の角を中心へ折ります。','Fold the bottom-left corner to the center.');
fold([1,0],[0,-1],1,'右下の角を中心へ折ります。','Fold the bottom-right corner to the center.');
fold([-1,0],[1,0],1,'全体を裏返します。','Turn the paper over.',true);
fold([-.5,-.5],[.5,-.5],-1,'下の角を、もう一度中心へ折ります。','Fold the bottom corner to the center again.');
fold([.5,-.5],[.5,.5],-1,'右の角を中心へ折ります。','Fold the right corner to the center.');
fold([.5,.5],[-.5,.5],-1,'上の角を中心へ折ります。','Fold the top corner to the center.');
fold([-.5,.5],[-.5,-.5],-1,'左の角を中心へ折ります。','Fold the left corner to the center.');
const p=computeFoldState(model,model.steps.length).positions;
const data:NonNullable<FoldOp['fingerPockets']>=p.map((v,i)=>{
  const [x,y]=vertices[i],outer=Math.abs(x)+Math.abs(y)>1+1e-8?1:0;
  return [i,v.x,v.y,Math.sign(Math.abs(v.x)>1e-8?v.x:x)||1,Math.sign(Math.abs(v.y)>1e-8?v.y:-y)||1,outer];
});
model.steps[0].caution={ja:'白い面を上にして始めます。折り目をつけて戻す予備工程は省略しています。',en:'Start white side up. Preparation-only creases are omitted.'};
model.steps.push({folds:[{axis:[point(0,0),point(0,.5)],moving:p.map((_,i)=>i),type:'valley',angle:0, fingerPockets:data}],
  description:{ja:'裏の4つのふくろに指を入れ、角を寄せながら指入れをふくらませます。',en:'Slip your fingers into the four pockets and bring the corners together while opening the pockets.'},
  caution:{ja:'両手の親指と人差し指を使います。紙を切らずに、四つの指入れがつながった形になります。',en:'Use both thumbs and index fingers. All four pockets remain part of one uncut sheet.'}});
export const fortuneTellerModel=model;
