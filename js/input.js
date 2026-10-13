// Input. Holding an arrow key, or an on-screen arrow, walks her along the path.
// Dragging turns the camera around her, the wheel or a pinch zooms, double-click resets the view,
// and clicking her or a letter acts on it. Walking only works in 'walk'; looking around also works on the intro.
import { ROMAN, clamp, coarse } from './util.js';
import { state } from './state.js';
import { camera, clickables } from './engine.js';
import { L, S, S0 } from './path.js';
import { gateS, walkTo } from './order.js';
import { orbitBy, zoomBy, setDragging, resetView } from './camera.js';
import { wave } from './world/her.js';
import { wobbleBarrier } from './world/ropes.js';
import { ui, toast } from './ui/dom.js';
import { enter } from './ui/hud.js';
import { openLetter, closeLetter } from './ui/letter.js';
import { showFinale, closeFinale } from './ui/finale.js';

const WALK = 4.6; // units per second while an arrow is held
const FWD = ['ArrowUp', 'ArrowRight', 'w', 'W'], BACK = ['ArrowDown', 'ArrowLeft', 's', 'S'];
const held = { key: 0, pad: 0 }; // 1 forward, -1 back, 0 still: from the keyboard and from the on-screen arrows
let lastBump = -9;
const mouse = new THREE.Vector2(); const ray = new THREE.Raycaster();
const pointers = new Map();
let down = null, pinch = 0, hoverDirty = false;

// Moves her target d units along the path. walkTo() clamps it to the gate.
function push(d) {
  if (state.mode !== 'walk') return;
  const g = gateS();
  if (d > 0 && state.sTarget >= g - .02 && state.s > g - 1.2 && state.readCount < 5) bump();
  walkTo(state.sTarget + d);
  if (!ui.firstHint.hidden && state.sTarget > S0 + .8) { ui.firstHint.classList.add('gone'); setTimeout(() => { ui.firstHint.hidden = true; }, 700); }
}
function bump() {
  if (state.time - lastBump < 1.1) return; lastBump = state.time;
  wobbleBarrier(state.readCount);
  toast('The rope stays up until you open Letter ' + ROMAN[state.readCount] + '.');
  ui.prompt.classList.remove('shake'); void ui.prompt.offsetWidth; ui.prompt.classList.add('shake');
}

function setHeld(src, dir) {
  held[src] = dir;
  const d = held.key || held.pad;
  ui.padFwd.classList.toggle('held', d > 0); ui.padBack.classList.toggle('held', d < 0);
}

// Runs every frame: walks her while an arrow is held.
export function updateInput(dt) {
  const d = held.key || held.pad;
  if (d) push(d * WALK * dt);
}

const canLook = () => state.mode === 'intro' || state.mode === 'entering' || state.mode === 'walk';

function setMouse(e) { const r = ui.canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
function pick() { ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(clickables, false); return h.length ? h[0].object : null; }
function handleClick() {
  const o = pick(); if (!o) return;
  const k = o.userData.kind;
  if (k === 'her') { if (state.mode === 'intro') enter(); else if (state.mode === 'walk') wave(); }
  else if (k === 'exhibit' && state.mode === 'walk') clickExhibit(o.userData.i);
  else if (k === 'finale' && state.mode === 'walk') {
    if (state.readCount < 5) toast('This room opens after all five letters.');
    else if (state.s > L - 1) showFinale(); else walkTo(L);
  }
}
function clickExhibit(i) {
  if (i < state.readCount) { openLetter(i); return; }
  if (i === state.readCount) { if (Math.abs(state.s - S[i]) < .6) openLetter(i); else { walkTo(S[i]); toast('Walking you to Letter ' + ROMAN[i] + '.'); } return; }
  toast('Letter ' + ROMAN[i] + ' opens after Letter ' + ROMAN[i - 1] + '.');
}

/* ---------- keys ---------- */
function onKeyDown(e) {
  const dir = FWD.includes(e.key) ? 1 : BACK.includes(e.key) ? -1 : 0;
  if (dir && canLook()) {
    e.preventDefault();
    if (state.mode === 'intro' && dir > 0 && !e.repeat) toast(coarse ? 'Tap her first. She’s waiting at the door.' : 'Click her first. She’s waiting at the door.');
    setHeld('key', dir);
  } else if (state.mode === 'walk' && e.key === 'Enter' && !ui.prompt.hidden && document.activeElement !== ui.promptBtn) { e.preventDefault(); ui.promptBtn.click(); }
  else if (state.mode === 'reading' && e.key === 'Escape') {
    if (!ui.letter.hidden && ui.envStage.classList.contains('read')) closeLetter();
    else if (!ui.finale.hidden) closeFinale(false);
  }
}
function onKeyUp(e) {
  const dir = FWD.includes(e.key) ? 1 : BACK.includes(e.key) ? -1 : 0;
  if (dir && held.key === dir) setHeld('key', 0);
}

// An on-screen arrow walks her while it is pressed. From the keyboard, each press takes one step.
function bindPad(btn, dir) {
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); setHeld('pad', dir); });
  const release = () => { if (held.pad === dir) setHeld('pad', 0); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => btn.addEventListener(t, release));
  btn.addEventListener('click', (e) => { if (e.detail === 0) push(dir * 2.2); });
  btn.addEventListener('contextmenu', (e) => e.preventDefault()); // a long press on a phone shouldn't open a menu
}

/* ---------- pointer: look around, pinch to zoom, click to act ---------- */
const spread = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
function endDrag() { setDragging(false); ui.canvas.classList.remove('dragging'); }
function onPointerDown(e) {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  ui.canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 1) down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), drag: false };
  else { pinch = spread(); if (down) down.drag = true; }
}
function onPointerMove(e) {
  setMouse(e); hoverDirty = true;
  const p = pointers.get(e.pointerId); if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  if (pointers.size >= 2) { const d = spread(); if (pinch && d && canLook()) zoomBy(pinch / d); pinch = d; return; }
  if (!down) return;
  if (!down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down.drag = true; setDragging(true); ui.canvas.classList.add('dragging'); }
  if (down.drag && canLook()) { const k = e.pointerType === 'touch' ? 1.5 : 1; orbitBy((e.clientX - down.lx) * k, (e.clientY - down.ly) * k); }
  down.lx = e.clientX; down.ly = e.clientY;
}
function onPointerUp(e) {
  const isClick = down && !down.drag && pointers.size === 1 && performance.now() - down.t < 600;
  pointers.delete(e.pointerId);
  if (isClick) { setMouse(e); handleClick(); }
  if (pointers.size < 2) pinch = 0;
  if (!pointers.size) { down = null; endDrag(); }
}
function onWheel(e) {
  e.preventDefault();
  if (!canLook()) return;
  const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 600 : 1;
  zoomBy(Math.exp(clamp(e.deltaY * unit, -240, 240) * .0012));
}

// Runs every frame: a pointer cursor over anything clickable, an open hand elsewhere.
export function updateHover() {
  if (hoverDirty && !down && (state.mode === 'intro' || state.mode === 'walk')) { hoverDirty = false; ui.canvas.style.cursor = pick() ? 'pointer' : ''; }
}

export function initInput() {
  window.addEventListener('wheel', onWheel, { passive: false });
  ui.canvas.addEventListener('pointerdown', onPointerDown);
  ui.canvas.addEventListener('pointermove', onPointerMove);
  ui.canvas.addEventListener('pointerup', onPointerUp);
  ui.canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); if (!pointers.size) { down = null; pinch = 0; endDrag(); } });
  ui.canvas.addEventListener('dblclick', () => { if (canLook()) resetView(); });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => { setHeld('key', 0); setHeld('pad', 0); });
  bindPad(ui.padFwd, 1); bindPad(ui.padBack, -1);
}
