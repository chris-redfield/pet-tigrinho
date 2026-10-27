import { ACTIONS, ACTION_ORDER, ICONS } from '../config.js';
import { getState, progress, remainingToday } from '../state.js';
import { openSheet } from './sheet.js';
import { showEvolution } from './evolve.js';
import { h, num } from './dom.js';
import { iconArt } from './art.js';

export function renderHome(host) {
  const stageName = h('div', { class: 'hdr__stage display' });
  const xpLabel = h('div', { class: 'hdr__xp' });
  const fill = h('div', { class: 'xpbar__fill' });
  const nextLabel = h('div', { class: 'xpbar__next' });

  const art = h('img', { class: 'pet-art', alt: 'Seu tigrinho' });
  const petStage = h('div', { class: 'pet-stage' },
    h('div', { class: 'pet-halo' }),
    h('div', { class: 'pet-ground' }),
    art);

  const buttons = new Map();
  const actions = h('nav', { class: 'actions' },
    ACTION_ORDER.map((type) => {
      const cfg = ACTIONS[type];
      const rate = h('div', { class: 'act__rate' });
      const button = h('button', {
        class: 'act panel', type: 'button',
        onclick: () => openSheet(screen, type, onLogged),
      },
        iconArt(ICONS[type], 'act__icon'),
        h('div', { class: 'act__txt' },
          h('div', { class: 'act__label', text: cfg.label }),
          rate));
      buttons.set(type, { button, rate });
      return button;
    }));

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'hdr' }, stageName, xpLabel),
    h('div', { class: 'xpbar' }, fill),
    nextLabel,
    petStage,
    actions);

  function update() {
    const state = getState();
    const { stage, next, into, span, ratio } = progress();

    stageName.textContent = stage.name;
    xpLabel.textContent = `${num(state.xp)} XP`;
    art.src = stage.art;
    art.style.setProperty('--pet-scale', stage.scale);
    petStage.dataset.stage = String(state.stage);

    fill.style.width = `${Math.round(ratio * 100)}%`;
    nextLabel.textContent = next
      ? `${num(into)} / ${num(span)} para ${next.name}`
      : 'Evolução máxima alcançada';

    for (const [type, { button, rate }] of buttons) {
      const cfg = ACTIONS[type];
      const left = remainingToday(type);
      button.dataset.done = String(left === 0);
      rate.textContent = left === 0 ? 'concluído hoje' : `+${cfg.xp} XP / ${cfg.rate}`;
    }
  }

  function onLogged(result) {
    update();
    if (result.gained > 0) toast(petStage, `+${result.gained} XP`);
    else if (result.cappedUnits > 0) toast(petStage, 'Registrado — sem XP hoje');

    if (result.evolved) {
      // Let the bar finish animating so the player sees what earned the evolution.
      setTimeout(() => showEvolution(screen, result.evolved), 650);
    }
  }

  update();
  host.append(screen);
  return { update };
}

let toastTimer;
function toast(host, text) {
  host.querySelector('.toast')?.remove();
  const node = h('div', { class: 'toast', text });
  host.append(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), 1900);
}
