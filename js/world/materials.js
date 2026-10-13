// Materials shared across the museum and the garden. createMaterials() fills M once, from buildWorld().
import { GALLERY_COLORS } from '../layout.js';
import { parquet, slabs, ashlar, damask, laylight, wash, grass, flagstone, foliage } from '../paint/surfaces.js';

// Colours below are written as they should look, so convert them to the renderer's linear space.
const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();

export const M = {};

export function createMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  M.brass = std({ color: 0xc9a063, metalness: .85, roughness: .3, envMapIntensity: 1.1 });
  M.gold = std({ color: 0xd4a85a, metalness: .9, roughness: .28, envMapIntensity: 1.35 });
  M.goldDeep = std({ color: 0x9a7234, metalness: .85, roughness: .4, envMapIntensity: 1.1 });
  M.velvet = std({ color: 0x8e1f35, roughness: .78, envMapIntensity: .3 });
  M.limestone = std({ color: lin(0xcdbfa3), roughness: .82, envMapIntensity: .35 });
  M.ashlar = std({ map: ashlar(), roughness: .85, envMapIntensity: .35 });
  M.marble = std({ color: lin(0x2e2826), roughness: .3, envMapIntensity: .8 });
  M.parquet = std({ map: parquet(), roughness: .38, metalness: .02, envMapIntensity: .55 });
  M.slabs = std({ map: slabs(), roughness: .25, envMapIntensity: .4 });
  M.ceiling = std({ color: lin(0xd9ceb8), roughness: .95, envMapIntensity: .2 });
  M.mat = std({ color: lin(0xf1ead9), emissive: lin(0x3b352c), roughness: .95, envMapIntensity: .15 });
  M.niche = std({ color: lin(0x6f6352), roughness: .9, envMapIntensity: .2 });
  M.wood = std({ color: lin(0x4a2e1e), roughness: .55, envMapIntensity: .5 });
  M.leather = std({ color: lin(0x3a3236), roughness: .6, envMapIntensity: .4 });
  M.bronze = std({ color: lin(0x6b5034), metalness: .7, roughness: .45, envMapIntensity: .9 });
  const dam = damask();
  M.fabric = GALLERY_COLORS.map((c) => std({ color: lin(c), map: dam, roughness: .88, envMapIntensity: .25 }));
  // Glass in the ceiling: lit from outside, so unlit here. sky.js sets its colour from night to dawn.
  M.laylight = new THREE.MeshBasicMaterial({ map: laylight(), color: 0x1d2742, toneMapped: false });
  M.wash = new THREE.MeshBasicMaterial({ map: wash(), transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending });
  M.grass = std({ map: grass(), roughness: 1, envMapIntensity: .2 });
  M.flagstone = std({ map: flagstone(), roughness: .9, envMapIntensity: .25 });
  M.hedge = std({ map: foliage(), roughness: .95, envMapIntensity: .2 });
  M.bark = std({ color: 0x4a3328, roughness: .9, envMapIntensity: .2 });
  return M;
}
