// Builds the museum and runs the frame loop. main.js loads this module only after
// it has checked that three.js loaded.
import { CONFIG } from './config.js';
import { store } from './util.js';
import { state } from './state.js';
import { renderer, scene, camera } from './engine.js';
import { restoreProgress } from './order.js';
import { resize, snapCamera, updateCamera } from './camera.js';
import { initInput, updateInput, updateHover } from './input.js';
import { setPhoto, loadPhotoFolders } from './paint/photo.js';
import { loadLetterFiles } from './ui/letter.js';
import { buildWorld, settleWorld, updateWorld, warmUp } from './world/index.js';
import { loadPhotos, PHOTO_DIR } from './world/photos.js';
import { updateHer } from './world/her.js';
import { ui } from './ui/dom.js';
import { buildHud, initHud, updateHUD } from './ui/hud.js';
import { initLetter } from './ui/letter.js';
import { initFinale, updateFinaleTrigger } from './ui/finale.js';
import { initEdit } from './ui/edit.js';

const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), .05); state.time += dt;
  updateInput(dt);
  updateHer(dt);
  updateCamera(dt);
  updateWorld(dt);
  updateFinaleTrigger();
  updateHUD();
  updateHover();
  renderer.render(scene, camera);
}

async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const faces = ['600 64px "Bodoni Moda"', 'italic 500 64px "Bodoni Moda"', '600 24px "Archivo"', '400 24px "Archivo"', '400 40px "Pinyon Script"', '400 40px "Charm"'];
  try { await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 3000))]); } catch (e) { /* fall back to system faces */ }
}

export async function start() {
  initHud(); initInput(); initLetter(); initFinale(); initEdit();
  window.addEventListener('resize', resize);
  await loadFonts();
  ui.ldText.textContent = 'Hanging the letters…';
  await loadLetterFiles(); // before building, because letter titles go on the placards
  setPhoto(null);
  buildWorld(); buildHud();
  restoreProgress(); settleWorld();
  const ph = CONFIG.photo || store.get('mou-photo'); if (ph) await setPhoto(ph);
  await loadPhotoFolders();
  resize(); warmUp(); state.mode = 'intro'; snapCamera();
  tick();
  ui.intro.hidden = false;
  ui.loader.classList.add('done'); setTimeout(() => { ui.loader.hidden = true; }, 900);
  loadPhotos().then((n) => { ui.photoCount.textContent = n ? n + (n === 1 ? ' photo' : ' photos') + ' hung from ' + PHOTO_DIR : 'No photos in ' + PHOTO_DIR + ' yet. Add 1.jpg, 2.jpg, …'; });
}
