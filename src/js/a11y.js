import { getSettings } from './settings.js';
import { reducedMotion } from './motion.js';

/**
 * Puts the Acessibilidade settings on <html> as classes, which the
 * stylesheets read:
 *
 *   reduce-motion  soft fades instead of drops, flights and bursts
 *   high-contrast  brighter edges, dim text close to full ink
 *   colorblind     the jade (green) scale becomes blue
 *
 * Call again after any of them changes. The phone's own reduce motion is
 * followed live while the player has not picked a value.
 */
export function applyA11y() {
  const s = getSettings();
  const root = document.documentElement.classList;
  root.toggle('reduce-motion', reducedMotion());
  root.toggle('high-contrast', s.contrast);
  root.toggle('colorblind', s.colorblind);
}

export function initA11y() {
  applyA11y();
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyA11y);
}
