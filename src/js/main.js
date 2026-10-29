import { initViewport, onViewportChange, getViewport } from './viewport.js';
import { hasPet, isOnboarded, resetSave } from './state.js';
import { startTour } from './ui/tour.js';
import { renderEgg } from './ui/egg.js';
import { renderHome } from './ui/home.js';
import { renderFinance } from './ui/finance.js';
import { renderTabbar } from './ui/tabbar.js';
import { renderProgress } from './ui/progress.js';
import { resetRecovery } from './recovery.js';
import { openTrilhas } from './ui/trilhas.js';
import { initA11y } from './a11y.js';
import { leaveScreens } from './ui/dom.js';
import { initMusic } from './music.js';
import { initSfx } from './sfx.js';
import { registerWorker } from './settings.js';

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

/**
 * Trilhas is a tab, but its screen is an overlay on the home screen: the
 * home underneath reacts to the XP a trilha pays (bar, evolution), and
 * closing the trilhas goes back to the Pet tab.
 */
function renderTrilhasTab(host) {
  const home = renderHome(host);
  openTrilhas(host, {
    onChange: home.update,
    onClose: () => { tab = 'pet'; route(); },
  });
}

const TABS = {
  pet: renderHome, trilhas: renderTrilhasTab, progresso: renderProgress, financas: renderFinance,
};
let tab = 'pet';
let tabbar = null;

/** Egg pick on first run; after that the pet and finance tabs, with the footer. */
function route() {
  const host = screens();
  leaveScreens();
  host.replaceChildren();
  tabbar?.remove();
  tabbar = null;
  if (!hasPet()) { renderEgg(host, route); return; }

  // The tab bar goes in first, so the home screen can refresh its badge.
  tabbar = renderTabbar(tab, (next) => {
    if (next === tab) return;
    tab = next;
    route();
  });
  host.after(tabbar);
  TABS[tab](host);

  // First time on the home screen (right after the first egg hatched): the
  // tour, once the screen has settled in.
  if (tab === 'pet' && !isOnboarded()) setTimeout(() => startTour(), 700);
}

function boot() {
  if (new URLSearchParams(location.search).has('reset')) { resetSave(); resetRecovery(); }
  initA11y();
  lockGestures();
  initMusic();
  initSfx();
  registerWorker();
  initViewport();
  initDebugHud();
  // The info screen retired the pet for a new egg: back to the egg pick.
  document.addEventListener('pet:new-egg', () => { tab = 'pet'; route(); });
  // A screen asks for another tab (Progresso links to Finanças).
  document.addEventListener('app:tab', (e) => {
    if (!TABS[e.detail] || e.detail === tab) return;
    tab = e.detail;
    route();
  });
  route();
  if (new URLSearchParams(location.search).has('debug')) console.log('[pet-tigrinho] ready', getViewport());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
