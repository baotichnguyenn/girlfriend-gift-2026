// A mechanical flip clock beside her portrait in the garden, counting the days since CONFIG.together
// (midnight in Vietnam, UTC+7). It shows 0000 until she reaches the garden, then each card flips over to the count.
// Each digit is three pieces: a fixed top half, a fixed bottom half, and a flap hinged across the middle
// that falls forward, showing the old top on its face and the new bottom on its back.
import { CONFIG } from '../config.js';
import { reduceMotion, ease, clamp } from '../util.js';
import { canvasTex, spaced } from '../paint/canvas.js';
import { M } from './materials.js';
import { box, merge } from './geo.js';

const DIGITS = 4, CW = .3, CH = .46, GAP = .045, FLIP = .55;
const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const cards = [];
let shown = 0, queue = null, atlasMat;

export function daysTogether() {
  const start = Date.parse(CONFIG.together + 'T00:00:00+07:00');
  return Number.isNaN(start) ? 0 : clamp(Math.floor((Date.now() - start) / 864e5), 0, 9999);
}

// All ten digits side by side, each on a dark card split by a hairline, as on a real flip clock.
function atlas() {
  return canvasTex(1280, 192, (x) => {
    for (let d = 0; d < 10; d++) {
      const ox = d * 128;
      const g = x.createLinearGradient(0, 0, 0, 192); g.addColorStop(0, '#2b292e'); g.addColorStop(.5, '#1d1b1f'); g.addColorStop(1, '#141316');
      x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(ox + 4, 4, 120, 184, 12) : x.rect(ox + 4, 4, 120, 184); x.fill();
      x.fillStyle = '#f3ecdc'; x.font = '600 150px Archivo, "Helvetica Neue", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(d), ox + 64, 104); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      x.fillStyle = '#0a090b'; x.fillRect(ox + 4, 94, 120, 4);
    }
  });
}

// A half card showing the top or bottom of digit d.
function half(d, top) {
  const g = new THREE.PlaneGeometry(CW, CH / 2);
  setHalf(g, d, top);
  return g;
}
function setHalf(g, d, top) {
  const uv = g.attributes.uv, u0 = d / 10, u1 = (d + 1) / 10, v0 = top ? .5 : 0, v1 = top ? 1 : .5;
  // PlaneGeometry vertices: top-left, top-right, bottom-left, bottom-right
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
}

export function buildFlipClock(parent) {
  atlasMat = new THREE.MeshStandardMaterial({ map: atlas(), emissiveMap: null, roughness: .45, envMapIntensity: .4 });
  atlasMat.emissive = new THREE.Color(0x222222); atlasMat.emissiveMap = atlasMat.map;
  const clock = new THREE.Group(); parent.add(clock);
  // a walnut case on brass feet, standing on a limestone pedestal
  const W = DIGITS * CW + (DIGITS - 1) * GAP + .3, H = CH + .42;
  clock.add(new THREE.Mesh(merge([box(.78, 1.05, .56, 0, .525, 0), box(.9, .08, .66, 0, 1.09, 0), box(.9, .08, .66, 0, .04, 0)]), M.limestone));
  const caseMat = new THREE.MeshStandardMaterial({ color: lin(0x5a3a26), roughness: .5, envMapIntensity: .5 });
  const body = new THREE.Group(); body.position.set(0, 1.13 + .06 + H / 2, 0); clock.add(body);
  body.add(new THREE.Mesh(merge([box(W, H, .34, 0, 0, 0)]), caseMat));
  body.add(new THREE.Mesh(merge([box(W - .14, CH + .08, .02, 0, .07, .17), box(.08, .06, .12, -W / 2 + .2, -H / 2 - .03, 0), box(.08, .06, .12, W / 2 - .2, -H / 2 - .03, 0)]), M.goldDeep));
  // the engraved label under the cards
  const label = canvasTex(512, 64, (x, w) => { x.fillStyle = '#e7c88f'; x.font = '600 26px Archivo, sans-serif'; spaced(x, 'DAYS TOGETHER', w / 2, 42, 9, 'center'); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(W * .7, W * .7 / 8), new THREE.MeshBasicMaterial({ map: label, transparent: true, toneMapped: false }));
  lab.position.set(0, -H / 2 + .1, .171); body.add(lab);
  for (let i = 0; i < DIGITS; i++) {
    const x = (i - (DIGITS - 1) / 2) * (CW + GAP), y = .07, z = .19;
    const top = new THREE.Mesh(half(0, true), atlasMat); top.position.set(x, y + CH / 4, z);
    const bottom = new THREE.Mesh(half(0, false), atlasMat); bottom.position.set(x, y - CH / 4, z);
    const flap = new THREE.Group(); flap.position.set(x, y, z + .006);
    const front = new THREE.Mesh(half(0, true), atlasMat); front.position.y = CH / 4; flap.add(front);
    const back = new THREE.Mesh(half(0, false), atlasMat); back.rotation.x = Math.PI; back.position.y = CH / 4; flap.add(back);
    flap.visible = false;
    body.add(top, bottom, flap);
    cards.push({ top, bottom, flap, front, back, d: 0, to: 0, t: null }); // t: null when still, else seconds into its flip
  }
  // in front of the arch, to one side of where she stops, turned a little toward her
  clock.position.set(-1.5, 0, 1.7); clock.rotation.y = .5;
}

const digitsOf = (n) => String(n).padStart(DIGITS, '0').split('').map(Number);

// Runs every frame. visible is whether the garden can be seen; the count only flips once it can.
export function updateFlipClock(dt, visible) {
  if (!visible) return;
  const target = daysTogether();
  if (target !== shown && !queue) {
    queue = digitsOf(target); shown = target;
    cards.forEach((c, i) => {
      if (c.d === queue[i]) return;
      c.to = queue[i]; c.t = reduceMotion ? FLIP : -i * .18 - .6; // the left card first, after a moment
    });
  }
  let busy = false;
  cards.forEach((c) => {
    if (c.t === null || c.d === c.to) return;
    busy = true;
    if (c.t < 0) { c.t += dt; return; }
    if (!c.flap.visible) { // start: the new top waits behind the flap, which shows the old top
      setHalf(c.top.geometry, c.to, true); setHalf(c.front.geometry, c.d, true); setHalf(c.back.geometry, c.to, false);
      c.flap.visible = true;
    }
    c.t += dt;
    const k = ease(clamp(c.t / FLIP, 0, 1));
    c.flap.rotation.x = -Math.PI * k;
    if (k >= 1) { // landed: the new bottom shows, and the flap folds away
      setHalf(c.bottom.geometry, c.to, false);
      c.flap.visible = false; c.flap.rotation.x = 0; c.d = c.to; c.t = null;
    }
  });
  if (!busy) queue = null;
}
