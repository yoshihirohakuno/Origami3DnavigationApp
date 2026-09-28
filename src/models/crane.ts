import type { OrigamiModel } from '../engine/types';
import { foldFlap } from '../engine/foldFlap';
import { computeFoldState } from '../engine/fold';
import { birdBaseModel } from '../engine/birdBase';

let model = birdBaseModel;

// Crease the remaining two lower flaps on their actual folded surfaces. A
// diagonal hinge directly sets the neck/tail direction; do not rotate a tip
// sideways while holding both ends of its old horizontal hinge fixed.
model = foldFlap(model,4,[0,-.55],15,{
  description:{ja:'下の細い先を1本、折り線に沿って斜め上へ折り上げて首にします。',
    en:'Fold one lower point diagonally upward along the crease to form the neck.'},
},'front',true);
model = foldFlap(model,8,[0,-.55],-15,{
  description:{ja:'もう1本の細い先を反対側へ折り上げ、尾にします。',
    en:'Fold the other lower point upward in the opposite direction to form the tail.'},
},'back',true);

const neck = computeFoldState(model,model.steps.length).positions[4];
const neckDirection = [-.5,Math.sqrt(3)/2];
model = foldFlap(model,4,[neck.x-neckDirection[0]*.12,neck.y-neckDirection[1]*.12],-15,{
  description:{ja:'首の先を折り下げ、くちばしを作ります。',
    en:'Fold the neck tip down to form the beak.'},
});

model.steps.push({folds:[
  {axis:[9,10],moving:[2],type:'valley',angle:72,direction:-1},
  {axis:[14,12],moving:[6],type:'valley',angle:72,direction:-1},
],description:{ja:'大きな2枚を左右へ開き、羽にします。',en:'Open the two large flaps into the wings.'}});

export const craneModel: OrigamiModel = model;
