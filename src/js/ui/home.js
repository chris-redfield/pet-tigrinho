import { ACTIONS, ACTION_ORDER, ICONS } from '../config.js';
import { getState, progress, remainingToday, doneToday, petName, level, canEvolve, evolve, devLevelUp, currentForm } from '../state.js';
import { openSheet } from './sheet.js';
import { showEvolution } from './evolve.js';
import { openInfo } from './info.js';
import { openAchievements } from './achievements.js';
import { h, num } from './dom.js';
import { iconArt, actionIcon } from './art.js';
import { toast } from './toast.js';
import { hearts, say, celebrateGain, replay } from './petfx.js';
import { createChatter } from '../chatter.js';
import { refreshTrilhaBadge } from './tabbar.js';
import { tourOpen } from './tour.js';

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
  const bar = h('div', { class: 'xpbar' }, fill);
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

  // Tapping the pet pets it: hearts, and now and then a line. Evolution
  // runs by itself once the XP is there (see autoEvolve).
  const petStage = h('div', {
    class: 'pet-stage', role: 'button', tabindex: '0', 'aria-label': 'Fazer carinho no tigrinho',
    onclick: (e) => onPetTap({ x: e.clientX, y: e.clientY }),
  },
    h('div', { class: 'pet-halo' }),
    h('div', { class: 'pet-ground' }),
    aura,
    art,
    sparks);

  // The five actions in a row under the pet, always in view: round icon
  // buttons without frames, so they sit lightly on the scene. The name
  // lives in the aria-label; the XP stays on the face of every button,
  // because the player must always see what an action pays before acting.
  const buttons = new Map();
  const actions = h('nav', { class: 'actions', 'aria-label': 'Registrar atividade' },
    ACTION_ORDER.map((type) => {
      const rate = h('div', { class: 'act__rate' });
      const button = h('button', {
        class: 'act', type: 'button',
        onclick: () => openSheet(screen, type, onLogged),
      }, h('span', { class: 'act__disc' }, actionIcon(type, 'act__icon')), rate);
      buttons.set(type, { button, rate });
      return button;
    }));

  // Dev only: ?dev in the URL shows a button that jumps one level.
  const devBtn = new URLSearchParams(location.search).has('dev') && h('button', {
    class: 'dev-lvl', type: 'button',
    onclick: () => onLogged(devLevelUp()),
  });

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'hdr' },
      h('div', { class: 'hdr__name' }, stageName),
      crownBtn,
      h('div', { class: 'hdr__right' }, xpLabel, infoBtn)),
    bar,
    nextLabel,
    h('div', { class: 'home-body' }, petStage, actions),
    devBtn);

  let shownLevel = 0;   // the level on screen, to spot a level-up after a log
  function update() {
    const state = getState();
    const { form } = progress();

    // The header shows the level, and the bar the way to the next one (with
    // "into / span" in small print under it): when it fills up, the pet
    // goes up a level.
    const { level: lv, ratio, into, span } = level();
    shownLevel = lv;
    stageName.textContent = petName();
    xpLabel.textContent = `Nv. ${lv}`;
    xpLabel.setAttribute('aria-label', `Nível ${lv}, ${num(state.xp)} XP no total`);
    art.src = form.art;
    aura.src = form.art;
    petStage.style.setProperty('--pet-scale', form.scale);
    petStage.style.setProperty('--aura', form.aura);
    petStage.dataset.form = form.id;

    const ready = canEvolve();
    petStage.dataset.ready = String(ready);
    if (ready) autoEvolve();

    if (devBtn) devBtn.textContent = `DEV +1 Nv (${lv})`;
    fill.style.width = `${Math.round(ratio * 100)}%`;
    // Small, under the bar: XP into this level out of what it takes.
    nextLabel.textContent = ready ? 'Evoluindo…' : `${num(into)} / ${num(span)}`;
    nextLabel.setAttribute('aria-label', ready ? 'Evoluindo' : `${num(into)} de ${num(span)} XP para o nível ${lv + 1}`);

    refreshTrilhaBadge();

    for (const [type, { button, rate }] of buttons) {
      const cfg = ACTIONS[type];
      const left = remainingToday(type);
      // A photo pays by place, so its button shows the range.
      const xps = cfg.places ? Object.values(cfg.places).map((p) => p.xp) : [cfg.xp];
      const lo = Math.min(...xps);
      const hi = Math.max(...xps);
      const pays = lo === hi ? `+${lo} XP` : `+${lo}–${hi} XP`;
      button.dataset.done = String(left === 0);
      rate.textContent = left === 0 ? '✓ hoje' : pays;
      button.setAttribute('aria-label', left === 0
        ? `${cfg.label}: concluído hoje`
        : `${cfg.label}: ${pays} por ${cfg.rate}`);
    }
  }

  function onLogged(result) {
    const before = fill.style.width;
    const fromLevel = shownLevel;
    update();
    if (result.gained > 0) {
      const levelUp = shownLevel > fromLevel;
      // The header keeps the old level until the bar has filled up.
      if (levelUp) xpLabel.textContent = `Nv. ${fromLevel}`;
      celebrateGain(screen, petStage, bar, result.gained, {
        before,
        levelUp,
        onLevelUp: () => {
          xpLabel.textContent = `Nv. ${shownLevel}`;
          replay(xpLabel, 'hdr__xp--up');
        },
      });
    } else if (result.cappedUnits > 0) {
      toast(petStage, 'Registrado — sem XP hoje');
    }
  }

  /**
   * Reaching the evolution level evolves the pet by itself. The short wait
   * lets the XP bar finish filling (and the gain celebration land) so the
   * player sees what earned it. The branch is decided at that moment, from
   * the status bars, by the same published rule as before.
   */
  let evolving = false;
  function autoEvolve() {
    if (evolving) return;
    evolving = true;
    setTimeout(() => {
      if (!screen.isConnected) { evolving = false; return; }
      const from = currentForm();
      const form = evolve();
      if (!form) { evolving = false; return; }
      update();
      showEvolution(screen, form, {
        from,
        onClose: () => { evolving = false; update(); },
      });
    }, 1300);
  }

  const chatter = createChatter();
  function onPetTap(at) {
    hearts(petStage, at);
    const line = chatter.onTap();
    if (line) say(petStage, line);
  }
  petStage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPetTap(); }
  });

  // Now and then, while the home screen is open, the pet says something:
  // mostly a gentle invitation to an action not done today. Spaced minutes
  // apart and capped per visit; stops when the screen goes away.
  function scheduleIdle() {
    const delay = chatter.nextIdleDelay();
    if (delay == null) return;
    setTimeout(() => {
      if (!screen.isConnected) return;
      if (!evolving && !document.hidden && !tourOpen() && !screen.querySelector('.sheet, .evolve, .info')) {
        say(petStage, chatter.onIdle(doneToday, remainingToday), 5200);
      }
      scheduleIdle();
    }, delay);
  }
  scheduleIdle();

  update();
  host.append(screen);
  return { update };
}
