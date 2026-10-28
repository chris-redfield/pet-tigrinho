import { ICONS } from '../config.js';
import { trilhaToday } from '../state.js';
import { h } from './dom.js';
import { iconArt } from './art.js';

const TABS = [
  { id: 'pet',      label: 'Pet',      icon: ICONS.paw },
  { id: 'trilhas',  label: 'Trilhas',  icon: ICONS.trail, badge: true },
  { id: 'financas', label: 'Finanças', icon: ICONS.coin },
  { id: 'ajuda',    label: 'Ajuda',    icon: ICONS.heart },
];

/**
 * Footer tab bar, pinned under the screens.
 *
 * The Trilhas tab carries a badge with how much of today's trilha is done
 * (`refreshTrilhaBadge`, which the home screen calls again on every update).
 *
 * @param {string}               active    id of the tab on screen
 * @param {(id: string) => void} onSelect
 */
export function renderTabbar(active, onSelect) {
  const bar = h('nav', { class: 'tabbar', 'aria-label': 'Seções' },
    TABS.map((tab) => h('button', {
      class: 'tab', type: 'button', dataset: { tab: tab.id },
      'aria-current': tab.id === active ? 'page' : null,
      onclick: () => onSelect(tab.id),
    },
      h('span', { class: 'tab__iconwrap' },
        iconArt(tab.icon, 'tab__icon'),
        tab.badge && h('span', { class: 'tab__badge', 'aria-hidden': 'true' })),
      h('span', { class: 'tab__label', text: tab.label }))));
  refreshTrilhaBadge(bar);
  return bar;
}

/** Writes today's trilha progress ("1/2", or ✓ once done) on the Trilhas tab. */
export function refreshTrilhaBadge(root = document) {
  const tab = root.querySelector('.tab[data-tab="trilhas"]');
  const badge = tab?.querySelector('.tab__badge');
  if (!badge) return;
  const trilha = trilhaToday();
  const ticked = trilha.tasks.filter((task) => task.done).length;
  badge.textContent = trilha.waiting ? '✓' : `${ticked}/${trilha.tasks.length}`;
  badge.dataset.done = String(trilha.waiting || trilha.ready);
  tab.setAttribute('aria-label', trilha.waiting
    ? `Trilhas: Dia ${trilha.day - 1} concluído`
    : `Trilhas: Dia ${trilha.day}, ${ticked} de ${trilha.tasks.length} tarefas`);
}
