# Museum of Us — notes for Claude

## What this is

A single-page, scroll-driven 3D experience built as a private gift.
A small figure of Bao's girlfriend walks a brass path through a museum at night.
Five letters hang along the path, and she must open them in a fixed order.
The format follows the scroll-driven chapter style of asklex.law/journey.

Read `DESIGN.md` before changing anything she will see.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole app: CSS, HTML overlays, and one inline script. No build step. |
| `DESIGN.md` | Visual language, 3D scene layout, camera, motion, copy voice. |
| `scripts/smoke_test.py` | Headless walkthrough. Saves screenshots and fails on page errors. |

## Run it

- Serve the folder: `python3 -m http.server 8000`, then open http://localhost:8000.
- Opening `index.html` directly from disk also works, except for a photo file set in `CONFIG.photo`.
  Chrome blocks WebGL from reading local image files over `file://`, so serve the folder when testing a photo.
- Add `#edit` to the URL to show the prototype tools: photo upload, unlock all, reset.

## Editing content

All content lives in `CONFIG` at the top of the inline script.

- `herName`: each letter opens with "Dear <herName>,".
- `from`: signature on letters and placards ("Gift of Bao").
- `photo`: path or `data:` URI. It becomes the figure's head and the final portrait.
- `dress`: hex colour of the figure's dress.
- `letters`: array of `{ title, medium, body: [paragraphs] }`. **Array order is the enforced reading order.**
  Text in `[square brackets]` renders highlighted as a placeholder.
- `finale`: eyebrow, title, and body for the last room.

The code assumes exactly five letters.
To change the count, update the station fractions in `S`, the seal and rail loops, every `< 5` and `=== 5` check, `ROMAN`, and the "five letters" copy.

## How the script is organised

The inline script runs top to bottom in these sections:

1. `CONFIG`.
2. Helpers and `store` (localStorage, every call wrapped in try/catch).
3. Renderer and scene setup. three.js r128 is loaded from cdnjs as the global `THREE`.
4. Canvas painters for textures: face, portrait, envelope, wax seal, placard.
5. The path. A centripetal Catmull-Rom curve through `PATH_PTS`.
   Position along it is arc length `s`, from `0` to `L`.
   Use `at(s)`, `tan(s)`, and `nrm(t)` rather than raw curve calls.
6. Stations. `S[i]` is where letter `i` hangs. `SB[i] = S[i] + 1.6` is its rope barrier. `S0` is where she lands after leaving the plinth.
7. `buildWorld()`: environment map, lights, floor, walls, wall art, plinth, path ribbon shader, exhibits, finale, barriers, rope lines, marker, dust, figure.
8. Order state: `readCount`, `gateS()`, `refresh()`.
9. HUD updates and input (wheel, pointer drag, keys, raycast clicks).
10. Letter overlay, finale overlay, `#edit` tools.
11. Camera rigs: intro, follow, station views (`VIEW`). They are blended by distance, then damped.
12. `tick()`, `resize()`, `start()`.

State machine: `loading → intro → entering → walk ⇄ reading`.
Input is ignored outside `walk`, except the intro hint.

## The order lock

This is the core requirement. Keep these invariants when changing anything.

- `readCount` is the number of letters opened, in order. Letter `i` can be opened only when `i <= readCount`.
- `gateS()` returns `S[readCount]`, or `L` once all five are read.
- `push()` clamps `sTarget` to the gate. That clamp is the only thing that stops her walking past a letter.
  Any new way of moving her (buttons, auto-walk, teleports) must go through the same clamp.
- `closeLetter()` increments `readCount` only when the closed letter is the current one. Re-reading an old letter changes nothing.
- `refresh()` re-derives everything from `readCount`: envelope textures, placards, light targets, ropes, seals, rail nodes. Call it after every `readCount` change.
- Progress persists in localStorage key `mou-read`. A previewed photo persists in `mou-photo`.
  `CONFIG.photo` wins over the stored photo.

## Constraints

- Keep it one self-contained file.
  The page is also published as a Claude artifact. That host only allows scripts from cdnjs, jsdelivr, or unpkg, and stylesheets from Google Fonts.
  Any image must be a `data:` URI or a same-folder file.
- three.js is pinned to **r128**. Use r128 APIs:
  `renderer.outputEncoding = THREE.sRGBEncoding`, `texture.encoding`, no `CapsuleGeometry`, no `BufferGeometryUtils`.
  The file has its own `mergeGeometries()` for this reason.
- Draw any new canvas text texture after `loadFonts()` resolves, or it will use fallback fonts.
- No `alert`, `confirm`, `prompt`, or `window.print`. The artifact host blocks them.
- Respect `prefers-reduced-motion`. The `reduceMotion` flag already disables chevron flow, pulsing, and dust drift.
- Every colour is a token in `:root`. The page is dark-only by design.
- Visibility is toggled with the `hidden` attribute, not inline `display` styles.

## Testing

```bash
pip install playwright
python -m playwright install chromium
python3 scripts/smoke_test.py
```

The script walks to the first letter, opens it, closes it, and checks the counter reads 1.
It also loads a phone-sized viewport.
Screenshots go to `scripts/out/`. It exits non-zero on a page error or a failed check.

Headless Chrome renders WebGL in software, so frames are slow.
The simulation clamps each frame to 0.05 s, so a fixed wait covers less walking than it would on a real device.
Wait on DOM state, such as `#prompt:not([hidden])`, rather than fixed timeouts.

Set `THREE_LOCAL=/path/to/three.min.js` to run without network access to cdnjs.

Manual checks before sharing a new version:

- Clicking the figure starts the walk. Scrolling on the intro shows the "click her first" toast.
- Scrolling stops at each letter. Pushing further shakes the rope and shows the rule.
- Breaking the seal opens the letter. Closing it swings the rope open and lights the next gallery.
- The finale appears after letter V.
- At 390 px wide, she stays in frame while walking and at each letter.

## Publishing as a Claude artifact

The artifact host adds its own `<!doctype>`, `<html>`, `<head>`, and `<body>`.
To republish, use the content between `<body>` and `</body>` only.

## Privacy

The letters and her photo are personal.
Keep this repository private.
Do not add analytics, trackers, or third-party embeds.
