import { ACTIONS, ACTION_ORDER, ICONS } from '../config.js';
import { getState, progress, remainingToday, petName, level, canEvolve, evolve, devLevelUp } from '../state.js';
import { openSheet } from './sheet.js';
import { showEvolution } from './evolve.js';
import { openInfo } from './info.js';
import { ICON_ART } from '../sprites.js';
import { h, num } from './dom.js';
import { iconArt } from './art.js';

export function renderHome(host) {
  const stageName = h('div', { class: 'hdr__stage display' });
  const xpLabel = h('div', { class: 'hdr__xp' });
  const infoBtn = h('button', {
    class: 'hdr__info', type: 'button', 'aria-label': 'Informações do pet',
    onclick: () => openInfo(screen, update),
  }, iconArt(ICONS.info, 'hdr__info-icon'));
  const fill = h('div', { class: 'xpbar__fill' });
  const nextLabel = h('div', { class: 'xpbar__next' });

  const art = h('img', { class: 'pet-art', alt: 'Seu tigrinho' });
  // Ready to evolve: a glow in the line's colour hugs the pet (a blurred
  // white copy of the sprite) and small stars rise around it.
  const aura = h('img', { class: 'pet-aura', alt: '' });
  const sparks = h('div', { class: 'pet-sparks' },
    Array.from({ length: 7 }, (_, i) => h('span', {
      class: 'pet-spark',
      style: `left:${12 + ((i * 37) % 76)}%;top:${45 + ((i * 23) % 40)}%;animation-delay:${-(i * 0.47).toFixed(2)}s`,
    })));

  // Evolving is the player's call: once the XP is there, tapping the pet does it.
  const petStage = h('div', { class: 'pet-stage', onclick: onPetTap },
    h('div', { class: 'pet-halo' }),
    h('div', { class: 'pet-ground' }),
    aura,
    art,
    sparks);

  // Square icon buttons in a column beside the pet. The name lives in the
  // aria-label; the XP stays on the face of every button, because the
  // player must always see what an action pays before doing it.
  const buttons = new Map();
  const actions = h('nav', { class: 'actions', 'aria-label': 'Registrar atividade' },
    ACTION_ORDER.map((type) => {
      const rate = h('div', { class: 'act__rate' });
      const icon = ICON_ART.includes(type)
        ? h('img', { class: 'act__icon act__icon--art', src: `assets/icons/${type}.webp`, alt: '' })
        : iconArt(ICONS[type], 'act__icon');
      const button = h('button', {
        class: 'act panel', type: 'button',
        onclick: () => openSheet(screen, type, onLogged),
      }, icon, rate);
      buttons.set(type, { button, rate });
      return button;
    }));

  // Dev only: ?dev in the URL shows a button that jumps one level.
  const devBtn = new URLSearchParams(location.search).has('dev') && h('button', {
    class: 'dev-lvl', type: 'button',
    onclick: () => onLogged(devLevelUp()),
  });

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'hdr' }, stageName, xpLabel, infoBtn),
    h('div', { class: 'xpbar' }, fill),
    nextLabel,
    h('div', { class: 'home-body' }, actions, petStage),
    devBtn);

  function update() {
    const state = getState();
    const { form, next, into, span, ratio } = progress();

    stageName.textContent = petName();
    xpLabel.textContent = `${num(state.xp)} XP`;
    art.src = form.art;
    aura.src = form.art;
    petStage.style.setProperty('--pet-scale', form.scale);
    petStage.style.setProperty('--aura', form.aura);
    petStage.dataset.form = form.id;

    const ready = canEvolve();
    petStage.dataset.ready = String(ready);
    if (ready) {
      petStage.setAttribute('role', 'button');
      petStage.setAttribute('tabindex', '0');
      petStage.setAttribute('aria-label', 'Evoluir o tigrinho');
    } else {
      for (const attr of ['role', 'tabindex', 'aria-label']) petStage.removeAttribute(attr);
    }

    if (devBtn) devBtn.textContent = `DEV +1 Nv (${level().level})`;
    fill.style.width = `${Math.round(ratio * 100)}%`;
    nextLabel.textContent = ready
      ? 'Toque no tigrinho para evoluir!'
      : next
        ? `${num(into)} / ${num(span)} para evoluir (Nv. ${next})`
        : 'Evolução máxima alcançada';

    for (const [type, { button, rate }] of buttons) {
      const cfg = ACTIONS[type];
      const left = remainingToday(type);
      button.dataset.done = String(left === 0);
      rate.textContent = left === 0 ? '✓ hoje' : `+${cfg.xp} XP`;
      button.setAttribute('aria-label', left === 0
        ? `${cfg.label}: concluído hoje`
        : `${cfg.label}: +${cfg.xp} XP por ${cfg.rate}`);
    }
  }

  function onLogged(result) {
    update();
    if (result.gained > 0) toast(petStage, `+${result.gained} XP`);
    else if (result.cappedUnits > 0) toast(petStage, 'Registrado — sem XP hoje');
  }

  function onPetTap() {
    const form = evolve();
    if (!form) return;
    update();
    showEvolution(screen, form);
  }
  petStage.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && canEvolve()) { e.preventDefault(); onPetTap(); }
  });

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
