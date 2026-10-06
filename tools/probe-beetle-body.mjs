// Authoring experiment only. A low panel-length residual is NOT enough:
// transverse collisions reject the candidate, and a single pose never
// establishes a continuous folding route. Does not modify any model file.
// node --import ./tools/register-typescript.mjs tools/probe-beetle-body.mjs
import { Vector3, Matrix4, Quaternion } from 'three';
import { beetleBodyMeshStudy as model } from '../src/experiments/beetleBodyMeshStudy.ts';
import { computeFoldState } from '../src/engine/fold.ts';
import { paperTriangles } from '../src/engine/mesh.ts';
import { intersectingPanels } from './panel-intersections.mjs';

const width = Number(process.argv.find(arg => arg.startsWith('--width='))?.slice(8) ?? .005);
const iterations = Number(process.argv.find(arg => arg.startsWith('--iterations='))?.slice(13) ?? 400);
if (!Number.isFinite(width) || width <= 0 || width > .05 ||
    !Number.isInteger(iterations) || iterations < 1 || iterations > 2000) {
  throw new Error('Use 0 < width <= .05 and 1 to 2000 iterations');
}
const EPS = 5e-7;
const before = computeFoldState(model, model.steps.length).positions;
const initial = computeFoldState(model, 0).positions;
const used = [...new Set(model.faces.flat())];
const pairMap = new Map();
for (const face of model.faces) for (const a of face) for (const b of face) {
  if (a < b) pairMap.set(`${a},${b}`, [a, b, before[a].distanceTo(before[b])]);
}
const constraints = [...pairMap.values()];
const rayIds = [38, 51, 41, 54, 44, 57, 47, 60];
const central = [...new Set(model.faces.filter(face => face.includes(0)).flat())];
const rimIds = Array.from({ length: 8 }, (_, j) => {
  const angle = j * Math.PI / 4 + Math.PI / 8;
  return central.filter(i => i !== 0 &&
    Math.abs((Math.atan2(model.vertices[i][1], model.vertices[i][0]) - angle + Math.PI * 6) % (Math.PI * 2)) < 1e-8)
    .sort((a, b) => Math.hypot(...model.vertices[b]) - Math.hypot(...model.vertices[a]))[0];
});
if (rimIds.some(i => i === undefined)) throw new Error('Missing central fan rim');
const fixed = new Map([[0, before[0].clone()]]);
for (const [j, i] of [51, 54, 57, 60].entries()) {
  const z = -width * (1 - j / 4);
  fixed.set(i, new Vector3(0, -Math.sqrt(.25 - z * z), z));
}
const alpha = width / Math.tan(Math.PI / 8);
const directions = [-1, 1, -.75, .75, -.5, .5, -.25, .25];
const rims = rimIds.map((i, j) => before[i].clone().applyAxisAngle(new Vector3(0, -1, 0), alpha * directions[j]));
const rays = rayIds.map((i, j) => {
  if (j % 2 === 0) return before[i].clone();
  const normal = rims[(j + 7) % 8].clone().cross(rims[j]).normalize();
  return before[i].clone().addScaledVector(normal, -2 * before[i].dot(normal));
});
function frame(edge, rim) {
  const x = edge.clone().normalize();
  const y = rim.clone().addScaledVector(x, -rim.dot(x)).normalize();
  return new Matrix4().makeBasis(x, y, x.clone().cross(y));
}
const rotations = Array.from({ length: 16 }, (_, k) => {
  const j = Math.floor(k / 2), edge = k % 2 ? (j + 1) % 8 : j;
  return new Quaternion().setFromRotationMatrix(frame(rays[edge], rims[j])
    .multiply(frame(before[rayIds[edge]], before[rimIds[j]]).invert()));
});
const p = before.map(v => v.clone());
for (const i of used) {
  if (i === 0) continue;
  const [x, y] = model.vertices[i];
  const angle = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
  p[i].applyQuaternion(rotations[Math.min(15, Math.floor(angle / (Math.PI / 8) + 1e-9))]);
}
for (const [i, point] of fixed) p[i].copy(point);
const active = used.filter(i => !fixed.has(i));
const indices = new Map(active.map((i, j) => [i, j * 3]));
const dimension = active.length * 3;
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
function rows() {
  return constraints.map(([a, b, length]) => {
    const d = p[a].clone().sub(p[b]), actual = d.length();
    return { a: indices.get(a), b: indices.get(b), d: d.divideScalar(actual || 1).toArray(), residual: actual - length };
  });
}
const energy = rs => rs.reduce((sum, row) => sum + row.residual ** 2, 0);
let lambda = 1e-6;
for (let iteration = 0; iteration < iterations; iteration++) {
  const rs = rows(), previousEnergy = energy(rs), rhs = new Float64Array(dimension);
  for (const { a, b, d, residual } of rs) for (let c = 0; c < 3; c++) {
    if (a !== undefined) rhs[a + c] -= d[c] * residual;
    if (b !== undefined) rhs[b + c] += d[c] * residual;
  }
  function multiply(v) {
    const result = Float64Array.from(v, value => value * lambda);
    for (const { a, b, d } of rs) {
      let scale = 0;
      for (let c = 0; c < 3; c++) scale += d[c] * ((a !== undefined ? v[a + c] : 0) - (b !== undefined ? v[b + c] : 0));
      for (let c = 0; c < 3; c++) {
        if (a !== undefined) result[a + c] += d[c] * scale;
        if (b !== undefined) result[b + c] -= d[c] * scale;
      }
    }
    return result;
  }
  let residual = rhs.slice(), direction = residual.slice(), norm = dot(residual, residual);
  const update = new Float64Array(dimension);
  for (let cg = 0; cg < 250 && norm > 1e-24; cg++) {
    const product = multiply(direction), denominator = dot(direction, product);
    if (denominator <= 0) break;
    const step = norm / denominator;
    for (let c = 0; c < dimension; c++) {
      update[c] += step * direction[c];
      residual[c] -= step * product[c];
    }
    const next = dot(residual, residual), beta = next / norm;
    for (let c = 0; c < dimension; c++) direction[c] = residual[c] + beta * direction[c];
    norm = next;
  }
  const copy = active.map(i => p[i].clone());
  active.forEach((i, j) => p[i].add(new Vector3(update[j * 3], update[j * 3 + 1], update[j * 3 + 2])));
  if (energy(rows()) < previousEnergy) lambda = Math.max(1e-12, lambda / 2);
  else {
    active.forEach((i, j) => p[i].copy(copy[j]));
    lambda *= 10;
  }
  if (Math.max(...rows().map(row => Math.abs(row.residual))) < 1e-9) break;
}
const materialError = Math.max(...constraints.map(([a, b]) =>
  Math.abs(p[a].distanceTo(p[b]) - initial[a].distanceTo(initial[b]))));
const crossings = intersectingPanels(paperTriangles(model), p, Infinity);
const poseConsistent = materialError <= EPS && crossings.length === 0;
console.log(JSON.stringify({
  model: model.id, width, iterations, materialTolerance: EPS, materialError,
  panelDimensionsPass: materialError <= EPS, transverseCrossings: crossings.length,
  firstCrossingPairs: crossings.slice(0, 5), poseConsistent,
  routeValidated: false,
  decision: poseConsistent ? 'Pose only. A continuous motion and source comparison are still required.' : 'Rejected. Do not register this pose as a finished beetle.',
}, null, 2));
process.exitCode = poseConsistent ? 0 : 2;
