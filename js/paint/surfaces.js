// Painted surfaces for the museum and the garden. Tiling textures repeat once per `size` world units.
import { seeded } from '../util.js';
import { canvasTex } from './canvas.js';

function tiled(tex, sizeU, sizeV) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / sizeU, 1 / sizeV); return tex; }
const hsl = (h, s, l, a) => 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')';

// Oak herringbone. One tile is 2.4 units square.
export function parquet() {
  return tiled(canvasTex(512, 512, (x, W) => {
    const rnd = seeded(7), w = W / 4 / Math.SQRT2, Lp = 4 * w;
    x.fillStyle = '#2a1a10'; x.fillRect(0, 0, W, W);
    x.save(); x.translate(W / 2, W / 2); x.rotate(-Math.PI / 4);
    for (let c = -6; c <= 6; c++) for (let k = -14; k <= 14; k++) {
      const ox = k * w + c * Lp, oy = k * w - c * Lp;
      for (const [px, py, pw, ph] of [[ox, oy, Lp, w], [ox, oy + w, w, Lp]]) {
        const l = 24 + rnd() * 5, hh = 27 + rnd() * 5;
        x.fillStyle = hsl(hh, 30, l); x.fillRect(px + 1, py + 1, pw - 2, ph - 2);
        x.strokeStyle = hsl(hh, 30, l - 6, .35); x.lineWidth = 1;
        const along = pw > ph;
        for (let g = 0; g < 4; g++) { const f = .15 + rnd() * .7; x.beginPath(); if (along) { x.moveTo(px + 2, py + ph * f); x.bezierCurveTo(px + pw * .3, py + ph * (f + .1), px + pw * .6, py + ph * (f - .1), px + pw - 2, py + ph * f); } else { x.moveTo(px + pw * f, py + 2); x.bezierCurveTo(px + pw * (f + .1), py + ph * .3, px + pw * (f - .1), py + ph * .6, px + pw * f, py + ph - 2); } x.stroke(); }
      }
    }
    x.restore();
  }), 1.7, 1.7);
}

// Great Hall floor: large cream and grey marble slabs. One tile is 4 units square.
export function slabs() {
  return tiled(canvasTex(512, 512, (x, W) => {
    const rnd = seeded(23), n = 2, t = W / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const light = (i + j) % 2 === 0;
      x.fillStyle = light ? '#a99d8b' : '#9a8e7d'; x.fillRect(i * t, j * t, t, t);
      x.strokeStyle = light ? 'rgba(120,105,90,.18)' : 'rgba(60,55,50,.2)'; x.lineWidth = 1.5;
      for (let v = 0; v < 5; v++) { x.beginPath(); let px = i * t + rnd() * t, py = j * t + rnd() * t; x.moveTo(px, py); for (let q = 0; q < 5; q++) { px += (rnd() - .5) * 90; py += (rnd() - .3) * 60; x.lineTo(px, py); } x.stroke(); }
    }
    x.strokeStyle = 'rgba(70,58,46,.35)'; x.lineWidth = 3;
    for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * t, 0); x.lineTo(i * t, W); x.moveTo(0, i * t); x.lineTo(W, i * t); x.stroke(); }
  }), 4, 4);
}

// Limestone ashlar for the Great Hall and the arches. One tile is 4.8 × 2.4 units: two courses of blocks.
export function ashlar() {
  return tiled(canvasTex(512, 256, (x, W, H) => {
    const rnd = seeded(41);
    x.fillStyle = '#b9aa8e'; x.fillRect(0, 0, W, H);
    for (let k = 0; k < 1600; k++) { x.fillStyle = 'rgba(' + (rnd() < .5 ? '90,75,55' : '255,250,235') + ',' + (rnd() * .04).toFixed(3) + ')'; x.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 6, 2 + rnd() * 6); }
    x.strokeStyle = 'rgba(95,80,60,.3)'; x.lineWidth = 2;
    for (let r = 0; r < 2; r++) {
      const y = r * H / 2; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
      const off = r ? W / 4 : 0; for (let c = 0; c < 3; c++) { const bx = (off + c * W / 2) % W; x.beginPath(); x.moveTo(bx, y); x.lineTo(bx, y + H / 2); x.stroke(); }
    }
  }), 4.8, 2.4);
}

// Silk damask, painted near-white so the material colour tints it. One tile is 1.4 × 2 units.
export function damask() {
  return tiled(canvasTex(256, 384, (x, W, H) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,0,0,.05)';
    const motif = (cx, cy, s) => {
      x.beginPath(); x.moveTo(cx, cy - 70 * s);
      x.bezierCurveTo(cx + 46 * s, cy - 40 * s, cx + 52 * s, cy + 20 * s, cx, cy + 70 * s);
      x.bezierCurveTo(cx - 52 * s, cy + 20 * s, cx - 46 * s, cy - 40 * s, cx, cy - 70 * s); x.fill();
      x.beginPath(); x.ellipse(cx, cy, 14 * s, 22 * s, 0, 0, Math.PI * 2); x.fill();
      for (const sg of [-1, 1]) { x.beginPath(); x.moveTo(cx, cy + 40 * s); x.quadraticCurveTo(cx + sg * 60 * s, cy + 50 * s, cx + sg * 64 * s, cy + 6 * s); x.quadraticCurveTo(cx + sg * 40 * s, cy + 30 * s, cx, cy + 40 * s); x.fill(); }
    };
    motif(W / 2, H / 2, 1); motif(0, 0, 1); motif(W, 0, 1); motif(0, H, 1); motif(W, H, 1);
    x.strokeStyle = 'rgba(0,0,0,.05)'; x.lineWidth = 1;
    for (let y = 0; y < H; y += 3) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  }), .95, 1.42);
}

// Frosted skylight glass in a grid of mullions. Painted white; the material colour sets night or dawn.
export function laylight() {
  return tiled(canvasTex(256, 256, (x, W) => {
    const g = x.createRadialGradient(W / 2, W / 2, 10, W / 2, W / 2, W * .75); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9c9c9');
    x.fillStyle = g; x.fillRect(0, 0, W, W);
    x.fillStyle = '#4a4a4a'; x.fillRect(0, 0, W, 10); x.fillRect(0, 0, 10, W);
    x.fillStyle = '#7a7a7a'; x.fillRect(0, W / 2 - 2, W, 4); x.fillRect(W / 2 - 2, 0, 4, W);
  }), 2.5, 2.5);
}

// Soft pool of light on a wall, brighter at the top, as if from a ceiling spot.
export function wash() {
  return canvasTex(256, 256, (x, W) => {
    x.save(); x.translate(W / 2, W * .42); x.scale(1, 1.25);
    const g = x.createRadialGradient(0, -20, 4, 0, 0, W * .46); g.addColorStop(0, 'rgba(255,214,160,.9)'); g.addColorStop(.45, 'rgba(255,196,140,.35)'); g.addColorStop(1, 'rgba(255,190,130,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, W * .46, 0, Math.PI * 2); x.fill(); x.restore();
  });
}

// Lawn. One tile is 6 units square.
export function grass() {
  return tiled(canvasTex(512, 512, (x, W) => {
    const rnd = seeded(91);
    x.fillStyle = '#5d7a3c'; x.fillRect(0, 0, W, W);
    for (let k = 0; k < 9000; k++) {
      const px = rnd() * W, py = rnd() * W, l = 26 + rnd() * 26;
      x.strokeStyle = hsl(80 + rnd() * 25, 40 + rnd() * 15, l, .55); x.lineWidth = 1 + rnd();
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - .5) * 5, py - 4 - rnd() * 8); x.stroke();
    }
  }), 6, 6);
}

// Raked pale gravel for the allées, as in a French garden. One tile is 2 units square.
export function gravel() {
  return tiled(canvasTex(256, 256, (x, W) => {
    const rnd = seeded(61);
    x.fillStyle = '#b3a58c'; x.fillRect(0, 0, W, W);
    for (let k = 0; k < 2600; k++) { x.fillStyle = hsl(30 + rnd() * 20, 10 + rnd() * 18, 48 + rnd() * 28, .8); x.beginPath(); x.ellipse(rnd() * W, rnd() * W, .8 + rnd() * 2, .6 + rnd() * 1.4, rnd() * 3, 0, Math.PI * 2); x.fill(); }
  }), 2, 2);
}

// Weathered limestone cliff. One tile is 8 units square.
export function rock() {
  return tiled(canvasTex(256, 256, (x, W) => {
    const rnd = seeded(83);
    x.fillStyle = '#8a7d6b'; x.fillRect(0, 0, W, W);
    for (let k = 0; k < 90; k++) { x.fillStyle = hsl(32, 10 + rnd() * 10, 38 + rnd() * 26, .35); x.beginPath(); x.ellipse(rnd() * W, rnd() * W, 8 + rnd() * 30, 3 + rnd() * 10, (rnd() - .5) * .5, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = 'rgba(40,32,26,.35)'; x.lineWidth = 1.5;
    for (let k = 0; k < 26; k++) { x.beginPath(); let px = rnd() * W, py = rnd() * W; x.moveTo(px, py); for (let q = 0; q < 4; q++) { px += (rnd() - .5) * 50; py += rnd() * 30; x.lineTo(px, py); } x.stroke(); }
  }), 8, 8);
}

// Clipped boxwood and yew: dense small leaves. One tile is 1.5 units square.
export function foliage() {
  return tiled(canvasTex(256, 256, (x, W) => {
    const rnd = seeded(13);
    x.fillStyle = '#26442a'; x.fillRect(0, 0, W, W);
    for (let k = 0; k < 2600; k++) { x.fillStyle = hsl(95 + rnd() * 25, 32 + rnd() * 16, 19 + rnd() * 13, .85); x.beginPath(); x.ellipse(rnd() * W, rnd() * W, 2 + rnd() * 3, 1.2 + rnd() * 1.6, rnd() * Math.PI, 0, Math.PI * 2); x.fill(); }
  }), 1.5, 1.5);
}

// One falling petal, white so each point's colour tints it.
export function petal() {
  return canvasTex(64, 64, (x) => {
    const g = x.createLinearGradient(0, 8, 0, 56); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#f0d8de');
    x.fillStyle = g; x.beginPath(); x.moveTo(32, 6); x.bezierCurveTo(56, 18, 52, 48, 32, 58); x.bezierCurveTo(12, 48, 8, 18, 32, 6); x.fill();
  });
}

// A candle flame: a white-gold core in an orange teardrop, on transparent.
export function flame() {
  return canvasTex(64, 64, (x) => {
    const g = x.createRadialGradient(32, 40, 2, 32, 36, 26); g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(.35, 'rgba(255,205,120,.9)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(32, 4); x.bezierCurveTo(46, 26, 50, 44, 32, 60); x.bezierCurveTo(14, 44, 18, 26, 32, 4); x.fill();
  });
}

// A soft round glow, for the light around a chandelier.
export function glow() {
  return canvasTex(128, 128, (x) => {
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, 'rgba(255,214,150,.9)'); g.addColorStop(.25, 'rgba(255,190,120,.35)'); g.addColorStop(1, 'rgba(255,170,100,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  });
}

// A glint of light off cut crystal: a bright point with four thin rays.
export function glint() {
  return canvasTex(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 10); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    for (const [w, h] of [[64, 2], [2, 64]]) { const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,235,.9)'); r.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = r; x.fillRect(32 - w / 2, 32 - h / 2, w, h); }
  });
}

// Placeholder paintings for frames that have no photo yet: soft impressionist landscapes.
const PALETTES = [
  ['#e9c9a8', '#c98b6b', '#6d7f5a', '#3e5a4a', '#f3e2c4'],
  ['#b9c9d6', '#e8d9c0', '#7d93a0', '#455d6b', '#f4efe3'],
  ['#f0c7b5', '#d9a0a6', '#8d9f7a', '#5a6e52', '#fff1e0'],
  ['#d6c48a', '#b98d4f', '#7b6a3e', '#3f4a33', '#f1e6c2'],
  ['#c7b8d6', '#e6c3c8', '#7f86a6', '#4b5170', '#f6eef2']
];
export function painting(seed, portrait) {
  const w = portrait ? 384 : 512, h = portrait ? 512 : 384;
  return canvasTex(w, h, (x) => {
    const rnd = seeded(101 + seed * 17), p = PALETTES[seed % PALETTES.length], hz = h * (.42 + rnd() * .18);
    const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, p[1]); sky.addColorStop(1, p[0]);
    x.fillStyle = sky; x.fillRect(0, 0, w, hz);
    const land = x.createLinearGradient(0, hz, 0, h); land.addColorStop(0, p[2]); land.addColorStop(1, p[3]);
    x.fillStyle = land; x.fillRect(0, hz, w, h - hz);
    x.fillStyle = p[3]; x.globalAlpha = .55; x.beginPath(); x.moveTo(0, hz);
    for (let k = 0; k <= 8; k++) x.lineTo(k / 8 * w, hz - 10 - rnd() * h * .12);
    x.lineTo(w, hz + 4); x.lineTo(0, hz + 4); x.fill(); x.globalAlpha = 1;
    for (let k = 0; k < 1400; k++) {
      const py = rnd() * h, inSky = py < hz, c = inSky ? (rnd() < .7 ? p[0] : p[4]) : p[2 + Math.floor(rnd() * 2)];
      x.fillStyle = c; x.globalAlpha = .18 + rnd() * .3;
      x.beginPath(); x.ellipse(rnd() * w, py, 3 + rnd() * 9, 1.5 + rnd() * 3, (rnd() - .5) * .8, 0, Math.PI * 2); x.fill();
    }
    if (rnd() < .6) { x.globalAlpha = .7; x.fillStyle = p[4]; x.beginPath(); x.arc(w * (.2 + rnd() * .6), hz * (.3 + rnd() * .3), 10 + rnd() * 14, 0, Math.PI * 2); x.fill(); }
    x.globalAlpha = 1;
  });
}
