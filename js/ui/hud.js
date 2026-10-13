// The HUD: the hand-off from the intro, wax-seal progress, chapter block, progress rail, and station prompt.
import { CONFIG } from '../config.js';
import { ROMAN } from '../util.js';
import { state } from '../state.js';
import { L, S } from '../path.js';
import { ui } from './dom.js';

const hud = { ch: null, pi: null, fill: -1 }; // what's on screen, to skip redundant DOM writes

export function buildHud() {
  for (let i = 0; i < 5; i++) { const sEl = document.createElement('span'); sEl.className = 'sm-seal'; sEl.textContent = ROMAN[i]; ui.seals.append(sEl); }
  for (let i = 0; i < 6; i++) { const nEl = document.createElement('span'); nEl.className = 'node'; nEl.style.left = ((i < 5 ? S[i] : L) / L * 100) + '%'; ui.rail.append(nEl); }
}

// Leaves the intro: she steps off the plinth (see her.js) and the HUD and walking arrows fade in.
export function enter() {
  if (state.mode !== 'intro') return;
  state.mode = 'entering';
  ui.intro.classList.add('leaving'); setTimeout(() => { ui.intro.hidden = true; }, 650);
  ui.hudTop.hidden = ui.hudBottom.hidden = ui.pad.hidden = false;
  requestAnimationFrame(() => { ui.hudTop.classList.add('in'); ui.hudBottom.classList.add('in'); ui.pad.classList.add('in'); });
}

// Called from refresh().
export function setHudProgress(n) {
  ui.readCount.textContent = n;
  [...ui.seals.children].forEach((el, i) => { el.className = 'sm-seal' + (i < n ? ' read' : i === n ? ' current' : ''); });
  [...ui.rail.querySelectorAll('.node')].forEach((el, i) => { el.className = 'node' + (i < n ? ' read' : i === n ? ' current' : ''); });
  hud.pi = null; // force prompt refresh
}

export function hidePrompt() { ui.prompt.hidden = true; hud.pi = null; }

export function updateHUD() {
  const sc = state.mode === 'entering' ? 0 : state.s;
  const f = sc / L;
  if (Math.abs(f - hud.fill) > .0005) { hud.fill = f; ui.railFill.style.transform = 'scaleX(' + f.toFixed(4) + ')'; ui.railHer.style.left = (f * 100).toFixed(2) + '%'; }
  let ch = S.findIndex((v) => sc < v + 2.0); if (ch < 0) ch = 5;
  if (hud.ch !== ch) {
    hud.ch = ch;
    if (ch < 5) { ui.chCount.textContent = '0' + (ch + 1) + ' / 05'; ui.chRoom.textContent = 'Gallery ' + ROMAN[ch]; ui.chTitle.textContent = CONFIG.letters[ch].title; }
    else { ui.chCount.textContent = 'VI'; ui.chRoom.textContent = 'The garden'; ui.chTitle.textContent = 'One more exhibit'; }
  }
  let pi = -1;
  if (state.mode === 'walk') for (let i = 0; i <= Math.min(state.readCount, 4); i++) if (Math.abs(state.s - S[i]) < .45 && Math.abs(state.sTarget - state.s) < .5) { pi = i; break; }
  if (hud.pi !== pi) {
    hud.pi = pi;
    if (pi < 0) ui.prompt.hidden = true;
    else {
      ui.promptMeta.textContent = 'Exhibit ' + ROMAN[pi] + ' · ' + CONFIG.letters[pi].medium;
      ui.promptTitle.textContent = CONFIG.letters[pi].title;
      ui.promptBtn.textContent = pi < state.readCount ? 'Read it again' : 'Open the letter';
      ui.prompt.dataset.i = pi; ui.prompt.hidden = false;
    }
  }
}

export function initHud() {
  ui.enterBtn.addEventListener('click', enter);
}
