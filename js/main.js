// Entry point. Fills in the static copy, then checks that three.js and WebGL work before loading
// the rest. The other modules use THREE as soon as they are evaluated, so they are imported dynamically.
import { applyCopy, fail, BootError } from './ui/dom.js';

applyCopy();
if (!window.THREE) {
  fail('The 3D engine didn’t load. Check your connection and reload.');
} else {
  try {
    const { start } = await import('./app.js');
    start();
  } catch (e) {
    fail(e instanceof BootError ? e.message : 'The museum didn’t load. Reload to try again.');
    if (!(e instanceof BootError)) throw e;
  }
}
