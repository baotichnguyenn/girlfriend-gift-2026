// The museum building: the limestone Great Hall, five fabric-walled galleries joined by arches,
// parquet floors, skylit ceilings, cornices, benches, and dust in the air.
import { CONFIG } from '../config.js';
import { seeded, reduceMotion } from '../util.js';
import { state } from '../state.js';
import { scene } from '../engine.js';
import { at, PLINTH_H } from '../path.js';
import { HALF_W, CEIL, FRONT_Z, WALL_T, ARCH_W, ARCH_SPRING, FABRIC_TOP, PARTITION_Z, DOOR_Z, STATION_Z, STATION_SIDE } from '../layout.js';
import { canvasTex, spaced } from '../paint/canvas.js';
import { M } from './materials.js';
import { box, plane, archedWall, archBand, addMerged } from './geo.js';
import { flora, urn } from './flora.js';

export let wallTitle = null; // hidden on portrait screens, where it would sit behind the intro text
let dust;

const SKIRT = .45;
const BACK_Z = DOOR_Z - WALL_T / 2;
const WALLS = [...PARTITION_Z, DOOR_Z];

// A flat arch-topped shape, w = half-width, for filling an arch.
function archShape(halfW, spring) {
  const s = new THREE.Shape(); s.moveTo(-halfW, 0); s.lineTo(-halfW, spring); s.absarc(0, spring, halfW, Math.PI, 0, true); s.lineTo(halfW, 0); s.closePath();
  return s;
}

// A plane facing +z, then turned to face along `normal` and moved to x, y, z.
function placed(g, nx, nz, x, y, z) {
  g.rotateY(Math.atan2(nx, nz)); g.translate(x, y, z); return g;
}

export function buildMuseum() {
  const out = new Map([[M.slabs, []], [M.parquet, []], [M.marble, []], [M.ashlar, []], [M.limestone, []], [M.niche, []], [M.ceiling, []], [M.laylight, []], [M.wood, []], [M.leather, []], [M.bronze, []]]);
  M.fabric.forEach((f) => out.set(f, []));
  const add = (mat, g) => out.get(mat).push(g);

  // floors: marble slabs in the Great Hall, herringbone oak in the galleries
  const hallLen = FRONT_Z - PARTITION_Z[0], galLen = PARTITION_Z[0] - BACK_Z;
  add(M.slabs, plane(HALF_W * 2, hallLen).rotateX(-Math.PI / 2).translate(0, 0, PARTITION_Z[0] + hallLen / 2));
  add(M.parquet, plane(HALF_W * 2, galLen).rotateX(-Math.PI / 2).translate(0, 0, BACK_Z + galLen / 2));
  WALLS.forEach((z) => add(M.marble, box(ARCH_W * 2, .03, WALL_T + .5, 0, .015, z)));

  // ceiling, with a skylight over the Great Hall and each gallery
  add(M.ceiling, plane(HALF_W * 2, FRONT_Z - BACK_Z).rotateX(Math.PI / 2).translate(0, CEIL, BACK_Z + (FRONT_Z - BACK_Z) / 2));
  add(M.laylight, plane(10, 10).rotateX(Math.PI / 2).translate(0, CEIL - .03, (FRONT_Z + PARTITION_Z[0]) / 2));
  STATION_Z.forEach((z) => add(M.laylight, plane(12.5, 12.5).rotateX(Math.PI / 2).translate(0, CEIL - .03, z)));
  STATION_Z.forEach((z) => { for (const [w, d] of [[13.3, .4], [.4, 13.3]]) for (const sg of [-1, 1]) add(M.limestone, box(w, .3, d, d < 1 ? 0 : sg * 6.45, CEIL - .15, d < 1 ? z + sg * 6.45 : z)); });

  // side walls: limestone ashlar in the Great Hall; fabric, skirting, and picture rail in the galleries
  for (const sx of [-1, 1]) {
    add(M.ashlar, box(.4, CEIL, hallLen, sx * (HALF_W + .2), CEIL / 2, PARTITION_Z[0] + hallLen / 2));
    add(M.limestone, box(.4, CEIL, galLen, sx * (HALF_W + .2), CEIL / 2, BACK_Z + galLen / 2));
    // cornice, three steps, the whole length of the building
    add(M.limestone, box(.5, .5, FRONT_Z - BACK_Z, sx * (HALF_W - .25), CEIL - .25, (FRONT_Z + BACK_Z) / 2));
    add(M.limestone, box(.3, .22, FRONT_Z - BACK_Z, sx * (HALF_W - .65), CEIL - .4, (FRONT_Z + BACK_Z) / 2));
    add(M.limestone, box(.16, .2, FRONT_Z - BACK_Z, sx * (HALF_W - .08), CEIL - .78, (FRONT_Z + BACK_Z) / 2));
    for (let g = 0; g < 5; g++) {
      const zN = PARTITION_Z[g] - WALL_T / 2, zS = WALLS[g + 1] + WALL_T / 2, len = zN - zS, zc = (zN + zS) / 2;
      add(M.fabric[g], placed(plane(len, FABRIC_TOP - SKIRT), -sx, 0, sx * (HALF_W - .005), (FABRIC_TOP + SKIRT) / 2, zc));
      add(M.marble, box(.08, SKIRT, len, sx * (HALF_W - .04), SKIRT / 2, zc));
      add(M.limestone, box(.1, .14, len, sx * (HALF_W - .05), FABRIC_TOP, zc));
    }
    // Great Hall pilasters with blind arches between them
    for (const z of [38.4, 45, 51.6]) add(M.limestone, box(.36, CEIL - .9, 1.3, sx * (HALF_W - .18), (CEIL - .9) / 2, z));
    for (const z of [41.7, 48.3]) {
      add(M.limestone, placed(archBand(2, 3.8, .45, .2), -sx, 0, sx * (HALF_W - .1), 0, z));
      add(M.niche, placed(new THREE.ShapeGeometry(archShape(2, 3.8), 24), -sx, 0, sx * (HALF_W - .02), 0, z));
    }
  }

  // walls between galleries, each with an arch, and the end wall with the garden doors
  WALLS.forEach((z, k) => {
    add(k === 0 || k === 5 ? M.ashlar : M.limestone, archedWall(HALF_W * 2, CEIL, WALL_T, ARCH_W, ARCH_SPRING).translate(0, 0, z));
    add(M.limestone, archBand(ARCH_W, ARCH_SPRING, .45, WALL_T + .16).translate(0, 0, z));
    add(M.limestone, box(.7, .95, WALL_T + .24, 0, ARCH_SPRING + ARCH_W + .2, z));
    for (const face of [1, -1]) {
      const g = face > 0 ? k - 1 : k; // the gallery this face looks into
      const fz = z + face * (WALL_T / 2 + .005);
      add(M.limestone, box(HALF_W * 2, .5, .25, 0, CEIL - .25, z + face * (WALL_T / 2 + .12)));
      if (g < 0 || g > 4) continue;
      const segW = HALF_W - ARCH_W - .5;
      for (const sx of [-1, 1]) {
        const cx = sx * (ARCH_W + .5 + segW / 2);
        add(M.fabric[g], placed(plane(segW, FABRIC_TOP - SKIRT), 0, face, cx, (FABRIC_TOP + SKIRT) / 2, fz));
        add(M.marble, box(segW, SKIRT, .08, cx, SKIRT / 2, z + face * (WALL_T / 2 + .04)));
        add(M.limestone, box(segW, .14, .1, cx, FABRIC_TOP, z + face * (WALL_T / 2 + .05)));
      }
    }
  });

  // Great Hall entrance wall: ashlar, a blind arch with bronze doors behind the plinth, and the carved title
  add(M.ashlar, box(HALF_W * 2 + .8, CEIL, .4, 0, CEIL / 2, FRONT_Z + .2));
  add(M.limestone, archBand(2.3, 2.6, .42, .2).translate(0, 0, FRONT_Z));
  add(M.bronze, new THREE.ShapeGeometry(archShape(2.3, 2.6), 24).rotateY(Math.PI).translate(0, 0, FRONT_Z - .01));
  add(M.limestone, box(HALF_W * 2, .32, .3, 0, 7.45, FRONT_Z - .1));

  // entrance plinth
  const p0 = at(0);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.62, .68, PLINTH_H, 40), M.marble); plinth.position.set(p0.x, PLINTH_H / 2, p0.z); scene.add(plinth);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.62, .02, 8, 48), M.brass); rim.rotation.x = Math.PI / 2; rim.position.set(p0.x, PLINTH_H, p0.z); scene.add(rim);

  // a bench in each gallery, across from the letter
  STATION_Z.forEach((z, i) => {
    const x = -STATION_SIDE[i] * 7.8;
    add(M.wood, box(.7, .42, 2.9, x, .21, z)); add(M.leather, box(.95, .16, 3.2, x, .5, z));
  });

  const hall = flora(scene, false);
  [[-4.7, 50.6], [4.7, 50.6], [-7.4, PARTITION_Z[0] + 1.9], [7.4, PARTITION_Z[0] + 1.9]].forEach(([x, z], k) => urn(hall, out, x, z, 300 + k));
  hall.build();

  addMerged(scene, out);

  // the title carved into the entrance wall
  const titleTex = canvasTex(2048, 420, (x, w) => {
    const carve = (text, size, y, sp) => {
      x.font = '600 ' + size + 'px "Bodoni Moda", Georgia, serif';
      x.fillStyle = 'rgba(255,248,232,.55)'; spaced(x, text, w / 2 + 2, y + 3, sp, 'center');
      x.fillStyle = 'rgba(92,76,56,.95)'; spaced(x, text, w / 2, y, sp, 'center');
    };
    carve(CONFIG.title.toUpperCase(), 170, 210, 30);
    carve('A PRIVATE EXHIBITION IN FIVE LETTERS', 46, 340, 16);
  });
  wallTitle = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.25), new THREE.MeshStandardMaterial({ map: titleTex, transparent: true, roughness: .9 }));
  wallTitle.position.set(0, 6.2, FRONT_Z - .02); wallTitle.rotation.y = Math.PI; scene.add(wallTitle);
}

export function buildDust() {
  const N = 700, pos = new Float32Array(N * 3); const rnd = seeded(5);
  for (let k = 0; k < N; k++) { pos[k * 3] = (rnd() - .5) * 22; pos[k * 3 + 1] = rnd() * 8; pos[k * 3 + 2] = BACK_Z + rnd() * (FRONT_Z - BACK_Z); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe6c0, size: .035, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);
}

export function updateDust() {
  if (!reduceMotion) { dust.rotation.y = Math.sin(state.time * .03) * .005; dust.position.y = Math.sin(state.time * .2) * .15; }
}
