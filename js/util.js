// Helpers shared by every module: maths, numerals, device flags, and localStorage.

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export const YEAR = new Date().getFullYear();
export const $ = (q) => document.querySelector(q);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const angleDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
export function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = matchMedia('(pointer: coarse)').matches;
export const EDIT = location.hash === '#edit';

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
};
