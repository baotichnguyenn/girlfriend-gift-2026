// The tall doors at the end of the last gallery. Once all five letters are read and she comes near,
// they swing open onto the garden, and dawn comes up (see sky.js).
import { reduceMotion, ease, clamp } from '../util.js';
import { state } from '../state.js';
import { scene } from '../engine.js';
import { S_DOOR } from '../path.js';
import { ARCH_W, ARCH_SPRING, DOOR_Z } from '../layout.js';
import { M } from './materials.js';
import { box, merge } from './geo.js';

const leaves = [];
let opened = false, amount = 0;
export const fanlight = new THREE.MeshBasicMaterial({ color: 0x1d2742, toneMapped: false, side: THREE.DoubleSide }); // sky.js tints it

// How far open the doors are, 0 to 1.
export const doorAmount = () => amount;
// True once the doors have been triggered, until progress is reset.
export const doorsOpening = () => opened;

export function buildDoors() {
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * ARCH_W, 0, DOOR_Z); scene.add(pivot);
    const w = ARCH_W - .02, cx = -sx * w / 2, h = ARCH_SPRING;
    pivot.add(new THREE.Mesh(box(w, h, .2, cx, h / 2, 0), M.wood));
    const trim = [];
    for (const face of [1, -1]) for (const [py, ph] of [[1.05, 1.5], [3.25, 2.3]]) {
      const pw = w - .7, z = face * .12;
      trim.push(box(pw, .08, .06, cx, py + ph / 2, z), box(pw, .08, .06, cx, py - ph / 2, z), box(.08, ph, .06, cx - pw / 2, py, z), box(.08, ph, .06, cx + pw / 2, py, z));
    }
    trim.push(box(.08, .5, .1, -sx * (w - .35), 2.55, .16), box(.08, .5, .1, -sx * (w - .35), 2.55, -.16));
    pivot.add(new THREE.Mesh(merge(trim), M.goldDeep));
    leaves.push({ pivot, sign: sx < 0 ? 1 : -1 });
  }
  // the half-round window above the doors, with radiating glazing bars
  const fan = new THREE.Mesh(new THREE.CircleGeometry(ARCH_W - .02, 32, 0, Math.PI), fanlight);
  fan.position.set(0, ARCH_SPRING, DOOR_Z); scene.add(fan);
  const bars = [box(ARCH_W * 2, .1, .12, 0, ARCH_SPRING + .05, DOOR_Z)];
  for (let k = 1; k < 6; k++) { const a = k / 6 * Math.PI, g = new THREE.BoxGeometry(.07, ARCH_W, .1); g.translate(0, ARCH_W / 2, 0); g.rotateZ(a - Math.PI / 2); g.translate(0, ARCH_SPRING, DOOR_Z); bars.push(g); }
  scene.add(new THREE.Mesh(merge(bars), M.goldDeep));
}

export function updateDoors(dt) {
  if (state.readCount < 5) opened = false;
  else if (state.s > S_DOOR - 9) opened = true;
  const target = opened ? 1 : 0;
  amount = reduceMotion ? target : clamp(amount + Math.sign(target - amount) * dt / 2.2, 0, 1);
  const k = ease(amount);
  leaves.forEach((l) => { l.pivot.rotation.y = l.sign * 1.95 * k; });
}
