// Wax seals, envelopes, and exhibit placards.
import { CONFIG } from '../config.js';
import { ROMAN, YEAR } from '../util.js';
import { spaced, rrect, fitFont } from './canvas.js';

function drawSeal(x, cx, cy, r, numeral) {
  x.save();
  const g = x.createRadialGradient(cx - r * .3, cy - r * .35, r * .1, cx, cy, r * 1.1); g.addColorStop(0, '#b8344f'); g.addColorStop(1, '#6e1427');
  x.fillStyle = g; x.beginPath();
  for (let k = 0; k <= 36; k++) { const a = k / 36 * Math.PI * 2; const rr = r * (1 + .05 * Math.sin(a * 7) + .03 * Math.sin(a * 13)); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; k ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.fill();
  x.strokeStyle = 'rgba(255,220,220,.18)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, r * .72, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#f1dcc4'; x.font = '600 ' + Math.round(r * .72) + 'px "Bodoni Moda", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(numeral, cx, cy + 2); x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.restore();
}
export function drawEnvelope(x, w, h, i, open) {
  x.clearRect(0, 0, w, h);
  const pg = x.createLinearGradient(0, 0, w, h); pg.addColorStop(0, '#f2e7d0'); pg.addColorStop(1, '#d9c6a2');
  if (open) {
    x.fillStyle = '#f8f0df'; rrect(x, 120, 34, w - 240, 320, 6); x.fill();
    x.fillStyle = '#4a3428'; x.font = '400 46px "Pinyon Script", cursive'; x.fillText('Dear ' + CONFIG.herName + ',', 160, 96);
    x.strokeStyle = 'rgba(70,50,40,.35)'; x.lineWidth = 3; x.lineCap = 'round';
    for (let r = 0; r < 4; r++) { const yy = 140 + r * 34; x.beginPath(); x.moveTo(160, yy); for (let xx = 160; xx < w - 170; xx += 16) x.lineTo(xx + 8, yy - 5 + Math.sin(xx * .31 + r * 2) * 4); x.stroke(); }
    x.fillStyle = pg; rrect(x, 40, 200, w - 80, h - 240, 8); x.fill();
    x.strokeStyle = 'rgba(60,40,30,.2)'; x.lineWidth = 3; x.beginPath(); x.moveTo(40, 206); x.lineTo(w / 2, 352); x.lineTo(w - 40, 206); x.stroke();
    x.save(); x.translate(w / 2 - 34, 360); x.rotate(-.35); drawSeal(x, 0, 0, 42, ''); x.restore();
    x.fillStyle = 'rgba(110,20,39,.9)'; x.beginPath(); x.arc(w / 2 + 40, 372, 34, -.3, Math.PI - .3); x.fill();
    x.fillStyle = '#6a4a38'; x.font = '600 22px Archivo, sans-serif'; spaced(x, 'OPENED', w / 2, h - 66, 6, 'center');
  } else {
    x.fillStyle = pg; rrect(x, 40, 40, w - 80, h - 80, 10); x.fill();
    x.fillStyle = 'rgba(120,90,60,.10)'; x.beginPath(); x.moveTo(40, 44); x.lineTo(w / 2, 300); x.lineTo(w - 40, 44); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(60,40,30,.22)'; x.lineWidth = 3; x.beginPath(); x.moveTo(44, 46); x.lineTo(w / 2, 300); x.lineTo(w - 44, 46); x.stroke();
    x.strokeStyle = 'rgba(60,40,30,.12)'; x.beginPath(); x.moveTo(44, h - 44); x.lineTo(w / 2 - 50, 312); x.moveTo(w - 44, h - 44); x.lineTo(w / 2 + 50, 312); x.stroke();
    drawSeal(x, w / 2, 300, 62, ROMAN[i]);
    x.fillStyle = '#4a3428'; x.font = '400 50px "Pinyon Script", cursive'; x.textAlign = 'right'; x.fillText('for ' + CONFIG.herName, w - 90, h - 78); x.textAlign = 'left';
  }
}
// i is 0–4 for the letters and 5 for the portrait in the garden. status is 'locked', 'current', or 'read'.
export function drawPlacard(x, i, status) {
  const w = 640, h = 256;
  x.fillStyle = '#efe8db'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(0,0,0,.1)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);
  const fin = i === 5;
  const title = fin ? 'You' : CONFIG.letters[i].title;
  const medium = fin ? 'Mixed media, ongoing' : CONFIG.letters[i].medium + ', ' + YEAR;
  x.fillStyle = '#8a6a3a'; x.font = '600 22px Archivo, sans-serif'; spaced(x, 'EXHIBIT ' + ROMAN[i], 36, 50, 5);
  x.fillStyle = '#211a1e'; fitFont(x, title, w - 72, 50, (s) => 'italic 500 ' + s + 'px "Bodoni Moda", Georgia, serif'); x.fillText(title, 36, 112);
  x.fillStyle = '#5b4d52'; x.font = '400 22px Archivo, sans-serif'; x.fillText(medium, 36, 152); x.fillText('Gift of ' + CONFIG.from, 36, 182);
  let line, col;
  if (status === 'current') { line = fin ? 'IN THE GARDEN' : 'READ THIS ONE NEXT'; col = '#8e1f35'; }
  else if (status === 'read') { line = 'OPENED'; col = '#5b4d52'; }
  else { line = 'OPENS AFTER EXHIBIT ' + ROMAN[i - 1]; col = '#8a7f84'; }
  x.fillStyle = col; x.font = '600 19px Archivo, sans-serif'; spaced(x, line, 36, 228, 4);
}
