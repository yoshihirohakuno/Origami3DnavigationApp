import { Matrix4, Quaternion, Vector3 } from 'three';
import { flatSequence, type FlatMove } from './flatSequence';
import { computeFoldState } from './fold';
import type { FoldOp, OrigamiModel } from './types';

type Point = [number, number, number];
export interface Deltahedron { vertices: Point[]; faces: [number, number, number][] }
const v = (p: Point) => new Vector3(...p);
const colors = ['#dc7565', '#61aaa0', '#e3ba60', '#798ac3', '#b983af'];
const text = (ja: string, en: string) => ({ ja, en });

/** The traditional Sonobe module: two corner pockets, gate folds and two
 * oblique end folds. Reference: Helena Verrill's ori0.gif. Auxiliary compiler
 * folds only subdivide the sheet at the three future assembly hinges; they are
 * removed, so the learner never folds and unfolds just to prepare a crease. */
function modulePaper(): OrigamiModel {
  const moves: FlatMove[] = [
    { line: [[-1,.5],[-.5,1]], side: 1 },
    { line: [[.5,-1],[1,-.5]], side: -1 },
    { line: [[-.5,-1],[-.5,1]], side: 1 },
    { line: [[.5,-1],[.5,1]], side: -1 },
    { line: [[-.5,0],[.5,1]], side: 1 },
    { line: [[-.5,-1],[.5,0]], side: -1 },
    { line: [[-1,0],[1,0]], side: 1 },
    { line: [[-1,0],[1,0]], side: 1, type: 'unfold' },
    { line: [[0,.5],[.5,0]], side: 1 },
    { line: [[0,.5],[.5,0]], side: 1, type: 'unfold' },
    { line: [[-.5,0],[0,-.5]], side: -1 },
  ];
  const captions = [
    text('左上の小さな角を内側へ折り、ポケットの端を作ります。', 'Fold the small top-left corner inward to prepare the pocket edge.'),
    text('右下の小さな角も内側へ折ります。', 'Fold the small bottom-right corner inward.'),
    text('左の辺を中心線へ折ります。', 'Fold the left edge to the center.'),
    text('右の辺も中心線へ折り、帯にします。', 'Fold the right edge to the center to make a band.'),
    text('帯の上端を斜め45度に折ります。', 'Fold the upper end diagonally at 45 degrees.'),
    text('下端も斜めに折り、先を向かいの帯の下へ入れます。', 'Fold the lower end diagonally and slip its tip under the opposite band.'),
  ];
  const model = flatSequence({ id: 'sonobe-unit', name: text('園部ユニット', 'Sonobe unit'), difficulty: 3 },
    [[-1,-1],[1,-1],[1,1],[-1,1]], true,
    moves.map((move, i) => ({ moves: [move], description: captions[i] ?? text('分割用', 'Subdivision only') })), 1e-7);
  model.steps = model.steps.slice(0, 6);
  return model;
}

/** Outward pyramid caps on an equilateral triangulated scaffold. Every cap
 * has three congruent right-isosceles triangles (legs sqrt(1/2), base 1).
 * One real sheet spans each scaffold edge. Its two tabs land exactly on the
 * neighboring cap triangles; no vertex morphing or disconnected face targets.
 * Pocket flex and insertion clearance are idealized as zero-thickness folds. */
export function sonobeSolid(id: string, ja: string, en: string, difficulty: number, scaffold: Deltahedron): OrigamiModel {
  const points = scaffold.vertices.map(v);
  const faces = scaffold.faces;
  const peaks = faces.map(([a,b,c]) => {
    const normal = points[b].clone().sub(points[a]).cross(points[c].clone().sub(points[a])).normalize();
    return points[a].clone().add(points[b]).add(points[c]).multiplyScalar(1/3).addScaledVector(normal, Math.sqrt(1/6));
  });
  const edges = new Map<string, { a: number; b: number; first: number; second?: number }>();
  faces.forEach((face, fi) => face.forEach((a, i) => {
    const b = face[(i+1)%3], key = [a,b].sort((x,y)=>x-y).join(',');
    if (Math.abs(points[a].distanceTo(points[b])-1)>1e-7) throw new Error(`${id}: non-unit scaffold edge`);
    const edge = edges.get(key);
    if (edge) { if (edge.second !== undefined || edge.a !== b || edge.b !== a) throw new Error(`${id}: non-manifold scaffold`); edge.second=fi; }
    else edges.set(key,{a,b,first:fi});
  }));
  if ([...edges.values()].some(e=>e.second===undefined)) throw new Error(`${id}: open scaffold`);
  const module = modulePaper();
  const flat = computeFoldState(module, module.steps.length).positions;
  const used = [...new Set(module.faces.flat())];
  const upper = module.faces.filter(f=>f.some(i=>flat[i].y>1e-6)).flat();
  const tabTop = module.faces.filter(f=>f.some(i=>flat[i].x+flat[i].y>.50001)).flat();
  const tabBottom = module.faces.filter(f=>f.some(i=>flat[i].x+flat[i].y<-.50001)).flat();
  const model: OrigamiModel = { id, name: text(ja,en), difficulty, vertices: [], faces: [], steps: [],
    faceSheet: [], sheetColors: [], sheetStartSteps: [], assemblyFaceInsets: [],
    renderLayerSeparation: .00003, cameraPos: [2,2.5,6] };
  const workX = 2.6;
  [...edges.values()].forEach((edge, sheet) => {
    const offset = model.vertices.length, remap=(i:number)=>i+offset;
    const mid = points[edge.a].clone().add(points[edge.b]).multiplyScalar(.5);
    // The first face runs opposite to the module's lower edge, keeping the
    // colored side outward under this right-handed frame.
    const ex = points[edge.a].clone().sub(points[edge.b]);
    const ey = mid.clone().sub(peaks[edge.first]).normalize();
    const ez = ex.clone().cross(ey).normalize();
    const rotation = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(ex,ey,ez));
    const inverse = rotation.clone().invert();
    const targetTop = peaks[edge.second!].clone().sub(mid).applyQuaternion(inverse);
    const bend = Math.atan2(targetTop.z,targetTop.y)*180/Math.PI;
    model.vertices.push(...module.vertices.map(([x,y]):[number,number]=>[x+workX,y]));
    model.faces.push(...module.faces.map(f=>f.map(remap)));
    model.assemblyFaceInsets!.push(...module.faces.map(()=>0));
    model.faceSheet!.push(...module.faces.map(()=>sheet));
    model.sheetColors!.push({front:colors[sheet%colors.length],back:'#fbfaf7'});
    model.sheetStartSteps!.push(model.steps.length);
    const prefix = `${sheet+1}/${edges.size}枚目：`;
    const englishPrefix = `Sheet ${sheet+1}/${edges.size}: `;
    for (const [i, step] of module.steps.entries()) model.steps.push({
      description: text(prefix+step.description.ja,englishPrefix+step.description.en),
      ...(i===0?{caution:text(`同じ大きさの正方形を${edges.size}枚使います。白い面を上にして、右側の作業位置で1枚ずつ折ります。`,
        `Use ${edges.size} equal squares. Start each sheet white side up in the work area on the right.`)}:{}),
      folds:step.folds.map(op=>({...op,axis:op.axis.map(remap) as [number,number],moving:op.moving.map(remap)})),
    });
    const unitState=()=>computeFoldState(model,model.steps.length).positions;
    const nearest = (x:number,y:number):number => used.reduce((best,i)=>flat[i].distanceToSquared(new Vector3(x,y,0))<flat[best].distanceToSquared(new Vector3(x,y,0))?i:best);
    if(Math.abs(bend)>1e-6)model.steps.push({description:text(prefix+'中央の折り線で立体の角度をつけます。',englishPrefix+'Bend the center crease to the joining angle.'),
      folds:[{axis:[remap(nearest(-.5,0)),remap(nearest(.5,0))],moving:[...new Set(upper)].map(remap),type:bend>0?'valley':'mountain',angle:Math.abs(bend),direction:bend>0?1:-1}]});
    for(const top of [true,false]){
      const fi=top?edge.second!:edge.first;
      const third=faces[fi].find(i=>i!==edge.a&&i!==edge.b)!;
      const goal=points[third].clone().sub(mid).applyQuaternion(inverse).add(new Vector3(workX,0,0));
      const axis: [number,number]=top?[remap(nearest(0,.5)),remap(nearest(.5,0))]:[remap(nearest(-.5,0)),remap(nearest(0,-.5))];
      const tip=remap(nearest(top?.5:-.5,top?1:-1)), p=unitState(), origin=p[axis[0]], direction=p[axis[1]].clone().sub(origin).normalize();
      const error=(sign:number)=>p[tip].clone().sub(origin).applyAxisAngle(direction,sign*Math.PI/2).add(origin).distanceTo(goal);
      const sign=error(1)<error(-1)?1:-1;
      if(error(sign)>1e-4)throw new Error(`${id}: tab misses its pocket (${error(sign)})`);
      model.steps.push({description:text(prefix+(top?'上':'下')+'の三角を90度起こし、差し込み用の先を作ります。',englishPrefix+`Raise the ${top?'upper':'lower'} triangular tab to 90 degrees.`),
        folds:[{axis,moving:[...new Set(top?tabTop:tabBottom)].map(remap),type:'valley',angle:90,direction:sign}]});
    }
    // Factor the rigid placement into a swing about an in-plane axis, followed
    // by a Z twist. This uses the existing rigid assembly operation throughout.
    const twist = new Quaternion(0,0,rotation.z,rotation.w).normalize();
    const swing = twist.clone().invert().multiply(rotation).normalize();
    const angle=2*Math.acos(Math.max(-1,Math.min(1,swing.w)));
    const len=Math.hypot(swing.x,swing.y);
    const axis:[number,number]=[model.vertices.length,model.vertices.length+1];
    model.vertices.push([workX,0],[workX+(len?swing.x/len:1),len?swing.y/len:0]);
    const op:FoldOp={axis,moving:used.map(remap),type:'assemble',direction:1,angle:angle*180/Math.PI,
      spinZ:2*Math.atan2(twist.z,twist.w)*180/Math.PI,translate:[mid.x-workX,mid.y,mid.z]};
    model.steps.push({description:text(prefix+(sheet===0?'左の組み立て位置に置きます。':'隣の三角と辺を合わせ、先をポケットへ差し込みます。'),
      englishPrefix+(sheet===0?'Place the first module in the assembly area on the left.':'Match the neighboring triangles and tuck the tabs into their pockets.')),
      caution:text('差し込むときはポケットを少しゆるめてください。画面では差し込み時の紙のしなりと厚みを簡略化しています。',
        'Loosen the pockets slightly when inserting. Paper flex and thickness during insertion are simplified on screen.'),folds:[op]});
    // Tucked tabs belong below the neighbor's colored outer panel. Their
    // physical surfaces stay exact; this small normal bias only resolves the
    // coincident surfaces in the depth buffer and SVG painter.
    const assembled = unitState();
    for (const [fi, face] of module.faces.entries()) {
      if (!face.some(i=>Math.abs(flat[i].x+flat[i].y)>.50001)) continue;
      const polygon = face.map(i=>assembled[remap(i)]);
      const normal = new Vector3();
      for(let i=1;i<polygon.length-1;i++)normal.add(polygon[i].clone().sub(polygon[0]).cross(polygon[i+1].clone().sub(polygon[0])));
      const center = polygon.reduce((sum,p)=>sum.add(p),new Vector3()).multiplyScalar(1/polygon.length);
      model.assemblyFaceInsets![sheet*module.faces.length+fi] = normal.dot(center)>0 ? -.002 : .002;
    }
  });
  return model;
}

/** Orient a convex unit-edge triangle hull without relying on hand-entered winding. */
export function triangleHull(vertices: Point[]): Deltahedron {
  const points=vertices.map(v), faces: Deltahedron['faces']=[];
  for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++)for(let c=b+1;c<points.length;c++){
    if([points[a].distanceTo(points[b]),points[b].distanceTo(points[c]),points[c].distanceTo(points[a])].some(d=>Math.abs(d-1)>1e-7))continue;
    const normal=points[b].clone().sub(points[a]).cross(points[c].clone().sub(points[a]));
    const signs=points.map(p=>p.clone().sub(points[a]).dot(normal));
    if(signs.some(d=>d>1e-7)&&signs.some(d=>d< -1e-7))continue;
    faces.push(signs.some(d=>d>1e-7)?[a,c,b]:[a,b,c]);
  }
  return {vertices,faces};
}
