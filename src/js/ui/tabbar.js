import { ICONS } from '../config.js';
import { h } from './dom.js';
import { iconArt } from './art.js';

const TABS = [
  { id: 'pet',      label: 'Pet',      icon: ICONS.paw },
  { id: 'financas', label: 'Finanças', icon: ICONS.coin },
  { id: 'ajuda',    label: 'Ajuda',    icon: ICONS.heart },
];

/**
 * Footer tab bar, pinned under the screens.
 *
 * @param {string}               active    id of the tab on screen
 * @param {(id: string) => void} onSelect
 */
export function renderTabbar(active, onSelect) {
  return h('nav', { class: 'tabbar', 'aria-label': 'Seções' },
    TABS.map((tab) => h('button', {
      class: 'tab', type: 'button',
      'aria-current': tab.id === active ? 'page' : null,
      onclick: () => onSelect(tab.id),
    },
      iconArt(tab.icon, 'tab__icon'),
      h('span', { class: 'tab__label', text: tab.label }))));
}
