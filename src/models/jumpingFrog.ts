import type { OrigamiModel } from '../engine/types';
import { foldFlap } from '../engine/foldFlap';
const vertices:[number,number][]=[];const faces:number[][]=[];
function id(x:number,y:number){let i=vertices.findIndex(v=>v[0]===x&&v[1]===y);if(i<0){i=vertices.length;vertices.push([x,y]);}return i;}
const halves=[1,-1].map(f=>{
  const cy=f*.5;
  const nodes=[[0,0],[.5,0],[.5,.5],[0,.5],[-.5,.5],[-.5,0],[-.5,-.5],[0,-.5],[.5,-.5]].map(([x,y])=>id(x,cy+f*y));
  for(let i=1;i<=8;i++){const tri=[nodes[0],nodes[i],nodes[i%8+1]];faces.push(f===1?tri.reverse():tri);}
  return nodes;
});
let model:OrigamiModel={id:'jumping-frog',name:{ja:'跳ねるカエル',en:'Jumping Frog'},difficulty:3,
  vertices,faces,faceSheet:faces.map(()=>0),sheetColors:[{front:'#71a35a',back:'#f5f2d9'}],cameraPos:[0,2,5],renderLayerSeparation:.00003,
  steps:halves.map((nodes,i)=>({folds:[{axis:[nodes[6],nodes[8]],moving:nodes,type:'valley',angle:0,waterbombCollapse:{nodes,centerY:i?-.5:.5,half:.5,flip:i?-1:1}}],
    description:{ja:i?'下側も両脇を内側へ寄せ、三角にたたみます。':'上側の両脇を内側へ寄せ、三角にたたみます。',en:i?'Collapse the lower square into a triangle as well.':'Bring the upper sides inward and collapse the top square into a triangle.'}}))};
model.steps[0].caution={ja:'縦横2対1の長方形を白い面を上にして使います。表示された折り線を利用し、折り目をつけて戻す工程は省略します。',en:'Use a 2:1 rectangle, white side up. Follow the displayed creases; preparation-only folding is omitted.'};
const add=(corner:number,origin:[number,number],angle:number,ja:string,en:string,side?:1|-1,sweep:'front'|'back'='front',onlyPreviousFlap=false)=>{
  const previousMoving=new Set(model.steps.at(-1)!.folds[0].moving);
  model=foldFlap(model,corner,origin,angle,{description:{ja,en}},sweep,false,side, onlyPreviousFlap ? face=>face.some(vi=>previousMoving.has(vi)) : undefined);
  model.steps.at(-1)!.folds[0].type=sweep==='front'?'valley':'mountain';
};
add(halves[0][4],[-.25,.25],-45,'上の左の一枚を、三角の頂点に合わせます。','Fold the upper left flap to the top point.');
add(halves[0][2],[.25,.25],45,'上の右の一枚も頂点に合わせます。','Fold the upper right flap to the top point.');
add(halves[0][4],[0,0],112.5,'左の先を斜め外へ折り返し、前脚にします。','Fold the left tip outward to make a front leg.');
add(halves[0][2],[0,0],67.5,'右の先も斜め外へ折り返します。','Fold the right tip outward for the other front leg.');
add(halves[1][4],[-.25,-.25],45,'下の左の一枚を、下の頂点に合わせます。','Fold the lower left flap to the bottom point.');
add(halves[1][2],[.25,-.25],-45,'下の右の一枚も頂点に合わせます。','Fold the lower right flap to the bottom point.');
add(halves[1][4],[0,0],67.5,'左下の先を外へ折り返し、後脚にします。','Fold the lower left tip outward to make a back leg.');
add(halves[1][2],[0,0],112.5,'右下の先も外へ折り返します。','Fold the lower right tip outward for the other back leg.');
add(halves[0][6],[-.25,0],90,'左の胴体の角を内側へ折り、脚の下へ収めます。','Fold the left body corner inward beneath the legs.');
add(halves[0][8],[.25,0],90,'右の胴体の角も内側へ折ります。','Fold the right body corner inward.');
add(0,[0,-.15],0,'後脚側を表示の横線で上へ折り重ねます。','Fold the back-leg section upward along the displayed horizontal line.',-1);
add(0,[0,-.03],0,'重ねた後脚側を表示の横線で折り返し、ばねになる段折りを作ります。','Fold the back-leg section back along the displayed line to make the spring pleat.',1,'back',true);
model.steps.at(-1)!.folds[0].angle=160;
model.steps.push({folds:[{axis:[halves[0][0],halves[1][0]],moving:model.vertices.map((_,i)=>i),type:'assemble',angle:180,direction:1}],description:{ja:'全体を裏返し、脚を下にして置きます。','en':'Turn it over and rest it on its legs.'},caution:{ja:'実物はおしりを軽く押して離すと跳ねます。画面では折り上がるまでを案内します。',en:'Press and release the back of the paper frog to make it hop. This guide shows the folding, not the jump.'}});
export const jumpingFrogModel=model;
