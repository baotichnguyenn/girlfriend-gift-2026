// Light and sky. The museum is lit for night. When the garden doors open, dawn comes up over everything:
// the sky, the skylights, the fog, and the sun.
import { reduceMotion } from '../util.js';
import { renderer, scene } from '../engine.js';
import { M } from './materials.js';
import { doorsOpening, fanlight } from './doors.js';

const NIGHT = { sky: 0x8a7f99, ground: 0x2a2026, hemi: .3, fog: 0x0e0b12, near: 22, far: 88, glass: 0x1d2742, exposure: 1.08 };
const DAWN = { sky: 0xffe7d1, ground: 0x6d7a4c, hemi: 1.0, fog: 0xf0cdb6, near: 24, far: 125, glass: 0xfff0da, exposure: 1.02 };
const SUN_DIR = new THREE.Vector3(.38, .1, -1).normalize(); // low on the horizon, ahead as she walks out

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
      'void main(){',
      '  vec3 d = normalize(vDir); float h = d.y;',
      '  vec3 night = mix(vec3(.08,.07,.13), vec3(.02,.03,.07), smoothstep(0.0, .6, h));',
      '  vec3 dawn = mix(vec3(1.0,.80,.62), vec3(.98,.87,.80), smoothstep(-.02, .12, h));',
      '  dawn = mix(dawn, vec3(.60,.73,.88), smoothstep(.12, .75, h));',
      '  float sd = max(dot(d, uSun), 0.0);',
      '  dawn += vec3(1.0,.82,.55) * (pow(sd, 400.0) * 1.2 + pow(sd, 12.0) * .35 + pow(sd, 3.0) * .08);',
      '  gl_FragColor = vec4(mix(night, dawn, uDawn), 1.0);',
      '}'
    ].join('\n')
  }));
  dome.position.set(0, 0, -60); garden.add(dome);
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
  const target = doorsOpening() ? 1 : 0;
  const prev = dawn;
  dawn += (target - dawn) * (reduceMotion ? 1 : 1 - Math.exp(-dt * .75));
  if (Math.abs(dawn - target) < .001) dawn = target;
  if (dawn !== prev || dt === 0) setDawn(dawn);
}

export function settleSky() { dawn = doorsOpening() ? 1 : 0; setDawn(dawn); }
