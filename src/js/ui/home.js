import { ACTIONS, ACTION_ORDER, ICONS } from '../config.js';
import { getState, progress, remainingToday, doneToday, petName, level, canEvolve, evolve, devLevelUp, currentForm, coins } from '../state.js';
import { openSheet } from './sheet.js';
import { showEvolution } from './evolve.js';
import { openProfile } from './profile.js';
import { h, num, onLeave, actionCfg } from './dom.js';
import { iconArt, actionIcon, coinArt } from './art.js';
import { openShop } from './shop.js';
import { toast } from './toast.js';
import { hearts, say, celebrateGain, replay } from './petfx.js';
import { createChatter } from '../chatter.js';
import { refreshTrilhaBadge } from './tabbar.js';
import { tourOpen } from './tour.js';
import { getRoutine, inRiskWindow } from '../recovery.js';
import { remind } from '../settings.js';
import { done as chime } from '../sfx.js';

let nudgedOn = null;    // the day Tigrin last called to the risk-hour plan
let remindedOn = null;  // the day the "no task yet" reminder last went out

export function renderHome(host) {
  const stageName = h('div', { class: 'hdr__stage display' });
  // The level, as a round badge on the left end of the XP bar.
  const xpLabel = h('div', { class: 'lvl', role: 'img' });
  // Perfil: the pet's info, conquistas and settings, in one screen.
  const profileBtn = h('button', {
    class: 'hdr__profile', type: 'button', 'aria-label': 'Perfil: informações, conquistas e configurações',
    onclick: () => openProfile(screen, update),
  }, iconArt(ICONS.person, 'hdr__profile-icon'));
  // Coins from the trilhas, top left; a tap opens the shop.
  const coinCount = h('span', { class: 'wallet__n' });
  const wallet = h('button', { class: 'wallet wallet--hdr', type: 'button', onclick: () => openShop(screen, { onEarn: () => document.dispatchEvent(new CustomEvent('app:tab', { detail: 'trilhas' })) }) },
    coinArt('coin'), coinCount);
  const fill = h('div', { class: 'xpbar__fill' });
  const bar = h('div', { class: 'xpbar' }, fill);
  const nextLabel = h('div', { class: 'xpbar__next' });

  const art = h('img', { class: 'pet-art', alt: 'Seu tigrinho', decoding: 'async', fetchpriority: 'high' });
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
  // lives in the aria-label. What an action pays is not printed here, to
  // keep the scene clean: a tap opens its sheet, which shows the XP before
  // anything is logged. Under a button only "✓ hoje" shows, once it is done.
  const buttons = new Map();
  const actions = h('nav', { class: 'actions', 'aria-label': 'Registrar atividade' },
    ACTION_ORDER.map((type) => {
      const rate = h('div', { class: 'act__rate' });
      const disc = h('span', { class: 'act__disc', dataset: { icon: actionCfg(type).icon } }, actionIcon(type, 'act__icon'));
      const button = h('button', {
        class: 'act', type: 'button',
        onclick: () => openSheet(screen, type, onLogged),
      }, disc, rate);
      buttons.set(type, { button, rate, disc });
      return button;
    }));

  // Dev only: ?dev in the URL shows a button that jumps one level.
  const devBtn = new URLSearchParams(location.search).has('dev') && h('button', {
    class: 'dev-lvl', type: 'button',
    onclick: () => onLogged(devLevelUp()),
  });

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'hdr' },
      h('div', { class: 'hdr__left' }, wallet),
      // The pet's name, centred over its level and XP.
      h('div', { class: 'hdr__name' }, stageName),
      h('div', { class: 'hdr__right' }, profileBtn)),
    h('div', { class: 'xprow' }, xpLabel, bar),
    nextLabel,
    h('div', { class: 'home-body' }, petStage, actions),
    devBtn);

  let shownLevel = 0;   // the level on screen, to spot a level-up after a log
  function update() {
    const state = getState();
    const { form } = progress();

    // The badge shows the level, and the bar the way to the next one (with
    // "into / span" in small print under it): when it fills up, the pet
    // goes up a level.
    const { level: lv, ratio, into, span } = level();
    shownLevel = lv;
    stageName.textContent = petName();
    coinCount.textContent = num(coins());
    wallet.setAttribute('aria-label', `${coins()} moedas. Abrir a loja`);
    xpLabel.textContent = String(lv);
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

    for (const [type, { button, rate, disc }] of buttons) {
      const cfg = actionCfg(type);
      // Passos <-> Cadeira de rodas follows the setting.
      if (disc.dataset.icon !== cfg.icon) {
        disc.dataset.icon = cfg.icon;
        disc.replaceChildren(actionIcon(type, 'act__icon'));
      }
      const left = remainingToday(type);
      // A photo pays by place, so its button shows the range.
      const xps = cfg.places ? Object.values(cfg.places).map((p) => p.xp) : [cfg.xp];
      const lo = Math.min(...xps);
      const hi = Math.max(...xps);
      const pays = lo === hi ? `+${lo} XP` : `+${lo}–${hi} XP`;
      button.dataset.done = String(left === 0);
      rate.textContent = '✓ hoje';
      rate.hidden = left !== 0;
      button.setAttribute('aria-label', left === 0
        ? `${cfg.label}: concluído hoje`
        : `${cfg.label}: ${pays} por ${cfg.rate}`);
    }
  }

  function onLogged(result) {
    const before = fill.style.width;
    const fromLevel = shownLevel;
    update();
    // Every activity logged chimes once, as it is saved.
    chime();
    if (result.gained > 0) {
      const levelUp = shownLevel > fromLevel;
      // The badge keeps the old level until the bar has filled up.
      if (levelUp) xpLabel.textContent = String(fromLevel);
      celebrateGain(screen, petStage, bar, result.gained, {
        before,
        levelUp,
        onLevelUp: () => {
          xpLabel.textContent = String(shownLevel);
          replay(xpLabel, 'lvl--up');
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
  let idleTimer = null;
  function scheduleIdle() {
    const delay = chatter.nextIdleDelay();
    if (delay == null) return;
    idleTimer = setTimeout(() => {
      if (!screen.isConnected) return;
      if (!evolving && !document.hidden && !tourOpen() && !screen.querySelector('.sheet, .evolve, .info')) {
        say(petStage, chatter.onIdle(doneToday, remainingToday), 5200);
      }
      scheduleIdle();
    }, delay);
  }
  scheduleIdle();

  // Inside the hours the player said betting used to happen (Progresso >
  // Rotina de volta), Tigrin calls them to the plan, once a day.
  const routine = getRoutine();
  const riskLine = () => `Esse é o seu horário difícil. Bora ${ACTIONS[routine.plan] ? actionCfg(routine.plan).verb.toLowerCase() : 'fazer uma tarefa'} comigo agora?`;
  if (routine && inRiskWindow() && nudgedOn !== new Date().toDateString()) {
    setTimeout(() => {
      if (!screen.isConnected || evolving || tourOpen()) return;
      nudgedOn = new Date().toDateString();
      say(petStage, riskLine(), 6000);
    }, 1800);
  }

  // With the game in the background, the same calls go out as phone
  // notifications, if the player turned reminders on (Perfil >
  // Configurações): the risk-hour one, and after 19h a gentle one when
  // nothing was logged today. Each at most once a day.
  const background = setInterval(() => {
    if (!screen.isConnected) { clearInterval(background); return; }
    const day = new Date().toDateString();
    if (routine && inRiskWindow() && nudgedOn !== day && remind(riskLine())) nudgedOn = day;
    const idle = ACTION_ORDER.every((type) => doneToday(type) === 0);
    if (idle && new Date().getHours() >= 19 && remindedOn !== day
      && remind('Que tal registrar uma tarefa hoje? O Tigrin está por aqui.')) remindedOn = day;
  }, 5 * 60_000);

  // Leaving for another tab: stop the timers now, not on their next tick.
  onLeave(() => {
    clearInterval(background);
    clearTimeout(idleTimer);
  });

  update();
  host.append(screen);
  return { update };
}
