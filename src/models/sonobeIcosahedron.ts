import { sonobeSolid, triangleHull } from '../engine/sonobe';

const p = (1 + Math.sqrt(5)) / 4;
const vertices: [number, number, number][] = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) vertices.push([0,a*.5,b*p],[a*.5,b*p,0],[b*p,0,a*.5]);
export const sonobeIcosahedronModel = sonobeSolid('sonobe-icosahedron', '星型二十面体', 'Stellated Icosahedron', 5,
  triangleHull(vertices));
