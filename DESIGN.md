# Museum of Us — Design

## Concept

A private museum at night, open for one visitor.
It is built in the manner of a great encyclopedic museum, the Metropolitan Museum of Art in particular:
a limestone entrance hall with flowers in urns, then painting galleries with silk-covered walls, gilded frames, parquet floors, and skylights, joined by arches in a long enfilade.
No name, logo, or branding of a real museum appears on the page.

The museum is the reason the order feels natural rather than forced.
Velvet ropes, gallery lights, numbered exhibits, and placards all say "this way, one at a time".
Her own photographs hang on the gallery walls.
When the last letter is read, the doors at the end open onto a French flower garden on a clifftop at dawn, with mountains beyond, where her portrait waits under an arch of roses.

The structure follows asklex.law/journey: a loader, an intro statement, then a guided 3D walk.
She walks the figure with the arrow keys or the on-screen arrows, and looks around the space with the mouse or a finger.
A chapter HUD shows a counter, the current gallery, and a progress rail.

## Experience flow

1. **Loader.** "Lighting the galleries…" while fonts load and the scene builds.
2. **Intro.** In the Great Hall, her figure stands on a plinth before an arched bronze door, under the carved title, between two urns of flowers.
   Headline: "Five letters. One way through."
   She clicks the figure, or the "Enter the museum" button.
   Pressing ↑ here only shows a toast asking her to click the figure first. Dragging already turns the view around her.
3. **Walk.** Holding ↑ (or the on-screen ▲) walks the figure forward along the brass line, through an arch into each gallery. ↓ (or ▼) walks her back.
   The camera follows from behind. Dragging turns it around her, and scrolling or pinching zooms.
4. **Arrival.** Near a letter, the camera swings to frame her and the frame. A prompt card offers "Open the letter".
5. **Letter.** An envelope with a wax seal numbered I–V. She breaks the seal, and the letter rises out.
   "Fold it away" closes it.
6. **Unlock.** The rope barrier swings open. The next gallery's light comes up. The brass marker moves to the next frame.
7. **The garden.** After letter V, the marker moves to the tall doors at the end of the last gallery.
   As she nears them, they swing open and dawn comes up: the sky, the skylights, and the light all warm from night to sunrise.
   The path continues down a gravel allée lined with flowers to an arch covered in roses, where her portrait stands on an easel, with the mountains behind it.
   The finale card reads "The last exhibit is you."

## Palette

The page UI is dark-only. Every UI colour is a CSS token in `:root`.
The HUD has a soft dark gradient behind it (`--scrim-edge`), so it stays readable over the bright garden.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0e0b12` | Page and scene background, fog colour |
| `--brass` | `#c9a063` | Accent: eyebrows, path, frames, primary button |
| `--brass-hi` | `#e7c88f` | Emphasis text, hover, focus ring |
| `--brass-ink` | `#7a5a2c` | Brass-coloured text on parchment |
| `--parchment` | `#efe3cb` | Main text on dark; envelope and paper |
| `--parch-light` / `--parch-deep` | `#f7efde` / `#e0cfae` | Paper gradient ends |
| `--parch-ink` | `#33241f` | Text on paper |
| `--velvet` / `--velvet-hi` | `#8e1f35` / `#b0304b` | Wax seals, ropes, "read" state, close button |
| `--mist` / `--mist-dim` | `#bcb2c4` / `#7f7588` | Secondary and tertiary text |
| `--hair` | brass at 28% | Hairlines and card borders |

Scene colours, set in the modules under `js/world/`:

| Element | Value |
| --- | --- |
| Limestone (Great Hall, arches, cornices) | `#cdbfa3`, ashlar blocks `#b9aa8e` |
| Gallery silk, I to V | `#7a2b31` red, `#40594b` green, `#34495f` blue, `#5a3048` plum, `#8a5236` terracotta |
| Galleries floor | Oak herringbone parquet |
| Great Hall floor | Warm marble slabs |
| Skirting, thresholds, plinth | Dark marble `#2e2826` |
| Picture frames | Gold `#d4a85a` with a darker sight edge `#9a7234`; cream mats `#f1ead9` |
| Skylights | `#1d2742` at night, `#fff0da` at dawn |
| Spotlights / wall washes | `#ffdcb0` / warm additive pools above each frame |
| Chandeliers | Gilt bronze (the frame gold), cut crystal `#fdfaf4`, wax `#f4ecdb`, candlelight `#ffc98f` |
| Light beams | `#ffd9a0`, additive |
| Night fog / dawn haze | `#0e0b12` / `#f0cdb6` |
| Garden | Lawn, raked gravel `#cdbfa6`, limestone balustrade, treillage green `#2f4a3c`, water `#7f9fb0` |
| Arch flowers | Blush, pink, white, and cream roses and peonies with a few deep pinks (`ARCH` in `garden.js`) |
| Mountains | Five ridges from `#454f4c` (near) to `#ccbfd1` (far), fading into a warm mist |
| Figure skin / shoes | `#f0c6a6` / `#2a1a1f` |
| Figure dress | `CONFIG.dress`, default `#b8576b` |

Scene colours are written as they should look, and converted to linear with `lin()` in `materials.js` and `flora.js`.

## Type

| Role | Face | Notes |
| --- | --- | --- |
| Display | Bodoni Moda | Headlines and titles, usually italic. Museum-catalogue feel. |
| Labels and UI | Archivo | Uppercase, letter-spacing 0.15–0.24em, 0.6–0.8rem. Like wall text. |
| Letters | Kalam | Handwriting for letter bodies, greeting, and signature. Light weight for body. |

All three load from Google Fonts and have system fallbacks.
Canvas textures (placards, envelopes, wall title) use the same faces.

## Layout

- The canvas is full-bleed. The HTML sits on top like wall text in the corners.
- Top left: wordmark. Top right: five small wax seals showing progress.
- Bottom left: chapter block with counter (`01 / 05`), gallery name, and italic letter title.
- Bottom right: walk hint and the progress rail. Rail nodes sit at each letter's real position along the path.
- Right edge: two square walking arrows, ▲ above ▼. Below the seals on wide screens; halfway down on phones, within thumb reach. They light up brass while held, by touch or by key.
- Below 720 px wide, the rail drops its "Entrance → Garden" label to keep the walk hint on one line.
- The station prompt sits above the rail on wide screens, and centred above the HUD on phones.
- Side gutter is `max(16px, 4vw)`. Fixed bars add safe-area insets.
- Below 720 px wide, the bottom HUD stacks into one column and the intro moves to the top of the screen.
- Buttons and cards have 2 px corners, like gallery signage. No pill shapes.

## 3D scene

One unit is about 0.75 m. The numbers that place everything are in `js/layout.js`.

- **Building:** 24 units wide, ceilings at 10, running toward −z.
  - The Great Hall, 18 units deep, is limestone ashlar with pilasters and arched niches.
    Behind the plinth, the entrance wall has a bronze door in a limestone arch, with the title carved above it.
    Four urns of flowers stand on pedestals: two flanking the plinth, and two flanking the arch into Gallery I.
  - Five galleries, 17 units each, are joined by walls with arched openings 8 units wide, so the arches line up in an enfilade.
    Each gallery has silk damask walls in its own colour, dark marble skirting, a limestone picture rail and cornice, an oak parquet floor, a skylight, and a bench.
  - The last gallery ends in a wall with tall double doors under a half-round window.
- **Chandeliers:** one in the middle of every room, after the crystal chandeliers of Versailles in the Louis XV style.
  Each has a gilt-bronze baluster stem ending in a pinecone finial, eight lower arms that swoop down and curl up to their candles, six upper arms, and a C-scroll under each lower arm.
  Swags of crystal beads hang between the arms, with prism drops under each candle cup, at each swag's lowest point, around the crown, and around the finial.
  It hangs on a chain from a gilded ceiling rose in the middle of the skylight. The Great Hall's is 1.3 times the size.
  The candles flicker, the crystals glint now and then, and a warm halo surrounds each chandelier, with a glow on the ceiling above.
  Two warm lights follow her to the nearest chandeliers, so the room she is in is lit by its own.
- **Path:** a centripetal Catmull-Rom curve about 120 units long.
  It runs straight through the middle of every arch and swings 3.5 units to one side at each letter, alternating sides.
  It is drawn as a shader ribbon with three zones:
  - walked: solid brass
  - open ahead: brass chevrons flowing forward
  - locked: faint dots
- **Letters:** one in the middle of each gallery.
  Each pier stands 3.1 units off the path, on the side away from the middle of the room.
- **Exhibit:** a pier dressed in the gallery's silk, with a limestone cap and a marble base, a gilded frame around the envelope, and a placard.
  The placard follows museum credit-line convention: exhibit number, title, medium and year, "Gift of Bao", and a status line.
- **Exhibit states:**

  | State | Envelope | Spotlight | Extras |
  | --- | --- | --- | --- |
  | Locked | Sealed, dimmed | 0.45, faint beam | Placard: "Opens after Exhibit N" |
  | Current | Sealed, gently pulsing glow | 2.9, strong beam | Brass marker floats overhead |
  | Read | Opened, letter peeking out | 1.7 | Placard: "Opened" |

- **Photographs:** 30 frames, six per gallery: two on each side wall, and two on the wall ahead, either side of the arch.
  Each photo from `displayed photos/` gets a cream mat and a gilded frame sized to its shape, a warm wash of light on the wall behind it, and a wall label.
  Frames without a photo hold a soft landscape painting.
- **Ropes:** brass stanchions at ±1.25 units either side of the path, every 3 units, joined by sagging velvet rope. They stop at the garden doors.
  Gaps open on the exhibit side near each letter.
  A barrier rope crosses the path 1.6 units past each letter. It swings about 100° open when that letter is closed.
- **Figure:** a chibi body built from primitives, about 2.1 units tall.
  The head is a camera-facing sprite: her photo cropped to a circle with a brass ring.
  Without a photo, a drawn placeholder face is used.
- **Garden:** a terrace on a clifftop, 52 units wide and 37 deep, inspired by the rose garden at Bagatelle, the water lilies at Giverny, and a cottage dahlia garden.
  - A limestone balustrade with urns runs along the cliff edge. Below it, rock falls away into misty valleys.
    Beyond, five layers of mountain ridges fade into haze, nearer ones darker, with the sun just above the peaks.
    The ridges are painted by the sky dome's shader, which follows the camera.
  - A gravel allée runs from the doors to the flower arch. Rounded box hedges and topiary cones line its first stretch; mounds of roses, peonies, and hydrangeas line the rest, like a wedding aisle.
  - The arch is a square frame covered in roses, peonies, hydrangea, and greenery, fullest at its top corners and spilling at its feet. Her portrait stands on an easel inside it, with the mountains behind.
  - Front left: a round water-lily basin with a limestone rim, ringed by lavender. Beside the allée, a bed of tulips, peonies, and poppies; past the basin, a mixed bed of peonies, roses, poppies, foxgloves, and cosmos.
  - Front right: lilies (white, blush, stargazer pink, orange, yellow) and irises in drifts.
  - Back left: a rose parterre of four curved beds in pinks, reds, and whites, round a green trellis rotunda covered in climbing roses and ringed by white roses.
  - Back right: a cottage garden of dahlias, foxgloves and delphiniums, cosmos, poppies, and roses, round a pergola hung with wisteria.
  - Along the cliff, a border of white and blush roses, lavender, foxgloves, daisies, and poppies, either side of the view behind the arch. Garlands of roses drape the balustrade rail.
  - Every bed sits on leafy ground cover, so no bare lawn shows between the flowers.
  - Hydrangeas line the museum's garden front, lavender lines the side balustrades, two cherry trees blossom in the front corners, and cypresses frame the view at the back.
  - Butterflies wander over the beds, and petals drift down the allée.
  - Her portrait is lit only after all five letters are read. The garden is hidden until the doors start to open.

## Camera

Four rigs, blended by how close she is to each station, then exponentially damped:

- **Intro:** in front of her at the plinth. On wide screens it is offset so she sits right of the intro text.
- **Follow:** behind and slightly to one side, looking ahead along the path.
- **Station:** on the far side of the path from the exhibit, framing her in the foreground and the frame behind.
  Blend weight ramps from 0 at 3.6 units away to 1 at 0.4 units.
- **Finale:** behind her at the end of the allée, looking through the flower arch at the portrait and the mountains.

Looking around sits on top of whichever rig is active:

- Dragging (mouse or one finger) swings the camera around her: left and right all the way round, up and down within limits.
  Dragging up lowers the camera and tilts the view up, to the chandeliers and skylights.
- The wheel or a pinch zooms between half and nearly twice the rig's distance.
- Double-click eases the view back to the rig's own framing.
- While she walks, the view swings back behind her by itself. Zoom stays where it was put.
- The camera never goes through a wall, a chandelier, the floor, or the ceiling. If the line from her to the camera is blocked, it pulls in closer to her.

Portrait-shaped screens pull every rig back and reduce side offsets so she stays in frame.
The wall title is hidden on portrait screens because it would sit behind the intro text.
During the intro-to-walk transition, the camera arcs sideways so it never passes through her.

## Motion

- The walk cycle (legs, arms, bob, head sway) is driven by distance moved, so it matches speed.
- Holding an arrow moves her target at 4.6 units per second. She eases toward it, capped at 7.5 units per second, and slows to a stop when the arrow is released.
- She turns to face a letter when she stops beside it.
- On the intro she waves every few seconds to invite a click. She also waves when clicked during the walk.
- Rope opening, light changes, and overlays all ease over 0.4–0.8 s.
- The garden doors swing open over about 2 s. Dawn takes about 5 s to come up.
- Flowers sway in a light wind, petals drift down, and butterflies flit over the beds.
- Reduced motion: no chevron flow, pulsing, dust drift, marker bob, swaying flowers, falling petals, butterflies, flickering candles, or glinting crystal. Overlays switch instantly, the doors open at once, and dawn comes up at once.

## Copy voice

- Plain, warm, and short.
- Museum vocabulary: Exhibit, Gallery, placard, "Gift of".
- When the rule blocks her, say what to do: "The rope stays up until you open Letter II."
- Buttons say exactly what happens: "Open the letter", "Fold it away", "Walk it again".

## Accessibility

- Keyboard: hold ↑ or → (or W) to walk forward, and ↓ or ← (or S) to walk back. Enter opens the letter at a station. Escape closes an open letter or the finale.
- The on-screen arrows are real buttons with labels. From the keyboard, each press takes one step.
- Focus moves to the seal, then to the close button, inside the letter dialog.
- Visible brass focus ring on every control.
- The chapter block and toasts are `aria-live` regions.

## Avoid

- A light UI theme. The night-museum look is deliberate. Only the garden at the end is bright.
- The name, logo, or branding of any real museum.
- Revealing the text of a locked letter anywhere, including tooltips or placards.
- Pill buttons, emoji, and generic gradient heroes.
- Any way to skip ahead that bypasses `gateS()`.

## Open questions

- Walking speed and drag sensitivity need tuning on a real phone.
- An optional soundtrack, started from a click, would suit the setting.
- Her photo still needs to be embedded as a `data:` URI or committed next to `index.html`.
- The photographs for the walls still need to go into `displayed photos/`.
- The garden is heavy for software rendering. Check the frame rate on an older phone.
