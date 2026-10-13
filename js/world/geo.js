// Geometry helpers: boxes placed in one call, planes with UVs in world units, arched shapes, and merging.

// Box of size w × h × d centred at x, y, z. UVs are scaled to world units, so a repeating texture tiles evenly.
export function box(w, h, d, x, y, z, ry) {
  const g = new THREE.BoxGeometry(w, h, d);
  worldUV(g, (face) => face < 2 ? [d, h] : face < 4 ? [w, d] : [w, h]);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}

// Plane of w × h in the XY plane, facing +z, with UVs in world units.
export function plane(w, h) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  return g;
}

// BoxGeometry has 6 groups of 4 vertices: ±x, ±y, ±z. size(face) gives that face's [u, v] size.
function worldUV(g, size) {
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) { const [su, sv] = size(f); for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); } }
}

// A wall w × h with an arched opening, extruded to thickness d and centred on z = 0.
export function archedWall(w, h, d, halfW, spring) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-halfW, 0); s.lineTo(-halfW, spring); s.absarc(0, spring, halfW, Math.PI, 0, true);
  s.lineTo(halfW, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -d / 2);
  return g;
}

// The moulded band around an arch: a ring of width `band`, extruded to thickness d.
export function archBand(halfW, spring, band, d) {
  const s = new THREE.Shape();
  s.moveTo(-halfW - band, 0); s.lineTo(-halfW - band, spring); s.absarc(0, spring, halfW + band, Math.PI, 0, true); s.lineTo(halfW + band, 0);
  s.lineTo(halfW, 0); s.lineTo(halfW, spring); s.absarc(0, spring, halfW, 0, Math.PI, false); s.lineTo(-halfW, 0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -d / 2);
  return g;
}

// Merges geometries into one, keeping position, normal, and uv (uv only if every input has it).
// three.js r128 ships no BufferGeometryUtils, so this stands in for it.
export function merge(geos) {
  const withUV = geos.every((g) => g.attributes.uv);
  let vc = 0, ic = 0;
  geos.forEach((g) => { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), uvs = withUV ? new Float32Array(vc * 2) : null, idx = new Uint32Array(ic);
  let vo = 0, io = 0;
  geos.forEach((g) => {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    if (withUV) uvs.set(g.attributes.uv.array, vo * 2);
    if (g.index) { const ia = g.index.array; for (let k = 0; k < ia.length; k++) idx[io + k] = ia[k] + vo; io += ia.length; }
    else { for (let k = 0; k < n; k++) idx[io + k] = vo + k; io += n; }
    vo += n; g.dispose();
  });
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (withUV) m.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}

// Adds one mesh per material from a map of { material: [geometries] }.
export function addMerged(parent, byMat) {
  for (const [mat, geos] of byMat) if (geos.length) parent.add(new THREE.Mesh(merge(geos), mat));
}
