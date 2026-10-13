// The finale card. It opens when she reaches the garden terrace with every letter read.
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { L, S0 } from '../path.js';
import { placeAt } from '../order.js';
import { snapCamera } from '../camera.js';
import { ui, fillBody } from './dom.js';
import { hidePrompt } from './hud.js';

let finaleArmed = true;

export function showFinale() {
  if (state.mode !== 'walk') return;
  state.mode = 'reading'; finaleArmed = false; hidePrompt();
  ui.finale.hidden = false; requestAnimationFrame(() => ui.finale.classList.add('in'));
  setTimeout(() => ui.finStay.focus({ preventScroll: true }), 60);
}

export function closeFinale(again) {
  ui.finale.classList.remove('in'); setTimeout(() => { ui.finale.hidden = true; }, 380);
  state.mode = 'walk';
  if (again) { placeAt(S0); snapCamera(); }
}

// Runs every frame. Re-arms once she walks back from the end.
export function updateFinaleTrigger() {
  if (state.mode === 'walk' && state.readCount === 5 && finaleArmed && state.s > L - .35) { finaleArmed = false; setTimeout(showFinale, 500); }
  if (!finaleArmed && state.mode === 'walk' && state.s < L - 2.5) finaleArmed = true;
}

export function initFinale() {
  ui.finEyebrow.textContent = CONFIG.finale.eyebrow;
  ui.finTitle.textContent = CONFIG.finale.title;
  fillBody(ui.finBody, [CONFIG.finale.body]); // renders into a <p>, so unwrap
  { const inner = ui.finBody.querySelector('p'); if (inner) { ui.finBody.replaceChildren(...inner.childNodes); } }
  ui.finSign.textContent = '— ' + CONFIG.from;
  ui.finStay.addEventListener('click', () => closeFinale(false));
  ui.finAgain.addEventListener('click', () => closeFinale(true));
}
