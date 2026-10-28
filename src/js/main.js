import { initViewport, onViewportChange, getViewport } from './viewport.js';
import { hasPet, resetSave } from './state.js';
import { renderEgg } from './ui/egg.js';
import { renderHome } from './ui/home.js';
import { renderFinance } from './ui/finance.js';
import { renderTabbar } from './ui/tabbar.js';
import { renderHelp } from './ui/help.js';
import { forceMotion } from './motion.js';

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

const TABS = { pet: renderHome, financas: renderFinance, ajuda: renderHelp };
let tab = 'pet';
let tabbar = null;

/** Egg pick on first run; after that the pet and finance tabs, with the footer. */
function route() {
  const host = screens();
  host.replaceChildren();
  tabbar?.remove();
  tabbar = null;
  if (!hasPet()) { renderEgg(host, route); return; }

  TABS[tab](host);
  tabbar = renderTabbar(tab, (next) => {
    if (next === tab) return;
    tab = next;
    route();
  });
  host.after(tabbar);
}

function boot() {
  if (new URLSearchParams(location.search).has('reset')) resetSave();
  // ?motion: full effects even with the system's reduce motion on.
  if (forceMotion) document.documentElement.classList.add('motion-full');
  lockGestures();
  initViewport();
  initDebugHud();
  // The info screen retired the pet for a new egg: back to the egg pick.
  document.addEventListener('pet:new-egg', () => { tab = 'pet'; route(); });
  route();
  console.log('[pet-tigrinho] ready', getViewport());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
