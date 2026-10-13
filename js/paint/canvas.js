// Helpers for textures painted on a 2D canvas.
// Paint text only after loadFonts() resolves, or it will use fallback fonts.
import { ANISO } from '../engine.js';

const HAS_LS = 'letterSpacing' in CanvasRenderingContext2D.prototype;
export function spaced(x, text, px, py, sp, align) {
  if (HAS_LS) { x.letterSpacing = sp + 'px'; x.textAlign = align || 'left'; x.fillText(text, px + (align === 'center' ? sp / 2 : 0), py); x.letterSpacing = '0px'; x.textAlign = 'left'; return; }
  const chars = [...text]; const total = chars.reduce((s, c) => s + x.measureText(c).width + sp, 0) - sp;
  let cx = align === 'center' ? px - total / 2 : align === 'right' ? px - total : px;
  x.textAlign = 'left'; for (const c of chars) { x.fillText(c, cx, py); cx += x.measureText(c).width + sp; }
}
export function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
export function fitFont(x, text, maxW, size, tpl) { let s = size; x.font = tpl(s); while (x.measureText(text).width > maxW && s > 14) { s -= 2; x.font = tpl(s); } }
export function makeTex(c) { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; return t; }
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return makeTex(c); }
