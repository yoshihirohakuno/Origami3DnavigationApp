import { Vector3 } from 'three';
import { easeInOut, type FoldState } from '../engine/fold';
import { foldSpatialFlap } from '../engine/foldSpatialFlap';
import { paperTriangles } from '../engine/mesh';
import type { FoldStep, OrigamiModel } from '../engine/types';

export interface MaterialStudy {
  model: OrigamiModel;
  stateAt: (model: OrigamiModel, time: number) => FoldState;
}

/** Private authoring bridge: refine the original material of an exact coupled
 * mechanism, then append a real single hinge. No vertex targets or remeshed
 * disconnected copies are used. The public folding routes remain unchanged. */
export function appendStudyFlap(source: MaterialStudy, seed: number,
  origin: Vector3, crease: Vector3, across: Vector3, angle: number, direction: 1|-1,
  caption: Pick<FoldStep, 'description'|'caution'>, type: 'valley'|'mountain' = 'valley'): MaterialStudy {
  const prefix = source.model.steps.length;
  const refined = foldSpatialFlap(source.model, seed, origin, crease, across, angle, direction,
    caption, source.stateAt);
  refined.steps[prefix].folds[0].type=type;
  const triangles = paperTriangles(source.model);
  const parentFaces=refined.faces.map(face=>{
    const [x,y]=face.reduce(([x,y],i)=>[x+refined.vertices[i][0]/face.length,y+refined.vertices[i][1]/face.length],[0,0]);
    for(const[fi,a,b,c]of triangles){
      const A=source.model.vertices[a],B=source.model.vertices[b],C=source.model.vertices[c];
      const dx=B[0]-A[0],dy=B[1]-A[1],ex=C[0]-A[0],ey=C[1]-A[1],det=dx*ey-dy*ex;
      if(Math.abs(det)<1e-14)continue;
      const u=((x-A[0])*ey-(y-A[1])*ex)/det,v=(dx*(y-A[1])-dy*(x-A[0]))/det;
      if(u>=-1e-8&&v>=-1e-8&&u+v<=1+1e-8)return fi;
    }
    throw new Error('Study flap: refined face lost its parent material panel');
  });
  // Each newly cut point lies in an ORIGINAL material panel. Transport it in
  // that panel's frame before applying the new fold, at every earlier time.
  const bindings = refined.vertices.slice(source.model.vertices.length).map(([x,y], j) => {
    for (const [,a,b,c] of triangles) {
      const A=source.model.vertices[a], B=source.model.vertices[b], C=source.model.vertices[c];
      const dx=B[0]-A[0],dy=B[1]-A[1],ex=C[0]-A[0],ey=C[1]-A[1],det=dx*ey-dy*ex;
      if(Math.abs(det)<1e-14)continue;
      const u=((x-A[0])*ey-(y-A[1])*ex)/det;
      const v=(dx*(y-A[1])-dy*(x-A[0]))/det;
      if(u>=-1e-8&&v>=-1e-8&&u+v<=1+1e-8)return {i:j+source.model.vertices.length,a,b,c,u,v};
    }
    throw new Error('Study flap: new vertex is outside its original material');
  });
  function stateAt(_: OrigamiModel, time: number): FoldState {
    const t=Math.max(0,Math.min(Number.isNaN(time)?0:time,prefix+1));
    const before=source.stateAt(source.model,Math.min(t,prefix));
    const positions=before.positions.map(p=>p.clone());
    for(const{i,a,b,c,u,v}of bindings)positions[i]=positions[a].clone().multiplyScalar(1-u-v)
      .addScaledVector(positions[b],u).addScaledVector(positions[c],v);
    if(t<prefix)return {...before,positions,movingFaces:new Set(parentFaces.flatMap((fi,j)=>before.movingFaces.has(fi)?[j]:[]))};
    const op=refined.steps[prefix].folds[0],fraction=t-prefix;
    const start=positions.map(p=>p.clone()),a=start[op.axis[0]],b=start[op.axis[1]],axis=b.clone().sub(a).normalize();
    const radians=direction*angle*Math.PI/180;
    for(const i of op.moving)positions[i].sub(a).applyAxisAngle(axis,radians*easeInOut(fraction)).add(a);
    let far=op.moving[0],distance=-1;
    for(const i of op.moving){const d=start[i].clone().sub(a).cross(axis).lengthSq();if(d>distance){far=i;distance=d;}}
    const moving=new Set(op.moving);
    return { positions, stepIndex:prefix, fraction,
      movingFaces:new Set(refined.faces.flatMap((face,fi)=>face.some(i=>moving.has(i))?[fi]:[])),
      guides:fraction>=1?[]:[{type:op.type,axisLine:[a.clone(),b.clone()],
        arrowPath:Array.from({length:17},(_,j)=>start[far].clone().sub(a).applyAxisAngle(axis,radians*j/16).add(a))}],
    };
  }
  return {model:refined,stateAt};
}
