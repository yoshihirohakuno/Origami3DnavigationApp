#!/usr/bin/env node
/**
 * 折り図(おりがみくらぶの zu.gif)をピクセル実測するための道具。
 *
 * 使い方:
 *   node tools/zu-measure.mjs fetch <name>            折り図を落として BMP に変換
 *   node tools/zu-measure.mjs map <bmp>               全体をアスキーで俯瞰(パネルの位置出し)
 *   node tools/zu-measure.mjs bbox <bmp> x0 y0 x1 y1  範囲内の「色の面」「線」の外接矩形
 *   node tools/zu-measure.mjs runs <bmp> x0 y0 x1 y1 [step]     行ごとの色の面の区間
 *   node tools/zu-measure.mjs outline <bmp> x0 y0 x1 y1 [step]  行ごとの線の x 座標
 *   node tools/zu-measure.mjs probe <bmp> x0 y0 x1 y1 r120,c85  指定の行/列の線の位置
 *
 * 注意:
 * - 折り図の GIF は透明部分を持つ。sips で BMP にすると透明画素は alpha=0 で
 *   RGB が 0 になるので、「透明 or 白 = 地」で判定すること(黒と間違えない)。
 * - **パネルごとに縮尺が違う**(実測で1割以上ずれることがある)。1枚のパネルから
 *   出した数値を信じず、必ず別のパネルや完成図と突き合わせる。
 * - 折り図は手描きなので、目印(1/2・1/3・角の二等分線・辺に重なる など)に
 *   一致するなら厳密値を採用する。実測はその裏づけに使う。
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const WORK = 'tools/.zu';

/** 無圧縮BMP(24/32bit)を読む。at(x,y) -> [r,g,b,a] */
export function readBmp(path) {
  const b = readFileSync(path);
  const off = b.readUInt32LE(10);
  const w = b.readInt32LE(18);
  const hRaw = b.readInt32LE(22);
  const bpp = b.readUInt16LE(28);
  const h = Math.abs(hRaw);
  const topDown = hRaw < 0;
  const bytes = bpp / 8;
  const row = Math.ceil((w * bytes) / 4) * 4;
  const at = (x, y) => {
    const yy = topDown ? y : h - 1 - y;
    const i = off + yy * row + x * bytes;
    return [b[i + 2], b[i + 1], b[i], bytes === 4 ? b[i + 3] : 255];
  };
  return { w, h, at };
}

/** 透明 or 白 = 地 */
export const isBlank = ([r, g, b, a]) => a < 128 || (r > 235 && g > 235 && b > 235);
/** 線(黒〜灰。破線もこれで拾える) */
export const isLine = ([r, g, b, a]) =>
  a >= 128 && (r + g + b) / 3 < 215 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
/** 色のついた面(紙の裏 or 表の色) */
export const isColor = ([r, g, b, a]) => a >= 128 && Math.max(r, g, b) - Math.min(r, g, b) > 28;

function fetchZu(name) {
  if (!existsSync(WORK)) mkdirSync(WORK, { recursive: true });
  const gif = `${WORK}/${name}.gif`;
  const bmp = `${WORK}/${name}.bmp`;
  const png = `${WORK}/${name}.png`;
  execFileSync('curl', [
    '-sS',
    '--max-time',
    '30',
    '-o',
    gif,
    `https://www.origami-club.com/rn-image/zu/${name}.gif`,
  ]);
  execFileSync('sips', ['-s', 'format', 'png', gif, '--out', png], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'bmp', png, '--out', bmp], { stdio: 'ignore' });
  const img = readBmp(bmp);
  console.log(`${png}\n${bmp}\n${img.w}x${img.h}`);
  console.log('png は目で見る用(Read ツールで開ける)、bmp は実測用。');
}

function map(file) {
  const img = readBmp(file);
  console.log(`${img.w}x${img.h}  ('#'=色の面 '+'=線 ' '=地)`);
  for (let y = 0; y < img.h; y += 8) {
    let line = '';
    for (let x = 0; x < img.w; x += 8) {
      let ink = 0;
      let col = 0;
      for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 8; dx++) {
          const p = img.at(Math.min(x + dx, img.w - 1), Math.min(y + dy, img.h - 1));
          if (isColor(p)) col++;
          else if (isLine(p)) ink++;
        }
      }
      line += col > 6 ? '#' : ink > 2 ? '+' : ink > 0 ? '.' : ' ';
    }
    console.log(String(y).padStart(4), line);
  }
}

function bbox(file, X0, Y0, X1, Y1) {
  const img = readBmp(file);
  const box = (test) => {
    let x0 = 1e9;
    let x1 = -1;
    let y0 = 1e9;
    let y1 = -1;
    for (let y = Y0; y <= Y1; y++)
      for (let x = X0; x <= X1; x++)
        if (test(img.at(x, y))) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return x1 < 0 ? null : { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, ratio: +((x1 - x0) / (y1 - y0)).toFixed(3) };
  };
  console.log('color', JSON.stringify(box(isColor)));
  console.log('line ', JSON.stringify(box(isLine)));
}

function runs(file, X0, Y0, X1, Y1, step = 4) {
  const img = readBmp(file);
  for (let y = Y0; y <= Y1; y += step) {
    const out = [];
    let s = -1;
    for (let x = X0; x <= X1; x++) {
      const on = isColor(img.at(x, y));
      if (on && s < 0) s = x;
      if (!on && s >= 0) {
        out.push(`${s}-${x - 1}`);
        s = -1;
      }
    }
    if (s >= 0) out.push(`${s}-${X1}`);
    if (out.length) console.log(y, out.join(' '));
  }
}

function outline(file, X0, Y0, X1, Y1, step = 4) {
  const img = readBmp(file);
  for (let y = Y0; y <= Y1; y += step) {
    const hits = [];
    let prev = false;
    for (let x = X0; x <= X1; x++) {
      const on = isLine(img.at(x, y));
      if (on && !prev) hits.push(x);
      prev = on;
    }
    if (hits.length) console.log(y, hits.join(' '));
  }
}

function probe(file, X0, Y0, X1, Y1, spec) {
  const img = readBmp(file);
  for (const s of spec.split(',')) {
    const kind = s[0];
    const v = +s.slice(1);
    const hits = [];
    let prev = false;
    if (kind === 'r') {
      for (let x = X0; x <= X1; x++) {
        const on = isLine(img.at(x, v));
        if (on && !prev) hits.push(x);
        prev = on;
      }
    } else {
      for (let y = Y0; y <= Y1; y++) {
        const on = isLine(img.at(v, y));
        if (on && !prev) hits.push(y);
        prev = on;
      }
    }
    console.log(s, hits.join(' '));
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const n = (i) => Number(rest[i]);
if (cmd === 'fetch') fetchZu(rest[0]);
else if (cmd === 'map') map(rest[0]);
else if (cmd === 'bbox') bbox(rest[0], n(1), n(2), n(3), n(4));
else if (cmd === 'runs') runs(rest[0], n(1), n(2), n(3), n(4), rest[5] ? n(5) : 4);
else if (cmd === 'outline') outline(rest[0], n(1), n(2), n(3), n(4), rest[5] ? n(5) : 4);
else if (cmd === 'probe') probe(rest[0], n(1), n(2), n(3), n(4), rest[5]);
else {
  console.log(readFileSync(new URL(import.meta.url)).toString().split('*/')[0]);
  process.exit(1);
}
