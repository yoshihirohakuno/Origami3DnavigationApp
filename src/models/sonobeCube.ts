import { sonobeSolid, triangleHull } from '../engine/sonobe';

const u = 1 / (2 * Math.SQRT2);
// Capping the four faces of a tetrahedron joins the six modules into a cube.
export const sonobeCubeModel = sonobeSolid('sonobe-cube', '園部ユニットの立方体', 'Sonobe Cube', 3,
  triangleHull([[u,u,u],[u,-u,-u],[-u,u,-u],[-u,-u,u]]));
