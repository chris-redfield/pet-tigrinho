import { ACTIONS, ACTION_ORDER, ICONS } from '../config.js';
import { getState, progress, remainingToday, petName, level, canEvolve, evolve, devLevelUp, trilhaToday } from '../state.js';
import { openSheet } from './sheet.js';
import { showEvolution } from './evolve.js';
import { openInfo } from './info.js';
import { openAchievements } from './achievements.js';
import { openTrilhas } from './trilhas.js';
import { h, num } from './dom.js';
import { iconArt, actionIcon } from './art.js';
import { toast } from './toast.js';

export function renderHome(host) {
  const stageName = h('div', { class: 'hdr__stage display' });
  const xpLabel = h('div', { class: 'hdr__xp' });
  const infoBtn = h('button', {
    class: 'hdr__info', type: 'button', 'aria-label': 'Informações do pet',
    onclick: () => openInfo(screen, update),
  }, iconArt(ICONS.info, 'hdr__info-icon'));
  const crownBtn = h('button', {
    class: 'hdr__crown', type: 'button', 'aria-label': 'Conquistas',
    onclick: () => openAchievements(screen, update),
  }, iconArt(ICONS.crown, 'hdr__crown-icon'));
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

  // Square icon buttons in a column beside the pet, folded behind one icon
  // so the pet gets the screen until the player asks for them. The name
  // lives in the aria-label; the XP stays on the face of every button,
  // because the player must always see what an action pays before acting.
  const buttons = new Map();
  const list = h('div', { class: 'actions__list', id: 'actions-list' },
    ACTION_ORDER.map((type, i) => {
      const rate = h('div', { class: 'act__rate' });
      const button = h('button', {
        class: 'act panel', type: 'button', style: `--i:${i}`,
        onclick: () => openSheet(screen, type, onLogged),
      }, actionIcon(type, 'act__icon'), rate);
      buttons.set(type, { button, rate });
      return button;
    }));

  const toggle = h('button', {
    class: 'actions__toggle panel', type: 'button', 'aria-expanded': 'false',
    'aria-controls': 'actions-list',
    onclick: () => setOpen(actions.dataset.open !== 'true'),
  },
    iconArt(ICONS.plus, 'actions__toggle-icon'),
    h('span', { class: 'actions__toggle-label', text: 'Tarefas' }));

  const actions = h('nav', { class: 'actions', 'aria-label': 'Registrar atividade',
    dataset: { open: 'false' } }, toggle, list);

  function setOpen(open) {
    actions.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar as tarefas' : 'Abrir as tarefas');
  }

  // Dev only: ?dev in the URL shows a button that jumps one level.
  const devBtn = new URLSearchParams(location.search).has('dev') && h('button', {
    class: 'dev-lvl', type: 'button',
    onclick: () => onLogged(devLevelUp()),
  });

  // Lower right: the way into the trilhas, a closed hand facing forward.
  const trilhaBadge = h('span', { class: 'fab__badge' });
  const trilhaBtn = h('button', {
    class: 'fab', type: 'button', 'aria-label': 'Trilhas',
    onclick: () => openTrilhas(screen, { onChange: update, onClose: update }),
  },
    iconArt(ICONS.fist, 'fab__icon'),
    trilhaBadge,
    h('span', { class: 'fab__label', text: 'Trilhas' }));

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'hdr' },
      h('div', { class: 'hdr__name' }, stageName),
      crownBtn,
      h('div', { class: 'hdr__right' }, xpLabel, infoBtn)),
    h('div', { class: 'xpbar' }, fill),
    nextLabel,
    h('div', { class: 'home-body' }, actions, petStage),
    trilhaBtn,
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

    const trilha = trilhaToday();
    const ticked = trilha.tasks.filter((task) => task.done).length;
    trilhaBadge.textContent = trilha.waiting ? '✓' : `${ticked}/${trilha.tasks.length}`;
    trilhaBadge.dataset.done = String(trilha.waiting || trilha.ready);
    trilhaBtn.setAttribute('aria-label', trilha.waiting
      ? `Trilhas: Dia ${trilha.day - 1} concluído`
      : `Trilhas: Dia ${trilha.day}, ${ticked} de ${trilha.tasks.length} tarefas`);

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
