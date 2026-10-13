# Museum of Us

A 3D museum walk. Holding the arrow keys walks a small figure of her across a limestone Great Hall and five silk-walled galleries hung with her photos, opening five letters in a fixed order. Velvet ropes block the way until each letter is read. After the last one, doors open onto a flower garden at dawn.

- Run: `python3 -m http.server 8000` (or `py -m http.server 8000` on Windows), then open http://localhost:8000
- Edit the letters, her name, and her photo in `CONFIG` in `js/config.js`
- Put the wall photos in `displayed photos/`, named `1.jpg`, `2.jpg`, … (see the README there)
- Controls: hold ↑ or ↓ (or the on-screen arrows) to walk. Drag to look around, scroll or pinch to zoom, double-click to reset the view
- Prototype tools: add `#edit` to the URL

See `DESIGN.md` for the design and `CLAUDE.md` for how the code is organised.
