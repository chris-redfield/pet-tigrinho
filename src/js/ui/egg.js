import { EGGS } from '../config.js';
import { chooseEgg } from '../state.js';
import { h } from './dom.js';
import { eggArt } from './art.js';

/**
 * First-run egg pick.
 *
 * All three hatch the same pet, so this is a cosmetic choice, not a roll -
 * the player picks, they do not get drawn. When real variety lands, keep it
 * that way: show what each egg contains and let them choose. A random pull
 * from three unknowns is a loot box, which is exactly what this game exists
 * to be an alternative to.
 */
export function renderEgg(host, onHatched) {
  let picked = null;

  const row = h('div', { class: 'egg-row' });
  const confirm = h('button', {
    class: 'btn', type: 'button', text: 'Escolha um ovo', disabled: true,
    onclick: hatch,
  });

  const eggs = EGGS.map((egg) => {
    const button = h('button', {
      class: 'egg', type: 'button', 'aria-pressed': 'false',
      onclick: () => pick(egg.id),
    }, eggArt(egg), h('span', { class: 'egg__name', text: egg.name }));
    return { egg, button };
  });
  row.append(...eggs.map((e) => e.button));

  const screen = h('div', { class: 'screen egg-screen' },
    h('h1', { class: 'egg-title display', text: 'Escolha seu ovo' }),
    h('p', { class: 'egg-sub', text: 'Seu bichinho cresce com o que você faz na vida real.' }),
    row,
    confirm);

  function pick(id) {
    picked = id;
    row.dataset.picked = id;
    for (const { egg, button } of eggs) {
      button.setAttribute('aria-pressed', String(egg.id === id));
    }
    confirm.disabled = false;
    confirm.textContent = 'Chocar';
  }

  function hatch() {
    confirm.disabled = true;
    const chosen = eggs.find((e) => e.egg.id === picked);
    chosen.button.classList.add('egg--hatching');
    setTimeout(() => {
      chooseEgg(picked);
      onHatched();
    }, 1250);
  }

  host.append(screen);
}
