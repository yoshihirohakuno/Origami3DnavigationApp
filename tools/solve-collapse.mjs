// 正方基本形(square base)の折りたたみを「連鎖する±180°回転」として解く。
// 中心Oの周りの8扇形を、折り線(O-頂点)を軸に順に回転させ、
// 既知の最終形(4隅が1点、辺中点が2:2で左右)になる符号列を総当たりで探す。
//
// 頂点: 0 O(0,0) 1 M_E(1,0) 2 TR(1,1) 3 M_N(0,1) 4 TL(-1,1)
//       5 M_W(-1,0) 6 BL(-1,-1) 7 M_S(0,-1) 8 BR(1,-1)
// 扇形S1(0,1,2)は固定。op_k: 軸[0, k+1]、動く頂点 = 扇形順でそれ以降。

const base = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

const OPS = [
  { axis: 2, moving: [3, 4, 5, 6, 7, 8] },
  { axis: 3, moving: [4, 5, 6, 7, 8] },
  { axis: 4, moving: [5, 6, 7, 8] },
  { axis: 5, moving: [6, 7, 8] },
  { axis: 6, moving: [7, 8] },
  { axis: 7, moving: [8] },
];

function rotate(p, origin, dir, angle) {
  // Rodrigues 回転(dirは単位ベクトル)
  const v = [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dot = dir[0] * v[0] + dir[1] * v[1] + dir[2] * v[2];
  const cross = [
    dir[1] * v[2] - dir[2] * v[1],
    dir[2] * v[0] - dir[0] * v[2],
    dir[0] * v[1] - dir[1] * v[0],
  ];
  return [
    origin[0] + v[0] * c + cross[0] * s + dir[0] * dot * (1 - c),
    origin[1] + v[1] * c + cross[1] * s + dir[1] * dot * (1 - c),
    origin[2] + v[2] * c + cross[2] * s + dir[2] * dot * (1 - c),
  ];
}

function apply(signs) {
  const pos = base.map(([x, y]) => [x, y, 0]);
  for (let k = 0; k < OPS.length; k++) {
    const { axis, moving } = OPS[k];
    const o = pos[0];
    const a = pos[axis];
    const d = [a[0] - o[0], a[1] - o[1], a[2] - o[2]];
    const len = Math.hypot(...d);
    const dir = [d[0] / len, d[1] / len, d[2] / len];
    const angle = signs[k] * Math.PI; // ±180°
    for (const vi of moving) pos[vi] = rotate(pos[vi], o, dir, angle);
  }
  return pos;
}

const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-9;

const fmt = (p) => `(${p.map((c) => (Math.abs(c) < 1e-9 ? 0 : +c.toFixed(4))).join(',')})`;

const results = [];
for (let mask = 0; mask < 64; mask++) {
  const signs = Array.from({ length: 6 }, (_, k) => ((mask >> k) & 1 ? 1 : -1));
  const pos = apply(signs);
  const cornersOk = [4, 6, 8].every((i) => near(pos[i], [1, 1, 0]));
  if (!cornersOk) continue;
  const D = Math.SQRT1_2;
  const sides = [3, 5, 7].map((i) =>
    near(pos[i], [1, 0, 0]) ? 'E' : near(pos[i], [D, D, 0]) ? 'D' : '?',
  );
  results.push({ signs, sides, mids: [3, 5, 7].map((i) => fmt(pos[i])) });
}

for (const r of results) {
  console.log('signs:', r.signs.join(','), ' M_N/M_W/M_S:', r.sides.join(','), r.mids.join(' '));
}
console.log(results.length, 'corner-solutions');

// 採用中の交互符号(モデルと同じ)で176°時の各扇形の層順(z)を出力する。
// 花弁折り(petal fold)の対象レイヤー特定に使う。
{
  const signs = [-1, 1, -1, 1, -1, 1];
  const pos = base.map(([x, y]) => [x, y, 0]);
  const deg = (176 * Math.PI) / 180;
  for (let k = 0; k < OPS.length; k++) {
    const { axis, moving } = OPS[k];
    const o = pos[0];
    const a = pos[axis];
    const d = [a[0] - o[0], a[1] - o[1], a[2] - o[2]];
    const len = Math.hypot(...d);
    const dir = [d[0] / len, d[1] / len, d[2] / len];
    for (const vi of moving) pos[vi] = rotate(pos[vi], o, dir, signs[k] * deg);
  }
  // 各扇形の重心zで層順を判定(S1=(0,1,2)...S8=(0,8,1))
  const sectors = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5],
    [0, 5, 6], [0, 6, 7], [0, 7, 8], [0, 8, 1],
  ];
  const zs = sectors.map((f, i) => ({
    sector: `S${i + 1}`,
    z: +(f.reduce((s, vi) => s + pos[vi][2], 0) / 3).toFixed(4),
  }));
  zs.sort((a, b) => b.z - a.z);
  console.log('layer order (front->back at 176°, signs -1,1,-1,1,-1,1):');
  console.log(zs.map((s) => `${s.sector}(z=${s.z})`).join(' > '));
}
