import { EGGS } from '../config.js';
import { FORMS } from '../forms.js';
import { chooseEgg } from '../state.js';
import { h } from './dom.js';
import { eggArt } from './art.js';

/**
 * First-run egg pick.
 *
 * Each egg says up front which pet it hatches and its type - the player
 * picks, they do not get drawn. A random pull from unknowns is a loot box,
 * which is exactly what this game exists to be an alternative to.
 */
export function renderEgg(host, onHatched) {
  let picked = null;

  const row = h('div', { class: 'egg-row' });
  const detail = h('p', { class: 'egg-detail', text: 'Cada ovo choca um bichinho diferente.' });
  const confirm = h('button', {
    class: 'btn', type: 'button', text: 'Escolha um ovo', disabled: true,
    onclick: hatch,
  });

  const eggs = EGGS.map((egg) => {
    const button = h('button', {
      class: 'egg', type: 'button', 'aria-pressed': 'false',
      onclick: () => pick(egg.id),
    }, eggArt(egg),
      h('span', { class: 'egg__name', text: egg.name }),
      h('span', { class: 'egg__type', text: egg.type }));
    return { egg, button };
  });
  row.append(...eggs.map((e) => e.button));

  const screen = h('div', { class: 'screen egg-screen' },
    h('h1', { class: 'egg-title display', text: 'Escolha seu ovo' }),
    h('p', { class: 'egg-sub', text: 'Seu bichinho cresce com o que você faz na vida real.' }),
    row,
    detail,
    confirm);

  function pick(id) {
    picked = id;
    row.dataset.picked = id;
    for (const { egg, button } of eggs) {
      button.setAttribute('aria-pressed', String(egg.id === id));
    }
    const egg = EGGS.find((e) => e.id === id);
    const base = FORMS[egg.base];
    detail.replaceChildren(
      h('strong', { text: `${base.name} · ${base.type}` }),
      h('br'),
      base.desc);
    confirm.disabled = false;
    confirm.textContent = `Chocar ${base.name}`;
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
