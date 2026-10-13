// Builds the whole scene once, and advances everything except her and the camera each frame.
import { renderer, scene, camera } from '../engine.js';
import { createMaterials } from './materials.js';
import { buildSky, settleSky, updateSky } from './sky.js';
import { buildMuseum, buildDust, updateDust } from './museum.js';
import { buildChandeliers, updateChandeliers } from './chandeliers.js';
import { buildPhotos } from './photos.js';
import { buildPathRibbon, updatePathRibbon } from './ribbon.js';
import { garden, buildGarden, updateGarden } from './garden.js';
import { buildExhibits, buildMarker, settleLights, updateExhibits } from './exhibits.js';
import { buildDoors, updateDoors } from './doors.js';
import { buildBarriers, buildRopeLines, settleBarriers, updateBarriers } from './ropes.js';
import { buildHer } from './her.js';

export function buildWorld() {
  // environment map: warm gallery light for the gold and brass to reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x241b1e, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, hex, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
  panel(0, 12, 0, 12, 12, 0xfff0dc, 2.2); panel(12, 3, 4, 5, 7, 0x7a2b31, 1); panel(-12, 4, -5, 6, 6, 0xffcf96, 1.6); panel(0, 2, 12, 8, 4, 0x40594b, 1); panel(0, 3, -12, 10, 4, 0xd8ccb3, .8);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();

  createMaterials();
  buildSky(garden);
  buildMuseum();
  buildChandeliers();
  buildPhotos();
  buildPathRibbon();
  buildGarden();
  buildExhibits();
  buildDoors();
  buildBarriers();
  buildRopeLines();
  buildMarker();
  buildDust();
  buildHer();
}

// Compiles the garden's shaders while the loader is up, so opening the doors doesn't stall.
export function warmUp() { garden.visible = true; renderer.compile(scene, camera); garden.visible = false; }

// Jumps lights, ropes, and sky to their targets, so the first frame shows the restored progress.
export function settleWorld() { settleLights(); settleBarriers(); settleSky(); }

export function updateWorld(dt) {
  updateDoors(dt);
  updateSky(dt);
  updateGarden();
  updateExhibits(dt);
  updateBarriers(dt);
  updatePathRibbon();
  updateDust();
  updateChandeliers();
}
