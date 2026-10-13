// The garden past the doors: lawn, a flagstone walk to a round terrace, tulips, roses, lavender,
// a meadow, hydrangeas, clipped hedges, cherry trees, a rose arbour over her portrait, and falling petals.
// It stays hidden until the doors start to open.
import { seeded, reduceMotion } from '../util.js';
import { state } from '../state.js';
import { renderer, scene } from '../engine.js';
import { S_DOOR } from '../path.js';
import { DOOR_Z, WALL_T, END_Z, TERRACE_Z } from '../layout.js';
import { petal } from '../paint/surfaces.js';
import { M } from './materials.js';
import { box, plane, merge, addMerged } from './geo.js';
import { flora, plant, floraTime } from './flora.js';
import { doorAmount } from './doors.js';

export const garden = new THREE.Group();
let petals;

const EDGE_Z = DOOR_Z - WALL_T / 2;   // the garden starts at the back face of the end wall
const TR = 5;                         // terrace radius
const TULIPS = [0xf4a7b9, 0xffffff, 0xf26b7a, 0xffc9a8, 0xd94861, 0xfde3e8, 0xf7b267];
const ROSES = [0xe8577a, 0xf7c5cc, 0xffffff, 0xfbe3d6, 0xc7344e];
const MEADOW = [0xffffff, 0xf7b7d0, 0xe0569c, 0xfde9a9, 0xf9d1e0, 0xc9a7e8];
const HYDRANGEA = [0x9db8e8, 0xb9a7e6, 0xf1c3dd, 0xf4f1ea, 0x8fa9e0];
const BLOSSOM = [0xf6bccb, 0xf2a6ba, 0xf9d3de, 0xfbe6ec, 0xeb92aa];

// Points on a grid with jitter, inside [x0, x1] × [z0, z1], skipping any `keep(x, z)` rejects.
function scatterGrid(x0, x1, z0, z1, step, rnd, keep, fn) {
  for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) {
    const px = x + (rnd() - .5) * step * .9, pz = z + (rnd() - .5) * step * .9;
    if (!keep || keep(px, pz)) fn(px, pz);
  }
}
const nearTerrace = (x, z, r) => Math.hypot(x, z - TERRACE_Z) < r;
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

export function buildGarden() {
  scene.add(garden);
  const rnd = seeded(77), f = flora(garden, true);
  const out = new Map([[M.grass, []], [M.flagstone, []], [M.hedge, []], [M.bark, []], [M.limestone, []], [M.bronze, []]]);
  const add = (mat, g) => out.get(mat).push(g);

  // lawn, walk, and terrace
  add(M.grass, plane(300, 160).rotateX(-Math.PI / 2).translate(0, 0, EDGE_Z - 80));
  const walkLen = EDGE_Z - (TERRACE_Z + TR - .3);
  add(M.flagstone, plane(2.6, walkLen).rotateX(-Math.PI / 2).translate(0, .012, EDGE_Z - walkLen / 2));
  const disc = new THREE.CircleGeometry(TR, 48); const uv = disc.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * TR * 2, uv.getY(i) * TR * 2);
  add(M.flagstone, disc.rotateX(-Math.PI / 2).translate(0, .014, TERRACE_Z));
  add(M.limestone, box(4.6, .05, 1.4, 0, .025, EDGE_Z - .7)); // a threshold slab outside the doors

  // clipped box hedges along the walk and around the terrace
  for (const sx of [-1, 1]) add(M.hedge, box(.55, .55, walkLen - 1.6, sx * 1.75, .275, EDGE_Z - 1.4 - (walkLen - 1.6) / 2));
  for (let k = 0; k < 32; k++) {
    const a = k / 32 * Math.PI * 2 + Math.PI / 64;
    if (Math.sin(a) > .9) continue; // leave an opening toward the walk
    add(M.hedge, box(1.1, .55, .55, Math.cos(a) * (TR + .6), .275, TERRACE_Z + Math.sin(a) * (TR + .6), -a + Math.PI / 2));
  }
  // tall yew walls enclosing the garden, with topiary cones at the walk
  for (const sx of [-1, 1]) add(M.hedge, box(1.6, 3.4, 58, sx * 27, 1.7, EDGE_Z - 29));
  add(M.hedge, box(55.6, 3.4, 1.6, 0, 1.7, EDGE_Z - 58));
  for (const sx of [-1, 1]) for (const z of [EDGE_Z - 1, END_Z + 1.2]) {
    const cone = new THREE.ConeGeometry(.6, 1.9, 10).translate(sx * 2.2, .95 + .3, z); add(M.hedge, cone);
    add(M.limestone, box(.9, .3, .9, sx * 2.2, .15, z));
  }

  // tulips in drifts beside the walk
  for (const sx of [-1, 1]) {
    scatterGrid(2.6, 11, EDGE_Z - 9.8, EDGE_Z - 1, .33, rnd, (x, z) => !nearTerrace(sx * x, z, TR + 1.6), (x, z) => {
      const drift = TULIPS[(Math.floor(-z / 2.2) * 3 + (sx > 0 ? 1 : 0)) % TULIPS.length]; // one colour per band
      plant(f, 'tulip', sx * x, z, .42 + rnd() * .22, rnd() < .85 ? drift : pick(TULIPS, rnd), rnd);
      if (rnd() < .35) f.add('leaf', { x: sx * x + (rnd() - .5) * .1, z: z + (rnd() - .5) * .1, s: 1.2, rx: (rnd() - .5) * .8, ry: rnd() * 6.3 });
    });
  }
  // rose bushes ringing the terrace
  for (let k = 0; k < 26; k++) {
    const a = k / 26 * Math.PI * 2; if (Math.sin(a) > .82) continue;
    const r = TR + 2.2 + rnd() * .8, x = Math.cos(a) * r, z = TERRACE_Z + Math.sin(a) * r, s = 1.2 + rnd() * .5;
    f.add('bush', { x, y: .32 * s, z, s, ry: rnd() * 6, color: 0x3f6b35 });
    const col = pick(ROSES, rnd);
    for (let j = 0; j < 12; j++) {
      const th = rnd() * Math.PI * 2, ph = rnd() * 1.2;
      f.add('rose', { x: x + Math.sin(ph) * Math.cos(th) * .36 * s, y: .32 * s + Math.cos(ph) * .3 * s, z: z + Math.sin(ph) * Math.sin(th) * .36 * s, s: 1 + rnd() * .4, rx: rnd(), ry: rnd() * 6, color: rnd() < .8 ? col : pick(ROSES, rnd) });
    }
  }
  // lavender rows along both sides
  for (const sx of [-1, 1]) for (let row = 0; row < 5; row++) {
    const x = sx * (13 + row * 1.25);
    for (let z = EDGE_Z - 1.5; z > EDGE_Z - 50; z -= .4) for (let j = 0; j < 2; j++) {
      const px = x + (rnd() - .5) * .7, pz = z + (rnd() - .5) * .3, h = .45 + rnd() * .25;
      f.add('stem', { x: px, z: pz, sy: h, rx: (rnd() - .5) * .2, ry: rnd() * 6 });
      f.add('lavender', { x: px, y: h - .02, z: pz, s: 1 + rnd() * .3, color: rnd() < .5 ? 0x8f7ad6 : 0xa58be0 });
    }
  }
  // meadow of cosmos and daisies behind the terrace
  scatterGrid(-11, 11, EDGE_Z - 44, TERRACE_Z - TR - 1.8, .46, rnd, (x, z) => !nearTerrace(x, z, TR + 3.6), (x, z) => {
    plant(f, 'daisy', x, z, .5 + rnd() * .35, pick(MEADOW, rnd), rnd, 1 + rnd() * .5);
  });
  // hydrangeas against the yew
  for (const sx of [-1, 1]) for (let z = EDGE_Z - 2.5; z > EDGE_Z - 55; z -= 2.3) {
    const x = sx * (24.4 + rnd() * .6), s = 1.3 + rnd() * .5, col = pick(HYDRANGEA, rnd);
    f.add('bush', { x, y: .35 * s, z, s, color: 0x355f31 });
    for (let j = 0; j < 7; j++) f.add('hydrangea', { x: x + (rnd() - .5) * .8 * s, y: (.4 + rnd() * .35) * s, z: z + (rnd() - .5) * .8 * s, s: .9 + rnd() * .3, color: col });
  }

  // cherry trees in blossom
  const trees = [[-8.5, EDGE_Z - 7.5], [8.5, EDGE_Z - 7.5], [-8.5, TERRACE_Z - 7], [8.5, TERRACE_Z - 7], [-17, TERRACE_Z - 2], [17, TERRACE_Z - 2], [0, TERRACE_Z - 15]];
  const bark = [];
  trees.forEach(([tx, tz]) => {
    const h = 2.6 + rnd() * .6;
    bark.push(new THREE.CylinderGeometry(.12, .2, h, 7).translate(tx, h / 2, tz));
    for (let b = 0; b < 4; b++) {
      const a = b / 4 * Math.PI * 2 + rnd(), len = 1.6 + rnd() * .8, th = .75 + rnd() * .3, g = new THREE.CylinderGeometry(.05, .1, len, 5);
      g.translate(0, len / 2, 0); g.rotateZ(th); g.rotateY(a); g.translate(tx, h - .3, tz); bark.push(g);
      // the branch tip: (0, len, 0) turned by th about z, then by a about y
      const ex = tx - len * Math.sin(th) * Math.cos(a), ez = tz + len * Math.sin(th) * Math.sin(a), ey = h - .3 + len * Math.cos(th);
      for (let j = 0; j < 30; j++) { const r = Math.cbrt(rnd()), th = rnd() * 6.3, ph = Math.acos(2 * rnd() - 1); f.add('blossom', { x: ex + Math.sin(ph) * Math.cos(th) * r * 1.15, y: ey + .25 + Math.cos(ph) * r * .7, z: ez + Math.sin(ph) * Math.sin(th) * r * 1.15, s: .22 + rnd() * .32, color: pick(BLOSSOM, rnd) }); }
    }
    for (let j = 0; j < 34; j++) { const r = Math.cbrt(rnd()), th = rnd() * 6.3, ph = Math.acos(2 * rnd() - 1); f.add('blossom', { x: tx + Math.sin(ph) * Math.cos(th) * r * 1.5, y: h + .9 + Math.cos(ph) * r * .9, z: tz + Math.sin(ph) * Math.sin(th) * r * 1.5, s: .26 + rnd() * .34, color: pick(BLOSSOM, rnd) }); }
  });
  add(M.bark, merge(bark));
  // a ring of distant trees beyond the yew, softened by the morning haze
  for (let k = 0; k < 46; k++) {
    const a = Math.PI * (.05 + .9 * k / 45), r = 70 + rnd() * 35;
    f.add('blossom', { x: Math.cos(a) * r * 1.1, y: 2 + rnd() * 3, z: EDGE_Z - 20 - Math.sin(a) * r, s: 8 + rnd() * 9, sy: 6 + rnd() * 6, color: rnd() < .2 ? 0xd9b9c0 : 0x5d7350 });
  }

  // a rose arbour over the portrait
  const az = TERRACE_Z - .55, arch = [];
  for (const sx of [-1, 1]) arch.push(new THREE.CylinderGeometry(.05, .05, 3.2, 8).translate(sx * 2.25, 1.6, az));
  arch.push(new THREE.TorusGeometry(2.25, .05, 8, 32, Math.PI).translate(0, 3.2, az));
  add(M.bronze, merge(arch));
  for (let k = 0; k < 150; k++) {
    const t = rnd(), onArch = t < .55, a = rnd() * Math.PI;
    const x = onArch ? Math.cos(a) * 2.25 : (rnd() < .5 ? -2.25 : 2.25), y = onArch ? 3.2 + Math.sin(a) * 2.25 : .3 + rnd() * 2.9;
    const j = () => (rnd() - .5) * .3;
    f.add('leaf', { x: x + j(), y: y + j(), z: az + j(), s: .75, rx: rnd() * 6, ry: rnd() * 6, rz: rnd() * 6 });
    if (rnd() < .75) f.add('rose', { x: x + j(), y: y + j(), z: az + j() + .05, s: 1 + rnd() * .5, rx: rnd(), ry: rnd() * 6, color: pick([0xf7c5cc, 0xffffff, 0xfbe3d6, 0xe8577a], rnd) });
  }

  f.build();
  addMerged(garden, out);

  // falling petals
  const N = 520, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4), col = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    pos.set([(rnd() - .5) * 26, rnd() * 7, EDGE_Z - 2 - rnd() * 34], k * 3);
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
  garden.visible = false;
}

export function updateGarden() {
  garden.visible = doorAmount() > 0 || state.s > S_DOOR - 1;
  if (!garden.visible) return;
  if (!reduceMotion) { floraTime.value = state.time; petals.material.uniforms.uTime.value = state.time; }
  petals.material.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(25 * Math.PI / 180));
}
