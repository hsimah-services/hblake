import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { REPO_ROOT } from '../../lib/env.ts';

// The site palette (client/src/styles/global.css) must work for colour-blind visitors:
// every pair of tones stays distinguishable under simulated protanopia, deuteranopia
// and tritanopia (Machado et al. 2009, full severity), measured as CIEDE2000 colour
// difference. Contrast stays WCAG AA in light and dark.

const CSS = fs.readFileSync(path.join(REPO_ROOT, 'client/src/styles/global.css'), 'utf8');
const TONES = ['green', 'orange', 'blue', 'berry'];
const MIN_DIFFERENCE = 10;

type Rgb = [number, number, number];

const SIMULATIONS: Record<string, number[][]> = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

function variable(name: string): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`global.css defines --${name}`);
  return match[1].trim();
}

function lightDark(name: string): [string, string] {
  const value = variable(name);
  const pair = value.match(/^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$/i);
  if (!pair) throw new Error(`--${name} is light-dark(#light, #dark), not ${value}`);
  return [pair[1], pair[2]];
}

const linear = (hex: string): Rgb => [1, 3, 5].map(i => {
  const c = parseInt(hex.slice(i, i + 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}) as Rgb;
const luminance = ([r, g, b]: Rgb): number => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const contrast = (a: string, b: string): number => {
  const [x, y] = [luminance(linear(a)), luminance(linear(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const simulate = (rgb: Rgb, m: number[][]): Rgb =>
  m.map(row => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]))) as Rgb;

function lab(rgb: Rgb): Rgb {
  const [r, g, b] = rgb;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(luminance(rgb));
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function ciede2000([l1, a1, b1]: Rgb, [l2, a2, b2]: Rgb): number {
  const rad = Math.PI / 180;
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const [ap1, ap2] = [(1 + g) * a1, (1 + g) * a2];
  const [cp1, cp2] = [Math.hypot(ap1, b1), Math.hypot(ap2, b2)];
  const hue = (b: number, a: number): number => ((Math.atan2(b, a) / rad) + 360) % 360;
  const [hp1, hp2] = [hue(b1, ap1), hue(b2, ap2)];
  let dh = hp2 - hp1;
  if (cp1 * cp2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin((dh / 2) * rad);
  const lBar = (l1 + l2) / 2;
  const cpBar = (cp1 + cp2) / 2;
  let hBar = hp1 + hp2;
  if (cp1 * cp2 !== 0) hBar = Math.abs(hp1 - hp2) <= 180 ? hBar / 2 : hBar < 360 ? (hBar + 360) / 2 : (hBar - 360) / 2;
  const t = 1 - 0.17 * Math.cos((hBar - 30) * rad) + 0.24 * Math.cos(2 * hBar * rad) + 0.32 * Math.cos((3 * hBar + 6) * rad) - 0.2 * Math.cos((4 * hBar - 63) * rad);
  const sl = 1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2);
  const sc = 1 + 0.045 * cpBar;
  const sh = 1 + 0.015 * cpBar * t;
  const rt = -2 * Math.sqrt(cpBar ** 7 / (cpBar ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hBar - 275) / 25) ** 2)) * rad);
  const [dl, dc] = [(l2 - l1) / sl, (cp2 - cp1) / sc];
  return Math.sqrt(dl ** 2 + dc ** 2 + (dH / sh) ** 2 + rt * dc * (dH / sh));
}

function closestPairs(colours: Record<string, string>): string[] {
  const problems: string[] = [];
  for (const [vision, matrix] of Object.entries(SIMULATIONS)) {
    const names = Object.keys(colours);
    for (let i = 0; i < names.length; i += 1) {
      for (let j = i + 1; j < names.length; j += 1) {
        const difference = ciede2000(lab(simulate(linear(colours[names[i]]), matrix)), lab(simulate(linear(colours[names[j]]), matrix)));
        if (difference < MIN_DIFFERENCE) problems.push(`${vision}: ${names[i]}/${names[j]} ΔE ${difference.toFixed(1)}`);
      }
    }
  }
  return problems;
}

test('home tiles are distinguishable with colour blindness and carry readable white text', () => {
  const tiles = Object.fromEntries(TONES.map(tone => [tone, variable(`site-tile-${tone}`)]));
  for (const [tone, hex] of Object.entries(tiles)) expect(contrast(hex, '#ffffff'), `white on ${tone}`).toBeGreaterThanOrEqual(4.5);
  expect(closestPairs(tiles)).toEqual([]);
});

for (const [index, scheme] of (['light', 'dark'] as const).entries()) {
  test(`${scheme} navigation tones are distinguishable with colour blindness and readable`, () => {
    const canvas = lightDark('site-canvas')[index];
    const tones = Object.fromEntries(TONES.map(tone => [tone, lightDark(`site-${tone}`)[index]]));
    for (const [tone, hex] of Object.entries(tones)) expect(contrast(hex, canvas), `${tone} on the ${scheme} canvas`).toBeGreaterThanOrEqual(4.5);
    // Links without a tone use the scheme's text colour, so tones must differ from it too.
    expect(closestPairs({ ...tones, text: scheme === 'light' ? '#000000' : '#ffffff' })).toEqual([]);
  });
}
