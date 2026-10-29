import { getSettings } from './settings.js';

/**
 * Background music: one calm loop, "forest" by syncopika (credited in
 * Perfil > Configurações). Follows the settings: off when Música de fundo
 * is off, at the Volume geral level. Browsers only let audio start after
 * the player touches the page, so it starts on the first tap - and the
 * file is only fetched then, and only if the music is on, so a phone does
 * not download it just to open the game. It pauses
 * while the game is out of view and fades in, never jumps in.
 */

const SRC = 'assets/audio/forest.mp3';
/** The track is mixed loud; 100% on the slider plays it at this level. */
const MAX_GAIN = 0.3;
const FADE_MS = 1200;

let audio = null;
let unlocked = false;
let fade = null;

function target() {
  const { music, volume } = getSettings();
  return music ? (volume / 100) * MAX_GAIN : 0;
}

/**
 * Eases the volume to `to` (pausing at 0), instead of an abrupt change. On
 * a timer, not animation frames: those stop in a hidden tab, and a fade
 * that never ends would leave the music playing in the background.
 */
function fadeTo(to) {
  clearInterval(fade);
  const from = audio.volume;
  const start = performance.now();
  fade = setInterval(() => {
    const t = Math.min(1, (performance.now() - start) / FADE_MS);
    audio.volume = from + (to - from) * t;
    if (t < 1) return;
    clearInterval(fade);
    if (to === 0) audio.pause();
  }, 50);
}

/** Applies the current settings: call after Música de fundo or Volume change. */
export function syncMusic() {
  if (!unlocked) return;
  if (!audio) {
    if (target() <= 0) return;   // music off: nothing to fetch yet
    audio = new Audio(SRC);
    audio.loop = true;
    audio.volume = 0;
  }
  // Out of view: silent at once, no fade to wait on.
  if (document.hidden) {
    clearInterval(fade);
    audio.pause();
    return;
  }
  const level = target();
  if (level > 0 && audio.paused) {
    audio.volume = 0;
    audio.play().catch(() => {});
  }
  fadeTo(level);
}

export function initMusic() {
  const unlock = () => {
    unlocked = true;
    syncMusic();
  };
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', syncMusic);
}
