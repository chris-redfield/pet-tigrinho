import { ACTIONS, ACTION_ORDER, ICONS } from '../config.js';
import { activity, medals, level, evolutions, petName } from '../state.js';
import { h, num, plural } from './dom.js';
import { iconArt, actionIcon } from './art.js';

/**
 * Conquistas: everything the player has done, lifetime and this week.
 *
 * It is a record, not a target. Nothing here can go down, nothing expires
 * and nothing is phrased as a goal the player is behind on - the same
 * reason the game has no streak. The week column exists because "what did
 * I actually do lately" is the question people ask themselves, and the
 * honest answer is a better reward than a number that resets.
 *
 * A save made before the per-day history existed shows an empty week until
 * the next action is logged; the lifetime column is complete either way.
 *
 * @param {HTMLElement} host     element to mount into
 * @param {() => void}  onClose  called after the screen is dismissed
 */
export function openAchievements(host, onClose) {
  let period = 'all';

  const close = () => {
    screen.remove();
    onClose?.();
  };

  const PERIODS = [
    { id: 'all', label: 'Sempre' },
    { id: 'week', label: 'Esta semana' },
  ];

  const tabs = h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Período' },
    PERIODS.map((item) => h('button', {
      class: 'seg__btn', type: 'button', role: 'tab', text: item.label,
      'aria-selected': String(item.id === period),
      onclick: () => {
        if (period === item.id) return;
        period = item.id;
        for (const btn of tabs.children) btn.setAttribute('aria-selected', String(btn.textContent === item.label));
        refresh();
      },
    })));

  const body = h('div', { class: 'ach__body', dataset: { scroll: '' } });

  function refresh() {
    body.replaceChildren(summary(), breakdown(), medalsPanel());
    body.scrollTop = 0;
  }

  /** Big numbers for the period. Level and evolutions are lifetime facts. */
  function summary() {
    const data = activity(period);
    const tiles = [
      { value: num(data.xp), label: 'XP' },
      { value: num(data.days), label: data.days === 1 ? 'dia ativo' : 'dias ativos' },
      { value: num(data.trilhas), label: data.trilhas === 1 ? 'trilha' : 'trilhas' },
    ];
    if (period === 'all') {
      tiles.push({ value: `Nv. ${level().level}`, label: 'nível' });
      tiles.push({ value: num(evolutions()), label: evolutions() === 1 ? 'evolução' : 'evoluções' });
    }
    return h('section', { class: 'ach__card panel' },
      h('h2', { class: 'ach__heading', text: period === 'all' ? 'Desde o começo' : 'De segunda até hoje' }),
      h('div', { class: 'ach__tiles' },
        tiles.map((tile) => h('div', { class: 'ach__tile' },
          h('div', { class: 'ach__value display', text: tile.value }),
          h('div', { class: 'ach__label', text: tile.label })))));
  }

  /** One row per action, with the units logged in the period. */
  function breakdown() {
    const { units } = activity(period);
    return h('section', { class: 'ach__card panel' },
      h('h2', { class: 'ach__heading', text: 'Atividades' }),
      h('ul', { class: 'ach__list' },
        ACTION_ORDER.map((type) => {
          const cfg = ACTIONS[type];
          const count = units[type] || 0;
          return h('li', { class: 'ach__row', dataset: { empty: String(count === 0) } },
            actionIcon(type, 'ach__icon'),
            h('div', { class: 'ach__row-text' },
              h('span', { class: 'ach__row-name', text: cfg.label }),
              h('span', { class: 'ach__row-rate', text: `+${cfg.xp} XP por ${cfg.rate}` })),
            h('span', { class: 'ach__count' },
              h('strong', { text: num(count) }),
              ' ',
              plural(count, cfg)));
        })));
  }

  /** Milestones, always lifetime - they are a record of the whole journey. */
  function medalsPanel() {
    const list = medals();
    const won = list.filter((medal) => medal.done).length;
    return h('section', { class: 'ach__card panel' },
      h('h2', { class: 'ach__heading' },
        'Medalhas ',
        h('span', { class: 'ach__tally', text: `${won} / ${list.length}` })),
      h('p', { class: 'ach__note', text: 'As medalhas contam desde o começo e nunca são perdidas.' }),
      h('ul', { class: 'medals' },
        list.map((medal) => h('li', { class: 'medal', dataset: { done: String(medal.done) } },
          h('div', { class: 'medal__disc' },
            iconArt(medal.done ? ICONS.crown : ICONS.lock, 'medal__icon')),
          h('div', { class: 'medal__text' },
            h('span', { class: 'medal__name', text: medal.name }),
            h('span', { class: 'medal__desc', text: medal.desc })),
          h('span', { class: 'medal__at', text: medal.done ? '✓' : `${num(medal.value)} / ${num(medal.goal)}` })))));
  }

  const screen = h('div', { class: 'ach', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Conquistas' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Conquistas' })),
    h('p', { class: 'ach__sub', text: `Tudo o que você fez com ${petName()}.` }),
    tabs,
    body);

  refresh();
  host.append(screen);
}
