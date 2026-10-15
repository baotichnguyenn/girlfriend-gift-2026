// The displays across the room from each letter (DISPLAY_X in layout.js). Room I has none.
// II: a whale skeleton hung from the ceiling. III: a marble goddess on a plinth, after the Venus de Milo.
// IV: a sculpture of steel pipes with flowers bursting from it. V: a blown-glass tower beside an iron basket of flowers.
// Each is built from primitives and merged per material; the flowers share one instanced collector.
import { seeded } from '../util.js';
import { scene } from '../engine.js';
import { CEIL, STATION_Z, DISPLAY_X } from '../layout.js';
import { M } from './materials.js';
import { box, merge } from './geo.js';
import { flora } from './flora.js';

const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const tube = (pts, r, seg = 20, radial = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, radial, false);
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const facing = (p, n, s, color) => ({ x: p.x, y: p.y, z: p.z, s, color, q: new THREE.Quaternion().setFromUnitVectors(UP, n.clone().normalize()) });

// A group at the display's spot, turned so its front (+z) faces the middle of the room.
function spot(i) {
  const g = new THREE.Group(); g.position.set(DISPLAY_X[i], 0, STATION_Z[i]);
  g.rotation.y = Math.atan2(-Math.sign(DISPLAY_X[i]), 0); scene.add(g);
  return g;
}

/* ---------- II: a whale skeleton, hung on cables like a natural-history hall's ---------- */
function whale(g) {
  const bone = new THREE.MeshStandardMaterial({ color: lin(0xe6dbc3), roughness: .72, envMapIntensity: .4 });
  const out = [];
  // in g's frame the whale lies along x, head toward +x, about 12 units long
  const spine = new THREE.CatmullRomCurve3([V(4.6, 6.3, 0), V(2, 6.45, 0), V(-.5, 6.4, 0), V(-3, 6.2, 0), V(-5.2, 6.05, 0), V(-6.6, 6.15, 0)]);
  const N = 42;
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1), p = spine.getPoint(t), tg = spine.getTangent(t), r = .14 * (1 - t * .7) + .02;
    const q = new THREE.Quaternion().setFromUnitVectors(UP, tg);
    out.push(new THREE.CylinderGeometry(r, r, .2, 8).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)).translate(p.x, p.y, p.z));
    out.push(box(.05, r * 2.4, .04, p.x, p.y + r * 1.6, p.z));            // spine above
    out.push(box(.04, .04, r * 4.2 * (1 - t * .5), p.x, p.y, p.z));       // processes either side
    // ribs over the front third, wide and curving down, then closing beneath
    if (t > .06 && t < .42 && k % 2 === 0) {
      const R = 1.05 * Math.sin(Math.PI * (t - .02) / .44) + .25;
      for (const s of [-1, 1]) out.push(tube([V(p.x, p.y, s * .15), V(p.x - .1, p.y - .35 * R, s * .95 * R), V(p.x - .2, p.y - 1.2 * R, s * 1.02 * R), V(p.x - .3, p.y - 1.85 * R, s * .55 * R)], .035, 14, 5));
    }
  }
  // the skull: long and flat, as in a rorqual, with the two lower jawbones bowing out beneath it
  out.push(new THREE.SphereGeometry(1, 20, 12).scale(2, .4, .78).translate(6.5, 6.15, 0));
  out.push(new THREE.SphereGeometry(1, 16, 10).scale(.7, .45, .7).translate(4.9, 6.25, 0));
  for (const s of [-1, 1]) out.push(tube([V(4.7, 5.9, s * .45), V(6, 5.75, s * .95), V(7.4, 5.8, s * .7), V(8.2, 5.95, s * .2)], .07, 20, 6));
  // flippers: an arm bone, then four fanned fingers
  for (const s of [-1, 1]) {
    const a = V(3.2, 5.95, s * .55), b = V(2.7, 5.4, s * 1.4);
    out.push(tube([a, V(3, 5.65, s * 1), b], .07, 8, 6));
    for (let f = 0; f < 4; f++) out.push(tube([b, V(2.3 - f * .2, 5.15 - f * .05, s * (2 + f * .12)), V(1.8 - f * .3, 4.95 - f * .05, s * (2.5 + f * .1))], .035, 8, 5));
  }
  // cables up to the ceiling
  for (const x of [5.2, 1, -3.4]) out.push(new THREE.CylinderGeometry(.012, .012, CEIL - 6.4, 4).translate(x, (CEIL + 6.4) / 2, 0));
  // spot() already turns local x to run along the gallery, so the whale hangs parallel to the wall;
  // shift it so the jaw and tail sit evenly between the arches
  const m = new THREE.Mesh(merge(out), bone); m.position.x = -.8; g.add(m);
}

/* ---------- III: a marble goddess, after the Venus de Milo ---------- */
// A lathe with folds: the radius ripples with the angle round it, like carved drapery.
function draped(profile, folds, depth, flat) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + depth * Math.sin(a * folds + y * 1.3) * Math.min(1, y);
    p.setXYZ(i, x * k, y, z * k * flat);
  }
  g.computeVertexNormals();
  return g;
}
function statue(g) {
  const marble = new THREE.MeshStandardMaterial({ color: lin(0xf1ece2), roughness: .42, envMapIntensity: .6 });
  // the plinth: base, die, and cornice
  g.add(new THREE.Mesh(merge([box(1.5, .2, 1.5, 0, .1, 0), box(1.25, 1.1, 1.25, 0, .75, 0), box(1.45, .14, 1.45, 0, 1.37, 0), box(1.32, .08, 1.32, 0, 1.47, 0)]), M.limestone));
  const fig = [], top = 1.51;
  // drapery from the feet to the hips, slipping off one side
  fig.push(draped([[.001, 0], [.6, 0], [.62, .1], [.55, .6], [.47, 1.1], [.42, 1.5], [.38, 1.75], [.33, 1.82], [.001, 1.82]], 13, .07, .8).rotateZ(-.04).translate(0, top, 0));
  // the bare torso, slightly turned: waist, chest, shoulders, neck
  const torso = draped([[.001, 0], [.33, 0], [.3, .2], [.29, .35], [.33, .55], [.36, .72], [.4, .86], [.36, .95], [.14, 1.02], [.1, 1.12], [.001, 1.14]], 2, .02, .72);
  fig.push(torso.rotateY(.25).rotateZ(.06).translate(.02, top + 1.78, 0));
  // the head, turned a little, with a knot of hair
  fig.push(new THREE.SphereGeometry(.19, 20, 14).scale(.9, 1.1, 1).translate(.08, top + 3.08, .02));
  fig.push(new THREE.SphereGeometry(.11, 12, 10).translate(.06, top + 3.15, -.15));
  fig.push(new THREE.TorusGeometry(.15, .045, 8, 20).rotateX(Math.PI / 2).translate(.08, top + 3.16, .0));
  // the broken arms
  for (const s of [-1, 1]) fig.push(new THREE.CylinderGeometry(.08, .095, .4, 10).rotateZ(s * .35).translate(s * .43, top + 2.55, 0));
  // the breasts, and a roll of cloth gathered slantwise at the hip
  for (const s of [-1, 1]) fig.push(new THREE.SphereGeometry(.12, 14, 10).scale(1, .9, .8).translate(s * .15 + .03, top + 2.42, .19));
  fig.push(new THREE.SphereGeometry(1, 24, 10).scale(.44, .1, .34).rotateZ(.18).translate(.01, top + 1.8, 0));
  g.add(new THREE.Mesh(merge(fig), marble));
}

/* ---------- IV: steel pipes with flowers bursting from them ---------- */
const BLOOMS = [0xf28aa0, 0xe0559a, 0xb65fc7, 0x6b4fb8, 0xf6a04d, 0xfbbd9a, 0xffffff, 0xf7cdd2, 0xd9314f, 0xfff1b0];
function cluster(f, rnd, c, rad, count, palette) {
  for (let k = 0; k < count; k++) {
    const n = V(rnd() - .5, rnd() - .35, rnd() - .5).normalize(), r = rad * Math.cbrt(rnd()), u = rnd();
    const p = c.clone().addScaledVector(n, r);
    const kind = u < .36 ? 'cuprose' : u < .56 ? 'dahlia' : u < .7 ? 'peony' : u < .78 ? 'lily' : u < .92 ? 'leaf' : 'blossom';
    const s = kind === 'blossom' ? .08 : kind === 'leaf' ? 1.5 : kind === 'dahlia' ? 1.5 + rnd() * .6 : 1.3 + rnd() * .6;
    f.add(kind, facing(p, n, s, kind === 'leaf' ? 0xffffff : pick(palette, rnd)));
  }
}
function pipes(g, f) {
  const rnd = seeded(404);
  const steel = new THREE.MeshStandardMaterial({ color: lin(0xd2d5da), metalness: .95, roughness: .18, envMapIntensity: 1.4 });
  const tubes = [box(3.4, .1, 2.6, 0, .05, 0)];
  // two rows of pipes round a hollow square, tallest at the back corner
  for (let k = 0; k < 64; k++) {
    const a = k / 64 * Math.PI * 2, ring = k % 2 ? .95 : 1.15;
    const x = Math.max(-1, Math.min(1, Math.cos(a) * 1.5)) * ring, z = Math.max(-1, Math.min(1, Math.sin(a) * 1.5)) * ring * .75;
    const h = 2 + (1 - (x + z) / 2.3) * 1.8 + rnd() * 1.6, r = .05 + rnd() * .03;
    tubes.push(new THREE.CylinderGeometry(r, r, h, 12, 1, true).translate(x, .1 + h / 2, z));
  }
  g.add(new THREE.Mesh(merge(tubes), steel));
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.5).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: lin(0x9aa0a8), metalness: 1, roughness: .05, envMapIntensity: 1.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mirror.position.y = .102; g.add(mirror); // the depth bias keeps it from flickering against the base it lies on
  // clouds of flowers spilling out between the pipes, low and high
  const at = (x, y, z) => g.localToWorld(V(x, y, z));
  g.updateMatrixWorld(true);
  [[-.9, 4.4, .7, .7], [.5, 3.4, 1, .65], [1.1, 2.1, .55, .6], [-1.1, 1.6, .7, .6], [0, 5, -.3, .55], [.9, 4.4, -.6, .5], [-.4, 2.7, -.9, .55], [.3, 1, 1.1, .5]].forEach(([x, y, z, r]) => cluster(f, rnd, at(x, y, z), r, 46, BLOOMS));
}

/* ---------- V: a blown-glass tower, and an iron basket of flowers ---------- */
const GLASS = [0xf25a0a, 0xe2320f, 0xf7a800, 0xffc400, 0x0f4fd0, 0x2b7de8, 0xc8141e, 0xf27a10, 0xf25a0a, 0xf7a800];
function glass(g, f) {
  const rnd = seeded(505);
  // the plinth, gallery white
  g.add(new THREE.Mesh(box(3, 1, 1.5, 0, .5, 0), new THREE.MeshStandardMaterial({ color: lin(0xf2efe8), roughness: .7, envMapIntensity: .3 })));
  // the tower: a core with curling tendrils, flaring wider as it rises
  const cx = .7, base = 1, tend = [];
  tend.push(new THREE.CylinderGeometry(.16, .22, 3.6, 12).translate(cx, base + 1.8, 0));
  // each tendril leaves the core, rises, and curls back at the tip, tapering like a horn
  const paint = (geo, hex) => {
    const c = new THREE.Color(hex).convertSRGBToLinear(), col = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) col.set([c.r, c.g, c.b], i);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
  };
  paint(tend[0], 0xd2681c);
  for (let k = 0; k < 170; k++) {
    const t = Math.pow(rnd(), .75), h = base + .25 + t * 3.5, a = rnd() * Math.PI * 2, len = .3 + t * .9 + rnd() * .35;
    const d = V(Math.cos(a), 0, Math.sin(a)), side = V(-d.z, 0, d.x), up = .15 + rnd() * .5, turn = rnd() < .5 ? -1 : 1;
    const p0 = V(cx, h, 0).addScaledVector(d, .1), pts = [p0];
    for (let j = 1; j <= 7; j++) {
      const u = j / 7, sw = u * u * 2.6 * turn;                      // swing round as it goes, curling at the end
      const dir = d.clone().multiplyScalar(Math.cos(sw)).addScaledVector(side, Math.sin(sw));
      pts.push(pts[j - 1].clone().addScaledVector(dir, len / 7).add(V(0, up * len / 7 * (1 - u * .6), 0)));
    }
    const curve = new THREE.CatmullRomCurve3(pts), seg = 18, rad = 6, r0 = .045 + rnd() * .03;
    const geo = new THREE.TubeGeometry(curve, seg, r0, rad, false), pos = geo.attributes.position, c = V(0, 0, 0), v = V(0, 0, 0);
    for (let j = 0; j <= seg; j++) {
      curve.getPointAt(j / seg, c); const k2 = 1 - .85 * j / seg;
      for (let q = 0; q <= rad; q++) { const i = j * (rad + 1) + q; v.fromBufferAttribute(pos, i).sub(c).multiplyScalar(k2).add(c); pos.setXYZ(i, v.x, v.y, v.z); }
    }
    geo.computeVertexNormals();
    tend.push(paint(geo, pick(GLASS, rnd)));
  }
  g.add(new THREE.Mesh(merge(tend), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .16, metalness: 0, envMapIntensity: .7 })));
  // the iron basket: an oval boat of rings and ribs on scrolled feet
  const iron = [], bx = -.7, by = base + .35;
  for (const [y, s] of [[0, .55], [.18, .8], [.36, 1]]) iron.push(new THREE.TorusGeometry(.62 * s, .015, 6, 32).rotateX(Math.PI / 2).scale(1.5, 1, .8).translate(bx, by + y, 0));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); iron.push(tube([V(bx + c * .5, by, s * .27), V(bx + c * .78, by + .18, s * .4), V(bx + c * .93, by + .36, s * .5)], .012, 6, 4)); }
  for (const s of [-1, 1]) for (const z of [-.2, .2]) iron.push(tube([V(bx + s * .3, by, z), V(bx + s * .45, base + .15, z), V(bx + s * .62, base + .05, z * 1.2), V(bx + s * .55, base + .14, z * 1.25)], .018, 10, 5));
  g.add(new THREE.Mesh(merge(iron), new THREE.MeshStandardMaterial({ color: lin(0x1c1b1d), metalness: .6, roughness: .45 })));
  // the flowers: tall blue delphinium, red and peach roses, yellow callas, greenery
  g.updateMatrixWorld(true);
  const at = (x, y, z) => g.localToWorld(V(x, y, z));
  for (let k = 0; k < 14; k++) f.add('spike', facing(at(bx - .5 + rnd() * .5, by + .25, -.15 + rnd() * .3), V(-.25 - rnd() * .3, 1, (rnd() - .5) * .3), 2.6 + rnd() * 1.2, pick([0x3d5fd6, 0x5577e8, 0x2f47b8], rnd)));
  for (let k = 0; k < 70; k++) {
    const p = at(bx + (rnd() - .5) * 1.7, by + .4 + rnd() * .3, (rnd() - .5) * .8), n = V(rnd() - .5, .8, rnd() - .5), u = rnd();
    if (u < .45) f.add('cuprose', facing(p, n, 1.6 + rnd() * .5, pick([0xc9182f, 0xd9314f, 0xa8102a, 0xf4b08a, 0xf7c9a6], rnd)));
    else if (u < .62) f.add('lily', facing(p.add(V(0, .2, 0)), V(rnd() - .5, .6, rnd() - .5), 1.4, pick([0xf7c21a, 0xffd23a], rnd)));
    else if (u < .85) f.add('leaf', facing(p, V(rnd() - .5, .5, rnd() - .5), 2, 0xffffff));
    else f.add('blossom', facing(p.add(V(0, .3, 0)), n, .07, 0xffffff));
  }
}

export function buildDisplays() {
  const f = flora(scene, false);
  whale(spot(1));
  statue(spot(2));
  pipes(spot(3), f);
  glass(spot(4), f);
  f.build();
}
