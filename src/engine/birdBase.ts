import type { FoldStep, OrigamiModel } from './types';
import { squareBaseModel } from '../models/squareBase';
import { carrySurfacePoints } from './carrySurfacePoints';

// Four symmetric pages. Opposite original corners 2/6 become wings; 4/8
// remain below for neck/tail. The old route lifted adjacent corners 2/8 and
// omitted a tuck crease on the neighboring page, pulling its face apart.
const S = 2 - Math.SQRT2, H = S / 2;
const unit = squareBaseModel.vertices[1][0];
const r = (x: number, y: number): [number, number] => [unit * (x+y), unit * (y-x)];
const vertices: [number, number][] = [
  ...squareBaseModel.vertices,
  r(S,0), r(0,S), r(H,H), r(0,-S), r(-H,-H), r(-S,0), r(-H,H), r(H,-H),
];
const faces: number[][] = [];
function page(a: number, corner: number, b: number, pa: number, pb: number, cross: number) {
  faces.push([0,pa,cross], [0,cross,pb], [pa,a,corner],
    [pa,corner,cross], [cross,corner,pb], [pb,corner,b]);
}
page(1,2,3,9,10,11);
page(3,4,5,10,14,15);
page(5,6,7,14,12,13);
page(7,8,1,12,9,16);

// A petal needs a flat base: both halves of its lifting hinge must be collinear.
// Keeping the former 176° pocket relief here locks those hinge points in space
// and makes any subsequent tip rotation stretch the central triangles.
const base = { ...squareBaseModel, steps: squareBaseModel.steps.map((s,i)=>({
  ...s, folds:s.folds.map(op=>({...op,angle:180,
    // Open the outer rim of the second pocket. The other rim turns this
    // page inside out and makes the two lower points overlap across both sides.
    ...(i === 4 ? { moving:[2,1], pocket:{rim:1,tip:2,pivot:3} } : {}),
  })),
})) };
const front: FoldStep = {
  folds:[{ axis:[9,10], moving:[2,1,3], type:'valley', angle:180, direction:1,
    petal:{tip:2,sides:[[1,9,8],[3,10,4]]} }],
  description:{ja:'手前の1枚を開き、左右を内側へたたんで花弁折りします。',
    en:'Open the front layer and tuck its sides inward into a petal fold.'},
};
const back: FoldStep = {
  folds:[{ axis:[14,12], moving:[6,5,7], type:'mountain', angle:180, direction:1,
    petal:{tip:6,sides:[[5,14,4],[7,12,8]]} }],
  description:{ja:'反対側の1枚も開き、左右を内側へたたんで花弁折りします。',
    en:'Open the opposite layer and tuck its sides inward into a petal fold.'},
};
export const birdBaseModel = carrySurfacePoints({
  id:'crane', name:{ja:'鶴',en:'Crane'}, difficulty:5,
  cameraAngle:22, cameraPos:[0,3,4], vertices,
  renderLayerSeparation: 0.00004,
  faces:faces.map(f=>[...f].reverse()),
  steps:[...base.steps.map((s,i)=>i?s:{...s,caution:{
    ja:'白い面を上にして始めます。角を合わせ、三角の形で止めます。',
    en:'Start white side up. Match the corners and stop at the triangle.',
  }}), front, back],
} satisfies OrigamiModel, base, 5);

