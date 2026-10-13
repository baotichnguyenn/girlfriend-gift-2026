// The order lock. Letter i can be opened only when i <= readCount, and she can't walk past gateS().
// Every change to state.readCount and state.sTarget happens in this module.
import { clamp, store } from './util.js';
import { state } from './state.js';
import { L, S, S0 } from './path.js';
import { setExhibitStates } from './world/exhibits.js';
import { setBarrierTargets } from './world/ropes.js';
import { setHudProgress } from './ui/hud.js';

// The farthest she may walk: the next unread letter, or the end once all five are read.
export const gateS = () => (state.readCount < 5 ? S[state.readCount] : L);

// The only two ways to move her. Both clamp to the gate.
export function walkTo(target) { state.sTarget = clamp(target, S0, gateS()); }
export function placeAt(target) { state.s = state.sTarget = clamp(target, S0, gateS()); }

// Re-derives everything shown from readCount: envelopes, placards, light targets, ropes, seals, rail nodes.
export function refresh() {
  setExhibitStates(state.readCount);
  setBarrierTargets(state.readCount);
  setHudProgress(state.readCount);
}

function save() { store.set('mou-read', String(state.readCount)); }

export function restoreProgress() {
  state.readCount = clamp(parseInt(store.get('mou-read') || '0', 10) || 0, 0, 5);
  refresh();
}

// Counts letter i as read if it is the current one. Re-reading an old letter changes nothing.
export function markRead(i) {
  if (i !== state.readCount) return false;
  state.readCount++; save(); refresh();
  return true;
}

export function unlockAll() { state.readCount = 5; save(); refresh(); }
export function resetProgress() { state.readCount = 0; save(); refresh(); }
