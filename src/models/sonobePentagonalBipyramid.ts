import { sonobeSolid, triangleHull } from '../engine/sonobe';

// Fifteen modules close a five-sided equatorial ring. Equal edges preserve
// the actual module dimensions; this is not a scaled octahedron mesh.
const r = 1 / (2 * Math.sin(Math.PI / 5));
const h = Math.sqrt(1 - r * r);
export const sonobePentagonalBipyramidModel = sonobeSolid(
  'sonobe-pentagonal-bipyramid', '五角環の星形', 'Pentagonal-ring Star', 3,
  triangleHull([
    ...Array.from({ length: 5 }, (_, i): [number, number, number] =>
      [r * Math.cos(i * Math.PI * 2 / 5), r * Math.sin(i * Math.PI * 2 / 5), 0]),
    [0, 0, h], [0, 0, -h],
  ]),
);
