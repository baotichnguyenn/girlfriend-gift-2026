// Her face (the figure's head) and the portrait in the garden.
// Both come from her photo when there is one, and from a placeholder drawing when there isn't.
import { CONFIG } from '../config.js';
import { clamp } from '../util.js';
import { toast } from '../ui/dom.js';
import { makeTex } from './canvas.js';

const faceCanvas = document.createElement('canvas'); faceCanvas.width = faceCanvas.height = 512;
export const faceTex = makeTex(faceCanvas);
const portraitCanvas = document.createElement('canvas'); portraitCanvas.width = 512; portraitCanvas.height = 640;
export const portraitTex = makeTex(portraitCanvas);

function drawCartoon(x) { // drawn in a 512 x 512 space
  x.fillStyle = '#2b1a14';
  x.beginPath(); x.ellipse(256, 290, 192, 222, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = CONFIG.dress;
  x.beginPath(); x.ellipse(256, 545, 205, 100, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f0c6a6'; x.fillRect(228, 380, 56, 90);
  const fg = x.createRadialGradient(236, 240, 30, 256, 270, 170); fg.addColorStop(0, '#f6d6bf'); fg.addColorStop(1, '#e8b796');
  x.fillStyle = fg; x.beginPath(); x.ellipse(256, 268, 128, 148, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#2b1a14'; x.beginPath();
  x.moveTo(118, 262); x.quadraticCurveTo(128, 104, 256, 100); x.quadraticCurveTo(388, 104, 396, 262);
  x.quadraticCurveTo(372, 176, 312, 160); x.quadraticCurveTo(262, 214, 158, 200); x.quadraticCurveTo(132, 222, 118, 262); x.fill();
  x.fillStyle = 'rgba(232,120,130,.35)';
  x.beginPath(); x.ellipse(182, 325, 30, 18, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(330, 325, 30, 18, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#2a1a17';
  x.beginPath(); x.ellipse(206, 282, 15, 20, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(306, 282, 15, 20, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(211, 275, 5, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(311, 275, 5, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#3a221c'; x.lineWidth = 5; x.lineCap = 'round';
  x.beginPath(); x.arc(206, 258, 26, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
  x.beginPath(); x.arc(306, 258, 26, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
  x.strokeStyle = '#a0464f'; x.lineWidth = 6;
  x.beginPath(); x.arc(256, 322, 30, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
}
function coverDraw(x, img, dw, dh, focusY) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const sc = Math.max(dw / iw, dh / ih), sw = dw / sc, sh = dh / sc;
  const sx = (iw - sw) / 2, sy = clamp(ih * focusY - sh / 2, 0, ih - sh);
  x.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
}
function drawFace(img) {
  const x = faceCanvas.getContext('2d');
  x.clearRect(0, 0, 512, 512); x.save();
  x.beginPath(); x.arc(256, 256, 236, 0, Math.PI * 2); x.clip();
  if (img) coverDraw(x, img, 512, 512, 0.42);
  else {
    const g = x.createRadialGradient(256, 200, 20, 256, 256, 360); g.addColorStop(0, '#f3d9cf'); g.addColorStop(1, '#c98a8f');
    x.fillStyle = g; x.fillRect(0, 0, 512, 512); drawCartoon(x);
  }
  x.restore();
  x.lineWidth = 14; x.strokeStyle = '#c9a063'; x.beginPath(); x.arc(256, 256, 240, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 3; x.strokeStyle = 'rgba(40,25,20,.6)'; x.beginPath(); x.arc(256, 256, 248.5, 0, Math.PI * 2); x.stroke();
  faceTex.needsUpdate = true;
}
function drawPortrait(img) {
  const x = portraitCanvas.getContext('2d');
  if (img) coverDraw(x, img, 512, 640, 0.4);
  else {
    const g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#d9a6a2'); g.addColorStop(1, '#7c4552');
    x.fillStyle = g; x.fillRect(0, 0, 512, 640);
    x.save(); x.translate(0, 110); drawCartoon(x); x.restore();
  }
  portraitTex.needsUpdate = true;
}

// Paints both from an image path or data: URI. With no src, paints the drawing instead.
export function setPhoto(src) {
  if (!src) { drawFace(null); drawPortrait(null); return; }
  const img = new Image();
  img.onload = () => { drawFace(img); drawPortrait(img); };
  img.onerror = () => toast('That photo didn’t load. Check the path in CONFIG.photo.');
  img.src = src;
}
