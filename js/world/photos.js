// Photographs on the gallery walls, read from the "displayed photos" folder next to index.html.
// Name them 1.jpg, 2.jpg, 3.jpg… (.jpeg, .png, and .webp work too). Photo 1 hangs first along the walk.
// Loading stops at the first missing number. Frames without a photo show a painting instead.
import { CONFIG } from '../config.js';
import { EDIT } from '../util.js';
import { scene } from '../engine.js';
import { HALF_W, WALL_T, PARTITION_Z, DOOR_Z, STATION_Z } from '../layout.js';
import { canvasTex, makeTex, fitFont } from '../paint/canvas.js';
import { painting } from '../paint/surfaces.js';
import { M } from './materials.js';
import { frameGeo } from './frames.js';

export const PHOTO_DIR = 'displayed photos/';
const EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_PX = 768;   // photos are scaled down to this, to keep GPU memory small on phones
const MAT = .26;      // cream mat between a photograph and its frame, at most; slim photos get a slimmer one
const LABEL_Y = 1.55; // wall labels hang at about eye level
const PAINTING_TITLES = ['Evening, Rose Garden', 'Study of Morning Light', 'The Long Field', 'Landscape at the Blue Hour', 'Orchard in May', 'River, Late Afternoon', 'The Quiet Shore', 'Hills After Rain'];

// One slot per frame, in the order she passes them.
export const SLOTS = [];
const WALLS = [...PARTITION_Z, DOOR_Z];
STATION_Z.forEach((zc, g) => {
  // maxW and maxH bound the picture itself; area is how much wall a picture of any shape should take
  // three on each side wall, 5.2 apart, so frame and label stay inside the gallery's 16-unit walls
  const side = (sx, dz, portrait) => SLOTS.push({ x: sx * (HALF_W - .01), z: zc + dz, nx: -sx, nz: 0, y: 3.05, maxW: 3, maxH: 2.4, area: 3.6, portrait });
  for (const [dz, portrait] of [[5.2, false], [0, true], [-5.2, false]]) { side(-1, dz, portrait); side(1, dz, portrait); }
  const ez = WALLS[g + 1] + WALL_T / 2 + .01;
  for (const sx of [-1, 1]) SLOTS.push({ x: sx * 8.25, z: ez, nx: 0, nz: 1, y: 3.2, maxW: 4.4, maxH: 2.8, area: 5.6, portrait: false });
});

const paintings = new Map();
function placeholder(i, portrait) {
  const key = (i % 5) + (portrait ? 'p' : 'l');
  if (!paintings.has(key)) paintings.set(key, painting(i % 5, portrait));
  return paintings.get(key);
}

function drawLabel(slot) {
  const x = slot.labelCtx, w = 512, h = 232, n = slot.i + 1;
  x.fillStyle = '#f3eee4'; x.fillRect(0, 0, w, h);
  let eyebrow, title, medium;
  if (EDIT) { eyebrow = 'SLOT ' + n; title = slot.file || 'Empty'; medium = PHOTO_DIR + n + '.jpg'; }
  else if (slot.file) { eyebrow = 'NO. ' + n; title = (CONFIG.photoTitles && CONFIG.photoTitles[slot.i]) || 'Untitled'; medium = 'Photograph · Gift of ' + CONFIG.from; }
  else { eyebrow = 'NO. ' + n; title = PAINTING_TITLES[slot.i % PAINTING_TITLES.length]; medium = 'Oil on canvas'; }
  x.fillStyle = '#8a6a3a'; x.font = '600 24px Archivo, sans-serif'; x.fillText(eyebrow, 30, 52);
  x.fillStyle = '#211a1e'; fitFont(x, title, w - 60, 46, (s) => 'italic 500 ' + s + 'px "Bodoni Moda", Georgia, serif'); x.fillText(title, 30, 118);
  x.fillStyle = '#5b4d52'; fitFont(x, medium, w - 60, 25, (s) => '400 ' + s + 'px Archivo, sans-serif'); x.fillText(medium, 30, 168);
  slot.labelTex.needsUpdate = true;
}

// Sizes the frame, mat, picture, wall wash, and label around a picture of cw × ch.
function fit(slot, cw, ch, withMat) {
  const m = withMat ? Math.min(MAT, Math.max(.08, Math.min(cw, ch) * .14)) : 0, ow = cw + 2 * m + .34, oh = ch + 2 * m + .34;
  const { gold, deep } = frameGeo(cw + 2 * m, ch + 2 * m);
  const swap = (mesh, geo) => { mesh.geometry.dispose(); mesh.geometry = geo; };
  swap(slot.gold, gold); swap(slot.deep, deep);
  swap(slot.mat, new THREE.PlaneGeometry(cw + 2 * m, ch + 2 * m)); slot.mat.visible = withMat;
  swap(slot.pic, new THREE.PlaneGeometry(cw, ch));
  slot.wash.scale.set(ow * 1.9, oh * 1.8, 1);
  slot.label.position.set(ow / 2 + .55, LABEL_Y - slot.y, .012);
}

export function buildPhotos() {
  SLOTS.forEach((slot, i) => {
    slot.i = i;
    const g = new THREE.Group(); g.position.set(slot.x, slot.y, slot.z); g.rotation.y = Math.atan2(slot.nx, slot.nz); scene.add(g);
    slot.wash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), M.wash); slot.wash.position.set(0, .35, .004); g.add(slot.wash);
    slot.gold = new THREE.Mesh(new THREE.BufferGeometry(), M.gold); g.add(slot.gold);
    slot.deep = new THREE.Mesh(new THREE.BufferGeometry(), M.goldDeep); g.add(slot.deep);
    slot.mat = new THREE.Mesh(new THREE.BufferGeometry(), M.mat); slot.mat.position.z = .06; g.add(slot.mat);
    slot.picMat = new THREE.MeshStandardMaterial({ map: placeholder(i, slot.portrait), emissiveMap: placeholder(i, slot.portrait), emissive: 0xffffff, emissiveIntensity: .2, roughness: .8 });
    slot.pic = new THREE.Mesh(new THREE.BufferGeometry(), slot.picMat); slot.pic.position.z = .066; g.add(slot.pic);
    const lc = document.createElement('canvas'); lc.width = 512; lc.height = 232;
    slot.labelCtx = lc.getContext('2d'); slot.labelTex = makeTex(lc);
    slot.label = new THREE.Mesh(new THREE.PlaneGeometry(.62, .28), new THREE.MeshBasicMaterial({ map: slot.labelTex, color: 0xd8d0c4 })); g.add(slot.label);
    fit(slot, ...size(slot, slot.portrait ? .75 : 4 / 3), false);
    drawLabel(slot);
  });
}

// Width and height for a picture of this aspect: the slot's area, shrunk if needed to fit its bounds.
// So a square photo and a long screenshot take a similar share of the wall, rather than one becoming a sliver.
function size(slot, aspect) {
  let w = Math.sqrt(slot.area * aspect), h = w / aspect;
  const k = Math.min(1, slot.maxW / w, slot.maxH / h);
  return [w * k, h * k];
}

function loadImage(url) {
  return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = url; });
}

function showPhoto(slot, img, file) {
  const iw = img.naturalWidth, ih = img.naturalHeight, sc = Math.min(1, MAX_PX / Math.max(iw, ih));
  const tex = canvasTex(Math.max(1, Math.round(iw * sc)), Math.max(1, Math.round(ih * sc)), (x, w, h) => x.drawImage(img, 0, 0, w, h));
  slot.picMat.map = slot.picMat.emissiveMap = tex; slot.picMat.emissiveIntensity = .3; slot.picMat.roughness = .55; slot.picMat.needsUpdate = true;
  fit(slot, ...size(slot, iw / ih), true);
  slot.file = file; drawLabel(slot);
}

// Hangs 1.jpg, 2.jpg, … in order until a number is missing. Resolves to how many it found.
export async function loadPhotos() {
  let count = 0;
  for (const slot of SLOTS) {
    const n = slot.i + 1;
    let found = null;
    for (const ext of EXTS) { const img = await loadImage(encodeURI(PHOTO_DIR + n + '.' + ext)); if (img) { found = { img, file: n + '.' + ext }; break; } }
    if (!found) break;
    showPhoto(slot, found.img, found.file);
    count++;
  }
  return count;
}
