// 手裏剣(おりがみくらぶ・2枚組み)の折り工程ソルバ(v3)。
// 理想的な180°反転(2D鏡映)で全工程を計算し、shuriken.ts に必要な数値を出す。
//
// v3 の要点:
// - ❹の折り線は❸の斜め辺と「平行」。ユニットは翼が斜めにずれた六角Z形
//   (先端 (-0.5,0.5)・(1,-0.5)、中央の斜め帯 + 翼2枚)
// - 組み立ては「朱を裏返して中央へ」「藍を朱の上にかさねる」(藍が上)
// - さしこむ = 下のユニットの翼の先を、上のユニットの縁(=上のユニットの
//   ❹折り線の像)で180°巻き込み、反対側の自分のポケットに差し込む。
//   この巻き込み線は各シートの翼を横切る「新しい折り線」なので、
//   展開図に事前に埋め込む必要がある。その平面位置を層ごとに逆展開して求める。
//
// 展開図の頂点は 0.5 刻みの 5×5 格子 + 巻き込み線の交点。

function reflect(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  return [2 * (a[0] + t * dx) - p[0], 2 * (a[1] + t * dy) - p[1]];
}
const fmt = (p) => `(${+p[0].toFixed(4)}, ${+p[1].toFixed(4)})`;
const eq = (p, q) => Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9;

// 5×5 格子。番号 = 5*ix + iy
const G = [];
for (let ix = 0; ix < 5; ix++) for (let iy = 0; iy < 5; iy++) G.push([-1 + ix * 0.5, -1 + iy * 0.5]);
const id = (x, y) => Math.round((x + 1) / 0.5) * 5 + Math.round((y + 1) / 0.5);

// ❶〜❹(軸頂点と moving。非鏡映=藍バリアント)
const STEPS = [
  [
    { axis: [id(-0.5, 1), id(-0.5, -1)], moving: [0, 1, 2, 3, 4].map((i) => id(-1, -1 + i * 0.5)) },
    { axis: [id(0.5, 1), id(0.5, -1)], moving: [0, 1, 2, 3, 4].map((i) => id(1, -1 + i * 0.5)) },
  ],
  [{ axis: [id(0, 1), id(0, -1)], moving: [0, 1, 2, 3, 4].map((i) => id(-0.5, -1 + i * 0.5)) }],
  [
    { axis: [id(0, 1), id(0.5, 0.5)], moving: [id(-0.5, 1), id(0.5, 1)] },
    { axis: [id(0, -0.5), id(0.5, -1)], moving: [id(0, -1), id(-1, -1), id(1, -1)] },
  ],
  [
    { axis: [id(0, 0.5), id(0.5, 0)], moving: [id(0, 1), id(-1, 1), id(1, 1), id(0.5, 0.5), id(-0.5, 0.5)] },
    { axis: [id(0, 0), id(0.5, -0.5)], moving: [id(0, -0.5), id(-1, -0.5), id(1, -0.5), id(0.5, -1), id(-0.5, -1)] },
  ],
];

// 頂点の軌跡と、各オペの軸線(実行時位置)を記録しながら折る
function foldUnit(mirror) {
  const s = mirror ? -1 : 1;
  const pos = G.map(([x, y]) => [s * x, y]);
  const opLines = []; // {a, b, moving:Set}
  for (const step of STEPS) {
    for (const op of step) {
      const a = [...pos[op.axis[0]]];
      const b = [...pos[op.axis[1]]];
      for (const vi of op.moving) pos[vi] = reflect(pos[vi], a, b);
      opLines.push({ a, b, moving: new Set(op.moving) });
    }
  }
  return { pos, opLines };
}

// 面(20枚)。各列5枚。layer は x 帯で決まる
const FACES = [];
for (let col = 0; col < 4; col++) {
  const x0 = -1 + col * 0.5;
  const x1 = x0 + 0.5;
  // 各列の斜め線は同じ向き(すべて傾き±1、列ごとに交互)
  // 列ごとの5面: 上の三角 / 帯 / 中央帯 / 帯 / 下の三角
  // 折り線のy切片は列によりミラーされるので、格子頂点で直接書く
  // 上の三角: {(x0,1),(x1,1),(m)} で m は列の向き次第
  const up = col % 2 === 0; // 斜線の向き(検証で確認)
  if (up) {
    // 斜線: (x0,y)-(x1,y-0.5) 型(左が高い)
    FACES.push([ [x0, 1], [x1, 1], [x1, 0.5] ]);
    FACES.push([ [x0, 1], [x1, 0.5], [x1, 0], [x0, 0.5] ]);
    FACES.push([ [x0, 0.5], [x1, 0], [x1, -0.5], [x0, 0] ]);
    FACES.push([ [x0, 0], [x1, -0.5], [x1, -1], [x0, -0.5] ]);
    FACES.push([ [x0, -0.5], [x1, -1], [x0, -1] ]);
  } else {
    // 斜線: (x0,y-0.5)-(x1,y) 型(右が高い)
    FACES.push([ [x0, 0.5], [x0, 1], [x1, 1] ]);
    FACES.push([ [x0, 0], [x0, 0.5], [x1, 1], [x1, 0.5] ]);
    FACES.push([ [x0, -0.5], [x0, 0], [x1, 0.5], [x1, 0] ]);
    FACES.push([ [x0, -1], [x0, -0.5], [x1, 0], [x1, -0.5] ]);
    FACES.push([ [x0, -1], [x1, -0.5], [x1, -1] ]);
  }
}

// 検証: 面の頂点が折り線と整合しているか(全頂点が格子上 & ❸❹の線上)
// ❸t: ジグザグ (-1,1)-(-0.5,0.5)-(0,1)-(0.5,0.5)-(1,1)
// → 列0(x -1..-0.5) は左が高い(up)、列1 は右が高い… 上のロジックの確認は動かして行う

const { pos: unitB, opLines: opsB } = foldUnit(false);
const { pos: unitA0, opLines: opsA } = foldUnit(true);

console.log('=== ユニット形状(藍) ===');
let ok = true;
for (const [name, p, want] of [
  ['(0,1)', unitB[id(0, 1)], [-0.5, 0.5]],
  ['(0.5,-1)', unitB[id(0.5, -1)], [1, -0.5]],
  ['(0.5,0.5)', unitB[id(0.5, 0.5)], [0, 0]],
]) {
  const good = eq(p, want);
  ok &&= good;
  console.log(`${good ? 'OK' : 'NG'} ${name} → ${fmt(p)} (期待 ${fmt(want)})`);
}

// === 組み立て ===
// 朱: 裏返し(縦線 x=-0.25 で鏡映) → +90°回転(中心(-0.25,0)) → 中心を原点へ
// 藍: 中心(0.25,0)を原点へ(+z 上へ)
const cA = [-0.25, 0];
const rot90 = ([x, y], c) => [c[0] - (y - c[1]), c[1] + (x - c[0])];
const asmAmap = (p) => {
  const m = [2 * cA[0] - p[0], p[1]]; // 裏返し
  const r = rot90(m, cA);
  return [r[0] - cA[0], r[1] - cA[1]];
};
const asmA = unitA0.map(asmAmap);
const asmB = unitB.map(([x, y]) => [x - 0.25, y]);

console.log('\n=== 組み立て(朱=下, 藍=上) ===');
console.log('朱 先端:', fmt(asmA[id(0, 1)]), fmt(asmA[id(0.5, -1)]));
console.log('藍 先端:', fmt(asmB[id(0, 1)]), fmt(asmB[id(0.5, -1)]));

// === 巻き込み線(さしこむ) ===
// ❼: 朱の翼の先を「藍の縁」で巻き込む。藍の縁 = 藍の❹折り線の像(2本)
//    縁1: asmB[(0,0.5)]-asmB[(0.5,0)] / 縁2: asmB[(0,0)]-asmB[(0.5,-0.5)]
// これを朱のローカル(展開図)へ逆写像し、朱のどの面をどこで割るかを求める。
const edges = [
  [asmB[id(0, 0.5)], asmB[id(0.5, 0)]],
  [asmB[id(0, 0)], asmB[id(0.5, -0.5)]],
];
console.log('\n藍の縁1:', fmt(edges[0][0]), '-', fmt(edges[0][1]));
console.log('藍の縁2:', fmt(edges[1][0]), '-', fmt(edges[1][1]));

// 朱の組み立て写像の逆
const invAsmA = (q) => {
  const r = [q[0] + cA[0], q[1] + cA[1]];
  // rot90 の逆(-90°)
  const m = [cA[0] + (r[1] - cA[1]), cA[1] - (r[0] - cA[0])];
  return [2 * cA[0] - m[0], m[1]]; // 裏返しの逆 = 同じ鏡映
};

// 面ごとの「折り履歴」= moving に自面の頂点を含むオペ列
function faceOps(faceVerts, opLines) {
  const ids = faceVerts.map(([x, y]) => id(x, y));
  return opLines
    .map((op, k) => ({ op, k }))
    .filter(({ op }) => ids.some((vi) => op.moving.has(vi)));
}

// 点 q(折り後ローカル) → 面 f の展開図座標(逆展開: 履歴の逆順に鏡映)
function unfoldPoint(q, hist) {
  let p = q;
  for (let i = hist.length - 1; i >= 0; i--) {
    p = reflect(p, hist[i].op.a, hist[i].op.b);
  }
  return p;
}

// 朱の各面について、藍の縁を展開図へ引き戻し、面と交差するか調べる
console.log('\n=== 朱の翼を割る巻き込み線(展開図座標) ===');
const mirror = true; // 朱
for (const face of FACES) {
  // 鏡映シートの面頂点(ローカル)
  const fv = face.map(([x, y]) => [mirror ? -x : x, y]);
  const hist = faceOps(face, opsA);
  for (let e = 0; e < 2; e++) {
    // 縁の2点を朱ローカル(折り後)へ→この面の展開図座標へ
    const p1 = unfoldPoint(invAsmA(edges[e][0]), hist);
    const p2 = unfoldPoint(invAsmA(edges[e][1]), hist);
    // 面(凸多角形)との交差区間を求める(頂点上の通過も含む)
    const d = [p2[0] - p1[0], p2[1] - p1[1]];
    const sd = (p) => d[0] * (p[1] - p1[1]) - d[1] * (p[0] - p1[0]); // 符号付き距離
    const cuts = [];
    let pos = 0;
    let neg = 0;
    for (let i = 0; i < fv.length; i++) {
      const a = fv[i];
      const b = fv[(i + 1) % fv.length];
      const da = sd(a);
      const db = sd(b);
      if (Math.abs(da) < 1e-9) cuts.push(a);
      else if (da > 0) pos++;
      else neg++;
      if (Math.abs(da) > 1e-9 && Math.abs(db) > 1e-9 && da * db < 0) {
        const t = da / (da - db);
        cuts.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    }
    const uniq = [];
    for (const c of cuts) if (!uniq.some((u2) => eq(u2, c))) uniq.push(c);
    // 面の内部を実際に横切る(両側に頂点がある)場合のみ折り線になる
    if (uniq.length === 2 && pos > 0 && neg > 0) {
      console.log(`面 [${face.map(fmt).join(' ')}] を縁${e + 1}で割る: ${fmt(uniq[0])} - ${fmt(uniq[1])} (鏡映ローカル)`);
    }
  }
}

// 巻き込み後の先端位置(縁で180°鏡映)と、収まり先の確認
console.log('\n=== 巻き込み後の先端 ===');
const tips = [
  ['朱N', asmA[id(0.5, -1)], edges[0]],
  ['朱S', asmA[id(0, 1)], edges[1]],
];
for (const [name, tip, e] of tips) {
  const w = reflect(tip, e[0], e[1]);
  console.log(`${name} ${fmt(tip)} → ${fmt(w)}`);
}
console.log(ok ? '\n形状OK' : '\n形状NG');

// --- デバッグ: 翼まわりの面について引き戻した縁の位置を表示 ---
console.log('\n=== デバッグ: 引き戻した縁 ===');
const dbgFaces = [
  [[0, 0], [0.5, -0.5], [0.5, -1], [0, -0.5]], // 列2の下側の帯(翼になる)
  [[0, -0.5], [0.5, -1], [0, -1]], // 列2の下の三角(❸フラップ)
  [[0.5, -1], [1, -0.5], [1, -1]], // 列3の下の三角
  [[0.5, -0.5], [0.5, 0], [1, 0.5], [1, 0]], // 列3の帯
  [[0.5, -1], [0.5, -0.5], [1, 0], [1, -0.5]], // 列3の下の帯
];
for (const face of dbgFaces) {
  const fv = face.map(([x, y]) => [-x, y]);
  const hist = faceOps(face, opsA);
  for (let e = 0; e < 2; e++) {
    const p1 = unfoldPoint(invAsmA(edges[e][0]), hist);
    const p2 = unfoldPoint(invAsmA(edges[e][1]), hist);
    console.log(`面[${face.map(fmt).join('')}] hist=${hist.length} 縁${e + 1}: ${fmt(p1)}-${fmt(p2)}`);
  }
}
