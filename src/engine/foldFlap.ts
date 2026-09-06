import { computeFoldState, foldSign } from './fold';
import type { FoldOp, FoldStep, OrigamiModel } from './types';

/** Add a straight crease across a flat, already folded corner. Its intersections
 * are carried by their material edges during earlier steps. All layers sharing
 * the corner are cut by the same spatial line and rotate on that actual hinge. */
export function foldFlap(model: OrigamiModel, corner: number, origin: [number, number],
  degrees: number, caption: Pick<FoldStep, 'description' | 'caution'>, sweep: 'front' | 'back' = 'front',
  halves = false): OrigamiModel {
  const p = computeFoldState(model, model.steps.length).positions;
  const radians = degrees * Math.PI / 180, dx = Math.cos(radians), dy = Math.sin(radians);
  const side = (vi: number) => dx * (p[vi].y - origin[1]) - dy * (p[vi].x - origin[0]);
  const tipSide = Math.sign(side(corner));
  const vertices = [...model.vertices], faces: number[][] = [], sheets: number[] = [];
  const bindings: NonNullable<FoldOp['surfacePoints']> = [], hinges: number[] = [];
  const intersections = new Map<string, number>(), moving = new Set<number>();
  const intersect = (a: number, b: number): number => {
    if (Math.abs(side(a)) < 1e-9) { hinges.push(a); return a; }
    if (Math.abs(side(b)) < 1e-9) { hinges.push(b); return b; }
    const key = [a,b].sort((x,y)=>x-y).join(',');
    if (intersections.has(key)) return intersections.get(key)!;
    const t = side(a) / (side(a) - side(b)), vi = vertices.length;
    vertices.push([model.vertices[a][0] * (1-t) + model.vertices[b][0] * t,
      model.vertices[a][1] * (1-t) + model.vertices[b][1] * t]);
    p.push(p[a].clone().lerp(p[b], t));
    bindings.push([vi, a, b, a, 1-t, t, 0]);
    intersections.set(key, vi); hinges.push(vi);
    return vi;
  };
  model.faces.forEach((face, fi) => {
    const add = (f: number[]) => { if(f.length >= 3){ faces.push(f); sheets.push(model.faceSheet?.[fi] ?? 0); } };
    if (!face.includes(corner)) { add(face); return; }
    for(const vi of face) if (side(vi) * tipSide > 1e-9) moving.add(vi);
    for(const sign of [1,-1]){
      const polygon: number[] = [];
      face.forEach((a,i)=>{
        const b=face[(i+1)%face.length], sa=side(a)*sign, sb=side(b)*sign;
        if(sa>=-1e-9) polygon.push(a);
        if((sa>1e-9&&sb< -1e-9)||(sa< -1e-9&&sb>1e-9)) polygon.push(intersect(a,b));
      });
      add([...new Set(polygon)]);
    }
  });
  const unique = [...new Set(hinges)];
  let axis: [number, number] = [unique[0],unique[1]], length=0;
  for(const a of unique)for(const b of unique)if(p[a].distanceToSquared(p[b])>length){
    length=p[a].distanceToSquared(p[b]); axis=[a,b];
  }
  if(length<1e-8) throw new Error(`${model.id}: crease misses corner ${corner}`);
  const op: FoldOp = { axis, moving:[...moving], type:'inside-reverse', angle:halves?90:180, sweep };
  op.direction = foldSign(op,p) as 1|-1;
  return { ...model, vertices, faces, ...(model.faceSheet?{faceSheet:sheets}:{}), steps:[
    ...model.steps.map(s=>({...s,folds:s.folds.map(f=>({...f,surfacePoints:[...(f.surfacePoints??[]),...bindings]}))})),
    { ...caption, folds:halves?[op,{...op}]:[op] },
  ] };
}
