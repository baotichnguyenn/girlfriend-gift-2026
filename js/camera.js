// Camera rigs: intro, follow, and one view per station (VIEW).
// They are blended by her distance to each station, then turned and zoomed around her by the visitor's drag,
// kept clear of walls, and damped.
import { clamp, smooth } from './util.js';
import { state } from './state.js';
import { renderer, camera, V3, UP } from './engine.js';
import { at, tan, nrm, PLINTH_H } from './path.js';
import { HALF_W, CEIL, FRONT_Z, WALL_T, ARCH_W, ARCH_SPRING, PARTITION_Z, DOOR_Z, CHANDELIERS, KEEP_OUT } from './layout.js';
import { ui } from './ui/dom.js';
import { VIEW } from './world/exhibits.js';
import { herXZ } from './world/her.js';
import { wallTitle } from './world/museum.js';

const camDes = new V3(), lookDes = new V3(), lookCur = new V3(), introCam = new V3(), introLook = new V3();
const tT = new V3(), tN = new V3(), pivot = new V3(), off = new V3();
let snap = true, portrait = false, introBlend = 1;

// Skips the damping on the next frame.
export function snapCamera() { snap = true; }

/* ---------- looking around ---------- */
const view = { yaw: 0, pitch: 0, zoom: 1 };
let dragging = false, resetting = false;
// dx and dy are pixels dragged.
export function orbitBy(dx, dy) { resetting = false; view.yaw -= dx * .0065; view.pitch = clamp(view.pitch + dy * .005, -.6, .95); }
export function zoomBy(f) { resetting = false; view.zoom = clamp(view.zoom * f, .5, 1.8); }
export function setDragging(on) { dragging = on; }
// Eases back to the rig's own framing.
export function resetView() { resetting = true; }

// Turns the whole rig around her: yaw swings the camera and its target together, pitch raises or lowers the camera.
// Below the rig's own height, the view also tilts up, toward the chandeliers and skylights.
function applyView() {
  off.subVectors(camDes, pivot);
  const r = off.length() * view.zoom, yaw = Math.atan2(off.x, off.z) + view.yaw;
  const el = clamp(Math.atan2(off.y, Math.hypot(off.x, off.z)) + view.pitch, -.12, 1.25);
  camDes.set(pivot.x + Math.sin(yaw) * Math.cos(el) * r, pivot.y + Math.sin(el) * r, pivot.z + Math.cos(yaw) * Math.cos(el) * r);
  const c = Math.cos(view.yaw), s = Math.sin(view.yaw), lx = lookDes.x - pivot.x, lz = lookDes.z - pivot.z;
  lookDes.x = pivot.x + lx * c + lz * s; lookDes.z = pivot.z - lx * s + lz * c;
  if (view.pitch < 0) lookDes.y -= view.pitch * 9;
}

// True if a camera at x, y, z would be inside a wall, a chandelier, the floor, or the ceiling.
const WALLS = [...PARTITION_Z, DOOR_Z];
function blocked(x, y, z) {
  if (y < .3) return true;
  if (z > DOOR_Z - WALL_T / 2 && (Math.abs(x) > HALF_W - .35 || y > CEIL - .35 || z > FRONT_Z - .35)) return true;
  for (const wz of WALLS) {
    if (Math.abs(z - wz) > WALL_T / 2 + .3) continue;
    const ax = Math.abs(x);
    if (ax > ARCH_W - .3 || y > ARCH_SPRING + Math.sqrt(ARCH_W * ARCH_W - ax * ax) - .3) return true;
  }
  for (const c of CHANDELIERS) if (y > c.y - 1.6 * c.s && Math.hypot(x, z - c.z) < 1.5 * c.s) return true;
  for (const k of KEEP_OUT) if (y > k.y0 && y < k.y1 && Math.hypot(x - k.x, z - k.z) < k.r) return true; // the displays
  return false;
}
// Pulls p in toward her until the line from her to p is clear.
function keepClear(p) {
  off.subVectors(p, pivot);
  for (let k = 1; k <= 30; k++) {
    const t = k / 30;
    if (blocked(pivot.x + off.x * t, pivot.y + off.y * t, pivot.z + off.z * t)) { p.copy(pivot).addScaledVector(off, Math.max(.12, (k - 1) / 30)); return; }
  }
}

function computeViews() {
  const k = portrait ? 1.35 : 1;
  for (const v of VIEW) {
    if (v.kind === 'exhibit') {
      // the t offset keeps her on the left of the frame, clear of the prompt card
      v.cam.copy(v.P).addScaledVector(v.D, -3.3 * k).addScaledVector(v.t, 2.2 * k * v.side).setY(2.5);
      v.look.copy(v.P).addScaledVector(v.D, 2.2).setY(2.0);
    } else {
      v.cam.copy(v.P).addScaledVector(v.t, -3.2 * k).addScaledVector(v.n, portrait ? .5 : 1.5).setY(2.3);
      v.look.copy(v.P).addScaledVector(v.t, 3.0).setY(2.4);
    }
  }
}
function computeIntroCam() {
  const p = at(0), t = tan(0);
  introCam.copy(p).addScaledVector(t, portrait ? 6.6 : 5.5).setY(1.6);
  const fwd = t.clone().negate(); const right = new V3().crossVectors(fwd, UP).normalize();
  introLook.copy(p).addScaledVector(right, portrait ? 0 : -1.5).setY(portrait ? 2.5 : 1.6);
}
function computeCamera() {
  const sc = (state.mode === 'intro' || state.mode === 'entering') ? 0 : state.s;
  tan(sc, tT); nrm(tT, tN);
  if (portrait) { camDes.copy(herXZ).addScaledVector(tT, -6.4).addScaledVector(tN, .5).setY(3.6); lookDes.copy(herXZ).addScaledVector(tT, 1.6).setY(1.0); }
  else { camDes.copy(herXZ).addScaledVector(tT, -5.2).addScaledVector(tN, 1.6).setY(3.0); lookDes.copy(herXZ).addScaledVector(tT, 3.2).setY(.9); }
  let best = null, bw = 0;
  for (const v of VIEW) { const w = 1 - smooth(.4, 3.6, Math.abs(sc - v.s)); if (w > bw) { bw = w; best = v; } }
  if (best && bw > 0) { camDes.lerp(best.cam, bw); lookDes.lerp(best.look, bw); }
  if (introBlend > 0) {
    camDes.lerp(introCam, introBlend); lookDes.lerp(introLook, introBlend);
    // arc sideways on the way out of the intro, so the camera never passes through her
    const arc = Math.sin(Math.PI * introBlend) * (introBlend < 1 ? 1 : 0);
    camDes.addScaledVector(tN, arc * 3.6); camDes.y += arc * 1.0;
  }
}

export function updateCamera(dt) {
  if (state.mode !== 'intro' && state.mode !== 'loading') introBlend = Math.max(0, introBlend - dt / 1.7);
  computeCamera();
  // while she walks, the view swings back behind her unless the visitor is holding it
  const walking = state.mode === 'walk' && Math.abs(state.sTarget - state.s) > .25;
  if (!dragging) view.yaw = Math.atan2(Math.sin(view.yaw), Math.cos(view.yaw));
  if (resetting || (walking && !dragging)) {
    const k = Math.exp(-dt * (resetting ? 4 : 1.6));
    view.yaw *= k; view.pitch *= k; if (resetting) view.zoom = 1 + (view.zoom - 1) * k;
    if (resetting && Math.abs(view.yaw) + Math.abs(view.pitch) + Math.abs(view.zoom - 1) < .002) resetting = false;
  }
  pivot.set(herXZ.x, 1.3 + (state.mode === 'intro' || state.mode === 'loading' ? PLINTH_H : 0), herXZ.z);
  applyView(); keepClear(camDes);
  if (snap) { camera.position.copy(camDes); lookCur.copy(lookDes); snap = false; }
  else {
    const fast = dragging ? 3.5 : 1; // follow the hand closely while dragging
    camera.position.lerp(camDes, 1 - Math.exp(-dt * 2.6 * fast)); lookCur.lerp(lookDes, 1 - Math.exp(-dt * 3.4 * fast));
    keepClear(camera.position);
  }
  camera.lookAt(lookCur);
}

export function resize() {
  const w = ui.stage.clientWidth || window.innerWidth, h = ui.stage.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  portrait = camera.aspect < .9; if (wallTitle) wallTitle.visible = !portrait;
  computeIntroCam(); computeViews();
}
