import { ICONS } from '../config.js';
import { TRILHA_XP, TRILHA_COINS } from '../trilhas.js';
import { trilhaPath, trilhaToday, completeTrilha, coins } from '../state.js';
import { done as chime } from '../sfx.js';
import { h, num, amount, amountNum, actionCfg } from './dom.js';
import { iconArt, actionIcon, coinArt } from './art.js';
import { openShop } from './shop.js';
import { openSheet } from './sheet.js';
import { toast } from './toast.js';

/**
 * Trilhas: the day path, Duolingo-shaped.
 *
 * One trilha per day, each a handful of the actions the home screen already
 * logs plus one small thing worth knowing. The tasks tick themselves off
 * from what the player logs, here or on the home screen, and finishing the
 * day pays the flat bonus printed on the card: XP and coins, the coins
 * being the trilha's own reward (spent in the shop, see shop.js).
 *
 * What the shape borrows from Duolingo is the zigzag of days and the one
 * highlighted node you are on. What it does not borrow is the streak: a
 * skipped day loses nothing, the trilha is simply still there tomorrow.
 *
 * @param {HTMLElement} host      element to mount into
 * @param {object}      handlers
 * @param {() => void}  handlers.onChange  XP changed - refresh the caller
 * @param {() => void}  handlers.onClose   the screen was dismissed
 */
export function openTrilhas(host, { onChange, onClose } = {}) {
  const close = () => {
    screen.remove();
    onClose?.();
  };

  let centred = false;
  // The coins the trilhas have paid, top right; a tap opens the shop.
  const wallet = h('button', { class: 'wallet', type: 'button', onclick: () => openShop(screen) });
  const banner = h('div', { class: 'tbanner panel' });
  const path = h('ol', { class: 'tpath' });
  const body = h('div', { class: 'trilhas__body', dataset: { scroll: '' } }, path);

  /** How far each day sits off the centre line, repeating every eight days. */
  const SWAY = [0, 1, 1.7, 1, 0, -1, -1.7, -1];

  const STATUS = {
    done:    { icon: ICONS.check, tag: 'Concluída' },
    current: { icon: ICONS.star,  tag: 'Hoje' },
    waiting: { icon: ICONS.lock,  tag: 'Abre amanhã' },
    locked:  { icon: ICONS.lock,  tag: 'Bloqueada' },
  };

  function refresh() {
    const today = trilhaToday();
    const nodes = trilhaPath();

    banner.replaceChildren(
      h('div', { class: 'tbanner__kicker', text: today.waiting ? 'Trilha de hoje' : `Dia ${today.day}` }),
      h('div', { class: 'tbanner__title display', text: today.waiting ? 'Concluída!' : today.title }),
      h('div', { class: 'tbanner__sub' }, today.waiting
        ? 'A próxima trilha abre amanhã. Nada se perde até lá.'
        : [`${today.tasks.length} tarefas · +${today.xp} XP e `, coinArt('coin coin--inline'), ` ${today.coins} ao concluir`]));
    wallet.replaceChildren(coinArt('coin'), h('span', { text: num(coins()) }));
    wallet.setAttribute('aria-label', `${coins()} moedas. Abrir a loja`);

    path.replaceChildren(...nodes.map((node) => {
      const look = STATUS[node.status];
      const sway = SWAY[(node.day - 1) % SWAY.length];
      return h('li', { class: 'tnode', dataset: { status: node.status }, style: `--sway:${sway}` },
        node.status === 'current' && h('span', { class: 'tnode__bubble', text: 'COMEÇAR' }),
        h('button', {
          class: 'tnode__btn', type: 'button',
          'aria-label': `Dia ${node.day}: ${node.title} — ${look.tag}`,
          onclick: () => openDay(node),
        }, iconArt(look.icon, 'tnode__icon')),
        h('span', { class: 'tnode__day', text: `Dia ${node.day}` }),
        node.status === 'waiting' && h('span', { class: 'tnode__hint', text: 'amanhã' }));
    }));

    // Open on the day the player is on. Only once: later refreshes happen
    // while a card is up, and re-centring under it reads as a glitch.
    if (!centred) {
      const here = path.querySelector('.tnode[data-status="current"], .tnode[data-status="waiting"]');
      if (here) {
        here.scrollIntoView({ block: 'center' });
        centred = true;
      }
    }
  }

  /** "1 foto", "2.000 passos" - the target written the way the player reads it. */
  function taskText(task) {
    return amount(task.type, task.units);
  }

  /**
   * One day's card. The current day is live: its tasks are checked against
   * what was logged today and can be logged straight from here. Any other
   * day is a read-only preview, so the player can always see what is coming.
   */
  function openDay(node) {
    if (node.status === 'locked') {
      toast(screen, `Conclua o Dia ${trilhaToday().day} primeiro`);
      return;
    }

    const live = node.status === 'current';
    const dismiss = () => { scrim.remove(); card.remove(); };
    const scrim = h('div', { class: 'scrim scrim--day', onclick: dismiss });

    const tasks = h('ul', { class: 'tday__tasks' });
    const state = h('p', { class: 'tday__state' });
    const confirm = h('button', { class: 'btn', type: 'button', onclick: finish });

    function fill() {
      // The live day carries its own progress; a preview is all done or
      // all pending, depending on whether that day has been finished.
      const data = live ? trilhaToday() : node;
      const rows = live
        ? data.tasks
        : data.tasks.map((task) => ({ ...task, done: node.status === 'done' }));

      tasks.replaceChildren(...rows.map((task) => {
        // The circle carries the affordance: a check once it is done, a
        // plus while the row can still be tapped to log it.
        const mark = h('span', { class: 'tday__mark' },
          task.done ? iconArt(ICONS.check, 'tday__mark-icon')
            : live ? iconArt(ICONS.plus, 'tday__mark-icon')
            : null);
        const text = h('div', { class: 'tday__text' },
          h('span', { class: 'tday__name', text: taskText(task) }),
          h('span', { class: 'tday__have', text: !live
            ? (task.done ? 'Concluída' : actionCfg(task.type).label)
            : task.done ? 'Feito hoje'
            : `${amountNum(task.type, task.have)} de ${amountNum(task.type, task.units)} hoje` }));

        // Only the live day can be logged from here; the rest are a preview.
        return h('li', { class: 'tday__task', dataset: { done: String(task.done) } },
          live && !task.done
            ? h('button', { class: 'tday__row', type: 'button',
                onclick: () => openSheet(screen, task.type, onLogged) },
                actionIcon(task.type, 'tday__icon'), text, mark)
            : h('div', { class: 'tday__row' },
                actionIcon(task.type, 'tday__icon'), text, mark));
      }));

      if (!live) {
        confirm.hidden = true;
        state.hidden = false;
        state.textContent = node.status === 'done'
          ? `Concluída · +${TRILHA_XP} XP · +${TRILHA_COINS} moedas`
          : 'Esta trilha abre amanhã.';
        return;
      }
      state.hidden = true;
      confirm.hidden = false;
      confirm.disabled = !data.ready;
      const left = rows.filter((task) => !task.done).length;
      confirm.replaceChildren(...(data.ready
        ? [`Concluir o dia · +${data.xp} XP · `, coinArt('coin coin--inline'), ` ${data.coins}`]
        : [left === 1 ? 'Falta 1 tarefa' : `Faltam ${left} tarefas`]));
      confirm.setAttribute('aria-label', data.ready ? `Concluir o dia: +${data.xp} XP e ${data.coins} moedas` : confirm.textContent);
    }

    function onLogged(result) {
      chime();   // every activity logged chimes once, as it is saved
      fill();
      refresh();
      onChange?.();
      // No "+N XP" toast here: the task row itself ticks over to done, which
      // says it better than a bubble landing on top of the card's buttons.
      if (result.gained === 0 && result.cappedUnits > 0) toast(screen, 'Registrado — sem XP hoje');
    }

    function finish() {
      const result = completeTrilha();
      if (!result) return;
      chime();
      dismiss();
      refresh();
      onChange?.();
      toast(screen, `Dia ${node.day} concluído · +${result.gained} XP · +${result.coins} moedas`);
    }

    const card = h('div', { class: 'tday sheet panel', role: 'dialog', 'aria-modal': 'true',
      dataset: { scroll: '' } },
      h('div', { class: 'tday__hdr' },
        h('span', { class: 'tday__day', text: `Dia ${node.day}` }),
        h('h2', { class: 'tday__title display', text: node.title })),
      tasks,
      h('div', { class: 'tday__note' },
        iconArt(ICONS.bulb, 'tday__bulb'),
        h('div', {},
          h('strong', { class: 'tday__note-title', text: node.note.title }),
          h('p', { class: 'tday__note-text', text: node.note.text }))),
      state,
      confirm,
      h('button', { class: 'btn btn--ghost', type: 'button', text: 'Fechar', onclick: dismiss }));

    fill();
    screen.append(scrim, card);
  }

  const screen = h('div', { class: 'trilhas', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Trilhas' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Trilhas' }),
      wallet),
    banner,
    body);

  refresh();
  host.append(screen);
}
