import { EGGS, ICONS, RARITIES } from '../config.js';
import { FORMS, BRANCHES } from '../forms.js';
import { discovered } from '../state.js';
import { h } from './dom.js';
import { iconArt, eggArt } from './art.js';

/**
 * Encyclopedia: every form, line by line, one line per egg.
 *
 * Forms the player has had show their art, name, type and description.
 * The rest are a black silhouette with no name - something to look
 * forward to. Nothing here can be bought or rolled: a form is discovered
 * only by raising a pet into it.
 *
 * @param {HTMLElement} host     element to mount into
 * @param {() => void}  [onClose]
 */
export function openEncyclopedia(host, onClose) {
  const seen = discovered();
  const total = Object.keys(FORMS).length;

  const close = () => {
    screen.remove();
    onClose?.();
  };

  /** The egg's base form and everything it can become, parents first. */
  function line(egg) {
    const out = [];
    const queue = [FORMS[egg.base]];
    while (queue.length) {
      const f = queue.shift();
      out.push(f);
      queue.push(...(BRANCHES[f.id] || []));
    }
    return out;
  }

  function card(form) {
    const known = seen.has(form.id);
    const tier = RARITIES[form.rarity];
    return h('li', { class: 'ency__card', dataset: { known: String(known) } },
      h('img', { class: `ency__art${known ? '' : ' silhouette'}`, src: form.thumb, alt: '',
        loading: 'lazy', decoding: 'async' }),
      known
        ? h('div', { class: 'ency__info' },
            h('div', { class: 'ency__name', text: form.name }),
            h('div', { class: 'ency__type', text: form.type }),
            h('span', { class: 'rarity rarity--sm', style: `--rarity:${tier.color}`, text: tier.label }),
            h('p', { class: 'ency__desc', text: form.desc }))
        : h('div', { class: 'ency__info' },
            h('div', { class: 'ency__name ency__name--unknown', text: '???' }),
            h('div', { class: 'ency__type', text: 'Ainda não descoberto' })));
  }

  const sections = EGGS.map((egg) => {
    const forms = line(egg);
    const found = forms.filter((f) => seen.has(f.id)).length;
    return h('section', { class: 'ency__line panel' },
      h('div', { class: 'ency__head' },
        h('span', { class: 'ency__egg' }, eggArt(egg)),
        h('h3', { class: 'info__heading ency__title', text: `Ovo ${egg.name}` }),
        h('span', { class: 'ency__count', text: `${found}/${forms.length}` })),
      h('ul', { class: 'ency__list' }, forms.map(card)));
  });

  const screen = h('div', { class: 'info ency', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Enciclopédia' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Enciclopédia' }),
      h('div', { class: 'ency__total', text: `${seen.size}/${total} descobertos` })),
    h('div', { class: 'info__body', dataset: { scroll: '' } }, sections));

  host.append(screen);
}
