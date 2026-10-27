/**
 * Vertical stage sizing.
 *
 * One rule covers every device:
 *   stage height = available height
 *   stage width  = min(available width, height * 9/16)
 *
 * On a tall phone (e.g. 20:9) the width clamp never bites, so the stage
 * fills the screen edge to edge. On anything wider than 9:16 - desktop,
 * tablets - the stage becomes a centred vertical column and the backdrop
 * shows around it.
 */

const TARGET_ASPECT = 9 / 16;

/** Stops the column growing absurdly tall on a 4K monitor. */
const FRAMED_MAX_H = 980;

/** Breathing room between the framed column and the window edges. */
const FRAMED_MARGIN = 48;

const state = {
  mode: 'bleed',
  width: 0,
  height: 0,
  unit: 0,
  availWidth: 0,
  availHeight: 0,
};

/** @type {Set<(s: typeof state) => void>} */
const listeners = new Set();

export function onViewportChange(fn) {
  listeners.add(fn);
  if (state.width) fn(state);
  return () => listeners.delete(fn);
}

export function getViewport() {
  return { ...state };
}

export function initViewport() {
  const probe = document.getElementById('vp-probe');
  const rotate = document.getElementById('rotate');
  const root = document.documentElement;
  const coarse = window.matchMedia('(pointer: coarse)');

  function layout() {
    const availWidth = probe.clientWidth;
    const availHeight = probe.clientHeight;
    if (!availWidth || !availHeight) return;

    // Half a pixel of slack so a phone that is exactly 9:16 stays full-bleed.
    const framed = availWidth > availHeight * TARGET_ASPECT + 0.5;

    let height = availHeight;
    let width = availWidth;
    if (framed) {
      height = Math.min(availHeight - FRAMED_MARGIN, FRAMED_MAX_H);
      height = Math.max(height, Math.min(availHeight, 320));
      width = Math.round(height * TARGET_ASPECT);
    }

    root.style.setProperty('--stage-w', `${width}px`);
    root.style.setProperty('--stage-h', `${height}px`);
    root.style.setProperty('--u', `${width / 100}px`);
    document.body.dataset.mode = framed ? 'framed' : 'bleed';

    // The game is vertical, so a phone held sideways gets a nudge.
    // Desktop landscape is normal and must not trigger it.
    rotate.hidden = !(coarse.matches && availWidth > availHeight);

    Object.assign(state, {
      mode: framed ? 'framed' : 'bleed',
      width, height,
      unit: width / 100,
      availWidth, availHeight,
    });

    for (const fn of listeners) fn(state);
  }

  // Changing --stage-* never resizes the probe, so this cannot loop.
  new ResizeObserver(layout).observe(probe);
  coarse.addEventListener('change', layout);
  window.addEventListener('orientationchange', layout);

  layout();
}
