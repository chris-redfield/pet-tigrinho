import { h } from './dom.js';
import { reducedMotion } from '../motion.js';
import { evolveTune } from '../sfx.js';

/**
 * Evolution reveal, Pokemon style.
 *
 * The old form glows and alternates with a white silhouette, a single soft
 * bloom swaps in the new form with a small bounce, light rays turn slowly
 * behind it and a ring of stars drifts out once. Rich, but still not a
 * payout: no coin shower, no strobe, no jingle, no counter spinning up -
 * and the build-up is short, because the outcome was already set by the
 * status bars (the info screen showed it) and is not being drawn here.
 *
 * Under reduced motion the new form simply fades in.
 *
 * @param {HTMLElement} host
 * @param {object} form   the new form
 * @param {{from?: object, onClose?: () => void} | (() => void)} [opts]
 */
export function showEvolution(host, form, opts = {}) {
  const { from, onClose } = typeof opts === 'function' ? { onClose: opts } : opts;
  const reduced = reducedMotion();

  const next = h('img', { class: 'evolve__art evolve__art--new', src: form.art, alt: form.name,
    style: `--pet-scale:${form.scale}` });
  const old = from && !reduced
    ? h('img', { class: 'evolve__art evolve__art--old', src: from.art, alt: '',
      style: `--pet-scale:${from.scale}` })
    : null;

  const stars = reduced ? null : h('div', { class: 'evolve__stars', 'aria-hidden': 'true' },
    Array.from({ length: 14 }, (_, i) => h('span', {
      class: 'evolve__star',
      style: `--a:${(i * 360) / 14}deg;--d:${30 + (i % 3) * 9};animation-delay:${(i % 4) * 40}ms`,
    })));

  const overlay = h('div', {
    class: 'evolve', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Evoluiu para ${form.name}`,
    dataset: { phase: old ? 'charge' : 'reveal' },
  },
    h('div', { class: 'evolve__stage' },
      reduced ? null : h('div', { class: 'evolve__rays', 'aria-hidden': 'true' }),
      h('div', { class: 'evolve__bloom', 'aria-hidden': 'true' }),
      old,
      next,
      stars),
    h('div', { class: 'evolve__kicker', text: old ? `${from.name} está evoluindo…` : 'Seu tigrinho evoluiu' }),
    h('h2', { class: 'evolve__name display', text: form.name }),
    h('button', {
      class: 'btn', type: 'button', text: 'Continuar',
      onclick: () => { overlay.remove(); onClose?.(); },
    }));

  host.append(overlay);

  if (old) {
    // Charge (~1.4 s) -> bloom + reveal. The kicker changes with the swap.
    setTimeout(() => {
      overlay.dataset.phase = 'reveal';
      overlay.querySelector('.evolve__kicker').textContent = 'Seu tigrinho evoluiu!';
      evolveTune();
    }, 1400);
  } else {
    evolveTune();
  }
  overlay.querySelector('.btn').focus({ preventScroll: true });
}
