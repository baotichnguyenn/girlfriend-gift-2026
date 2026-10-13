// Prototype tools, shown only when the URL ends in #edit: photo upload, unlock all, reset.
import { EDIT, store } from '../util.js';
import { state } from '../state.js';
import { S0 } from '../path.js';
import { placeAt, resetProgress, unlockAll } from '../order.js';
import { snapCamera } from '../camera.js';
import { setPhoto } from '../paint/photo.js';
import { settleBarriers } from '../world/ropes.js';
import { ui, toast } from './dom.js';

export function initEdit() {
  if (!EDIT) return;
  ui.editPanel.hidden = false;
  ui.photoInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const m = 900, sc = Math.min(1, m / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', .86); store.set('mou-photo', url); setPhoto(url); toast('Photo updated.');
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  });
  ui.clearPhoto.addEventListener('click', () => { store.del('mou-photo'); setPhoto(null); toast('Back to the drawing.'); });
  ui.unlockAll.addEventListener('click', () => { unlockAll(); toast('All letters unlocked.'); });
  ui.resetAll.addEventListener('click', () => {
    resetProgress(); settleBarriers(); // close the ropes at once rather than swinging them shut
    if (state.mode !== 'intro' && state.mode !== 'loading') { placeAt(S0); snapCamera(); }
    toast('Progress reset.');
  });
}
