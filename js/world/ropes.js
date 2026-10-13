// Velvet ropes: brass stanchions lining the path, and the barrier rope that crosses it just past each letter.
import { clamp, ease } from '../util.js';
import { state } from '../state.js';
import { scene, V3 } from '../engine.js';
import { S, SB, S_DOOR, at, tan, nrm, minDistToPath } from '../path.js';
import { HALF_W } from '../layout.js';
import { EX } from './exhibits.js';
import { M } from './materials.js';
import { merge } from './geo.js';

const BAR = []; // one barrier per letter. open runs 0 (closed) to 1 (swung open).

const POST_PARTS = [
  { geo: new THREE.CylinderGeometry(.15, .17, .04, 20), y: .02 },
  { geo: new THREE.CylinderGeometry(.032, .032, .88, 12), y: .47 },
  { geo: new THREE.TorusGeometry(.046, .012, 8, 18), y: .9, rx: Math.PI / 2 },
  { geo: new THREE.SphereGeometry(.056, 16, 12), y: .96 }
];
function makePost(brass) {
  const g = new THREE.Group();
  POST_PARTS.forEach((p) => { const m = new THREE.Mesh(p.geo, brass); m.position.y = p.y; if (p.rx) m.rotation.x = p.rx; g.add(m); });
  return g;
}
function ropeGeo(a, b, sag) {
  const A = new V3(a.x, .9, a.z), B = new V3(b.x, .9, b.z);
  const C = A.clone().add(B).multiplyScalar(.5); C.y -= sag * 2;
  return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, C, B), 16, .03, 6, false);
}
function buildBarrier(i, brass, velvet) {
  const sb = SB[i], p = at(sb), t = tan(sb), n = nrm(t);
  const A = p.clone().addScaledVector(n, 1.25), B = p.clone().addScaledVector(n, -1.25);
  const pa = makePost(brass); pa.position.copy(A); scene.add(pa);
  const pivot = new THREE.Group(); pivot.position.copy(A); scene.add(pivot);
  const v = B.clone().sub(A);
  const pb = makePost(brass); pb.position.copy(v); pivot.add(pb);
  pivot.add(new THREE.Mesh(ropeGeo(new V3(0, 0, 0), v, .16), velvet));
  const th = 1.75; const rot = (sg) => (v.x * Math.cos(sg * th) + v.z * Math.sin(sg * th)) * t.x + (-v.x * Math.sin(sg * th) + v.z * Math.cos(sg * th)) * t.z;
  BAR.push({ pivot, open: 0, target: 0, sign: rot(1) > rot(-1) ? 1 : -1, wobble: 0 });
}

export function buildBarriers() {
  for (let i = 0; i < 5; i++) buildBarrier(i, M.brass, M.velvet);
}

// Needs the exhibits built first, to keep the rope lines clear of them. They stop at the garden doors.
export function buildRopeLines() {
  const step = 3.0, rows = { '1': [], '-1': [] }, spots = [];
  const first = 5.4; // keeps the foreground of the entrance shot clear
  const count = Math.floor((S_DOOR - 2 - first) / step) + 1;
  const p = new V3(), t = new V3(), n = new V3();
  for (let k = 0; k < count; k++) {
    const sp = first + k * step; at(sp, p); tan(sp, t); nrm(t, n);
    for (const side of [1, -1]) {
      const q = p.clone().addScaledVector(n, side * 1.25); let ok = true;
      for (let j = 0; j < 5; j++) {
        if (Math.abs(sp - SB[j]) < 1.3) ok = false;
        if (Math.abs(sp - S[j]) < 2.4 && side === EX[j].side) ok = false;
        if (Math.hypot(q.x - EX[j].pos.x, q.z - EX[j].pos.z) < 2.3) ok = false;
      }
      if (minDistToPath(q, sp, 3.0) < 1.55) ok = false;
      if (Math.abs(q.x) > HALF_W - 1.2) ok = false;
      rows[side][k] = ok ? q : null; if (ok) spots.push(q);
    }
  }
  const mtx = new THREE.Matrix4(), quat = new THREE.Quaternion(), scl = new V3(1, 1, 1), e = new THREE.Euler();
  POST_PARTS.forEach((part) => {
    const im = new THREE.InstancedMesh(part.geo, M.brass, spots.length);
    im.frustumCulled = false; // r128 culls by the base geometry's bounds, which sit at the origin
    e.set(part.rx || 0, 0, 0); quat.setFromEuler(e);
    spots.forEach((q, k) => { mtx.compose(new V3(q.x, part.y, q.z), quat, scl); im.setMatrixAt(k, mtx); });
    scene.add(im);
  });
  const geos = [];
  for (const side of ['1', '-1']) for (let k = 0; k < count - 1; k++) { const a = rows[side][k], b = rows[side][k + 1]; if (a && b) geos.push(ropeGeo(a, b, .2)); }
  if (geos.length) scene.add(new THREE.Mesh(merge(geos), M.velvet));
}

// Barriers before the n-th letter swing open. Called from refresh().
export function setBarrierTargets(n) { BAR.forEach((b, i) => { b.target = i < n ? 1 : 0; }); }

// Jumps every barrier to its target without swinging.
export function settleBarriers() { BAR.forEach((b) => { b.open = b.target; }); }

// Shakes barrier i when she pushes against it.
export function wobbleBarrier(i) { BAR[i].wobble = 1; }

export function updateBarriers(dt) {
  BAR.forEach((b) => {
    b.open += (b.target - b.open) * (1 - Math.exp(-dt * 2.2)); b.wobble *= Math.exp(-dt * 3);
    b.pivot.rotation.y = b.sign * 1.75 * ease(clamp(b.open, 0, 1)) + Math.sin(state.time * 30) * .06 * b.wobble;
  });
}
