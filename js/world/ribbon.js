// The brass line on the floor, drawn by a shader in three zones:
// walked (solid), open ahead up to the gate (flowing chevrons), and locked (faint dots).
import { reduceMotion } from '../util.js';
import { state } from '../state.js';
import { scene, V3 } from '../engine.js';
import { L, S, at, tan, nrm } from '../path.js';
import { gateS } from '../order.js';

let pathMat;

export function buildPathRibbon() {
  const N = Math.ceil(L / .2), pos = [], dist = [], side = [], idx = [];
  const p = new V3(), t = new V3(), n = new V3();
  for (let i = 0; i <= N; i++) {
    const sv = i / N * L; at(sv, p); tan(sv, t); nrm(t, n); const w = .34;
    pos.push(p.x + n.x * w, .012, p.z + n.z * w, p.x - n.x * w, .012, p.z - n.z * w);
    dist.push(sv, sv); side.push(0, 1);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setIndex(idx);
  pathMat = new THREE.ShaderMaterial({
    uniforms: { uS: { value: 0 }, uGate: { value: S[0] }, uTime: { value: 0 }, uCol: { value: new THREE.Color(0xd8ad6a) } },
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -16, // on top of the garden gravel, which it lies on
    vertexShader: 'attribute float aDist; attribute float aSide; varying float vD; varying float vSide; varying float vDepth; void main(){ vD=aDist; vSide=aSide; vec4 mv=modelViewMatrix*vec4(position,1.0); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader: [
      'uniform float uS; uniform float uGate; uniform float uTime; uniform vec3 uCol;',
      'varying float vD; varying float vSide; varying float vDepth;',
      'void main(){',
      '  float u = vSide - 0.5;',
      '  float edge = smoothstep(0.0,0.2,vSide)*smoothstep(1.0,0.8,vSide);',
      '  float a = 0.0;',
      '  if (vD < uS) { a = 0.5*edge; }',
      '  else if (vD < uGate) {',
      '    float f = fract(vD*0.8 + abs(u)*0.9 - uTime*0.9);',
      '    float chev = smoothstep(0.0,0.06,f)*smoothstep(0.30,0.22,f);',
      '    a = (0.16 + 0.75*chev)*edge;',
      '  } else {',
      '    float d = fract(vD*1.1);',
      '    float dotm = 1.0 - smoothstep(0.10,0.16,length(vec2((d-0.5)*0.9, u*0.9)));',
      '    a = 0.2*dotm;',
      '  }',
      '  a *= 1.0 - smoothstep(18.0,46.0,vDepth);',
      '  gl_FragColor = vec4(uCol, a);',
      '}'
    ].join('\n')
  });
  scene.add(new THREE.Mesh(g, pathMat));
}

export function updatePathRibbon() {
  pathMat.uniforms.uS.value = (state.mode === 'intro' || state.mode === 'entering' || state.mode === 'loading') ? 0 : state.s;
  pathMat.uniforms.uGate.value = gateS();
  pathMat.uniforms.uTime.value = reduceMotion ? 0 : state.time;
}
