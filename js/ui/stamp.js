// Postage stamps for the letters, drawn as inline SVG: a perforated stamp with a Vietnamese motif,
// and a round postmark with today's date in Vietnam over its corner.
// Each visit deals the letters a fresh shuffle of motifs and colours, so no two letters share a stamp,
// and a letter keeps its stamp until the page reloads.
import { CONFIG } from '../config.js';
import { seeded } from '../util.js';

const PAPER = '#f8f2e4';

// [tint, ink, accent]: two-colour printing, like an engraved stamp.
const PALETTES = [
  ['#f3d9c6', '#a8321e', '#e0662f'], ['#d7e0ea', '#1f3e6b', '#c7473d'], ['#d9e6d3', '#2e5a3a', '#d0614f'],
  ['#e3d8ea', '#5b3a78', '#d98aa8'], ['#f2e2b8', '#7a4f14', '#c8452f'], ['#f4d9dc', '#8e2440', '#3f6d4e'],
  ['#d3e6e4', '#1d5c5a', '#e2913a']
];
const VALUES = ['20đ', '30đ', '50đ', '100đ', '200đ', '500đ', '1000đ', '2000đ'];

// Each motif draws into a 100 × 100 box. c = { ink, accent, tint }, rnd = random numbers.
const MOTIFS = [
  ['Hoa sen', (c) => {
    const petal = (rot, s, fill) => `<path d="M0,0C-9,-10 -9,-26 0,-36C9,-26 9,-10 0,0Z" transform="translate(50,76) rotate(${rot}) scale(${s})" fill="${fill}" stroke="${c.ink}" stroke-width="1.1"/>`;
    return `<ellipse cx="22" cy="88" rx="20" ry="5" fill="${c.ink}" opacity=".8"/><ellipse cx="82" cy="91" rx="14" ry="3.6" fill="${c.ink}" opacity=".7"/>`
      + petal(-64, .78, c.tint) + petal(64, .78, c.tint) + petal(-34, .95, c.accent) + petal(34, .95, c.accent) + petal(0, 1.08, c.accent)
      + `<path d="M50,72V44M46,70L40,50M54,70L60,50" stroke="${c.ink}" stroke-width=".6" fill="none"/>`
      + `<path d="M4,97q6,-3 12,0t12,0t12,0t12,0t12,0t12,0t12,0t12,0" stroke="${c.ink}" stroke-width="1" fill="none"/>`;
  }],
  ['Nón lá', (c) => {
    let ribs = '';
    for (let k = 1; k < 8; k++) { const x = 12 + k * 9.5; ribs += `<path d="M50,40L${x},${82 + Math.sin(k / 8 * Math.PI) * 5}" stroke="${c.ink}" stroke-width=".55"/>`; }
    return `<circle cx="50" cy="44" r="24" fill="${c.accent}" opacity=".85"/><path d="M0,70H100" stroke="${c.ink}" stroke-width=".6"/>`
      + `<path d="M12,82L50,40L88,82Q50,93 12,82Z" fill="${PAPER}" stroke="${c.ink}" stroke-width="1.4"/>${ribs}`
      + `<path d="M24,85Q50,106 76,85" stroke="${c.accent}" stroke-width="1.4" fill="none"/>`;
  }],
  ['Đèn lồng', (c) => {
    const lantern = (x, y, s, fill) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,-40V-26" stroke="${c.ink}" stroke-width="1"/>`
      + `<rect x="-9" y="-28" width="18" height="5" fill="${c.ink}"/><ellipse cx="0" cy="0" rx="22" ry="24" fill="${fill}" stroke="${c.ink}" stroke-width="1.2"/>`
      + `<ellipse cx="0" cy="0" rx="8" ry="24" fill="none" stroke="${c.ink}" stroke-width=".6"/><ellipse cx="0" cy="0" rx="15" ry="24" fill="none" stroke="${c.ink}" stroke-width=".6"/>`
      + `<rect x="-9" y="23" width="18" height="5" fill="${c.ink}"/><path d="M-3,28L-5,44M0,28V46M3,28L5,44" stroke="${c.accent}" stroke-width="1"/></g>`;
    return `<path d="M0,10Q50,22 100,10" stroke="${c.ink}" stroke-width="1" fill="none"/>` + lantern(17, 42, .5, c.tint) + lantern(83, 42, .5, c.tint) + lantern(50, 56, 1, c.accent);
  }],
  ['Chùa Một Cột', (c) => `<ellipse cx="50" cy="90" rx="46" ry="8" fill="${c.ink}" opacity=".18" stroke="${c.ink}" stroke-width=".8"/>`
    + `<circle cx="20" cy="90" r="2.4" fill="${c.accent}"/><circle cx="78" cy="88" r="2" fill="${c.accent}"/><circle cx="86" cy="92" r="1.6" fill="${c.accent}"/>`
    + `<rect x="46" y="62" width="8" height="28" fill="${PAPER}" stroke="${c.ink}" stroke-width="1"/><rect x="33" y="58" width="34" height="5" fill="${c.ink}"/>`
    + `<rect x="38" y="44" width="24" height="14" fill="${PAPER}" stroke="${c.ink}" stroke-width="1"/><path d="M44,44V58M50,44V58M56,44V58" stroke="${c.ink}" stroke-width=".6"/>`
    + `<path d="M24,47Q38,43 44,33H56Q62,43 76,47Q62,45 50,45Q38,45 24,47Z" fill="${c.accent}" stroke="${c.ink}" stroke-width="1"/>`
    + `<path d="M40,33Q46,29 48,22H52Q54,29 60,33Z" fill="${c.accent}" stroke="${c.ink}" stroke-width="1"/><circle cx="50" cy="20" r="1.8" fill="${c.ink}"/>`],
  ['Xe đạp hoa', (c, rnd) => {
    let flowers = '';
    for (let k = 0; k < 11; k++) {
      const x = 15 + rnd() * 26, y = 32 + rnd() * 14, r = 2.8 + rnd() * 2.2, f = rnd() < .6 ? c.accent : c.tint;
      flowers += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${f}" stroke="${c.ink}" stroke-width=".6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".9" fill="${c.ink}"/>`;
    }
    const wheel = (x) => `<circle cx="${x}" cy="78" r="14" fill="none" stroke="${c.ink}" stroke-width="2"/><circle cx="${x}" cy="78" r="1.6" fill="${c.ink}"/>`
      + `<path d="M${x - 14},78H${x + 14}M${x},64V92M${x - 10},68L${x + 10},88M${x + 10},68L${x - 10},88" stroke="${c.ink}" stroke-width=".4"/>`;
    return wheel(28) + wheel(74) + `<path d="M28,78L44,58H66L74,78M44,58L52,78L66,58M28,78H52M42,52H50M44,52L46,58M66,58L64,47L71,45" stroke="${c.ink}" stroke-width="2" fill="none" stroke-linejoin="round"/>`
      + `<path d="M13,44H43L40,57H16Z" fill="${c.tint}" stroke="${c.ink}" stroke-width="1"/><path d="M19,44L20,57M25,44V57M31,44V57M37,44L36,57" stroke="${c.ink}" stroke-width=".5"/>` + flowers;
  }],
  ['Hoa hồng', (c) => {
    const leaf = (x, y, r) => `<path d="M0,0C6,-7 16,-7 22,0C16,7 6,7 0,0Z" transform="translate(${x},${y}) rotate(${r})" fill="${c.ink}" opacity=".85"/>`;
    return `<path d="M50,98C47,82 53,70 50,56" stroke="${c.ink}" stroke-width="2" fill="none"/>` + leaf(50, 82, -28) + leaf(50, 74, 208)
      + `<circle cx="50" cy="40" r="19" fill="${c.accent}" stroke="${c.ink}" stroke-width="1.2"/>`
      + `<path d="M50,40m-4,0a4,4 0 1,1 8,0M44,44a8,8 0 0,1 12,-10M58,46a11,11 0 0,1 -18,-1M37,34a14,14 0 0,1 22,-9M62,30a15,15 0 0,1 -2,22" stroke="${c.ink}" stroke-width="1" fill="none"/>`;
  }],
  ['Hoa mai', (c, rnd) => {
    let blooms = '';
    for (const [x, y] of [[24, 76], [40, 62], [58, 50], [74, 34], [86, 20], [66, 26], [32, 50]]) {
      const s = .8 + rnd() * .4;
      let p = '';
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + rnd(); p += `<circle cx="${(Math.cos(a) * 4.6).toFixed(2)}" cy="${(Math.sin(a) * 4.6).toFixed(2)}" r="4.2"/>`; }
      blooms += `<g transform="translate(${x},${y}) scale(${s.toFixed(2)})" fill="#e6a817" stroke="${c.ink}" stroke-width=".5">${p}<circle r="1.9" fill="${c.ink}"/></g>`;
    }
    return `<path d="M6,96C28,82 40,62 60,50S84,26 92,12M60,50C64,38 66,30 66,24M40,62C34,56 32,52 32,48" stroke="${c.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` + blooms;
  }],
  ['Bình minh', (c) => `<circle cx="50" cy="54" r="19" fill="${c.accent}"/>`
    + `<path d="M0,84L18,60L30,72L48,46L66,70L80,58L100,80V100H0Z" fill="${c.ink}" opacity=".55"/>`
    + `<path d="M0,92L22,76L40,88L62,72L84,88L100,82V100H0Z" fill="${c.ink}"/>`
    + `<path d="M20,28q3,-3 6,0q3,-3 6,0M64,22q2.5,-2.5 5,0q2.5,-2.5 5,0M74,34q2,-2 4,0q2,-2 4,0" stroke="${c.ink}" stroke-width="1" fill="none"/>`]
];

// Today in Vietnam, as day, month, and year.
function today() {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(new Date());
    const get = (t) => +parts.find((p) => p.type === t).value;
    return { d: get('day'), m: get('month'), y: get('year') };
  } catch (e) { const n = new Date(); return { d: n.getDate(), m: n.getMonth() + 1, y: n.getFullYear() }; }
}

// The date line a Vietnamese letter opens with.
export function letterDate() { const t = today(); return 'ngày ' + t.d + ' tháng ' + t.m + ' năm ' + t.y; }

const rnd = seeded(1 + Math.floor(Math.random() * 2147483000));
const shuffled = (arr) => { const a = arr.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
const motifs = shuffled(MOTIFS), palettes = shuffled(PALETTES);
const specs = [];
let uid = 0;

function spec(i) {
  if (!specs[i]) {
    const [tint, ink, accent] = palettes[i % palettes.length];
    specs[i] = { tint, ink, accent, motif: motifs[i % motifs.length], value: VALUES[Math.floor(rnd() * VALUES.length)], tilt: (rnd() - .5) * 7, mark: (rnd() - .5) * 30, seed: Math.floor(rnd() * 1e6) };
  }
  return specs[i];
}

// The stamp and postmark for letter i, as SVG markup. Ids are fresh on every call, so copies can share a page.
export function stampSVG(i) {
  const s = spec(i), n = ++uid, c = { ink: s.ink, accent: s.accent, tint: s.tint }, t = today();
  const date = String(t.d).padStart(2, '0') + '.' + String(t.m).padStart(2, '0') + '.' + String(t.y).slice(2);
  // perforations: holes every 8 units along each edge of the 100 × 124 stamp
  let holes = '';
  for (let x = 2; x <= 100; x += 8) holes += `<circle cx="${x + 70}" cy="8" r="2.6"/><circle cx="${x + 70}" cy="132" r="2.6"/>`;
  for (let y = 6; y <= 124; y += 8) holes += `<circle cx="70" cy="${y + 8}" r="2.6"/><circle cx="170" cy="${y + 8}" r="2.6"/>`;
  const cx = 74, cy = 100, wave = 'q5,-3 10,0t10,0t10,0t10,0t10,0t10,0t10,0t10,0';
  return `<svg viewBox="0 0 180 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs>
  <mask id="perf${n}"><rect x="70" y="8" width="100" height="124" fill="#fff"/><g fill="#000">${holes}</g></mask>
  <filter id="lift${n}" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.3" flood-color="#3a2410" flood-opacity=".35"/></filter>
  <path id="top${n}" d="M${cx - 20},${cy}A20,20 0 0,1 ${cx + 20},${cy}"/>
  <path id="bot${n}" d="M${cx - 23.5},${cy}A23.5,23.5 0 0,0 ${cx + 23.5},${cy}"/>
</defs>
<g transform="rotate(${s.tilt.toFixed(2)} 120 70)" filter="url(#lift${n})"><g mask="url(#perf${n})">
  <rect x="70" y="8" width="100" height="124" fill="${PAPER}"/>
  <g transform="translate(70,8)">
    <rect x="8" y="8" width="84" height="108" fill="${s.tint}" stroke="${s.ink}" stroke-width=".8"/>
    <rect x="11" y="11" width="78" height="102" fill="none" stroke="${s.ink}" stroke-width=".35"/>
    <text x="50" y="22" fill="${s.ink}" font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="8.6" letter-spacing="1.2" text-anchor="middle">VIỆT NAM</text>
    <g transform="translate(17,27) scale(.66)">${s.motif[1](c, seeded(s.seed))}</g>
    <text x="14" y="110" fill="${s.accent}" stroke="${s.ink}" stroke-width=".25" font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="10.5">${s.value}</text>
    <text x="86" y="109.5" fill="${s.ink}" font-family="'EB Garamond',Georgia,serif" font-style="italic" font-size="6.6" text-anchor="end">${s.motif[0]}</text>
  </g>
</g></g>
<g transform="rotate(${s.mark.toFixed(1)} ${cx} ${cy})" fill="none" stroke="#2a2230" stroke-opacity=".62" style="mix-blend-mode:multiply">
  <circle cx="${cx}" cy="${cy}" r="27" stroke-width="1.3"/><circle cx="${cx}" cy="${cy}" r="15" stroke-width=".8"/>
  <g stroke="none" fill="#2a2230" fill-opacity=".66" font-family="'EB Garamond',Georgia,serif" font-weight="700" letter-spacing="1">
    <text font-size="6.2"><textPath href="#top${n}" startOffset="50%" text-anchor="middle">${esc(CONFIG.title.toUpperCase())}</textPath></text>
    <text font-size="5.6"><textPath href="#bot${n}" startOffset="50%" text-anchor="middle">BƯU ĐIỆN</textPath></text>
    <text x="${cx}" y="${cy + 2.4}" font-size="7.2" text-anchor="middle" letter-spacing=".3">${date}</text>
  </g>
  <path d="M${cx + 30},${cy - 9}${wave}M${cx + 30},${cy - 3}${wave}M${cx + 30},${cy + 3}${wave}M${cx + 30},${cy + 9}${wave}" stroke-width="1.1"/>
</g>
</svg>`;
}

function esc(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]); }
