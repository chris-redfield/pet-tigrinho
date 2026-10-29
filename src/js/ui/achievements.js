import { ACTION_ORDER, ICONS } from '../config.js';
import { activity, medals, level, evolutions } from '../state.js';
import { h, num, amount, amountNum, actionCfg } from './dom.js';
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
 * The Conquistas tab of the profile.
 *
 * @returns {HTMLElement[]} the period switch and the tab's scrolling body
 */
export function renderAchievements() {
  let period = 'all';

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
          const cfg = actionCfg(type);
          const count = units[type] || 0;
          return h('li', { class: 'ach__row', dataset: { empty: String(count === 0) } },
            actionIcon(type, 'ach__icon'),
            h('div', { class: 'ach__row-text' },
              h('span', { class: 'ach__row-name', text: cfg.label }),
              h('span', { class: 'ach__row-rate', text: `+${cfg.xp} XP por ${cfg.rate}` })),
            h('span', { class: 'ach__count' }, ...countParts(type, count)));
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
            h('span', { class: 'medal__desc', text: medalDesc(medal) })),
          h('span', { class: 'medal__at', text: medal.done ? '✓' : medal.type
            ? `${amountNum(medal.type, medal.value)} / ${amountNum(medal.type, medal.goal)}`
            : `${num(medal.value)} / ${num(medal.goal)}` })))));
  }

  refresh();
  return [tabs, body];
}

/** "<strong>2.000</strong> passos" - the number bold, the unit plain. */
function countParts(type, count) {
  const [n, ...unit] = amount(type, count).split(' ');
  return [h('strong', { text: n }), ` ${unit.join(' ')}`];
}

/** Step medals read in wheelchair minutes for players who use one. */
function medalDesc(medal) {
  return medal.type && actionCfg(medal.type).factor !== 1
    ? `${amount(medal.type, medal.goal)} de cadeira de rodas.`
    : medal.desc;
}
