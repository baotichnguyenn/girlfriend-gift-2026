// Light and sky. The museum is lit for night. When the garden doors open, dawn comes up over everything:
// the sky, the skylights, the fog, and the sun.
// The garden stands on a cliff, so the sky dome also paints the view beyond it: layers of mountain ridges
// fading into valley mist, nearer ones darker. They are drawn in the dome's shader, so they cost no geometry.
import { reduceMotion } from '../util.js';
import { renderer, scene, camera } from '../engine.js';
import { M } from './materials.js';
import { doorsOpening, fanlight } from './doors.js';

const NIGHT = { sky: 0x8a7f99, ground: 0x2a2026, hemi: .3, fog: 0x0e0b12, near: 22, far: 88, glass: 0x1d2742, exposure: 1.08 };
const DAWN = { sky: 0xffe7d1, ground: 0x6d7a4c, hemi: 1.0, fog: 0xf0cdb6, near: 24, far: 125, glass: 0xfff0da, exposure: 1.02 };
const SUN_DIR = new THREE.Vector3(.38, .13, -1).normalize(); // low over the mountains, ahead as she walks out

let hemi, sun, dome, dawn = 0;
const c1 = new THREE.Color(), c2 = new THREE.Color();
const mix = (a, b, k) => c1.setHex(a).lerp(c2.setHex(b), k);

export function buildSky(garden) {
  hemi = new THREE.HemisphereLight(NIGHT.sky, NIGHT.ground, NIGHT.hemi); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe8cc, 0.2); key.position.set(5, 12, 8); scene.add(key);
  sun = new THREE.DirectionalLight(0xffd6ae, 0); sun.position.set(30, 40, 10); sun.target.position.set(0, 0, -70); scene.add(sun, sun.target);
  dome = new THREE.Mesh(new THREE.SphereGeometry(185, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uDawn: { value: 0 }, uSun: { value: SUN_DIR } },
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform float uDawn; uniform vec3 uSun; varying vec3 vDir;',
      'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float n2(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y); }',
      'float fbm(vec2 p){ float v = 0.0, a = .5; for (int k = 0; k < 5; k++) { v += a * n2(p); p = p * 2.03 + 17.1; a *= .5; } return v; }',
      // one ridge of mountains: sampled round a circle, so it joins up behind her with no seam
      'vec3 ridge(vec3 col, float h, float az, float freq, float seed, float base, float amp, vec3 c, vec3 mist, float sun){',
      '  float f = fbm(vec2(cos(az), sin(az)) * freq + seed); float top = base + amp * f * f * 1.7;',
      '  float t = clamp((top - h) / (amp * 1.3 + .015), 0.0, 1.0);',
      '  vec3 lc = mix(mix(c, mist, t * .8), mist, sun * .4);',
      '  return mix(col, lc, step(h, top)); }',
      'void main(){',
      '  vec3 d = normalize(vDir); float h = d.y, az = atan(d.x, -d.z);',
      '  vec3 night = mix(vec3(.08,.07,.13), vec3(.02,.03,.07), smoothstep(0.0, .6, h));',
      '  vec3 dawn = mix(vec3(1.0,.80,.62), vec3(.98,.87,.80), smoothstep(-.02, .12, h));',
      '  dawn = mix(dawn, vec3(.60,.73,.88), smoothstep(.12, .75, h));',
      '  float sd = max(dot(d, uSun), 0.0), sun = pow(sd, 5.0);',
      '  dawn += vec3(1.0,.82,.55) * (pow(sd, 400.0) * 1.2 + pow(sd, 12.0) * .35 + pow(sd, 3.0) * .08);',
      '  vec3 col = mix(night, dawn, uDawn);',
      '  vec3 mist = mix(vec3(.07,.06,.11), mix(vec3(.94,.82,.77), vec3(1.0,.87,.70), sun), uDawn);',
      '  float k = .1 + .9 * uDawn;',
      // far to near: each nearer, lower, more jagged, and darker
      '  col = ridge(col, h, az, .9, 3.1, .01, .12, vec3(.78,.73,.82) * k, mist, sun);',
      '  col = ridge(col, h, az, 1.4, 7.7, -.004, .1, vec3(.62,.6,.72) * k, mist, sun);',
      '  col = ridge(col, h, az, 2.0, 1.9, -.026, .08, vec3(.45,.49,.56) * k, mist, sun);',
      '  col = ridge(col, h, az, 2.9, 5.3, -.056, .065, vec3(.3,.38,.37) * k, mist, sun);',
      '  col = ridge(col, h, az, 4.2, 9.6, -.1, .058, vec3(.2,.29,.23) * k, mist, sun);',
      '  col = mix(col, mist, 1.0 - smoothstep(-.3, -.12, h));', // the valley floor, lost in mist
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  }));
  garden.add(dome);
}

function setDawn(k) {
  hemi.color.copy(mix(NIGHT.sky, DAWN.sky, k)); hemi.groundColor.copy(mix(NIGHT.ground, DAWN.ground, k)); hemi.intensity = NIGHT.hemi + (DAWN.hemi - NIGHT.hemi) * k;
  sun.intensity = 1.5 * k;
  scene.fog.color.copy(mix(NIGHT.fog, DAWN.fog, k)); scene.background.copy(scene.fog.color);
  scene.fog.near = NIGHT.near + (DAWN.near - NIGHT.near) * k; scene.fog.far = NIGHT.far + (DAWN.far - NIGHT.far) * k;
  M.laylight.color.copy(mix(NIGHT.glass, DAWN.glass, k)); fanlight.color.copy(M.laylight.color);
  renderer.toneMappingExposure = NIGHT.exposure + (DAWN.exposure - NIGHT.exposure) * k;
  dome.material.uniforms.uDawn.value = k;
}

// The current dawn, 0 (night) to 1.
export const dawnAmount = () => dawn;

export function updateSky(dt) {
  dome.position.copy(camera.position); // centred on the eye, so the mountains always sit at the horizon
  const target = doorsOpening() ? 1 : 0;
  const prev = dawn;
  dawn += (target - dawn) * (reduceMotion ? 1 : 1 - Math.exp(-dt * .75));
  if (Math.abs(dawn - target) < .001) dawn = target;
  if (dawn !== prev || dt === 0) setDawn(dawn);
}

export function settleSky() { dawn = doorsOpening() ? 1 : 0; setDawn(dawn); }
