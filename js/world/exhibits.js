// The five letter exhibits, her portrait on an easel in the garden, spotlights,
// and the brass marker over whatever she should go to next.
import { reduceMotion } from '../util.js';
import { state } from '../state.js';
import { scene, V3, UP, clickables } from '../engine.js';
import { L, S, at, tan, nrm } from '../path.js';
import { ARCH_SPRING, ARCH_W, DOOR_Z } from '../layout.js';
import { canvasTex, makeTex } from '../paint/canvas.js';
import { drawEnvelope, drawPlacard } from '../paint/stationery.js';
import { portraitTex } from '../paint/photo.js';
import { M } from './materials.js';
import { box, merge } from './geo.js';
import { frameGeo } from './frames.js';
import { garden } from './garden.js';
import { doorAmount } from './doors.js';

export const EX = [];   // one per letter
export let fin = null;  // the portrait in the garden
// One per station, for the camera rigs and for which way she faces when she stops.
// camera.js fills in cam and look.
export const VIEW = [];
let marker;
const DOOR_MARK = new V3(0, ARCH_SPRING + ARCH_W - 1.6, DOOR_Z + .6);

function beamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 }, uCol: { value: new THREE.Color(0xffd9a0) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float uOp; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float rim=abs(dot(normalize(vN),normalize(vV))); float a=uOp*(0.25+0.75*vUv.y)*pow(rim,2.0); gl_FragColor=vec4(uCol,a); }'
  });
}

function addFrame(g, w, h, y, z) {
  const { gold, deep } = frameGeo(w, h);
  for (const [geo, mat] of [[gold, M.gold], [deep, M.goldDeep]]) { const m = new THREE.Mesh(geo, mat); m.position.set(0, y, z); g.add(m); }
}

function addSpot(parent, frameWorld, towardPath, height, withBeam) {
  const lp = frameWorld.clone().addScaledVector(towardPath, 2.3); lp.y = height;
  const spot = new THREE.SpotLight(0xffdcb0, 0, 13, .48, .7, 1.3);
  spot.position.copy(lp); spot.target.position.copy(frameWorld);
  parent.add(spot, spot.target);
  if (!withBeam) return { spot, beam: null };
  const dirv = lp.clone().sub(frameWorld); const len = dirv.length();
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.15, len, 32, 1, true), beamMaterial());
  beam.position.copy(frameWorld).addScaledVector(dirv, .5); beam.quaternion.setFromUnitVectors(UP, dirv.normalize());
  parent.add(beam);
  return { spot, beam };
}

function placard(g, x, y, z) {
  const plCanvas = document.createElement('canvas'); plCanvas.width = 640; plCanvas.height = 256;
  const plTex = makeTex(plCanvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, .42), new THREE.MeshBasicMaterial({ map: plTex, toneMapped: false, color: 0xd2cbc2 }));
  mesh.position.set(x, y, z); g.add(mesh);
  return { plCtx: plCanvas.getContext('2d'), plTex, mesh };
}

function buildExhibit(i) {
  const sv = S[i], P = at(sv), t = tan(sv), n = nrm(t);
  const side = Math.sign(n.x * P.x) || 1; // the side away from the middle of the room
  const E = P.clone().addScaledVector(n, side * 3.1), D = n.clone().multiplyScalar(side);
  const g = new THREE.Group(); g.position.copy(E); g.lookAt(P.x, 0, P.z); scene.add(g);
  // a pier dressed in the gallery's fabric, with a limestone cap
  g.add(new THREE.Mesh(merge([box(3.3, .3, .9, 0, .15, 0), box(3.1, .1, .62, 0, .35, 0)]), M.marble));
  g.add(new THREE.Mesh(box(3.1, 3.6, .5, 0, .4 + 1.8, 0), M.fabric[i]));
  g.add(new THREE.Mesh(merge([box(3.35, .18, .66, 0, 4.09, 0), box(3.25, .1, .6, 0, 3.96, 0), box(3.2, .12, .56, 0, .46, 0)]), M.limestone));
  const FY = 2.55, FZ = .255;
  const matte = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 1.36), M.mat); matte.position.set(0, FY, FZ + .04); g.add(matte);
  const sealedTex = canvasTex(768, 512, (x, w, h) => drawEnvelope(x, w, h, i, false));
  const openTex = canvasTex(768, 512, (x, w, h) => drawEnvelope(x, w, h, i, true));
  const envMat = new THREE.MeshStandardMaterial({ map: sealedTex, emissiveMap: sealedTex, emissive: 0xffffff, emissiveIntensity: .25, roughness: .8, transparent: true });
  const env = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), envMat); env.position.set(0, FY, FZ + .045); g.add(env);
  addFrame(g, 1.86, 1.36, FY, FZ);
  const { plCtx, plTex } = placard(g, 0, .95, .255);
  g.updateMatrixWorld(true);
  const frameWorld = g.localToWorld(new V3(0, FY, FZ));
  const { spot, beam } = addSpot(scene, frameWorld, D.clone().negate(), 6.6, true);
  env.userData = { kind: 'exhibit', i }; matte.userData = { kind: 'exhibit', i };
  clickables.push(env, matte);
  EX.push({ i, g, env, envMat, sealedTex, openTex, plCtx, plTex, spot, beam, side, pos: E.clone(), frameWorld, status: '', spotT: 0, beamT: 0, emBase: .25 });
  VIEW.push({ s: sv, i, kind: 'exhibit', side, P, t, n, D, cam: new V3(), look: new V3() });
}

function buildFinale() {
  const P = at(L), t = tan(L), n = nrm(t);
  const E = P.clone().addScaledVector(t, 3.9);
  const g = new THREE.Group(); g.position.copy(E); g.lookAt(P.x, 0, P.z); garden.add(g);
  // a gilded frame on a wooden easel
  const FY = 2.35, FZ = .12, lean = .1;
  const legs = [];
  for (const sx of [-1, 1]) { const leg = new THREE.CylinderGeometry(.04, .05, 3.6, 6); leg.rotateZ(sx * .09); leg.rotateX(-lean); leg.translate(sx * .62, 1.78, -.05); legs.push(leg); }
  const back = new THREE.CylinderGeometry(.04, .05, 3.3, 6); back.rotateX(.42); back.translate(0, 1.55, -.72); legs.push(back);
  legs.push(box(1.7, .07, .2, 0, 1.0, .1));
  g.add(new THREE.Mesh(merge(legs), M.wood));
  const art = new THREE.Group(); art.position.set(0, FY, FZ); art.rotation.x = -lean; g.add(art);
  const portraitMat = new THREE.MeshStandardMaterial({ map: portraitTex, emissiveMap: portraitTex, emissive: 0xffffff, emissiveIntensity: .3, roughness: .7 });
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.125), portraitMat); portrait.position.z = .07; art.add(portrait);
  addFrame(art, 1.7, 2.125, 0, 0);
  const stand = new THREE.Group(); stand.position.set(1.55, 0, .3); stand.rotation.y = -.25; g.add(stand);
  stand.add(new THREE.Mesh(merge([new THREE.CylinderGeometry(.03, .03, 1.1, 6).translate(0, .55, 0), box(.36, .03, .36, 0, .015, 0)]), M.bronze));
  const { plCtx, plTex, mesh } = placard(stand, 0, 1.25, .02);
  mesh.rotation.x = -.5;
  g.updateMatrixWorld(true);
  const frameWorld = g.localToWorld(new V3(0, FY, FZ));
  // in the scene, not the hidden garden, so the number of lights never changes and no shader recompiles
  const { spot } = addSpot(scene, frameWorld, t.clone().negate(), 7.2, false);
  portrait.userData = { kind: 'finale' }; clickables.push(portrait);
  fin = { g, portraitMat, plCtx, plTex, spot, beam: null, pos: E.clone(), frameWorld, status: '', spotT: 0, beamT: 0 };
  VIEW.push({ s: L, i: 5, kind: 'finale', P, t, n, D: t.clone(), cam: new V3(), look: new V3() });
}

export function buildExhibits() {
  for (let i = 0; i < 5; i++) buildExhibit(i);
  buildFinale();
}

export function buildMarker() {
  marker = new THREE.Mesh(new THREE.OctahedronGeometry(.14), new THREE.MeshStandardMaterial({ color: 0xe7c88f, emissive: 0x7a5420, emissiveIntensity: 1, metalness: .6, roughness: .3 }));
  scene.add(marker);
}

// Sets envelope, placard, and light targets for n letters read. Called from refresh().
export function setExhibitStates(n) {
  for (let i = 0; i < 5; i++) {
    const ex = EX[i]; const st = i < n ? 'read' : i === n ? 'current' : 'locked';
    if (ex.status === st) continue;
    ex.status = st;
    ex.envMat.map = ex.envMat.emissiveMap = st === 'read' ? ex.openTex : ex.sealedTex;
    ex.envMat.color.setHex(st === 'locked' ? 0x6a6268 : 0xffffff); ex.envMat.needsUpdate = true;
    drawPlacard(ex.plCtx, i, st); ex.plTex.needsUpdate = true;
    ex.spotT = st === 'locked' ? .45 : st === 'current' ? 2.9 : 1.7;
    ex.beamT = st === 'locked' ? .02 : st === 'current' ? .13 : .07;
    ex.emBase = st === 'locked' ? .03 : st === 'current' ? .32 : .22;
  }
  const fst = n >= 5 ? 'current' : 'locked';
  if (fin.status !== fst) {
    fin.status = fst; drawPlacard(fin.plCtx, 5, fst); fin.plTex.needsUpdate = true;
    fin.spotT = fst === 'current' ? 2.2 : .35;
    fin.portraitMat.color.setHex(fst === 'current' ? 0xffffff : 0x4a4448); fin.portraitMat.emissiveIntensity = fst === 'current' ? .3 : .04;
  }
}

// Jumps every light to its target, so the first frame doesn't fade in.
export function settleLights() {
  EX.forEach((ex) => { ex.spot.intensity = ex.spotT; ex.beam.material.uniforms.uOp.value = ex.beamT; });
  fin.spot.intensity = fin.spotT;
}

export function updateExhibits(dt) {
  const kk = 1 - Math.exp(-dt * 2.5);
  EX.forEach((ex) => {
    ex.spot.intensity += (ex.spotT - ex.spot.intensity) * kk;
    ex.beam.material.uniforms.uOp.value += (ex.beamT - ex.beam.material.uniforms.uOp.value) * kk;
    ex.envMat.emissiveIntensity = ex.emBase + (ex.status === 'current' && !reduceMotion ? Math.sin(state.time * 2.6) * .14 : 0);
  });
  fin.spot.intensity += (fin.spotT - fin.spot.intensity) * kk;
  // over the next letter; then over the doors until they open; then over her portrait
  const done = state.readCount >= 5, mt = !done ? EX[state.readCount].frameWorld : doorAmount() < .5 ? DOOR_MARK : fin.frameWorld;
  marker.position.set(mt.x, mt.y + (!done ? 2.05 : 2.6) + (reduceMotion ? 0 : Math.sin(state.time * 2) * .08), mt.z);
  marker.rotation.y = state.time * 1.2;
}
