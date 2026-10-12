# Museum of Us — Design

## Concept

A private museum at night, open for one visitor.
The museum is the reason the order feels natural rather than forced.
Velvet ropes, gallery lights, numbered exhibits, and placards all say "this way, one at a time".

The structure follows asklex.law/journey: a loader, an intro statement, then a scroll-driven 3D walk.
A chapter HUD shows a counter, the current gallery, and a progress rail.

## Experience flow

1. **Loader.** "Lighting the galleries…" while fonts load and the scene builds.
2. **Intro.** Her figure stands on a plinth under the wall title.
   Headline: "Five letters. One way through."
   She clicks the figure, or the "Enter the museum" button.
   Scrolling here only shows a toast asking her to click the figure first.
3. **Walk.** Scroll, swipe up, drag, or arrow keys move the figure along the brass line. The camera follows from behind.
4. **Arrival.** Near a letter, the camera swings to frame her and the frame. A prompt card offers "Open the letter".
5. **Letter.** An envelope with a wax seal numbered I–V. She breaks the seal, and the letter rises out.
   "Fold it away" closes it.
6. **Unlock.** The rope barrier swings open. The next gallery's light comes up. The brass marker moves to the next frame.
7. **Last room.** After letter V, the path ends at a framed portrait of her. The finale card reads "The last exhibit is you."

## Palette

The page is dark-only. Every UI colour is a CSS token in `:root`.

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

Scene colours, set in the script:

| Element | Value |
| --- | --- |
| Walls | `#2a1f2e` |
| Exhibit panels | `#3b2c40` |
| Floor tiles | `hsl(285, 10%, 10–13%)` with dark grout |
| Spotlights | `#ffdcb0` |
| Light beams | `#ffd9a0`, additive |
| Figure skin / shoes | `#f0c6a6` / `#2a1a1f` |
| Figure dress | `CONFIG.dress`, default `#b8576b` |

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
- The station prompt sits above the rail on wide screens, and centred above the HUD on phones.
- Side gutter is `max(16px, 4vw)`. Fixed bars add safe-area insets.
- Below 720 px wide, the bottom HUD stacks into one column and the intro moves to the top of the screen.
- Buttons and cards have 2 px corners, like gallery signage. No pill shapes.

## 3D scene

- **Room:** 32 × 108 units, walls 9 units high, fog from 15 to 50 units.
  Six abstract colour-field paintings on the side walls add atmosphere.
- **Path:** a centripetal Catmull-Rom curve through 11 points, about 97 units long.
  It is drawn as a shader ribbon with three zones:
  - walked: solid brass
  - open ahead: brass chevrons flowing forward
  - locked: faint dots
- **Letters:** at 16%, 33%, 50%, 67%, and 84% of the path.
  Each panel stands 3.1 units off the path, on whichever side is farthest from other parts of the path.
- **Exhibit:** a panel on a base, a brass frame, an envelope texture, and a placard.
  The placard follows museum credit-line convention: exhibit number, title, medium and year, "Gift of Bao", and a status line.
- **Exhibit states:**

  | State | Envelope | Spotlight | Extras |
  | --- | --- | --- | --- |
  | Locked | Sealed, dimmed | 0.45, faint beam | Placard: "Opens after Exhibit N" |
  | Current | Sealed, gently pulsing glow | 2.9, strong beam | Brass marker floats overhead |
  | Read | Opened, letter peeking out | 1.7 | Placard: "Opened" |

- **Ropes:** brass stanchions at ±1.25 units either side of the path, every 3 units, joined by sagging velvet rope.
  Gaps open on the exhibit side near each letter.
  A barrier rope crosses the path 1.6 units past each letter. It swings about 100° open when that letter is closed.
- **Figure:** a chibi body built from primitives, about 2.1 units tall.
  The head is a camera-facing sprite: her photo cropped to a circle with a brass ring.
  Without a photo, a drawn placeholder face is used.
- **Last room:** a larger panel with her portrait, lit only after all five letters are read.

## Camera

Four rigs, blended by how close she is to each station, then exponentially damped:

- **Intro:** in front of her at the plinth. On wide screens it is offset so she sits right of the intro text.
- **Follow:** behind and slightly to one side, looking ahead along the path.
- **Station:** on the far side of the path from the exhibit, framing her in the foreground and the frame behind.
  Blend weight ramps from 0 at 3.6 units away to 1 at 0.4 units.
- **Finale:** behind her, looking at the portrait.

Portrait-shaped screens pull every rig back and reduce side offsets so she stays in frame.
The wall title is hidden on portrait screens because it would sit behind the intro text.
During the intro-to-walk transition, the camera arcs sideways so it never passes through her.

## Motion

- The walk cycle (legs, arms, bob, head sway) is driven by distance moved, so it matches speed.
- Movement eases toward the scroll target, capped at 7.5 units per second.
- She turns to face a letter when she stops beside it.
- On the intro she waves every few seconds to invite a click. She also waves when clicked during the walk.
- Rope opening, light changes, and overlays all ease over 0.4–0.8 s.
- Reduced motion: no chevron flow, pulsing, dust drift, or marker bob. Overlays switch instantly.

## Copy voice

- Plain, warm, and short.
- Museum vocabulary: Exhibit, Gallery, placard, "Gift of".
- When the rule blocks her, say what to do: "The rope stays up until you open Letter II."
- Buttons say exactly what happens: "Open the letter", "Fold it away", "Walk it again".

## Accessibility

- Keyboard: arrow keys, Space, and Page Up/Down walk. Enter opens the letter at a station. Escape closes an open letter or the finale.
- Focus moves to the seal, then to the close button, inside the letter dialog.
- Visible brass focus ring on every control.
- The chapter block and toasts are `aria-live` regions.

## Avoid

- A light theme. The night-museum look is deliberate.
- Revealing the text of a locked letter anywhere, including tooltips or placards.
- Pill buttons, emoji, and generic gradient heroes.
- Any way to skip ahead that bypasses `gateS()`.

## Open questions

- Swipe speed needs tuning on a real phone.
- An optional soundtrack, started from a click, would suit the setting.
- Her photo still needs to be embedded as a `data:` URI or committed next to `index.html`.
