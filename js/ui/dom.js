// Page elements, the static copy from CONFIG, and small DOM helpers.
// This module doesn't touch THREE, so main.js can use it before checking that three.js loaded.
import { CONFIG } from '../config.js';
import { $, coarse } from '../util.js';

export const ui = {
  canvas: $('#c'), stage: $('#stage'), loader: $('#loader'), ldText: $('#ldText'), ldBar: $('#ldBar'),
  intro: $('#intro'), enterBtn: $('#enterBtn'), hudTop: $('#hudTop'), hudBottom: $('#hudBottom'),
  seals: $('#seals'), readCount: $('#readCount'), chCount: $('#chCount'), chRoom: $('#chRoom'), chTitle: $('#chTitle'),
  rail: $('#rail'), railFill: $('#railFill'), railHer: $('#railHer'), walkHint: $('#walkHint'),
  prompt: $('#prompt'), promptMeta: $('#promptMeta'), promptTitle: $('#promptTitle'), promptBtn: $('#promptBtn'),
  firstHint: $('#firstHint'), toast: $('#toast'), pad: $('#walkPad'), padFwd: $('#padFwd'), padBack: $('#padBack'),
  letter: $('#letter'), envStage: $('#envStage'), envelope: $('#envelope'), sealBtn: $('#sealBtn'), sealNum: $('#sealNum'), envTo: $('#envTo'), envStamp: $('#envStamp'),
  paper: $('#paper'), paperMeta: $('#paperMeta'), paperTitle: $('#paperTitle'), paperStamp: $('#paperStamp'), paperDate: $('#paperDate'), paperDear: $('#paperDear'), paperBody: $('#paperBody'), paperSign: $('#paperSign'), closeLetter: $('#closeLetter'),
  finale: $('#finale'), finEyebrow: $('#finEyebrow'), finTitle: $('#finTitle'), finBody: $('#finBody'), finSign: $('#finSign'), finStay: $('#finStay'), finAgain: $('#finAgain'),
  editPanel: $('#editPanel'), photoCount: $('#photoCount'), photoInput: $('#photoInput'), clearPhoto: $('#clearPhoto'), unlockAll: $('#unlockAll'), resetAll: $('#resetAll')
};

// Thrown while the scene modules load when this browser can't run them. main.js shows the message.
export class BootError extends Error {}

export function fail(msg) { ui.ldText.textContent = msg; ui.ldBar.hidden = true; }

let toastTimer;
export function toast(msg) { ui.toast.textContent = msg; ui.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2900); }

// One <p> per paragraph. Text in [square brackets] is highlighted as a placeholder.
export function fillBody(el, paras) {
  el.textContent = '';
  paras.forEach((p) => {
    const pe = document.createElement('p');
    p.split(/(\[[^\]]+\])/).forEach((part) => {
      if (!part) return;
      if (part.startsWith('[')) { const m = document.createElement('mark'); m.className = 'todo'; m.textContent = part; pe.append(m); }
      else pe.append(document.createTextNode(part));
    });
    el.append(pe);
  });
}

export function applyCopy() {
  document.title = CONFIG.title;
  $('#ldEyebrow').textContent = CONFIG.title;
  const h = ui.intro.querySelector('h1');
  h.textContent = '';
  const [line1, line2] = [].concat(CONFIG.introTitle); // one line, or two with the second in italics
  h.append(document.createTextNode((line1 || '') + (line2 ? ' ' : '')));
  if (line2) { const em = document.createElement('em'); em.textContent = line2; h.append(em); }
  $('#introLede').textContent = CONFIG.introText;
  $('#tapText').textContent = coarse ? 'Tap her to step inside' : 'Click her to step inside';
  ui.walkHint.textContent = coarse ? '▲ ▼ to walk · drag to look' : '↑ ↓ to walk · drag to look';
  $('#firstHintText').textContent = coarse ? 'Hold ▲ to walk with her' : 'Hold ↑ to walk with her';
}
