# Museum of Us — notes for Claude

## What this is

A single-page 3D experience built as a private gift.
A small figure of Bao's girlfriend walks a brass path through a museum at night, styled after a great museum's Great Hall and painting galleries.
Her photos hang on the gallery walls. Five letters stand along the path, and she must open them in a fixed order.
After the last letter, doors open onto a flower garden at dawn, where her portrait waits.
The format follows the chapter style of asklex.law/journey.
She walks the figure with the arrow keys or the on-screen arrows, and looks around with the mouse or a finger.

Read `DESIGN.md` before changing anything she will see.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Markup for the HUD and overlays. Loads three.js, `css/museum.css`, then `js/main.js`. |
| `css/museum.css` | All styles. Colour tokens are in `:root`. |
| `js/` | The app as native ES modules. See "How the code is organised". No build step. |
| `displayed photos/` | Her photos for the gallery walls, named `1.jpg`, `2.jpg`, … Has its own `README.md`. |
| `DESIGN.md` | Visual language, 3D scene layout, camera, motion, copy voice. |
| `scripts/smoke_test.py` | Headless walkthrough. Saves screenshots and fails on page errors. |

## Run it

- Serve the folder: `python3 -m http.server 8000`, then open http://localhost:8000.
- Opening `index.html` directly from disk doesn't work. Chrome won't load ES modules over `file://`, and the loader says so.
- Add `#edit` to the URL to show the prototype tools: photo upload, unlock all, reset.

## Editing content

All content lives in `CONFIG` in `js/config.js`.

- `herName`: each letter opens with "Dear <herName>,".
- `from`: signature on letters and placards ("Gift of Bao").
- `photo`: path relative to `index.html`, or a `data:` URI. It becomes the figure's head and the final portrait.
- `dress`: hex colour of the figure's dress.
- `photoTitles`: optional wall-label titles for the photos, in number order.
- `letters`: array of `{ title, medium, body: [paragraphs] }`. **Array order is the enforced reading order.**
  Text in `[square brackets]` renders highlighted as a placeholder.
- `finale`: eyebrow, title, and body for the card in the garden.

Wall photos are files, not config. Put them in `displayed photos/` named `1.jpg`, `2.jpg`, … (`.jpeg`, `.png`, and `.webp` also work).
`photos.js` loads them in order and stops at the first missing number. There are 30 frames; any without a photo shows a painting.
With `#edit`, each wall label shows its slot number, and the edit panel says how many photos loaded.

The code assumes exactly five letters.
To change the count, update:

- the gallery lists in `layout.js`: `PARTITION_Z` (one arch per gallery), `STATION_SIDE`, and `GALLERY_COLORS`
- the `5` and `6` loop bounds, every `< 5`, `>= 5`, and `=== 5` check across `js/`, and the `4` in `updateHUD()`
- `ROMAN` (`util.js`) and the `/ 05` counter (`ui/hud.js`)
- the "five letters" copy in `config.js`, `world/museum.js`, and `index.html`

## How the code is organised

| Module | Contents |
| --- | --- |
| `main.js` | Entry point. Applies the static copy, checks that three.js loaded, then imports `app.js`. |
| `app.js` | `start()` and the frame loop `tick()`. |
| `config.js` | `CONFIG`. |
| `util.js` | Maths helpers, `ROMAN`, `YEAR`, the `reduceMotion`, `coarse`, and `EDIT` flags, and `store` (localStorage, every call wrapped in try/catch). |
| `state.js` | `state`: the values more than one module writes. `mode`, `s`, `sTarget`, `readCount`, `time`. |
| `engine.js` | `renderer`, `scene`, `camera`, `V3`, and `clickables`, the meshes the pointer can hit. Throws `BootError` if WebGL won't start. |
| `layout.js` | The floor plan as plain numbers: room size, where each arch, letter, chandelier, and the doors stand, and each gallery's colour. |
| `path.js` | The path, built from `layout.js`, and its stations (see below). |
| `order.js` | The order lock (see below). |
| `camera.js` | Camera rigs: intro, follow, and station views. Blended by distance, turned and zoomed around her by `orbitBy()` and `zoomBy()`, kept out of walls, then damped. Also `resetView()`, `snapCamera()`, and `resize()`. |
| `input.js` | Hold-to-walk from arrow keys and the on-screen arrows (`updateInput()`), drag to look, wheel or pinch to zoom, double-click to reset the view, and raycast clicks. |
| `paint/canvas.js` | Canvas texture helpers: `canvasTex()`, `makeTex()`, `spaced()`, `rrect()`, `fitFont()`. |
| `paint/photo.js` | Her face and portrait textures. `setPhoto(src)`, or `setPhoto(null)` for the drawing. |
| `paint/stationery.js` | Painters for wax seals, envelopes, and placards. |
| `paint/surfaces.js` | Painters for parquet, marble, ashlar, damask, skylight glass, wall washes, lawn, flagstones, foliage, petals, and placeholder paintings. |
| `world/index.js` | `buildWorld()`: the environment map, materials, then the sky, building, chandeliers, photos, ribbon, garden, exhibits, doors, ropes, marker, dust, and her. Also `updateWorld()`, `settleWorld()`, and `warmUp()`, which compiles the garden's shaders during loading. |
| `world/materials.js` | `M`, the shared materials. `createMaterials()` runs first in `buildWorld()`. |
| `world/geo.js` | Geometry helpers: `box()`, `plane()` with world-unit UVs, `archedWall()`, `archBand()`, `merge()`, `addMerged()`. |
| `world/museum.js` | The building: floors, walls, arches, ceilings, skylights, cornices, the Great Hall, urns, benches, the carved title, dust. |
| `world/chandeliers.js` | A Louis XV crystal chandelier in each room, all sharing a few draw calls, and the two lights that follow her to the nearest ones. |
| `world/photos.js` | The 30 photo frames, their labels and wall washes, and `loadPhotos()`. |
| `world/frames.js` | `frameGeo()`: a gilded frame around any opening. Used by the photos and the letters. |
| `world/flora.js` | Flower geometry, a wind-sway shader, the instanced `flora()` collector, `plant()`, and `urn()`. |
| `world/ribbon.js` | The path ribbon shader: walked, open to the gate, locked. |
| `world/exhibits.js` | The five letter piers, the portrait on its easel, spotlights, and the marker. Owns `EX`, `fin`, and `VIEW`. |
| `world/ropes.js` | Stanchions, rope lines, and the barrier past each letter. |
| `world/doors.js` | The garden doors. They open once `readCount` is 5 and she comes near. |
| `world/sky.js` | Lights, the sky dome, and the night-to-dawn change that follows the doors. |
| `world/garden.js` | The garden, the falling petals, and the switch that hides it all until the doors open. |
| `world/her.js` | Her figure, her fill light, and `updateHer()`: movement toward `sTarget`, the plinth hop, walk cycle, waving, facing. |
| `ui/dom.js` | `ui` element map, `toast()`, `fail()`, `fillBody()`, `applyCopy()`, `BootError`. |
| `ui/hud.js` | `enter()`, seals, chapter block, progress rail, station prompt. |
| `ui/letter.js` | Letter overlay. |
| `ui/finale.js` | Finale overlay and the trigger at the end of the path. |
| `ui/edit.js` | `#edit` tools. |

The path is a centripetal Catmull-Rom curve through `PATH_PTS`.
Position along it is arc length `s`, from `0` to `L`.
Use `at(s)`, `tan(s)`, and `nrm(t)` rather than raw curve calls.
`S[i]` is where letter `i` hangs. `SB[i] = S[i] + 1.6` is its rope barrier. `S0` is where she lands after leaving the plinth.

Start-up:

1. `main.js` calls `applyCopy()`. If `THREE` is missing, it shows an error in the loader.
   Otherwise it imports `app.js`. If `engine.js` throws `BootError`, it shows that message instead.
2. `start()` wires listeners (`init*()`), waits for `loadFonts()`, then builds: `setPhoto(null)`, `buildWorld()`, `buildHud()`.
3. It restores progress, settles lights, ropes, and sky, applies the photo, calls `resize()` and `warmUp()`, sets mode to `intro`, and starts `tick()`.
4. Once the intro shows, `loadPhotos()` hangs the wall photos one by one.

Each frame, `tick()` runs `updateInput`, `updateHer`, `updateCamera`, `updateWorld`, `updateFinaleTrigger`, `updateHUD`, and `updateHover`, then renders.
Her update comes first because the camera follows `herXZ`.
`updateWorld()` runs the doors first, then the sky, so dawn follows the doors in the same frame.

State machine (`state.mode`): `loading → intro → entering → walk ⇄ reading`.
Walking only works in `walk`. Looking around also works in `intro` and `entering`. Pressing ↑ on the intro shows a hint instead.

Rules for the modules:

- They are plain ES modules with relative `.js` imports. No bundler and no npm packages.
- `THREE` is the global from the cdnjs script tag.
  Modules can use it at the top level because `main.js` checks for it before importing `app.js`.
  `ui/dom.js`, `config.js`, and `util.js` load before that check, so they must not touch `THREE`.
- An imported binding can't be reassigned. Values that several modules write go on `state`.
  Values that only one module writes stay private to it, behind a function such as `snapCamera()`, `wave()`, or `wobbleBarrier()`.
- There are no import cycles. Keep it that way: pass a value in, or move it to a lower module.
- New code follows the same pattern. `build*()` and `init*()` run once from `start()`, and `update*()` runs from `tick()`.

## The order lock

This is the core requirement. It lives in `order.js`. Keep these invariants when changing anything.

- `state.readCount` is the number of letters opened, in order. Letter `i` can be opened only when `i <= readCount`.
- `gateS()` returns `S[readCount]`, or `L` once all five are read.
- `walkTo()` and `placeAt()` clamp to the gate, and they are the only code that sets `state.sTarget`.
  That clamp is the only thing that stops her walking past a letter.
  Any new way of moving her (buttons, auto-walk, teleports) must call one of them.
  Holding an arrow calls `push()` in `input.js` each frame, which goes through `walkTo()`.
  `updateHer()` moves `state.s` toward `sTarget`, never past it.
- Only `order.js` changes `readCount`: `restoreProgress()`, `markRead()`, `unlockAll()`, `resetProgress()`.
- `markRead(i)` increments `readCount` only when `i` is the current letter. `closeLetter()` calls it, so re-reading an old letter changes nothing.
- `refresh()` re-derives everything from `readCount`: envelope textures, placards, light targets, ropes, seals, rail nodes.
  Every `readCount` change calls it.
- The garden doors read `readCount` but never change it. She can only reach them because `gateS()` is `L` once all five are read.
  Resetting progress closes the doors and brings the night back.
- Progress persists in localStorage key `mou-read`. A previewed photo persists in `mou-photo`.
  `CONFIG.photo` wins over the stored photo.

## Constraints

- No build step. The browser loads `index.html`, `css/`, and `js/` exactly as they are in the repo.
- The page is also published as a Claude artifact.
  That host only allows external scripts from cdnjs, jsdelivr, or unpkg, and external stylesheets from Google Fonts.
  Everything else must be a file in this folder or a `data:` URI.
- three.js is pinned to **r128**. Use r128 APIs:
  `renderer.outputEncoding = THREE.sRGBEncoding`, `texture.encoding`, no `CapsuleGeometry`, no `BufferGeometryUtils`.
  `world/geo.js` has its own `merge()` for this reason.
- Draw any new canvas text texture after `loadFonts()` resolves, or it will use fallback fonts.
- No `alert`, `confirm`, `prompt`, or `window.print`. The artifact host blocks them.
- Respect `prefers-reduced-motion`. The `reduceMotion` flag already disables chevron flow, pulsing, dust drift, flower sway, falling petals, candle flicker, and crystal glints, and makes the doors and dawn instant.
- Keep it light enough for a phone.
  Flowers and crystals are `InstancedMesh`es, static building parts are merged per material, and photos are scaled down to 768 px.
  Don't give each chandelier its own light: two shared lights follow her, so the light count, and so the shaders, never change.
  The garden stays hidden until the doors open.
  In r128, an `InstancedMesh` is culled by its base geometry's bounds, so set `frustumCulled = false` on every one.
- Scene colours are written as they should look. Pass them through `lin()` (sRGB to linear), as `materials.js` does.
- Every UI colour is a token in `:root`. The UI is dark-only by design; only the garden at the end of the walk is bright.
- Visibility is toggled with the `hidden` attribute, not inline `display` styles.

## Testing

```bash
pip install playwright
python -m playwright install chromium
python3 scripts/smoke_test.py
```

The script holds ↑ to walk to the first letter, checks the rope holds, opens and closes the letter, and checks the counter reads 1.
It then checks that dragging doesn't move her and that holding the on-screen arrow does.
It also loads a phone-sized viewport.
Screenshots go to `scripts/out/`. It exits non-zero on a page error or a failed check.

Headless Chrome renders WebGL in software, so frames are slow.
Once the garden is visible, a single frame can take tens of seconds, so the smoke test stops at the first letter.
The simulation clamps each frame to 0.05 s, so a fixed wait covers less walking than it would on a real device.
Wait on DOM state, such as `#prompt:not([hidden])`, rather than fixed timeouts.

Set `THREE_LOCAL=/path/to/three.min.js` to run without network access to cdnjs.
Set `CHROME_PATH` to use an installed Chrome instead of Playwright's Chromium.

Manual checks before sharing a new version:

- Clicking the figure starts the walk. Pressing ↑ on the intro shows the "click her first" toast.
- Holding ↑ stops her at each letter. Holding on shakes the rope and shows the rule.
- Dragging turns the view without moving her. Walking swings it back behind her. Double-click resets it.
- The on-screen arrows walk her while held, on a phone and with a mouse.
- Breaking the seal opens the letter. Closing it swings the rope open and lights the next gallery.
- After letter V, the doors open, dawn comes up, and the finale appears on the garden terrace.
- Photos from `displayed photos/` hang in order, and frames fit their shape.
- At 390 px wide, she stays in frame while walking and at each letter.
- The published artifact gets past the loader. A module file missing from the publish stops it there.

## Publishing as a Claude artifact

The artifact host adds its own `<!doctype>`, `<html>`, `<head>`, and `<body>`.
To republish:

- Publish the content between `<body>` and `</body>` of `index.html` as the page.
- Pass `css/museum.css` and every file under `js/` as supporting files, at the same relative paths, such as `js/world/her.js`.
- Pass each photo in `displayed photos/` the same way, such as `displayed photos/1.jpg`.
  The folder name has a space, so check on the first publish that the photos load.

## Privacy

The letters, her photo, and the photos in `displayed photos/` are personal.
Keep this repository private.
Do not add analytics, trackers, or third-party embeds.
