// 鶴の花弁折り(petal fold)で使う厳密点を検算する。
// 前面フラップは未回転の紙座標で O(0,0), E(1,0), C(1,1), N(0,1)。
// 側辺を中心線 O-C に合わせる角度二等分線の足は s = 2 - sqrt(2)。

const EPS = 1e-9;
const s = 2 - Math.SQRT2;
const h = s / 2;

const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < EPS;
const fmt = (p) => `(${p.map((v) => (Math.abs(v) < EPS ? 0 : +v.toFixed(6))).join(', ')})`;

function reflect(p, a, b) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const wx = p[0] - a[0];
  const wy = p[1] - a[1];
  const t = (wx * vx + wy * vy) / (vx * vx + vy * vy);
  const q = [a[0] + t * vx, a[1] + t * vy];
  return [2 * q[0] - p[0], 2 * q[1] - p[1]];
}

const front = {
  O: [0, 0],
  E: [1, 0],
  C: [1, 1],
  N: [0, 1],
  pE: [s, 0],
  pN: [0, s],
  h: [h, h],
};

const back = {
  O: [0, 0],
  E: [1, 0],
  C: [1, -1],
  S: [0, -1],
  pE: [s, 0],
  pS: [0, -s],
  h: [h, -h],
};

const frontE = reflect(front.E, front.C, front.pE);
const frontN = reflect(front.N, front.C, front.pN);
const frontTip = reflect(front.C, front.pE, front.pN);
const backE = reflect(back.E, back.C, back.pE);
const backS = reflect(back.S, back.C, back.pS);
const backTip = reflect(back.C, back.pE, back.pS);

const checks = [
  ['front E -> center', frontE, front.h],
  ['front N -> center', frontN, front.h],
  ['front lifted corner', frontTip, [s - 1, s - 1]],
  ['back E -> center', backE, back.h],
  ['back S -> center', backS, back.h],
  ['back lifted corner', backTip, [s - 1, 1 - s]],
];

for (const [label, got, want] of checks) {
  if (!near(got, want)) {
    throw new Error(`${label}: got ${fmt(got)}, want ${fmt(want)}`);
  }
}

console.log(`s = ${s}`);
for (const [label, got] of checks) {
  console.log(`${label}: ${fmt(got)}`);
}
console.log('crane petal fold checks passed');
