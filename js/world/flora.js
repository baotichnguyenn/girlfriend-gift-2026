// Flowers for the Great Hall urns and the garden. Each kind of flower is one InstancedMesh,
// coloured per instance, so thousands of them cost a handful of draw calls.
import { seeded } from '../util.js';
import { M } from './materials.js';
import { box } from './geo.js';

export const floraTime = { value: 0 }; // advanced by garden.js; wind sways anything built with sway on

const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const UP = new THREE.Vector3(0, 1, 0);

// Wind bends each vertex in proportion to its height above the ground.
function floraMaterial(opts, sway) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: .6, envMapIntensity: .3 }, opts));
  if (sway) m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = floraTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <project_vertex>', [
      'vec4 mvPosition = vec4( transformed, 1.0 );',
      '#ifdef USE_INSTANCING',
      '  mvPosition = instanceMatrix * mvPosition;',
      '#endif',
      'float swH = max(mvPosition.y, 0.0);',
      'mvPosition.x += sin(uTime * 1.3 + mvPosition.x * .55 + mvPosition.z * .35) * .09 * swH;',
      'mvPosition.z += cos(uTime * 1.05 + mvPosition.x * .45 - mvPosition.z * .3) * .05 * swH;',
      'mvPosition = modelViewMatrix * mvPosition;',
      'gl_Position = projectionMatrix * mvPosition;'
    ].join('\n'));
  };
  return m;
}

/* ---------- geometry: each stands on y = 0 and points up ---------- */
function tulipGeo() {
  const pts = [[.004, 0], [.05, .015], [.075, .06], [.082, .12], [.068, .17], [.074, .19]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 8);
}
function daisyGeo(petals) { // flat petals in white around a yellow centre; vertex colours carry the centre
  const pos = [], col = [];
  for (let k = 0; k < petals; k++) {
    const a = k / petals * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), px = -s, pz = c, r0 = .02, r1 = .12, hw = .022, lift = .03;
    const p0 = [c * r0 + px * hw * .5, .01, s * r0 + pz * hw * .5], p1 = [c * r0 - px * hw * .5, .01, s * r0 - pz * hw * .5];
    const p2 = [c * r1 - px * hw, .01 + lift, s * r1 - pz * hw], p3 = [c * r1 + px * hw, .01 + lift, s * r1 + pz * hw];
    pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3); for (let v = 0; v < 6; v++) col.push(1, 1, 1);
  }
  for (let k = 0; k < 6; k++) {
    const a0 = k / 6 * Math.PI * 2, a1 = (k + 1) / 6 * Math.PI * 2;
    pos.push(0, .03, 0, Math.cos(a1) * .028, .018, Math.sin(a1) * .028, Math.cos(a0) * .028, .018, Math.sin(a0) * .028);
    for (let v = 0; v < 3; v++) col.push(1, .78, .25);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
function leafGeo() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, .05, .09, .01, 0, .22, 0, 0, 0, 0, 0, .22, 0, -.05, .09, .01], 3));
  g.computeVertexNormals();
  return g;
}

export const GEO = {
  stem: new THREE.CylinderGeometry(.011, .015, 1, 4, 1, true).translate(0, .5, 0),
  tulip: tulipGeo(),
  rose: new THREE.IcosahedronGeometry(.075, 1).scale(1, .78, 1),
  peony: new THREE.IcosahedronGeometry(.11, 1).scale(1, .72, 1),
  daisy: daisyGeo(7),
  lavender: new THREE.ConeGeometry(.024, .24, 5).translate(0, .12, 0),
  hydrangea: new THREE.IcosahedronGeometry(.17, 1),
  leaf: leafGeo(),
  bush: new THREE.IcosahedronGeometry(.36, 1),
  blossom: new THREE.SphereGeometry(.5, 9, 6)
};

// One collector per place (the urns, the garden). add() records instances; build() makes the meshes.
export function flora(parent, sway) {
  const mats = {
    petal: floraMaterial({ side: THREE.DoubleSide }, sway),
    facet: floraMaterial({ flatShading: true }, sway),
    daisy: floraMaterial({ side: THREE.DoubleSide, vertexColors: true }, sway),
    green: floraMaterial({ color: lin(0x4f7a3a), side: THREE.DoubleSide, roughness: .8 }, sway),
    bush: floraMaterial({ flatShading: true, roughness: .9 }, false),
    soft: floraMaterial({ roughness: .85 }, false)
  };
  const kinds = {
    stem: ['stem', 'green'], tulip: ['tulip', 'petal'], rose: ['rose', 'facet'], peony: ['peony', 'facet'], daisy: ['daisy', 'daisy'],
    lavender: ['lavender', 'facet'], hydrangea: ['hydrangea', 'facet'], leaf: ['leaf', 'green'], bush: ['bush', 'bush'], blossom: ['blossom', 'soft']
  };
  const items = {}; Object.keys(kinds).forEach((k) => { items[k] = []; });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  return {
    // it: { x, y, z, s or sx/sy/sz, rx/ry/rz or q (a Quaternion), color (hex) }
    add(kind, it) { items[kind].push(it); },
    build() {
      for (const [kind, list] of Object.entries(items)) {
        if (!list.length) continue;
        const [geo, mat] = kinds[kind];
        const im = new THREE.InstancedMesh(GEO[geo], mats[mat], list.length);
        list.forEach((it, k) => {
          if (it.q) q.copy(it.q); else q.setFromEuler(e.set(it.rx || 0, it.ry || 0, it.rz || 0, 'YXZ'));
          p.set(it.x, it.y || 0, it.z); s.set(it.sx || it.s || 1, it.sy || it.s || 1, it.sz || it.s || 1);
          im.setMatrixAt(k, m4.compose(p, q, s));
          im.setColorAt(k, c.set(it.color === undefined ? 0xffffff : it.color).convertSRGBToLinear());
        });
        im.frustumCulled = false; // r128 culls instanced meshes by the base geometry's bounds, not the instances'
        parent.add(im);
      }
    }
  };
}

// A flower standing on a stem: the stem from the ground and the head at its top, leaning a little.
export function plant(f, kind, x, z, h, color, rnd, headScale) {
  const lean = (rnd() - .5) * .25, ry = rnd() * Math.PI * 2;
  f.add('stem', { x, z, sy: h, rx: lean, ry });
  const hx = x + Math.sin(ry) * Math.sin(lean) * h, hz = z + Math.cos(ry) * Math.sin(lean) * h;
  f.add(kind, { x: hx, y: h * Math.cos(lean), z: hz, s: headScale || 1, rx: (rnd() - .5) * .4, ry: rnd() * Math.PI * 2, color });
}

const URN_PALETTE = [0xfff4ee, 0xf7cfd6, 0xf2a7b5, 0xf6c39b, 0xe57e8f, 0xfbe6dc, 0xd65c78, 0xf9d9c3];

// An urn of flowers on a limestone pedestal, like the arrangements in a great museum's entrance hall.
// Adds stone to `out` (a material → geometries map) and flowers to the collector f.
export function urn(f, out, x, z, seed) {
  const rnd = seeded(seed);
  out.get(M.limestone).push(box(1.1, 1.3, 1.1, x, .65, z), box(1.3, .12, 1.3, x, 1.36, z), box(1.3, .12, 1.3, x, .06, z));
  const prof = [[.001, 0], [.3, 0], [.32, .05], [.17, .13], [.15, .26], [.3, .4], [.44, .6], [.47, .76], [.42, .86], [.52, .92], [.52, .97], [.001, .97]];
  out.get(M.bronze).push(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 20).translate(x, 1.42, z));
  const cy = 2.5, n = new THREE.Vector3();
  const onDome = (rx, ry, bias) => {
    const th = rnd() * Math.PI * 2, ph = Math.acos(Math.pow(rnd(), bias));
    n.set(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
    return { x: x + n.x * rx, y: cy + n.y * ry, z: z + n.z * rx, q: new THREE.Quaternion().setFromUnitVectors(UP, n.clone().normalize()) };
  };
  for (let k = 0; k < 44; k++) f.add('leaf', Object.assign(onDome(.98, .62, .2), { s: .9 + rnd() * .5, color: 0xffffff }));
  for (let k = 0; k < 62; k++) f.add('peony', Object.assign(onDome(.95, .82, .6), { s: 1 + rnd() * .5, color: URN_PALETTE[Math.floor(rnd() * URN_PALETTE.length)] }));
  for (let k = 0; k < 80; k++) f.add('rose', Object.assign(onDome(.98, .86, .5), { s: .9 + rnd() * .5, color: URN_PALETTE[Math.floor(rnd() * URN_PALETTE.length)] }));
  for (let k = 0; k < 14; k++) f.add('hydrangea', Object.assign(onDome(.9, .7, .8), { s: .9 + rnd() * .3, color: rnd() < .5 ? 0xf3efe6 : 0xdfe6d2 }));
  // a few tall flowering branches
  for (let k = 0; k < 7; k++) {
    const th = rnd() * Math.PI * 2, tilt = .25 + rnd() * .35, h = 1.3 + rnd() * .7;
    const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(th), Math.cos(tilt), Math.sin(tilt) * Math.sin(th));
    f.add('stem', { x, y: cy - .3, z, sx: 1.4, sy: h, sz: 1.4, q: new THREE.Quaternion().setFromUnitVectors(UP, dir) });
    for (let b = 0; b < 6; b++) {
      const t = .45 + b / 6 * .55;
      f.add('blossom', { x: x + dir.x * h * t + (rnd() - .5) * .1, y: cy - .3 + dir.y * h * t, z: z + dir.z * h * t + (rnd() - .5) * .1, s: .1 + rnd() * .08, color: rnd() < .5 ? 0xfbe3ea : 0xffffff });
    }
  }
}
