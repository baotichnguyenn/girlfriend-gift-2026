// The letter overlay: an envelope with a wax seal, then the letter itself.
import { CONFIG } from '../config.js';
import { ROMAN, reduceMotion } from '../util.js';
import { state } from '../state.js';
import { markRead } from '../order.js';
import { ui, toast, fillBody } from './dom.js';
import { hidePrompt } from './hud.js';
import { stampSVG, letterDate } from './stamp.js';

let openIdx = -1;

// Letters dropped into the "letters" folder as 1.txt … 5.txt replace the text in CONFIG.
// Each non-empty line is a paragraph. A first line "Title: …" also replaces the letter's title.
export async function loadLetterFiles() {
  await Promise.all(CONFIG.letters.map(async (lt, i) => {
    try {
      const res = await fetch('letters/' + (i + 1) + '.txt', { cache: 'no-cache' });
      if (!res.ok) return;
      const lines = (await res.text()).replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const title = lines[0] && /^title\s*:/i.test(lines[0]) ? lines.shift().replace(/^title\s*:\s*/i, '') : '';
      if (title) lt.title = title;
      if (lines.length) lt.body = lines;
    } catch (e) { /* no file: keep the text in CONFIG */ }
  }));
}

// Only call with i <= readCount. Callers check the order first.
export function openLetter(i) {
  if (state.mode !== 'walk') return;
  state.mode = 'reading'; openIdx = i;
  const lt = CONFIG.letters[i], again = i < state.readCount;
  ui.sealNum.textContent = ROMAN[i]; ui.envTo.textContent = 'for ' + CONFIG.herName;
  ui.paperMeta.textContent = 'Exhibit ' + ROMAN[i] + ' · ' + lt.medium;
  ui.paperTitle.textContent = lt.title;
  ui.envStamp.innerHTML = stampSVG(i); ui.paperStamp.innerHTML = stampSVG(i); // our own markup, no user text
  ui.paperDate.textContent = letterDate();
  ui.paperDear.textContent = 'Dear ' + CONFIG.herName + ',';
  fillBody(ui.paperBody, lt.body);
  ui.paperSign.textContent = '— ' + CONFIG.from;
  ui.closeLetter.textContent = again ? 'Back to the museum' : 'Fold it away';
  ui.envelope.classList.remove('open'); ui.envStage.classList.toggle('read', again);
  ui.paper.scrollTop = 0;
  hidePrompt();
  ui.letter.hidden = false; requestAnimationFrame(() => ui.letter.classList.add('in'));
  setTimeout(() => (again ? ui.closeLetter : ui.sealBtn).focus({ preventScroll: true }), 60);
}

export function closeLetter() {
  ui.letter.classList.remove('in');
  setTimeout(() => { ui.letter.hidden = true; }, 380);
  const i = openIdx; openIdx = -1; state.mode = 'walk';
  if (markRead(i)) {
    if (state.readCount < 5) toast('The rope is down. Letter ' + ROMAN[state.readCount] + ' is waiting ahead.');
    else toast('Every letter is open. One room left.');
  }
}

export function initLetter() {
  ui.sealBtn.addEventListener('click', () => {
    ui.envelope.classList.add('open');
    setTimeout(() => { ui.envStage.classList.add('read'); ui.closeLetter.focus({ preventScroll: true }); }, reduceMotion ? 30 : 700);
  });
  ui.closeLetter.addEventListener('click', closeLetter);
  ui.promptBtn.addEventListener('click', () => { const i = +ui.prompt.dataset.i; if (!isNaN(i)) openLetter(i); });
}
