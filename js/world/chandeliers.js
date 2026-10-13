// Crystal chandeliers in the Louis XV manner, one in the middle of each room: a gilt-bronze baluster stem,
// two tiers of scrolling arms with candles, swags of crystal beads, and prism drops, hung on a chain
// from a gilded ceiling rose. All six share a handful of draw calls.
// Two real lights follow her to the nearest chandeliers; halos, flames, and glints are sprites.
import { reduceMotion, smooth } from '../util.js';
import { state } from '../state.js';
import { renderer, scene } from '../engine.js';
import { CEIL, CHANDELIERS } from '../layout.js';
import { flame, glow, glint } from '../paint/surfaces.js';
import { M } from './materials.js';
import { merge } from './geo.js';
import { herXZ } from './her.js';

const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
const lights = [];
let flames, glints;

// Profiles as [radius, height] around the centre of the body, before scaling.
const STEM = [[.001, -1.28], [.04, -1.22], [.1, -1.1], [.11, -1.0], [.07, -.9], [.04, -.84], [.12, -.76], [.12, -.7], [.05, -.64], [.06, -.52], [.17, -.44], [.25, -.36], [.26, -.3], [.2, -.24], [.08, -.2], [.05, -.05], [.1, .06], [.1, .12], [.05, .18], [.07, .3], [.16, .4], [.17, .48], [.1, .56], [.05, .6], [.04, .86], [.09, .94], [.09, 1.0], [.04, 1.06], [.001, 1.12]];
const LOWER_ARM = [[.25, -.33], [.48, -.58], [.82, -.6], [1.05, -.43], [1.12, -.22], [1.12, -.08]]; // swoops down, then curls up to the candle
const UPPER_ARM = [[.17, .42], [.36, .28], [.58, .33], [.7, .53], [.72, .7]];
const CUP = [[.001, 0], [.05, .004], [.09, .028], [.095, .045], [.06, .04], [.03, .05], [.03, .09], [.001, .09]]; // drip pan and nozzle

const vec = (r, y, a) => new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));

export function buildChandeliers() {
  const gilt = [], wax = [], crystals = [], flamePts = [], glintPts = [];
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  // a crystal: a long prism drop, or a small bead when tall is false
  const crystal = (p, size, tall) => { crystals.push({ p, s: tall ? [size * .38, size, size * .38] : [size, size, size] }); glintPts.push(p); };

  CHANDELIERS.forEach(({ z, y: cy, s }) => {
    const at = (v) => v.multiplyScalar(s).add(new THREE.Vector3(0, cy, z));
    const place = (g) => g.scale(s, s, s).translate(0, cy, z);
    gilt.push(place(lathe(STEM, 16)));
    gilt.push(place(new THREE.TorusGeometry(.27, .022, 6, 32).rotateX(Math.PI / 2).translate(0, -.33, 0)));
    gilt.push(place(new THREE.TorusGeometry(.18, .018, 6, 24).rotateX(Math.PI / 2).translate(0, .44, 0)));

    // two tiers of arms, each ending in a drip pan, a candle, and a flame, with a prism drop below
    for (const [arm, n, phase] of [[LOWER_ARM, 8, 0], [UPPER_ARM, 6, Math.PI / 6]]) {
      const ends = [];
      for (let k = 0; k < n; k++) {
        const a = phase + k / n * Math.PI * 2;
        gilt.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arm.map(([r, y]) => at(vec(r, y, a)))), 24, .026 * s, 6));
        if (arm === LOWER_ARM) { // a C-scroll under the swoop of each lower arm
          const c = new THREE.TorusGeometry(.075, .014, 5, 14, Math.PI * 1.4); c.rotateZ(.4); c.rotateY(-a);
          gilt.push(place(c.translate(.6 * Math.cos(a), -.5, .6 * Math.sin(a))));
        }
        const [er, ey] = arm[arm.length - 1];
        gilt.push(place(lathe(CUP, 10).translate(er * Math.cos(a), ey, er * Math.sin(a))));
        wax.push(place(new THREE.CylinderGeometry(.024, .026, .22, 8).translate(er * Math.cos(a), ey + .2, er * Math.sin(a))));
        flamePts.push(at(vec(er, ey + .35, a)));
        crystal(at(vec(er, ey - .04, a)), .02 * s, false);
        crystal(at(vec(er, ey - .14, a)), .08 * s, true);
        ends.push(vec(er, ey - .02, a));
      }
      // swags of beads between neighbouring arms, each with a drop at its lowest point
      const beads = arm === LOWER_ARM ? 9 : 7, sag = arm === LOWER_ARM ? .26 : .16;
      for (let k = 0; k < n; k++) {
        const A = ends[k], B = ends[(k + 1) % n];
        for (let b = 1; b <= beads; b++) {
          const t = b / (beads + 1), p = A.clone().lerp(B, t); p.y -= sag * 4 * t * (1 - t);
          crystal(at(p), .022 * s, false);
        }
        const mid = A.clone().lerp(B, .5); mid.y -= sag + .1;
        crystal(at(mid), .07 * s, true);
      }
    }
    // a ring of drops round the crown and round the pinecone, and one long drop at the very bottom
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; crystal(at(vec(.11, .9, a)), .05 * s, true); crystal(at(vec(.14, -.92, a)), .07 * s, true); }
    crystal(at(new THREE.Vector3(0, -1.4, 0)), .1 * s, true);

    // the chain up to a gilded ceiling rose
    const top = cy + 1.12 * s;
    for (let y = top + .04, k = 0; y < CEIL - .1; y += .085, k++) gilt.push(new THREE.TorusGeometry(.045, .011, 6, 12).rotateY(k % 2 ? Math.PI / 2 : 0).translate(0, y, z));
    gilt.push(new THREE.CircleGeometry(.55 * s, 32).rotateX(Math.PI / 2).translate(0, CEIL - .06, z));
    for (const r of [.52, .36, .2]) gilt.push(new THREE.TorusGeometry(r * s, .03, 6, 32).rotateX(Math.PI / 2).translate(0, CEIL - .08, z));
    gilt.push(new THREE.SphereGeometry(.14 * s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI).translate(0, CEIL - .08, z));

    // a warm halo round the candles, and their glow on the ceiling
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .6 }));
    halo.position.set(0, cy - .1, z); halo.scale.set(4.4 * s, 4.4 * s, 1); scene.add(halo);
    const wash = new THREE.Mesh(new THREE.CircleGeometry(3 * s, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowMap(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .45 }));
    wash.position.set(0, CEIL - .1, z); scene.add(wash);
  });

  scene.add(new THREE.Mesh(merge(gilt), M.gold));
  scene.add(new THREE.Mesh(merge(wax), new THREE.MeshStandardMaterial({ color: lin(0xf4ecdb), emissive: lin(0x4a3a24), roughness: .55, envMapIntensity: .3 })));

  // cut crystal: faceted, nearly mirror-smooth, catching the warm room in its facets
  const glass = new THREE.MeshStandardMaterial({ color: lin(0xfdfaf4), emissive: lin(0x2e2618), metalness: .25, roughness: .04, envMapIntensity: 2.6, flatShading: true });
  const im = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), glass, crystals.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  crystals.forEach((c, k) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), k * 2.4); im.setMatrixAt(k, m4.compose(c.p, q, sc.set(...c.s))); });
  im.frustumCulled = false; // r128 culls instanced meshes by the base geometry's bounds
  scene.add(im);

  flames = points(flamePts, flame(), [
    'float f = .82 + .1 * sin(uTime * 13.0 + aPhase) + .08 * sin(uTime * 7.3 + aPhase * 2.0);',
    'gl_PointSize = .3 * f * uScale / -mv.z; vA = 1.0;'
  ]);
  glints = points(glintPts, glint(), [
    'float g = pow(max(sin(uTime * (.6 + fract(aPhase) * .9) + aPhase * 6.0), 0.0), 40.0);',
    'gl_PointSize = .3 * uScale / -mv.z; vA = g;'
  ]);

  for (let k = 0; k < 2; k++) { const l = new THREE.PointLight(0xffc98f, 0, 17, 2); scene.add(l); lights.push(l); }
}

let glowTex;
const glowMap = () => glowTex || (glowTex = glow());

// Additive sprites at the given points. size is a few lines of vertex shader that set gl_PointSize and vA.
function points(pts, map, size) {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(pts.map((p, k) => (k * 2.399) % 6.283), 1));
  const p = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 600 }, uMap: { value: map } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: ['uniform float uTime; uniform float uScale; attribute float aPhase; varying float vA;', 'void main(){', '  vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;', ...size, '}'].join('\n'),
    fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(t.rgb, t.a * vA); }'
  }));
  p.frustumCulled = false;
  scene.add(p);
  return p;
}

export function updateChandeliers() {
  const t = reduceMotion ? 1.3 : state.time, scale = renderer.domElement.height / (2 * Math.tan(25 * Math.PI / 180));
  for (const p of [flames, glints]) { p.material.uniforms.uTime.value = t; p.material.uniforms.uScale.value = scale; }
  // the two chandeliers nearest her lend her their light
  const near = CHANDELIERS.map((c) => ({ c, d: Math.hypot(herXZ.x, herXZ.z - c.z) })).sort((a, b) => a.d - b.d);
  lights.forEach((l, k) => {
    const { c, d } = near[k];
    l.position.set(0, c.y - .2, c.z);
    l.intensity = 1.6 * c.s * (1 - smooth(9, 19, d));
  });
}
