import type { Deltahedron } from './sonobe';

/** A strip of regular antiprisms capped by equilateral pyramids. All edges
 * have length one; each ring is offset by half a sector from its neighbor. */
export function cappedAntiprism(sides: 3 | 4 | 5, rings: number): Deltahedron {
  if (!Number.isInteger(rings) || rings < 2) throw new Error('At least two rings are required');
  const radius = 1 / (2 * Math.sin(Math.PI / sides));
  const rise = Math.sqrt(1 - (2 * radius * Math.sin(Math.PI / (2 * sides))) ** 2);
  const capHeight = Math.sqrt(1 - radius * radius);
  const vertices: Deltahedron['vertices'] = [];
  const faces: Deltahedron['faces'] = [];
  for (let ring = 0; ring < rings; ring++) for (let i = 0; i < sides; i++) {
    const angle = (2 * i + ring) * Math.PI / sides;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), (ring - (rings - 1) / 2) * rise]);
  }
  const lower = vertices.length, upper = lower + 1;
  vertices.push([0, 0, -(rings - 1) * rise / 2 - capHeight], [0, 0, (rings - 1) * rise / 2 + capHeight]);
  const at = (ring: number, i: number) => ring * sides + (i + sides) % sides;
  for (let i = 0; i < sides; i++) faces.push([lower, at(0, i + 1), at(0, i)]);
  for (let ring = 0; ring < rings - 1; ring++) for (let i = 0; i < sides; i++) {
    faces.push([at(ring, i), at(ring, i + 1), at(ring + 1, i)]);
    faces.push([at(ring, i + 1), at(ring + 1, i + 1), at(ring + 1, i)]);
  }
  for (let i = 0; i < sides; i++) faces.push([upper, at(rings - 1, i), at(rings - 1, i + 1)]);
  return { vertices, faces };
}
