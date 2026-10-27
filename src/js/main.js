import { initViewport, onViewportChange, getViewport } from './viewport.js';
import { hasPet, resetSave } from './state.js';
import { renderEgg } from './ui/egg.js';
import { renderHome } from './ui/home.js';

/** Kills the browser gestures that break a fullscreen game. */
function lockGestures() {
  // Long-press menu on sprites and buttons.
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Safari pinch-zoom.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (e) => e.preventDefault());
  }

  // Double-tap zoom on older WebKit, which ignores touch-action.
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch < 320) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

  // Any drag that is not inside a scroller is a rubber-band attempt.
  document.addEventListener('touchmove', (e) => {
    if (!e.target.closest('[data-scroll]')) e.preventDefault();
  }, { passive: false });
}

function initDebugHud() {
  if (!new URLSearchParams(location.search).has('debug')) return;
  const hud = document.getElementById('hud');
  hud.hidden = false;
  onViewportChange((s) => {
    hud.textContent =
      `${s.mode}  stage ${s.width}x${s.height}\n` +
      `avail ${s.availWidth}x${s.availHeight}  u=${s.unit.toFixed(2)}px\n` +
      `dpr ${window.devicePixelRatio}  aspect ${(s.width / s.height).toFixed(3)}`;
  });
}

const screens = () => document.getElementById('screens');

/** Egg pick on first run, the pet from then on. */
function route() {
  const host = screens();
  host.replaceChildren();
  if (hasPet()) renderHome(host);
  else renderEgg(host, route);
}

function boot() {
  if (new URLSearchParams(location.search).has('reset')) resetSave();
  lockGestures();
  initViewport();
  initDebugHud();
  route();
  console.log('[pet-tigrinho] ready', getViewport());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
