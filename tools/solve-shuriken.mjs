// 手裏剣(おりがみくらぶ・2枚組み)の折り工程ソルバ。
// 理想的な180°反転(2D鏡映)で全9工程の頂点位置を計算し、
// - 各工程後のシルエット(頂点座標)
// - 組み立て(❺❻)の平行移動ベクトル
// - 差し込み(❼❾)の折り線と相手ユニットの縁の一致
// を検証して、shuriken.ts に書くべき数値を出力する。
//
// シートのローカル展開図(非鏡映バリアント、帯 = x∈[0,0.5] に畳む):
//   ❶ 観音折り: x=±0.5 で両端を中心へ(谷)
//   ❷ 中心 x=0 で左半分を右へ(谷)
//   ❸ 帯の端を斜め45°に折る: 上 (0,1)-(0.5,0.5) / 下 (0,-0.5)-(0.5,-1)(谷)
//   ❹ 先端を折る: 上 (0,0)-(0.5,0.5) / 下 (0,-0.5)-(0.5,0)(谷)
// 完成ユニット: 中央平行四辺形 + 先端 (1,0)・(-0.5,0) の稲妻形(全長1.5)


// 点pを直線(a→b)で鏡映する
function reflect(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  const fx = a[0] + t * dx;
  const fy = a[1] + t * dy;
  return [2 * fx - p[0], 2 * fy - p[1]];
}

function eq(p, q) {
  return Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
}
function fmt(p) {
  return `(${(+p[0].toFixed(4))}, ${(+p[1].toFixed(4))})`;
}

// ローカル展開図の20頂点(非鏡映バリアント)
const LOCAL = [
  [-1, 1], // c0
  [-1, 0], // c1
  [-1, -0.5], // c2
  [-1, -1], // c3
  [-0.5, 1], // c4
  [-0.5, 0.5], // c5
  [-0.5, 0], // c6
  [-0.5, -1], // c7
  [0, 1], // c8
  [0, 0], // c9
  [0, -0.5], // c10
  [0, -1], // c11
  [0.5, 1], // c12
  [0.5, 0.5], // c13
  [0.5, 0], // c14
  [0.5, -1], // c15
  [1, 1], // c16
  [1, 0], // c17
  [1, -0.5], // c18
  [1, -1], // c19
];

// 折り工程(軸=頂点インデックス2つ、moving=動く頂点)
const UNIT_STEPS = [
  // ❶ 観音折り(2オペ)
  [
    { axis: [4, 7], moving: [0, 1, 2, 3] },
    { axis: [12, 15], moving: [16, 17, 18, 19] },
  ],
  // ❷ 半分に折る
  [{ axis: [8, 11], moving: [0, 1, 2, 3, 4, 5, 6, 7] }],
  // ❸ 端を斜めに折る
  [
    { axis: [8, 13], moving: [4, 12] },
    { axis: [10, 15], moving: [3, 11, 19] },
  ],
  // ❹ 先端を折る
  [
    { axis: [9, 13], moving: [0, 4, 8, 12, 16] },
    { axis: [10, 14], moving: [3, 7, 11, 15, 19] },
  ],
];

// 1シートの❶〜❹を理想反転で計算(mirror=trueでx反転バリアント)
function foldUnit(mirror) {
  const s = mirror ? -1 : 1;
  const pos = LOCAL.map(([x, y]) => [s * x, y]);
  for (const step of UNIT_STEPS) {
    for (const op of step) {
      const a = pos[op.axis[0]];
      const b = pos[op.axis[1]];
      for (const vi of op.moving) pos[vi] = reflect(pos[vi], a, b);
    }
  }
  return pos;
}

console.log('=== ❶〜❹ 後のユニット形状(非鏡映) ===');
const unit = foldUnit(false);
unit.forEach((p, i) => console.log(`c${i}: ${fmt(p)}`));

// 検証: 先端の位置
console.log('\n--- 検証 ---');
const checks = [
  ['c8 (東の先端)', unit[8], [1, 0]],
  ['c7 (西の先端)', unit[7], [-0.5, 0]],
  ['c15 (西の先端)', unit[15], [-0.5, 0]],
  ['c11 (折り込まれた角→中央付近)', unit[11], [0, 0]],
  ['c0 (紙の角→先端に重なる)', unit[0], [1, 0]],
  ['c4 (❸で畳んだ角)', unit[4], [0.5, 0]],
];
let ok = true;
for (const [name, p, want] of checks) {
  const good = eq(p, want);
  ok &&= good;
  console.log(`${good ? 'OK' : 'NG'} ${name}: ${fmt(p)} (期待 ${fmt(want)})`);
}

// 中央平行四辺形(❹の折り線ではさまれた領域)の頂点
console.log('\n中央部: c9', fmt(unit[9]), 'c13', fmt(unit[13]), 'c14', fmt(unit[14]), 'c10', fmt(unit[10]));

// === 組み立て ===
// 配置: 朱(A)=鏡映バリアント AX=-1.6 / 藍(B)=非鏡映 BX=+1.6
const AX = -1.2;
const BX = 1.2;

const unitA = foldUnit(true).map(([x, y]) => [x + AX, y]); // 鏡映
const unitB = foldUnit(false).map(([x, y]) => [x + BX, y]);

// Aの中心・先端
const tipsA = [unitA[8], unitA[7]]; // 先端2つ(鏡映なので西=c8, 東=c7/c15)
console.log('\n=== 組み立て前 ===');
console.log('A 先端:', fmt(tipsA[0]), fmt(tipsA[1]), '中心:', fmt([AX - 0.25, 0]));
console.log('B 先端:', fmt(unitB[8]), fmt(unitB[7]), '中心:', fmt([BX + 0.25, 0]));

// ❺ A: 長軸(y=0)まわりに180°裏返し(2Dでは恒等) + 面内90°回転(pivot=c8A) + 平行移動
//    B: 中心を原点へ平行移動
// 目標: A中心 → (0, 1.6) (Bの上に待機)、B中心 → (0,0)
const pivotA = unitA[8]; // (-2.6, 0)
function spin90(p, pivot) {
  return [pivot[0] - (p[1] - pivot[1]), pivot[1] + (p[0] - pivot[0])];
}
const centerA = [AX - 0.25, 0];
const centerAspun = spin90(centerA, pivotA);
const STAGE_Y = 1.0;
const trA5 = [0 - centerAspun[0], STAGE_Y - centerAspun[1]];
const trB5 = [-(BX + 0.25), 0];
console.log('\n=== ❺ の数値 ===');
console.log(`A: spinZ=+90 (pivot=c8A ${fmt(pivotA)}) → translate [${trA5[0]}, ${trA5[1]}]`);
console.log(`B: translate [${trB5[0]}, ${trB5[1]}]`);

// ❻ A を B の上へ: (0, STAGE_Y) → (0,0)
console.log(`\n=== ❻ の数値 ===\nA: translate [0, ${-STAGE_Y}]`);

// 組み立て後の位置を計算
const asmA = unitA.map((p) => {
  const q = spin90(p, pivotA);
  return [q[0] + trA5[0], q[1] + trA5[1] - STAGE_Y];
});
const asmB = unitB.map((p) => [p[0] + trB5[0], p[1] + trB5[1]]);

console.log('\n=== 組み立て後 ===');
console.log('A 先端:', fmt(asmA[8]), fmt(asmA[7]), '(北/南のはず)');
console.log('B 先端:', fmt(asmB[8]), fmt(asmB[7]), '(東/西のはず)');

// ❼ 差し込み: Aの先端三角をベースの折り線(c9-c13 / c10-c14)で相手側へ巻き込む
//    折り線が B の中央部の縁と一致しているか確認
console.log('\n=== 差し込みの折り線と相手の縁 ===');
console.log('A 折り線1: ', fmt(asmA[9]), '-', fmt(asmA[13]));
console.log('A 折り線2: ', fmt(asmA[10]), '-', fmt(asmA[14]));
console.log('B 中央部の縁: ', fmt(asmB[9]), '-', fmt(asmB[13]), '/', fmt(asmB[10]), '-', fmt(asmB[14]));

// 巻き込み後のAの先端位置(折り線でもう一度鏡映=展開位置)
const wrapN = reflect(asmA[8], asmA[9], asmA[13]);
console.log('\nA北先端の巻き込み後:', fmt(wrapN), '(Bの帯 |y|<=0.5 内に収まるはず)');
const wrapS = reflect(asmA[11], asmA[10], asmA[14]);
console.log('A南先端(c11)の巻き込み後:', fmt(wrapS));

// 星の4先端
console.log('\n=== 完成した星 ===');
console.log('北:', fmt(asmA[8]), '南:', fmt(asmA[7]), '東西:', fmt(asmB[8]), fmt(asmB[7]));
console.log(ok ? '\n全チェックOK' : '\nNGあり!');
