import { sonobeSolid, triangleHull } from '../engine/sonobe';

const u = Math.SQRT1_2;
export const sonobeOctahedronModel = sonobeSolid('sonobe-octahedron', '星型八面体', 'Stellated Octahedron', 3,
  triangleHull([[u,0,0],[-u,0,0],[0,u,0],[0,-u,0],[0,0,u],[0,0,-u]]));
