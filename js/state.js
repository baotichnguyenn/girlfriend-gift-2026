// State that more than one module writes. An imported binding can't be reassigned,
// so it lives as fields on one shared object.
export const state = {
  mode: 'loading', // loading → intro → entering → walk ⇄ reading
  s: 0,            // her position: arc length along the path, 0 to L
  sTarget: 0,      // where she is walking to. Only order.js sets it, always clamped to gateS().
  readCount: 0,    // letters opened, in order. Only order.js changes it.
  time: 0          // seconds since the first frame, advanced by the frame loop
};
