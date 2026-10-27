import { h } from './dom.js';

/**
 * Evolution reveal.
 *
 * Styled as a Pokemon-ish bloom, not a payout: no coin shower, no strobe,
 * no rising jingle, no counter spinning up. The player already knew this
 * was coming - the XP bar told them - so there is nothing to suspend.
 */
export function showEvolution(host, stage, onClose) {
  const overlay = h('div', { class: 'evolve', role: 'dialog', 'aria-modal': 'true' },
    h('img', { class: 'evolve__art', src: stage.art, alt: stage.name,
      style: `--pet-scale:${stage.scale}` }),
    h('div', { class: 'evolve__kicker', text: 'Seu tigrinho evoluiu' }),
    h('h2', { class: 'evolve__name display', text: stage.name }),
    h('button', {
      class: 'btn', type: 'button', text: 'Continuar',
      onclick: () => { overlay.remove(); onClose?.(); },
    }));
  host.append(overlay);
}
