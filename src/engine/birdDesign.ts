import { birdBaseModel } from './birdBase';
import { foldFlap } from './foldFlap';
import { computeFoldState } from './fold';
import type { OrigamiModel } from './types';

type Design = 'pterosaur' | 'phoenix' | 'waterbird' | 'crested';
/** Original bird-base studies. Each silhouette uses real flap folds; neither
 * the final outline nor intermediate panels are stretched into a target mesh. */
export function birdDesign(id: string, ja: string, en: string, design: Design): OrigamiModel {
  let m: OrigamiModel = { ...birdBaseModel, id, name: { ja, en }, difficulty: 5,
    sheetColors: [{ front: {pterosaur:'#7eac8c',phoenix:'#df9762',waterbird:'#8caec8',crested:'#b09cc9'}[design], back:'#fbfaf7' }] };
  const fold = (corner: number, origin: [number, number], degrees: number, ja: string, en: string, back = false) => {
    m = foldFlap(m, corner, origin, degrees, { description: { ja, en } }, back ? 'back' : 'front');
  };
  const neckAngle = design === 'pterosaur' ? 28 : design === 'waterbird' ? 20 : 12;
  const tailAngle = design === 'phoenix' ? -58 : design === 'crested' ? -38 : -28;
  fold(4,[0,-.55],neckAngle,'片方の細い先を折り上げ、首を起こします。','Reverse-fold one lower point up for the neck.');
  fold(8,[0,-.55],tailAngle,'反対の先を後ろへ折り上げ、尾を出します。','Reverse-fold the other point outward for the tail.',true);
  let tip=computeFoldState(m,m.steps.length).positions[4];
  const angle=(90+2*neckAngle)*Math.PI/180;
  const headLength=design==='pterosaur'?.27:design==='waterbird'?.22:.15;
  fold(4,[tip.x-Math.cos(angle)*headLength,tip.y-Math.sin(angle)*headLength],neckAngle-30,
    '首の先を折り返し、頭とくちばしを作ります。','Reverse-fold the neck tip to form the head and beak.');
  if(design==='crested') {
    tip=computeFoldState(m,m.steps.length).positions[4];
    fold(4,[tip.x+.045,tip.y+.035],15,'頭の先を小さく上へ折り返し、冠羽を作ります。','Fold the small head tip upward to make the crest.');
  }
  if(design==='waterbird') {
    tip=computeFoldState(m,m.steps.length).positions[8];
    fold(8,[tip.x-.12,tip.y],65,'尾の先を内側へ折り、短い尾に整えます。','Fold the tail tip inward to shorten the tail.',true);
  }
  if(design==='phoenix') {
    tip=computeFoldState(m,m.steps.length).positions[8];
    fold(8,[tip.x-.162,tip.y+.079],15,'長い尾の先を折り返して、尾の流れを変えます。','Reverse-fold the long tail tip to change its direction.',true);
    tip=computeFoldState(m,m.steps.length).positions[8];
    fold(8,[tip.x-.034,tip.y-.05],-30,'尾の末端をもう一度折り返し、細かな段を作ります。','Fold the very end back once more to make a small tail pleat.',true);
  }
  // Add actual wing creases before opening each complete wing as a rigid group.
  const height=design==='waterbird'?.15:design==='pterosaur'?.36:.43;
  for(const [corner,side] of [[2,'手前'],[6,'反対側']] as const) {
    fold(corner,[0,height],0,`${side}の翼の先を折り下げ、翼の輪郭を整えます。`,
      `Fold down the tip of the ${corner===2?'front':'opposite'} wing to shape its outline.`,corner===6);
    if(design==='phoenix'||design==='pterosaur') {
      const p=computeFoldState(m,m.steps.length).positions[corner];
      fold(corner,[0,(p.y+height)/2],0,`${side}の翼先を折り返し、翼に段をつけます。`,
        `Fold back the ${corner===2?'front':'opposite'} wing tip to make a stepped edge.`,corner===6);
    }
  }
  for(const front of [true,false]) {
    const p=computeFoldState(m,m.steps.length).positions;
    const moving=m.vertices.flatMap(([x,y],i)=>
      (front?x:-x)>=Math.abs(y)-1e-7 && p[i].y>p[9].y+1e-7 ? [i] : []);
    m.steps.push({folds:[{axis:front?[9,10]:[14,12],moving,type:'valley',angle:design==='waterbird'?35:70,direction:-1}],
      description:{ja:`${front?'手前':'反対側'}の翼を外へ広げます。`,en:`Open the ${front?'front':'opposite'} wing outward.`}});
  }
  return m;
}
