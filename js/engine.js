// The renderer, scene, and camera that every 3D module uses.
// three.js r128 is the global THREE, loaded from cdnjs before any module runs.
import { ui, BootError } from './ui/dom.js';

function createRenderer() {
  try {
    return new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { throw new BootError('This browser couldn’t start 3D graphics. Try the latest Chrome or Safari.'); }
}

export const renderer = createRenderer();
export const V3 = THREE.Vector3;
export const UP = new V3(0, 1, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
export const ANISO = renderer.capabilities.getMaxAnisotropy();

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0b12);
scene.fog = new THREE.Fog(0x0e0b12, 15, 50);
export const camera = new THREE.PerspectiveCamera(50, 1, 0.2, 260); // a near plane of 0.2, not 0.1, doubles depth precision

// Meshes the pointer can click. Each has userData.kind: 'her', 'exhibit' (with userData.i), or 'finale'.
export const clickables = [];
