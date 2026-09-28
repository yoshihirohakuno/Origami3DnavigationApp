import { sonobeSolid, triangleHull } from '../engine/sonobe';

// Nine modules on a unit-edge triangular bipyramid, capped like the other
// Sonobe assemblies. The equatorial ring has three vertices, not four.
const r = 1 / Math.sqrt(3);
const h = Math.sqrt(2 / 3);
export const sonobeTriangularBipyramidModel = sonobeSolid(
  'sonobe-triangular-bipyramid', '三角環の結晶', 'Triangular-ring Crystal', 3,
  triangleHull([
    ...Array.from({ length: 3 }, (_, i): [number, number, number] =>
      [r * Math.cos(i * Math.PI * 2 / 3), r * Math.sin(i * Math.PI * 2 / 3), 0]),
    [0, 0, h], [0, 0, -h],
  ]),
);
