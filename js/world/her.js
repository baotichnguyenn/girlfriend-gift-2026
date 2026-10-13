// Her figure, built from primitives with her face as a camera-facing sprite.
// updateHer() walks her toward sTarget and animates the walk cycle, waving, and turning.
import { CONFIG } from '../config.js';
import { clamp, ease, angleDiff } from '../util.js';
import { state } from '../state.js';
import { scene, V3, clickables } from '../engine.js';
import { at, tan, S0, PLINTH_H } from '../path.js';
import { placeAt } from '../order.js';
import { ui } from '../ui/dom.js';
import { canvasTex } from '../paint/canvas.js';
import { faceTex } from '../paint/photo.js';
import { VIEW } from './exhibits.js';

export const herXZ = new V3(); // where she stands on the floor; the camera follows it
let her, legL, legR, armL, armR, head, shadow, fillLight;
let spd = 0, walkAmt = 0, phase = 0, heading = 0, moveDir = 1;
let enterT = 0, waveT = 0, nextWave = 1.5;
const v1 = new V3(), v2 = new V3();

export function buildHer() {
  fillLight = new THREE.PointLight(0xffd9a8, 0.9, 8, 2); scene.add(fillLight);
  her = new THREE.Group();
  const skinM = new THREE.MeshStandardMaterial({ color: 0xf0c6a6, roughness: .65 });
  const dressM = new THREE.MeshStandardMaterial({ color: new THREE.Color(CONFIG.dress), roughness: .7 });
  const shoeM = new THREE.MeshStandardMaterial({ color: 0x2a1a1f, roughness: .5 });
  const sashM = new THREE.MeshStandardMaterial({ color: 0xc9a063, metalness: .7, roughness: .35 });
  const legGeo = new THREE.CylinderGeometry(.06, .052, .44, 12); legGeo.translate(0, -.22, 0);
  const shoeGeo = new THREE.SphereGeometry(.075, 14, 10); shoeGeo.scale(1, .7, 1.5); shoeGeo.translate(0, -.45, .035);
  const mkLeg = (x) => { const l = new THREE.Group(); l.position.set(x, .5, 0); l.add(new THREE.Mesh(legGeo, skinM), new THREE.Mesh(shoeGeo, shoeM)); her.add(l); return l; };
  legL = mkLeg(-.095); legR = mkLeg(.095);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.16, .36, .56, 28), dressM); skirt.position.y = .74; her.add(skirt);
  const sash = new THREE.Mesh(new THREE.TorusGeometry(.163, .02, 8, 28), sashM); sash.rotation.x = Math.PI / 2; sash.position.y = 1.02; her.add(sash);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.13, .165, .32, 24), dressM); torso.position.y = 1.17; her.add(torso);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(.15, 20, 14), dressM); shoulders.scale.set(1.25, .55, .9); shoulders.position.y = 1.31; her.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.05, .055, .14, 12), skinM); neck.position.y = 1.42; her.add(neck);
  const armGeo = new THREE.CylinderGeometry(.042, .036, .4, 10); armGeo.translate(0, -.2, 0);
  const handGeo = new THREE.SphereGeometry(.048, 12, 10); handGeo.translate(0, -.42, 0);
  const mkArm = (x) => { const a = new THREE.Group(); a.position.set(x, 1.32, 0); a.add(new THREE.Mesh(armGeo, dressM), new THREE.Mesh(handGeo, skinM)); her.add(a); return a; };
  armL = mkArm(-.2); armR = mkArm(.2);
  head = new THREE.Sprite(new THREE.SpriteMaterial({ map: faceTex, toneMapped: false, transparent: true, alphaTest: .02 }));
  head.scale.set(.86, .86, 1); head.position.y = 1.82; her.add(head);
  const herHit = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 2.4, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  herHit.position.y = 1.15; herHit.userData = { kind: 'her' }; her.add(herHit); clickables.push(herHit);
  scene.add(her);
  const sh = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
}

export function wave() { waveT = .0001; }

export function updateHer(dt) {
  const time = state.time;
  if (state.mode === 'walk') {
    const diff = state.sTarget - state.s; const step = clamp(diff * (1 - Math.exp(-dt * 3.2)), -7.5 * dt, 7.5 * dt);
    state.s += step; spd = Math.abs(step) / Math.max(dt, 1e-4); if (Math.abs(step) > 1e-4) moveDir = Math.sign(step);
  } else spd = 0;
  walkAmt += (clamp(spd / 2.0, 0, 1) - walkAmt) * (1 - Math.exp(-dt * 8));

  let baseY = 0;
  if (state.mode === 'intro' || state.mode === 'loading') { at(0, herXZ); baseY = PLINTH_H; }
  else if (state.mode === 'entering') {
    enterT = Math.min(1, enterT + dt / .95); const k = ease(enterT);
    at(0, v1); at(S0, v2); herXZ.lerpVectors(v1, v2, k);
    baseY = PLINTH_H * (1 - k) + Math.sin(Math.PI * enterT) * .55;
    if (enterT >= 1) { state.mode = 'walk'; placeAt(S0); ui.firstHint.hidden = false; }
  } else at(state.s, herXZ);

  // walk cycle
  phase += spd * dt * 4.4;
  const sw = Math.sin(phase) * walkAmt;
  legL.rotation.x = sw * .6; legR.rotation.x = -sw * .6; armL.rotation.x = -sw * .5; armR.rotation.x = sw * .5;
  const bob = Math.abs(Math.sin(phase)) * .06 * walkAmt + Math.sin(time * 2.1) * .012 * (1 - walkAmt);
  her.position.set(herXZ.x, baseY + bob, herXZ.z);
  head.material.rotation = Math.sin(phase) * .07 * walkAmt + Math.sin(time * 1.3) * .03 * (1 - walkAmt);
  if (state.mode === 'intro' && time > nextWave) { waveT = .0001; nextWave = time + 4.5; }
  armL.rotation.z = -.14;
  if (waveT > 0) { waveT += dt / 1.4; const e = Math.sin(Math.PI * Math.min(1, waveT)); armR.rotation.z = .14 + e * (2.4 + Math.sin(time * 14) * .25); if (waveT >= 1) waveT = 0; }
  else armR.rotation.z = .14;

  // facing
  let targetH;
  if (state.mode === 'intro' || state.mode === 'loading') { tan(0, v1); targetH = Math.atan2(v1.x, v1.z); }
  else {
    tan(state.mode === 'entering' ? 0 : state.s, v1); let hx = v1.x, hz = v1.z;
    if (moveDir < 0 && walkAmt > .2) { hx = -hx; hz = -hz; }
    targetH = Math.atan2(hx, hz);
    if (walkAmt < .25 && state.mode !== 'entering') for (const v of VIEW) if (Math.abs(state.s - v.s) < .8) { targetH = Math.atan2(v.D.x, v.D.z); break; }
  }
  heading += angleDiff(targetH, heading) * (1 - Math.exp(-dt * 7)); her.rotation.y = heading;
  shadow.position.set(herXZ.x, .015, herXZ.z); const shs = 1 - Math.min(.5, baseY * .5); shadow.scale.set(shs, shs, shs);
  fillLight.position.set(herXZ.x, baseY + 2.6, herXZ.z);
}
