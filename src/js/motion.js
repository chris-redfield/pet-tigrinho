/**
 * Whether effects should use their soft versions.
 *
 * Follows the system "reduce motion" setting. `?motion` in the URL forces
 * the full effects everywhere, for checking them on a machine that has
 * reduce motion on; `main.js` then adds `motion-full` to <html>, which the
 * reduced-motion CSS rules are scoped against.
 */
export const forceMotion = new URLSearchParams(location.search).has('motion');

export function reducedMotion() {
  return !forceMotion && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
