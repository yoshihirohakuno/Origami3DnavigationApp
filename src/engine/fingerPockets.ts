import { Vector3 } from 'three';

/** Eight congruent right triangles meet at the center. The dot-product
 * constraint C·M=1/4 preserves both legs and the hypotenuse at every pose. */
export function fingerPocketPoint(x: number, y: number, sx: number, sy: number, outer: number, progress: number): Vector3 {
  const theta = Math.PI / 2 * (1 - progress);
  const a = Math.cos(theta), b = Math.sin(theta) / Math.SQRT2;
  const phi = Math.atan2(b, a) + Math.acos(Math.min(1, 1 / Math.sqrt(2 * (a*a+b*b))));
  const c = new Vector3(sx * Math.sin(theta)/2, sy * Math.sin(theta)/2, Math.cos(theta)/Math.SQRT2);
  const mx = new Vector3(sx * Math.sin(phi)/2, 0, Math.cos(phi)/2);
  const my = new Vector3(0, sy * Math.sin(phi)/2, Math.cos(phi)/2);
  return panelPoint(x, y, outer, c, mx, my);
}

/** Signed opening switches between the two mouth axes through the closed pose.
 * |C|²=1/2, |M|²=1/4 and C·M=1/4 keep every panel rigid. */
export function fingerPocketPlayPoint(x: number, y: number, sx: number, sy: number, outer: number, opening: number): Vector3 {
  const u = .44 * Math.min(1, Math.abs(opening));
  const h = Math.sqrt(.5-u*u), z = .25/h, r = Math.sqrt(.25-z*z);
  const c = opening >= 0 ? new Vector3(0, sy*u, h) : new Vector3(sx*u, 0, h);
  const mx = opening >= 0 ? new Vector3(sx*r, 0, z) : new Vector3(sx*(u+h)/2, 0, (h-u)/2);
  const my = opening >= 0 ? new Vector3(0, sy*(u+h)/2, (h-u)/2) : new Vector3(0, sy*r, z);
  return panelPoint(x, y, outer, c, mx, my);
}

function panelPoint(x: number, y: number, outer: number, c: Vector3, mx: Vector3, my: Vector3): Vector3 {
  const u = Math.abs(x)*2, v = Math.abs(y)*2;
  const p = c.clone().multiplyScalar(Math.min(u,v))
    .addScaledVector(mx, Math.max(0,u-v)).addScaledVector(my,Math.max(0,v-u));
  if (outer) {
    const n = mx.clone().sub(c).cross(my.clone().sub(c)).normalize();
    p.addScaledVector(n, -2 * p.clone().sub(c).dot(n));
  }
  return p;
}
