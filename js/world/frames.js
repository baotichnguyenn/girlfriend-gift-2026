// Gilded picture frames with a stepped profile: an outer bead, a flat panel, and a darker sight edge.
import { merge } from './geo.js';

// Four bars between an outer rectangle (ow × oh) and an inner one (iw × ih), `depth` deep, back at z0.
function ring(ow, oh, iw, ih, depth, z0, out) {
  const zc = z0 + depth / 2, bh = (oh - ih) / 2, bw = (ow - iw) / 2;
  const bar = (w, h, x, y) => { const g = new THREE.BoxGeometry(w, h, depth); g.translate(x, y, zc); out.push(g); };
  bar(ow, bh, 0, ih / 2 + bh / 2); bar(ow, bh, 0, -ih / 2 - bh / 2);
  bar(bw, ih, -iw / 2 - bw / 2, 0); bar(bw, ih, iw / 2 + bw / 2, 0);
}

// Geometry for a frame around a w × h opening, facing +z with its back at z = 0.
// Returns { gold, deep } for the two materials. f is the moulding width.
export function frameGeo(w, h, f = .17) {
  const gold = [], deep = [];
  ring(w + 2 * f, h + 2 * f, w + 2 * f - .1, h + 2 * f - .1, .15, 0, gold);
  ring(w + 2 * f - .1, h + 2 * f - .1, w + .1, h + .1, .1, 0, gold);
  ring(w + .1, h + .1, w, h, .12, 0, deep);
  return { gold: merge(gold), deep: merge(deep) };
}
