import { flatSequence } from '../engine/flatSequence';
import type { OrigamiModel, LocalizedText } from '../engine/types';

// easy/flowers/tree/zu/zu.gif: three SAME-SIZE squares. Different folding
// routes make triangles of widths √2, 3√2/2 and 2√2. Do not scale a finished
// triangle into three copies. The reference explicitly uses glue at assembly.
const square: [number,number][] = [[-1,-1],[1,-1],[1,1],[-1,1]];
const H = Math.SQRT2;
const small = flatSequence({ id:'tree-small', name:{ja:'上の枝',en:'Top tier'}, difficulty:1,
  sheetColors:[{front:'#91bb62',back:'#fbfaf7'}],
}, square, true, [
  { moves:[{line:[[-1,0],[1,0]],side:1}],
    description:{ja:'明るい緑の紙の上のふちを下のふちへ合わせ、半分に折ります。',en:'Fold the top edge of the light-green square down to the bottom edge.'},
    caution:{ja:'同じ大きさの正方形3枚とのりを用意します。どの紙も白い面を上にして始めます。',en:'Prepare three equal-sized squares and glue. Start each square white side up.'} },
  { moves:[{line:[[-1,0],[0,-1]],side:-1}],
    description:{ja:'左下の角を、上のふちの中央へ折り上げます。',en:'Fold the lower-left corner up to the middle of the top edge.'} },
  { moves:[{line:[[0,-1],[1,0]],side:-1}],
    description:{ja:'右下の角も、上のふちの中央へ折り上げます。',en:'Fold the lower-right corner up to the middle of the top edge too.'} },
  { moves:[{line:[[0,-1],[0,1]],side:-1}],
    description:{ja:'右半分を左へ重ね、小さな三角にします。',en:'Fold the right half over the left to make a small triangle.'} },
], 1e-8);

const medium = flatSequence({ id:'tree-medium', name:{ja:'中の枝',en:'Middle tier'}, difficulty:1,
  sheetColors:[{front:'#49a878',back:'#fbfaf7'}],
}, square, true, [
  { moves:[{line:[[-1,-.5],[1,-.5]],side:-1}],
    description:{ja:'2枚目の紙の下のふちを、紙の中心線へ折ります。',en:'Fold the bottom edge of the second square to its center line.'},
    caution:{ja:'最初の三角はそのまま置き、2枚目の紙を折ります。白い面が上です。',en:'Leave the first triangle aside and work on the second square, white side up.'} },
  { moves:[{line:[[.5,-1],[.5,1]],side:-1}],
    description:{ja:'右のふちも紙の中心線へ折ります。',en:'Fold the right edge to the center line too.'} },
  { moves:[{line:[[-1,-.5],[.5,1]],side:-1}],
    description:{ja:'右下側を斜めに折り、左上側へ重ねて三角にします。',en:'Fold the lower-right half diagonally over the upper-left half into a triangle.'} },
], 1e-8);

const large = flatSequence({ id:'tree-large', name:{ja:'下の枝',en:'Bottom tier'}, difficulty:1,
  sheetColors:[{front:'#25835a',back:'#fbfaf7'}],
}, [[0,H],[-H,0],[0,-H],[H,0]], true, [
  { moves:[{line:[[-H,0],[H,0]],side:-1}],
    description:{ja:'3枚目の紙をひし形に置き、下の角を上の角へ合わせて折ります。',en:'Place the third square as a diamond. Fold the bottom point up to the top point.'},
    caution:{ja:'紙の大きさは他の2枚と同じです。この三角がツリーの一番下になります。',en:'Use the same square size as the other two sheets. This triangle forms the bottom tier.'} },
], 1e-8);

function orient(part: OrigamiModel, pivot: [number,number], spinZ: number, description: LocalizedText) {
  const a=part.vertices.length;
  part.vertices.push(pivot,[pivot[0]+1,pivot[1]]);
  part.steps.push({description, folds:[{axis:[a,a+1], moving:part.vertices.map((_,i)=>i),type:'assemble',angle:0,spinZ}]});
}
orient(small,[0,0],45,{ja:'直角の角を上に向けます。小さい枝ができました。',en:'Turn the right-angle corner upward. The small tier is ready.'});
orient(medium,[-1,1],-45,{ja:'直角の角を上に向けます。中くらいの枝ができました。',en:'Turn the right-angle corner upward. The middle tier is ready.'});

export const threePieceTreeModel: OrigamiModel = {
  id:'three-piece-tree',name:{ja:'3枚のツリー',en:'Three-Piece Tree'},difficulty:2,
  vertices:[],faces:[],steps:[],faceSheet:[],sheetColors:[],renderLayerSeparation:.00004,
};
const pieces: number[][]=[];
for(const [sheet,part] of [small,medium,large].entries()) {
  const offset=threePieceTreeModel.vertices.length, dx=(sheet-1)*3;
  pieces.push(part.vertices.map((_,i)=>i+offset));
  threePieceTreeModel.vertices.push(...part.vertices.map(([x,y]):[number,number]=>[x+dx,y]));
  threePieceTreeModel.faces.push(...part.faces.map(f=>f.map(v=>v+offset)));
  threePieceTreeModel.faceSheet!.push(...part.faces.map(()=>sheet));
  threePieceTreeModel.sheetColors!.push(part.sheetColors![0]);
  threePieceTreeModel.steps.push(...part.steps.map(s=>({...s,folds:s.folds.map(f=>({...f,
    axis:f.axis.map(v=>v+offset) as [number,number],moving:f.moving.map(v=>v+offset),
  }))})));
}
// Reference assembly offsets, measured relative to the large triangle's height:
// middle apex .4H above the large apex, small apex .3H above the middle.
// Glue these two overlaps; z offsets represent the separate sheets, not folds.
threePieceTreeModel.steps.push(
  { description:{ja:'中くらいの三角の先にのりを少し付け、小さい三角を上から重ねて貼ります。',en:'Put a little glue on the middle triangle’s tip and attach the small triangle over it.'},
    caution:{ja:'先をすべて隠すまで重ね、たての中心をそろえます。紙を折る工程ではなく、のり付けです。',en:'Cover the tip completely and align the vertical centers. This is a glue assembly, not another fold.'},
    folds:[{axis:[pieces[0][0],pieces[0][1]],moving:pieces[0],type:'assemble',angle:0,translate:[2,1+.3*H,.004]}] },
  { description:{ja:'大きい三角の先にのりを付け、上の2段を重ねて貼ったら完成です。',en:'Glue the large triangle’s tip and attach the upper two tiers to finish.'},
    caution:{ja:'平らな飾りです。のりが乾いてから持ち上げましょう。',en:'This is a flat decoration. Let the glue dry before lifting it.'},
    folds:[{axis:[pieces[1][0],pieces[1][1]],moving:[...pieces[0],...pieces[1]],type:'assemble',angle:0,translate:[4,1.4*H-1,.004]}] },
);
