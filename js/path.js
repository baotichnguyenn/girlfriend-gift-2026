// The brass path: a centripetal Catmull-Rom curve. Position along it is arc length s, from 0 to L.
// Use at(s), tan(s), and nrm(t) rather than raw curve calls.
import { clamp } from './util.js';
import { PLINTH_Z, PARTITION_Z, STATION_Z, STATION_SIDE, STATION_X, DOOR_Z, END_Z } from './layout.js';

const V3 = THREE.Vector3;

// Straight through the middle of every arch, swinging out to one side at each letter.
const PATH_PTS = [[0, PLINTH_Z], [0, PLINTH_Z - 6]];
PARTITION_Z.forEach((pz, i) => PATH_PTS.push([0, pz + 2.5], [0, pz - 2.5], [STATION_SIDE[i] * STATION_X, STATION_Z[i]]));
PATH_PTS.push([0, DOOR_Z + 2.5], [0, DOOR_Z - 2.5], [0, END_Z]);

const curve = new THREE.CatmullRomCurve3(PATH_PTS.map(([x, z]) => new V3(x, 0, z)), false, 'centripetal');
curve.arcLengthDivisions = 1200;
export const L = curve.getLength();
export const at = (s, out) => curve.getPointAt(clamp(s / L, 0, 1), out || new V3());
export const tan = (s, out) => curve.getTangentAt(clamp(s / L, 0, 1), out || new V3()).setY(0).normalize();
export const nrm = (t, out) => (out || new V3()).set(t.z, 0, -t.x);
const SAMPLES = []; for (let s = 0; s <= L; s += 0.5) SAMPLES.push({ s, p: at(s) });
export function minDistToPath(q, sSelf, skip) {
  let m = Infinity;
  for (const o of SAMPLES) { if (Math.abs(o.s - sSelf) < skip) continue; const d = Math.hypot(o.p.x - q.x, o.p.z - q.z); if (d < m) m = d; }
  return m;
}
// The path always heads toward -z, so z picks out a single point on it.
export function sAtZ(z) {
  let a = 0, b = L;
  for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (at(m).z > z) a = m; else b = m; }
  return (a + b) / 2;
}

/* ---------- stations ---------- */
export const S = STATION_Z.map(sAtZ);       // where each letter hangs
export const SB = S.map((v) => v + 1.6);     // the rope barrier just past each letter
export const S0 = 1.4;                       // where she lands after stepping off the plinth
export const S_DOOR = sAtZ(DOOR_Z);          // the garden doors
export const PLINTH_H = 0.5;
