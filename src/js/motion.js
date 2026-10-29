import { getSettings } from './settings.js';

/**
 * Whether effects should use their soft versions.
 *
 * Follows the system "reduce motion" setting until the player picks one in
 * Perfil > Configurações > Acessibilidade. `?motion` in the URL forces the
 * full effects everywhere, for checking them on a machine that has reduce
 * motion on. a11y.js mirrors the answer as `reduce-motion` on <html>, which
 * the soft CSS versions are scoped to.
 */
export const forceMotion = new URLSearchParams(location.search).has('motion');

export function systemReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function reducedMotion() {
  if (forceMotion) return false;
  const picked = getSettings().reduceMotion;
  return picked ?? systemReducedMotion();
}
