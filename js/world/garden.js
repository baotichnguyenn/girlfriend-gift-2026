// The garden past the doors: a clifftop terrace in the French manner, with mountains beyond (see sky.js).
// A gravel allée lined with flowers leads to a flower-covered arch, where her portrait stands.
// Left of the allée: a water-lily basin, then a rose parterre round a green trellis rotunda.
// Right: lilies and irises, then a cottage garden of dahlias, foxgloves, and cosmos round a wisteria pergola.
// A stone balustrade runs along the cliff edge. Everything here stays hidden until the doors start to open.
import { seeded, reduceMotion } from '../util.js';
import { state } from '../state.js';
import { renderer, scene } from '../engine.js';
import { S_DOOR } from '../path.js';
import { DOOR_Z, WALL_T, HALF_W, ARCH_Z, CLIFF_Z, GARDEN_W } from '../layout.js';
import { petal } from '../paint/surfaces.js';
import { M } from './materials.js';
import { box, plane, merge, addMerged } from './geo.js';
import { flora, plant, floraTime } from './flora.js';
import { doorAmount } from './doors.js';

export const garden = new THREE.Group();
let petals, wings;
const butterflies = [];

const EDGE_Z = DOOR_Z - WALL_T / 2;  // the garden starts at the back face of the end wall
const GW = GARDEN_W;
const CROSS_Z = EDGE_Z - 12.6;       // the cross allée
const BACK_Z = CLIFF_Z + 3.4;        // beds stop here, leaving lawn before the balustrade
const UP = new THREE.Vector3(0, 1, 0);

// palettes, written as they should look
const ARCH = [0xfbe4e4, 0xf7cdd2, 0xf4b6c2, 0xffffff, 0xfdf0e6, 0xeea3b4, 0xe2708f, 0xc9375c];
const BLUSH = [0xf9d9dc, 0xf6c6cd, 0xfbe6e0];
const ROSE_BEDS = [[0xf58fb0, 0xf06c9b, 0xfbb3c8], [0xe23b55, 0xf26b6b, 0xd9314f], [0xfde3e3, 0xffffff, 0xf9cdd5], [0xe0559a, 0xf27aa8, 0xc93c7f]];
const DAHLIA = [0xf7a1b5, 0xf28aa0, 0xfbbd9a, 0xf6966b, 0xe8577a, 0xfcd3c1, 0xd6457a, 0xfde0cf, 0xf3b45c];
const LILY = [0xffffff, 0xfbe9ef, 0xf39cbd, 0xf6a04d, 0xfff1b0];
const IRIS = [0x6b5bc4, 0x8d7ad8, 0x3f4fa8, 0xf4f0ff, 0xf3d36b];
const SPIKE = [0x8b6fd1, 0x5b74d6, 0xe39ac3, 0xf5eef7, 0xb98be0];
const COSMOS = [0xffffff, 0xf7b7d0, 0xe0569c, 0xf9d1e0];
const HYDRANGEA = [0x9db8e8, 0xb9a7e6, 0xf4f1ea, 0x8fa9e0];
const BLOSSOM = [0xf6bccb, 0xf2a6ba, 0xf9d3de, 0xfbe6ec, 0xeb92aa];
const WISTERIA = [0xb7a2e8, 0xc9b6f0, 0x9f86d8, 0xe9e1f7];
const LAVENDER = [0x8f7ad6, 0xa58be0];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
// Points on a jittered grid inside [x0, x1] × [z0, z1] that pass keep(x, z).
function scatter(x0, x1, z0, z1, step, rnd, keep, fn) {
  for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) {
    const px = x + (rnd() - .5) * step * .9, pz = z + (rnd() - .5) * step * .9;
    if (!keep || keep(px, pz)) fn(px, pz);
  }
}
// An instance facing out along direction n.
const facing = (x, y, z, n, s, color) => ({ x, y, z, s, color, q: new THREE.Quaternion().setFromUnitVectors(UP, n.clone().normalize()) });
// A random direction, mostly upward when up is near 1.
function outward(rnd, up) {
  const th = rnd() * 6.28, ph = Math.acos(Math.pow(rnd(), up));
  return new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
}

export function buildGarden() {
  scene.add(garden);
  const rnd = seeded(77), f = flora(garden, true);
  const out = new Map([[M.grass, []], [M.gravel, []], [M.hedge, []], [M.bark, []], [M.limestone, []], [M.bronze, []], [M.trellis, []], [M.rock, []], [M.water, []]]);
  const add = (mat, g) => out.get(mat).push(g);
  const flat = (w, d, x, z, y) => plane(w, d).rotateX(-Math.PI / 2).translate(x, y, z);
  const ellipse = (ra, rb, x, z, y) => { const g = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2).scale(ra, 1, rb).translate(x, y, z), uv = g.attributes.uv, ps = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i), -ps.getZ(i)); return g; };
  const disc = (r, x, z, y) => { const g = new THREE.CircleGeometry(r, 40), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * r * 2, uv.getY(i) * r * 2); return g.rotateX(-Math.PI / 2).translate(x, y, z); };
  const lavender = (x, z, h) => { f.add('stem', { x, z, sy: h, rx: (rnd() - .5) * .2, ry: rnd() * 6 }); f.add('lavender', { x, y: h - .02, z, s: 1 + rnd() * .3, color: pick(LAVENDER, rnd) }); };

  /* ---------- ground: lawn on the clifftop, gravel allées, and rock falling away below ---------- */
  add(M.grass, flat(GW * 2, EDGE_Z - CLIFF_Z, 0, (EDGE_Z + CLIFF_Z) / 2, 0));
  add(M.gravel, flat(18, 4, 0, EDGE_Z - 2, .013));                                        // forecourt
  const alleeEnd = ARCH_Z + 2.4;
  add(M.gravel, flat(3.4, EDGE_Z - 4 - alleeEnd, 0, (EDGE_Z - 4 + alleeEnd) / 2, .012));  // the allée
  add(M.gravel, flat(GW * 2 - 4, 2.4, 0, CROSS_Z, .011));                                 // the cross allée
  add(M.gravel, flat(7.6, 5, 0, ARCH_Z, .014));                                           // under the arch
  add(M.limestone, box(4.6, .05, 1.4, 0, .025, EDGE_Z - .7));                            // threshold slab
  // the rock face, sloping steeply down and out from every open edge
  const skirt = (ax, az, bx, bz, ox, oz) => {
    const D = 16, H = 48, len = Math.hypot(bx - ax, bz - az), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([ax, 0, az, bx, 0, bz, bx + ox * D, -H, bz + oz * D, ax + ox * D, -H, az + oz * D], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, len, 0, len, 50, 0, 50], 2));
    g.setIndex([0, 2, 1, 0, 3, 2]); g.computeVertexNormals();
    return g;
  };
  add(M.rock, skirt(GW + .5, CLIFF_Z, -GW - .5, CLIFF_Z, 0, -1));
  for (const sx of [-1, 1]) {
    add(M.rock, skirt(sx * GW, EDGE_Z + .5, sx * GW, CLIFF_Z - .5, sx, 0));
    add(M.rock, skirt(sx * (HALF_W + .4), EDGE_Z, sx * (GW + .5), EDGE_Z, 0, 1));
  }
  add(M.limestone, box(HALF_W * 2 + 1.2, .55, .7, 0, 9.85, EDGE_Z - .2)); // a cornice along the museum's garden front

  /* ---------- a stone balustrade along the cliff, with urns on some of its piers ---------- */
  const BALUSTER = [[.001, 0], [.09, 0], [.09, .04], [.05, .08], [.045, .14], [.08, .26], [.1, .34], [.08, .42], [.04, .52], [.035, .62], [.06, .68], [.07, .72], [.07, .78], [.001, .78]];
  const balusters = [], urnSpots = [];
  const balustrade = (x0, z0, x1, z1, urnsAt) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len, ry = Math.atan2(-uz, ux), piers = Math.ceil(len / 6.5);
    add(M.limestone, box(len, .18, .6, (x0 + x1) / 2, .09, (z0 + z1) / 2, ry));
    add(M.limestone, box(len, .14, .62, (x0 + x1) / 2, 1.03, (z0 + z1) / 2, ry));
    for (let p = 0; p <= piers; p++) {
      const t = p / piers * len, px = x0 + ux * t, pz = z0 + uz * t;
      add(M.limestone, box(.7, 1.22, .7, px, .61, pz)); add(M.limestone, box(.84, .1, .84, px, 1.27, pz));
      if (urnsAt.includes(p) || (urnsAt.includes(-1) && p === piers)) urnSpots.push([px, pz]);
      if (p < piers) for (let b = .62; b < len / piers - .4; b += .36) balusters.push([px + ux * b, pz + uz * b]);
    }
  };
  balustrade(-GW, CLIFF_Z + .4, GW, CLIFF_Z + .4, [0, -1]);
  for (const sx of [-1, 1]) {
    balustrade(sx * (GW - .4), EDGE_Z - .4, sx * (GW - .4), CLIFF_Z + .4, [2]);
    balustrade(sx * (HALF_W + .7), EDGE_Z - .4, sx * (GW - .4), EDGE_Z - .4, []);
  }
  const bim = new THREE.InstancedMesh(new THREE.LatheGeometry(BALUSTER.map(([r, y]) => new THREE.Vector2(r, y)), 8), M.limestone, balusters.length), m4 = new THREE.Matrix4();
  balusters.forEach(([x, z], k) => bim.setMatrixAt(k, m4.makeTranslation(x, .18, z)));
  bim.frustumCulled = false; // r128 culls instanced meshes by the base geometry's bounds
  garden.add(bim);
  const URN = [[.001, 0], [.16, 0], [.16, .06], [.08, .12], [.07, .22], [.2, .36], [.3, .56], [.32, .68], [.26, .74], [.34, .8], [.001, .8]];
  urnSpots.forEach(([x, z]) => {
    add(M.limestone, new THREE.LatheGeometry(URN.map(([r, y]) => new THREE.Vector2(r, y)), 16).translate(x, 1.32, z));
    for (let k = 0; k < 26; k++) {
      const n = outward(rnd, .8), rose = k % 3;
      f.add(rose ? 'cuprose' : 'leaf', facing(x + n.x * .38, 2.18 + n.y * .3, z + n.z * .38, n, rose ? 1.1 : 1.3, rose ? pick([0xf06c9b, 0xfbb3c8, 0xe23b55], rnd) : 0xffffff));
    }
  });

  /* ---------- the flower arch at the end of the allée, and an aisle of flowers leading to it ---------- */
  const AX = 2.35, AH = 4.5, AZ = ARCH_Z - .35;
  add(M.bronze, merge([box(.1, AH, .1, -AX, AH / 2, AZ), box(.1, AH, .1, AX, AH / 2, AZ), box(AX * 2 + .1, .1, .1, 0, AH, AZ)]));
  const frameLen = AH * 2 + AX * 2;
  for (let d = 0; d < frameLen; d += .05) {
    const px = d < AH ? -AX : d < AH + AX * 2 ? -AX + (d - AH) : AX, py = d < AH ? d : d < AH + AX * 2 ? AH : AH - (d - AH - AX * 2);
    // fuller at the top corners and the feet, as in a hand-tied arch
    const corner = Math.max(0, 1 - Math.min(Math.hypot(px + AX, py - AH), Math.hypot(px - AX, py - AH)) / 1.6) + (py < .9 ? .6 : 0);
    const n = 2 + Math.round(corner * 2 + rnd());
    for (let k = 0; k < n; k++) {
      const off = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() * .9 - .3).normalize(), r = .12 + rnd() * (.24 + corner * .2), u = rnd();
      const kind = u < .7 ? 'cuprose' : u < .8 ? 'peony' : u < .83 ? 'hydrangea' : u < .94 ? 'leaf' : 'blossom';
      const s = kind === 'cuprose' ? 1.2 + rnd() * .8 : kind === 'peony' ? .9 + rnd() * .3 : kind === 'hydrangea' ? .7 : kind === 'leaf' ? 1 : .07;
      f.add(kind, facing(px + off.x * r, py + off.y * r, AZ + off.z * r, off, s, kind === 'leaf' ? 0xffffff : kind === 'hydrangea' ? 0xf6f3ea : kind === 'peony' ? pick(BLUSH, rnd) : pick(ARCH, rnd)));
    }
  }
  // flower mounds: spilling from the feet of the arch, and lining the allée up to it
  const mound = (cx, cz, rad, hgt, count, spill) => {
    for (let k = 0; k < count; k++) {
      const n = outward(rnd, .7), u = rnd(), kind = u < .68 ? 'cuprose' : u < .8 ? 'peony' : u < .86 ? 'hydrangea' : 'leaf';
      f.add(kind, facing(cx + n.x * rad + spill * (rnd() - .3), Math.max(.06, n.y * hgt), cz + n.z * rad, n, kind === 'cuprose' ? 1.2 + rnd() * .7 : kind === 'leaf' ? 1 : .85, kind === 'leaf' ? 0xffffff : kind === 'hydrangea' ? 0xf6f3ea : kind === 'peony' ? pick(BLUSH, rnd) : pick(ARCH, rnd)));
    }
  };
  for (const sx of [-1, 1]) {
    mound(sx * (AX + .25), AZ + .35, 1.0, .9, 95, sx * .6);
    for (let z = CROSS_Z - 2; z > alleeEnd + .6; z -= 2.5) mound(sx * 2.25, z, .62, .62, 30, 0);
  }

  /* ---------- the front: hydrangeas under the facade, box hedges and topiary by the allée, lavender by the balustrade ---------- */
  for (const sx of [-1, 1]) {
    add(M.hedge, box(.45, .48, CROSS_Z + 1.4 - (EDGE_Z - 4.2), sx * 1.95, .24, (CROSS_Z + 1.4 + EDGE_Z - 4.2) / 2));
    for (const cz of [EDGE_Z - 1.2, CROSS_Z + 1.9, CROSS_Z - 1.9]) {
      add(M.hedge, new THREE.ConeGeometry(.55, 1.8, 10).translate(sx * 2.7, 1.2, cz)); add(M.limestone, box(.8, .3, .8, sx * 2.7, .15, cz));
    }
    for (let x = HALF_W + 1.2; x < GW - 1.2; x += 1.6) {
      const s = 1.2 + rnd() * .4, col = pick(HYDRANGEA, rnd), bz = EDGE_Z - 1.4;
      f.add('bush', { x: sx * x, y: .35 * s, z: bz, s, color: 0x355f31 });
      for (let j = 0; j < 7; j++) f.add('hydrangea', { x: sx * x + (rnd() - .5) * .8 * s, y: (.4 + rnd() * .35) * s, z: bz + (rnd() - .5) * .8 * s, s: .9 + rnd() * .3, color: col });
    }
    for (let z = EDGE_Z - 4.5; z > BACK_Z; z -= .38) for (const x of [GW - 1.5, GW - 2.2]) lavender(sx * (x + (rnd() - .5) * .4), z + (rnd() - .5) * .3, .45 + rnd() * .25);
  }
  const nearLavender = (x) => Math.abs(x) > GW - 2.9;

  /* ---------- front left: a water-lily basin, as at Giverny ---------- */
  const PX = -11, PZ = EDGE_Z - 7.4, PR = 2.9;
  add(M.water, disc(PR, PX, PZ, .07));
  add(M.limestone, new THREE.CylinderGeometry(PR + .05, PR + .1, .2, 48, 1, true).translate(PX, .1, PZ));
  add(M.limestone, new THREE.TorusGeometry(PR + .16, .17, 6, 48).rotateX(Math.PI / 2).scale(1, .55, 1).translate(PX, .2, PZ));
  for (let k = 0; k < 46; k++) {
    const a = rnd() * 6.28, r = Math.sqrt(rnd()) * (PR - .35), x = PX + Math.cos(a) * r, z = PZ + Math.sin(a) * r;
    f.add('pad', { x, y: .08, z, s: .7 + rnd() * .6, ry: rnd() * 6.28, color: pick([0xffffff, 0xd8ecc0, 0xc4dca8], rnd) });
    if (k % 3 === 0) f.add('waterlily', { x: x + .05, y: .085, z: z + .05, s: 1 + rnd() * .4, ry: rnd() * 6, color: pick([0xffffff, 0xf7c4d4, 0xe8709c, 0xfff0d0], rnd) });
  }
  for (let k = 0; k < 44; k++) { const a = k / 44 * 6.28, r = PR + .9 + rnd() * .25; lavender(PX + Math.cos(a) * r, PZ + Math.sin(a) * r, .42 + rnd() * .2); }

  /* ---------- front right: lilies and irises in drifts ---------- */
  add(M.hedge, flat(GW - 3 - 3.6, (EDGE_Z - 4.4) - (CROSS_Z + 1.8), (GW - 3 + 3.6) / 2, (EDGE_Z - 4.4 + CROSS_Z + 1.8) / 2, .008));
  scatter(3.8, GW - 3, CROSS_Z + 1.8, EDGE_Z - 4.4, .5, rnd, (x) => !nearLavender(x), (x, z) => {
    const band = Math.floor(x / 3.2) + Math.floor(-z / 3);
    if (band % 3 === 0) { // irises, the fleur-de-lis, in clumps
      plant(f, 'iris', x, z, .62 + rnd() * .2, IRIS[(band + 1) % IRIS.length], rnd, 1.2);
      f.add('leaf', { x, z, s: 1.6, sy: 3.2, rx: (rnd() - .5) * .5, ry: rnd() * 6 });
    } else { // lilies, two or three trumpets to a stem
      const h = .95 + rnd() * .35, col = LILY[(band * 2 + (rnd() < .2 ? 1 : 0)) % LILY.length];
      f.add('stem', { x, z, sy: h, rx: (rnd() - .5) * .15, ry: rnd() * 6 });
      for (let j = 0; j < 2 + Math.round(rnd()); j++) {
        const a = rnd() * 6.28;
        f.add('lily', facing(x + Math.cos(a) * .06, h - j * .08, z + Math.sin(a) * .06, new THREE.Vector3(Math.cos(a) * .9, .7, Math.sin(a) * .9), 1 + rnd() * .3, col));
      }
      if (rnd() < .5) f.add('leaf', { x, y: h * .4, z, s: 1.3, rx: rnd() - .5, ry: rnd() * 6 });
    }
  });

  /* ---------- back left: a rose parterre round a green trellis rotunda ---------- */
  const RX = -16.5, RZ = CROSS_Z - 10.5, RR = 2.4, RH = 3.4;
  add(M.gravel, disc(RR + 1.2, RX, RZ, .015));
  add(M.gravel, flat(2, (CROSS_Z - 1.2) - (RZ + RR + 1), RX, (CROSS_Z - 1.2 + RZ + RR + 1) / 2, .015));
  const BEDS = [[-8.2, CROSS_Z - 5.4, 3.9, 2.4], [-21.2, CROSS_Z - 4.4, 2.6, 2.2], [-8.6, CROSS_Z - 15.2, 4.3, 2.6], [-20.4, CROSS_Z - 16.6, 2.6, 2.4]];
  BEDS.forEach(([bx, bz, ra, rb], bi) => {
    add(M.hedge, ellipse(ra + .3, rb + .3, bx, bz, .008));
    scatter(bx - ra, bx + ra, bz - rb, bz + rb, .9, rnd, (x, z) => ((x - bx) / ra) ** 2 + ((z - bz) / rb) ** 2 < 1, (x, z) => {
      const s = .62 + rnd() * .25;
      f.add('bush', { x, y: .3 * s, z, s, ry: rnd() * 6, color: 0x3f6b35 });
      for (let j = 0; j < 11; j++) { const n = outward(rnd, .5); f.add('cuprose', facing(x + n.x * .4 * s, .3 * s + n.y * .38 * s, z + n.z * .4 * s, n, 1.4 + rnd() * .5, pick(ROSE_BEDS[bi], rnd))); }
    });
  });
  // the rotunda: eight posts, a ring, a ribbed dome, lattice in seven bays, and roses climbing it all
  const trellis = [], climbers = [];
  const dome = (t) => [RR * Math.cos(t * Math.PI / 2), RH + 2.1 * Math.sin(t * Math.PI / 2)];
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2 + Math.PI / 8, b = a + Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
    const x0 = RX + ca * RR, z0 = RZ + sa * RR, x1 = RX + Math.cos(b) * RR, z1 = RZ + Math.sin(b) * RR;
    trellis.push(box(.12, RH, .12, x0, RH / 2, z0));
    trellis.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([0, .25, .5, .75, 1].map((t) => { const [r, y] = dome(t); return new THREE.Vector3(RX + ca * r, y, RZ + sa * r); })), 12, .05, 5));
    if (k !== 1) { // every bay but the one facing the path: diagonal lattice, lines u ± v = c clipped to the bay
      const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0) / len, (x1 - x0) / len), LH = 2.6;
      for (const dir of [1, -1]) for (let c = dir > 0 ? -len : 0; c < (dir > 0 ? LH : len + LH); c += .45) {
        const u0 = dir > 0 ? Math.max(0, -c) : Math.max(0, c - LH), u1 = dir > 0 ? Math.min(len, LH - c) : Math.min(len, c);
        if (u1 - u0 < .05) continue;
        const v0 = dir > 0 ? u0 + c : c - u0, v1 = dir > 0 ? u1 + c : c - u1;
        const bar = new THREE.BoxGeometry(Math.SQRT2 * (u1 - u0), .035, .035);
        bar.rotateZ(dir * Math.PI / 4).translate((u0 + u1) / 2 - len / 2, .3 + (v0 + v1) / 2, 0).rotateY(ry).translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
        trellis.push(bar);
      }
    }
    for (let j = 0; j < 22; j++) {
      const [r, y] = rnd() < .45 ? dome(rnd()) : [RR, rnd() * RH];
      climbers.push([RX + ca * r + (rnd() - .5) * .3, y, RZ + sa * r + (rnd() - .5) * .3]);
    }
  }
  trellis.push(new THREE.TorusGeometry(RR, .06, 6, 8).rotateX(Math.PI / 2).translate(RX, RH, RZ));
  trellis.push(new THREE.TorusGeometry(RR * .7, .04, 6, 16).rotateX(Math.PI / 2).translate(RX, RH + 1.5, RZ));
  trellis.push(new THREE.SphereGeometry(.14, 10, 8).translate(RX, RH + 2.25, RZ), new THREE.ConeGeometry(.06, .4, 8).translate(RX, RH + 2.5, RZ));

  /* ---------- back right: a cottage garden of dahlias, foxgloves, cosmos, and roses round a wisteria pergola ---------- */
  const GX = 16.6, GZ = CROSS_Z - 11.5, GH = 3.3;
  add(M.gravel, flat(5.2, 5.2, GX, GZ, .015));
  add(M.gravel, flat(2, (CROSS_Z - 1.2) - (GZ + 2.6), GX, (CROSS_Z - 1.2 + GZ + 2.6) / 2, .015));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) trellis.push(box(.2, GH, .2, GX + sx * 1.8, GH / 2, GZ + sz * 1.8));
  for (const sx of [-1, 1]) trellis.push(box(.16, .24, 4.6, GX + sx * 1.8, GH + .12, GZ));
  for (let k = 0; k < 7; k++) trellis.push(box(4.6, .14, .1, GX, GH + .31, GZ - 2.1 + k * .7));
  add(M.trellis, merge(trellis));
  for (let k = 0; k < 64; k++) { // wisteria hanging from the slats
    const x = GX - 2 + rnd() * 4, z = GZ - 2.1 + Math.round(rnd() * 6) * .7;
    f.add('spike', { x, y: GH + .2, z, s: .8 + rnd() * .5, rx: Math.PI, color: pick(WISTERIA, rnd) });
    if (k % 2) f.add('leaf', { x: x + (rnd() - .5) * .4, y: GH + .3, z, s: 1.4, rx: Math.PI * .6, ry: rnd() * 6 });
  }
  for (let j = 0; j < 40; j++) climbers.push([GX + (rnd() < .5 ? -1.8 : 1.8) + (rnd() - .5) * .3, rnd() * GH, GZ + (rnd() < .5 ? -1.8 : 1.8) + (rnd() - .5) * .3]);
  climbers.forEach(([x, y, z]) => {
    const rose = rnd() < .6;
    f.add(rose ? 'cuprose' : 'leaf', facing(x, y, z, new THREE.Vector3(rnd() - .5, rnd() - .3, rnd() - .5), 1.1, rose ? pick([0xf06c9b, 0xfbb3c8, 0xe2708f, 0xffffff], rnd) : 0xffffff));
  });
  const keepCottage = (x, z) => !nearLavender(x) && !(Math.abs(x - GX) < 3.4 && Math.abs(z - GZ) < 3.4) && !(Math.abs(x - GX) < 1.3 && z > GZ) && !(x < 6.5 && z < ARCH_Z + 3.4);
  add(M.hedge, flat(GW - 3 - 4, CROSS_Z - 1.8 - BACK_Z, (GW - 3 + 4) / 2, (CROSS_Z - 1.8 + BACK_Z) / 2, .008));
  scatter(4.2, GW - 3, BACK_Z, CROSS_Z - 1.8, .5, rnd, keepCottage, (x, z) => {
    const u = rnd(), drift = Math.floor((x + 3) / 3.4) * 7 + Math.floor(-z / 2.8);
    if (u < .5) { // dahlias: big heads on tall stems
      plant(f, 'dahlia', x, z, .7 + rnd() * .45, DAHLIA[drift % DAHLIA.length], rnd, 1.5 + rnd() * .7);
      if (rnd() < .4) f.add('leaf', { x, y: .3, z, s: 1.5, rx: (rnd() - .5) * 1.2, ry: rnd() * 6 });
    } else if (u < .66) plant(f, 'spike', x, z, .55 + rnd() * .4, SPIKE[drift % SPIKE.length], rnd, 1.1 + rnd() * .5);
    else if (u < .88) plant(f, 'daisy', x, z, .6 + rnd() * .35, pick(COSMOS, rnd), rnd, 1.2 + rnd() * .4);
    else plant(f, 'cuprose', x, z, .55 + rnd() * .3, pick([0xfbb3c8, 0xfde3e3, 0xf3a3c0], rnd), rnd, 1.2);
  });

  /* ---------- trees: cherry blossom in the front corners, cypresses framing the view ---------- */
  const bark = [];
  for (const [tx, tz] of [[-21.5, EDGE_Z - 5.5], [21.5, EDGE_Z - 5.5]]) {
    const h = 2.8;
    bark.push(new THREE.CylinderGeometry(.13, .22, h, 7).translate(tx, h / 2, tz));
    for (let b = 0; b < 4; b++) {
      const a = b / 4 * Math.PI * 2 + rnd(), len = 1.7 + rnd() * .7, th = .75 + rnd() * .3, g = new THREE.CylinderGeometry(.05, .1, len, 5);
      g.translate(0, len / 2, 0); g.rotateZ(th); g.rotateY(a); g.translate(tx, h - .3, tz); bark.push(g);
      // the branch tip: (0, len, 0) turned by th about z, then by a about y
      const ex = tx - len * Math.sin(th) * Math.cos(a), ez = tz + len * Math.sin(th) * Math.sin(a), ey = h - .3 + len * Math.cos(th);
      for (let j = 0; j < 30; j++) { const r = Math.cbrt(rnd()), n = outward(rnd, 1); f.add('blossom', { x: ex + n.x * r * 1.15, y: ey + .25 + (n.y * 2 - 1) * r * .7, z: ez + n.z * r * 1.15, s: .22 + rnd() * .32, color: pick(BLOSSOM, rnd) }); }
    }
  }
  add(M.bark, merge(bark));
  const CYPRESS = [[.001, 0], [.45, .3], [.8, 1.5], [.86, 3], [.72, 4.6], [.44, 6.1], [.16, 7.3], [.001, 7.8]];
  for (const [x, z, s] of [[-24.2, CLIFF_Z + 2.4, 1.1], [-21.6, CLIFF_Z + 1.9, .9], [24.2, CLIFF_Z + 2.4, 1.15], [21.4, CLIFF_Z + 2, .85], [-24.4, CROSS_Z - 2, .8], [24.4, CROSS_Z - 2, .8]]) {
    add(M.hedge, new THREE.LatheGeometry(CYPRESS.map(([r, y]) => new THREE.Vector2(r, y)), 10).scale(s, s, s).translate(x, 0, z));
  }

  f.build();
  addMerged(garden, out);

  /* ---------- falling petals ---------- */
  const N = 520, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4), col = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    pos.set([(rnd() - .5) * 26, rnd() * 7, EDGE_Z - 2 - rnd() * (EDGE_Z - ARCH_Z + 4)], k * 3);
    seed.set([rnd() * 6.3, .25 + rnd() * .35, .3 + rnd() * .6, (rnd() - .5) * 3], k * 4);
    const c = new THREE.Color(pick(BLOSSOM, rnd)); col.set([c.r, c.g, c.b], k * 3);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  petals = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 600 }, uMap: { value: petal() } },
    transparent: true, depthWrite: false,
    vertexShader: [
      'uniform float uTime; uniform float uScale; attribute vec4 aSeed; attribute vec3 color; varying vec3 vCol; varying float vSpin;',
      'void main(){',
      '  vec3 p = position; p.y = mod(p.y - uTime * aSeed.y, 7.0);',
      '  p.x += sin(uTime * .6 + aSeed.x) * aSeed.z; p.z += cos(uTime * .45 + aSeed.x * 1.7) * aSeed.z * .6;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;',
      '  gl_PointSize = .09 * uScale / -mv.z; vCol = color; vSpin = aSeed.x + uTime * aSeed.w;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D uMap; varying vec3 vCol; varying float vSpin;',
      'void main(){',
      '  vec2 c = gl_PointCoord - .5; float s = sin(vSpin), k = cos(vSpin); c = mat2(k, -s, s, k) * c; c.x *= 1.0 + .6 * abs(sin(vSpin * .7));',
      '  vec4 t = texture2D(uMap, c + .5); if (t.a < .35) discard;',
      '  gl_FragColor = vec4(t.rgb * vCol, t.a);',
      '}'
    ].join('\n')
  }));
  petals.frustumCulled = false;
  garden.add(petals);

  /* ---------- butterflies: two wings each, flapping as they wander over the beds ---------- */
  const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.bezierCurveTo(.02, .1, .14, .12, .13, .03); wing.bezierCurveTo(.14, -.03, .1, -.09, .04, -.08); wing.bezierCurveTo(.02, -.06, 0, -.02, 0, 0);
  const homes = [[-11, PZ], [10, EDGE_Z - 8], [16, CROSS_Z - 7], [12, CROSS_Z - 15], [-9, CROSS_Z - 6], [-19, CROSS_Z - 15], [-4, ARCH_Z + 4], [5, ARCH_Z + 6], [20, EDGE_Z - 9], [-20, CROSS_Z - 3]];
  const tint = [0xffffff, 0xfff3b0, 0xc9d8ff, 0xf6b26b, 0xffffff, 0xfff3b0, 0xe8d1ff, 0xffffff, 0xf6b26b, 0xc9d8ff];
  wings = new THREE.InstancedMesh(new THREE.ShapeGeometry(wing, 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .7 }), homes.length * 2);
  homes.forEach(([x, z], k) => {
    butterflies.push({ x, z, ph: rnd() * 6.3, sp: .5 + rnd() * .4, rx: 1.5 + rnd() * 1.5, rz: 1.2 + rnd() * 1.5 });
    const c = new THREE.Color(tint[k]).convertSRGBToLinear(); wings.setColorAt(k * 2, c); wings.setColorAt(k * 2 + 1, c);
  });
  wings.frustumCulled = false;
  garden.add(wings);
  garden.visible = false;
}

const bq = new THREE.Quaternion(), wq = new THREE.Quaternion(), roll = new THREE.Vector3(0, 0, 1), bp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), wm = new THREE.Matrix4();
function updateButterflies(t) {
  butterflies.forEach((b, k) => {
    const u = t * b.sp + b.ph;
    bp.set(b.x + Math.sin(u * .7) * b.rx, 1 + .35 * Math.sin(u * 1.3) + .15 * Math.sin(u * 3.1), b.z + Math.cos(u * .5) * b.rz);
    bq.setFromAxisAngle(UP, Math.atan2(Math.cos(u * .7) * .7 * b.rx, -Math.sin(u * .5) * .5 * b.rz)); // face the way she's flying
    const flap = .25 + .95 * Math.abs(Math.sin(u * 14));
    wings.setMatrixAt(k * 2, wm.compose(bp, wq.setFromAxisAngle(roll, flap).premultiply(bq), one));
    wings.setMatrixAt(k * 2 + 1, wm.compose(bp, wq.setFromAxisAngle(roll, Math.PI - flap).premultiply(bq), one));
  });
  wings.instanceMatrix.needsUpdate = true;
}

export function updateGarden() {
  garden.visible = doorAmount() > 0 || state.s > S_DOOR - 1;
  if (!garden.visible) return;
  const t = reduceMotion ? 2 : state.time;
  floraTime.value = reduceMotion ? 0 : t;
  petals.material.uniforms.uTime.value = reduceMotion ? 0 : t;
  petals.material.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(25 * Math.PI / 180));
  updateButterflies(t);
}
