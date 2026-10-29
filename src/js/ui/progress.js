import { ACTIONS, ACTION_ORDER, CHECKIN_XP, ICONS } from '../config.js';
import { getState, payCheckin } from '../state.js';
import {
  PGSI_QUESTIONS, PGSI_OPTIONS, pgsiStatus, savePgsi,
  thisWeek, answerWeek, weekHistory,
  debtSummary, saveDebt,
  careSteps, markCare,
  getRoutine, setRoutine, clearRoutine, routineWeek,
} from '../recovery.js';
import { h } from './dom.js';
import { toast } from './toast.js';
import { iconArt } from './art.js';
import { openHelp } from './help.js';

/**
 * Progresso tab: the five recovery indicators (see recovery.js), one card
 * each. Everything is answered by the player and stays on this device.
 *
 * The tone is the game's: no grades, no red for a bad week, no streak to
 * lose. A number going the wrong way is shown as plainly as one going the
 * right way, with a pointer to help where it matters. Where to get help
 * lives here too (the Ajuda button in the header), not on a tab of its own.
 */

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
/**
 * "dd/mm" for a timestamp or a 'YYYY-MM-DD' day key. A bare day key is read
 * as a local date: `new Date('2026-10-26')` would be UTC midnight, which in
 * Brazil is still the 25th.
 */
const shortDate = (when) => {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(when);
  const d = day ? new Date(+day[1], day[2] - 1, +day[3]) : new Date(when);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
const hourLabel = (h) => `${String(h).padStart(2, '0')}h`;

/** Asks the app to switch tabs (main.js listens). */
const goTo = (tab) => document.dispatchEvent(new CustomEvent('app:tab', { detail: tab }));

export function renderProgress(host) {
  const body = h('div', { class: 'prog__body', dataset: { scroll: '' } });
  const screen = h('div', { class: 'screen prog' },
    h('div', { class: 'prog__hdr' },
      h('div', { class: 'prog__hdr-text' },
        h('h1', { class: 'prog__title display', text: 'Progresso' }),
        h('p', { class: 'prog__sub', text: 'Só você vê isso: fica guardado neste aparelho.' })),
      h('button', { class: 'prog__help', type: 'button', 'aria-label': 'Onde buscar ajuda', onclick: () => help() },
        iconArt(ICONS.heart, 'prog__help-icon'), 'Ajuda')),
    body);

  /** Where to get help, over this screen; back returns here, refreshed. */
  const help = () => openHelp(screen, render);

  function render() {
    const top = body.scrollTop;
    body.replaceChildren(weekCard(), pgsiCard(), debtCard(), careCard(), routineCard());
    body.scrollTop = top;
  }

  // ---------- 2. dias sem apostar ----------
  function weekCard() {
    const answer = thisWeek();
    const weeks = weekHistory(8);
    const chart = h('div', { class: 'prog__bars', role: 'img',
      'aria-label': `Dias sem apostar nas últimas 8 semanas: ${weeks.map((w) => w.days ?? 'sem resposta').join(', ')}` },
      weeks.map((w, i) => h('div', { class: 'prog__bar', dataset: { empty: String(w.days == null), now: String(i === weeks.length - 1) } },
        h('span', { class: 'prog__bar-val', text: w.days == null ? '–' : String(w.days) }),
        h('span', { class: 'prog__bar-track' },
          h('span', { class: 'prog__bar-fill', style: `height:${((w.days ?? 0) / 7) * 100}%` })),
        h('span', { class: 'prog__bar-lbl', text: i === weeks.length - 1 ? 'Agora' : shortDate(w.week) }))));

    const picker = h('div', { class: 'prog__days' },
      Array.from({ length: 8 }, (_, n) => h('button', {
        class: 'prog__day', type: 'button', text: String(n),
        'aria-pressed': String(answer === n),
        'aria-label': `${n} ${n === 1 ? 'dia' : 'dias'}`,
        onclick: () => {
          const { first } = answerWeek(n);
          if (first) {
            const paid = payCheckin();
            if (paid.gained) toast(screen, `Obrigado por responder! +${paid.gained} XP para o Tigrin`);
          } else {
            toast(screen, 'Resposta atualizada');
          }
          render();
        },
      })));

    return card('Dias sem apostar', [
      h('p', { class: 'prog__q', text: answer == null
        ? 'Nos últimos 7 dias, em quantos você ficou sem apostar?'
        : `Esta semana: ${answer} de 7 dias sem apostar. Quer mudar a resposta?` }),
      picker,
      answer == null && h('p', { class: 'prog__note', text: `Responder rende +${CHECKIN_XP} XP, seja qual for o número.` }),
      chart,
      h('p', { class: 'prog__note', text: 'Uma semana difícil não apaga nada. Cada semana é uma nova chance.' }),
    ]);
  }

  // ---------- 1. PGSI ----------
  function pgsiCard() {
    const status = pgsiStatus();
    const last = status.results.at(-1);
    return card('Gravidade do jogo (PGSI)', [
      h('p', { class: 'prog__q', text: '9 perguntas rápidas sobre como as apostas afetam a sua vida. Respondidas no início, depois de 3 e de 6 meses.' }),
      status.results.length > 0 && h('div', { class: 'prog__trend' },
        status.results.map((r, i) => [
          i > 0 && h('span', { class: 'prog__arrow', 'aria-hidden': 'true', text: '→' }),
          h('div', { class: 'prog__point' },
            h('strong', { class: 'prog__big', text: String(r.score) }),
            h('span', { class: 'prog__lbl', text: r.label })),
        ])),
      last && h('p', { class: 'prog__band', dataset: { band: last.band.id }, text: `Última: ${last.band.label} (${last.score} de 27)` }),
      last?.band.id === 'problem' && h('button', { class: 'btn btn--ghost prog__btn', type: 'button',
        text: 'Ver onde buscar ajuda', onclick: help }),
      status.due
        ? h('button', { class: 'btn prog__btn', type: 'button',
          text: status.results.length ? `Responder (${status.nextLabel})` : 'Responder agora',
          onclick: () => openPgsi(screen, status.results.length === 0, render, help) })
        : h('p', { class: 'prog__note', text: `Próximo questionário (${status.nextLabel}) em ${status.inDays} ${status.inDays === 1 ? 'dia' : 'dias'}.` }),
    ]);
  }

  // ---------- 3. peso das dívidas ----------
  function debtCard() {
    const sum = debtSummary();
    const field = (name, label, value) => h('label', { class: 'prog__field' },
      h('span', { text: label }),
      h('input', { class: 'prog__input', name, type: 'number', inputmode: 'numeric', min: '0', step: '1',
        placeholder: 'R$', value: value ?? '' }));
    const form = h('form', { class: 'prog__form', onsubmit: (e) => {
      e.preventDefault();
      const f = new FormData(form);
      if (!(Number(f.get('income')) > 0)) { toast(screen, 'Informe a sua renda do mês'); return; }
      saveDebt({ income: f.get('income'), payment: f.get('payment'), balance: f.get('balance') });
      toast(screen, 'Salvo para este mês');
      render();
    } },
      field('income', 'Renda mensal', sum?.last.income),
      field('payment', 'Parcelas de dívidas de aposta por mês', sum?.last.payment),
      field('balance', 'Total que ainda deve', sum?.last.balance),
      h('button', { class: 'btn prog__btn', type: 'submit', text: 'Salvar este mês' }));

    const share = sum?.last.share ?? 0;
    return card('Peso das dívidas', [
      sum
        ? [
          h('div', { class: 'prog__meter', role: 'img', 'aria-label': `${share}% da renda vai para dívidas` },
            h('span', { class: 'prog__meter-fill', style: `width:${Math.min(100, share)}%` })),
          h('p', { class: 'prog__q' }, h('strong', { class: 'prog__big', text: `${share}%` }), ' da renda vai para dívidas de aposta'),
          sum.months > 1 && h('p', { class: 'prog__note',
            text: `No começo: ${sum.first.share}% da renda e ${brl(sum.first.balance)} devidos. Agora: ${sum.last.share}% e ${brl(sum.last.balance)}.` }),
          h('p', { class: 'prog__note', text: 'A parcela pode cair sem a dívida cair: por isso o total devido também conta.' }),
        ]
        : h('p', { class: 'prog__q', text: 'Quanto da sua renda está preso em dívidas de aposta? Atualize uma vez por mês.' }),
      h('details', { class: 'prog__more', open: !sum },
        h('summary', { text: sum ? 'Atualizar valores' : 'Preencher' }),
        form),
      h('button', { class: 'btn btn--ghost prog__btn', type: 'button',
        text: 'Pedir ao Tigrin um plano para sair das dívidas', onclick: () => goTo('financas') }),
    ]);
  }

  // ---------- 4. chegada ao cuidado ----------
  function careCard() {
    const steps = careSteps();
    return card('Chegada ao cuidado', [
      h('p', { class: 'prog__q', text: 'Pedir ajuda é um caminho de três passos. Marque cada um quando acontecer.' }),
      h('ol', { class: 'prog__steps' }, steps.map((s) => h('li', {},
        h('button', { class: 'prog__step', type: 'button', 'aria-pressed': String(Boolean(s.at)),
          onclick: () => { markCare(s.id, !s.at); render(); } },
          h('span', { class: 'prog__check', 'aria-hidden': 'true', text: s.at ? '✓' : '' }),
          h('span', { class: 'prog__step-lbl', text: s.label }),
          s.at && h('span', { class: 'prog__step-date', text: shortDate(s.at) }))))),
      h('button', { class: 'btn btn--ghost prog__btn', type: 'button', text: 'Ver onde buscar ajuda', onclick: help }),
    ]);
  }

  // ---------- 5. rotina de volta ----------
  function routineCard() {
    const routine = getRoutine();
    if (!routine) return card('Rotina de volta', [
      h('p', { class: 'prog__q', text: 'Em que horário a vontade de apostar costuma bater? Nesse horário o Tigrin vai te chamar para outra coisa.' }),
      routineForm(),
    ]);

    const week = routineWeek(getState().log);
    return card('Rotina de volta', [
      h('p', { class: 'prog__q' },
        'Seu horário difícil: ', h('strong', { text: `${hourLabel(routine.from)} às ${hourLabel(routine.to)}` }),
        '. Plano: ', h('strong', { text: ACTIONS[routine.plan]?.verb ?? '—' }), '.'),
      h('div', { class: 'prog__meter', role: 'img', 'aria-label': `${week.done} de ${week.planned} dias` },
        h('span', { class: 'prog__meter-fill prog__meter-fill--jade', style: `width:${(week.done / week.planned) * 100}%` })),
      h('p', { class: 'prog__note', text: `Esta semana: ${week.done} de ${week.planned} ${week.planned === 1 ? 'dia' : 'dias'} com uma tarefa registrada nesse horário.` }),
      h('details', { class: 'prog__more' },
        h('summary', { text: 'Mudar horário ou plano' }),
        routineForm(routine),
        h('button', { class: 'btn btn--ghost prog__btn', type: 'button', text: 'Remover horário',
          onclick: () => { clearRoutine(); render(); } })),
    ]);
  }

  function routineForm(current) {
    const hours = (name, value) => h('select', { class: 'prog__input', name },
      Array.from({ length: 24 }, (_, hr) => h('option', { value: String(hr), selected: hr === value, text: hourLabel(hr) })));
    const form = h('form', { class: 'prog__form', onsubmit: (e) => {
      e.preventDefault();
      const f = new FormData(form);
      if (f.get('from') === f.get('to')) { toast(screen, 'Escolha um horário de início e de fim diferentes'); return; }
      setRoutine({ from: f.get('from'), to: f.get('to'), plan: f.get('plan') });
      toast(screen, 'Combinado! Te chamo nesse horário.');
      render();
    } },
      h('div', { class: 'prog__row' },
        h('label', { class: 'prog__field' }, h('span', { text: 'Das' }), hours('from', current?.from ?? 20)),
        h('label', { class: 'prog__field' }, h('span', { text: 'Às' }), hours('to', current?.to ?? 22))),
      h('label', { class: 'prog__field' }, h('span', { text: 'O que fazer no lugar' }),
        h('select', { class: 'prog__input', name: 'plan' },
          ACTION_ORDER.map((type) => h('option', { value: type, selected: type === (current?.plan ?? 'steps'), text: ACTIONS[type].verb })))),
      h('button', { class: 'btn prog__btn', type: 'submit', text: 'Salvar' }));
    return form;
  }

  render();
  host.append(screen);
}

function card(title, children) {
  return h('section', { class: 'prog__card panel' },
    h('h2', { class: 'prog__name', text: title }),
    children);
}

/**
 * The PGSI questionnaire, one question per screen. The first time it asks
 * about the last 12 months; the follow-ups about the last 3.
 */
function openPgsi(screen, first, onDone, help) {
  const answers = [];
  const period = first ? 'Nos últimos 12 meses' : 'Nos últimos 3 meses';
  const count = h('div', { class: 'pgsi__count' });
  const lead = h('p', { class: 'pgsi__lead', text: `${period}…` });
  const question = h('h2', { class: 'pgsi__q', id: 'pgsi-q' });
  const options = h('div', { class: 'pgsi__opts' });
  const back = h('button', { class: 'btn btn--ghost pgsi__back', type: 'button', text: 'Voltar',
    onclick: () => { answers.pop(); step(); } });
  const close = h('button', { class: 'pgsi__close', type: 'button', 'aria-label': 'Fechar', text: '✕',
    onclick: () => overlay.remove() });

  const overlay = h('div', { class: 'pgsi', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pgsi-q' },
    h('div', { class: 'pgsi__top' }, count, close),
    h('div', { class: 'pgsi__body', dataset: { scroll: '' } }, lead, question, options, back));

  function step() {
    const i = answers.length;
    if (i === PGSI_QUESTIONS.length) { result(); return; }
    count.textContent = `Pergunta ${i + 1} de ${PGSI_QUESTIONS.length}`;
    question.textContent = PGSI_QUESTIONS[i];
    back.hidden = i === 0;
    options.replaceChildren(...PGSI_OPTIONS.map((o) => h('button', { class: 'chip pgsi__opt', type: 'button', text: o.label,
      onclick: () => { answers.push(o.value); step(); } })));
    options.firstChild.focus({ preventScroll: true });
  }

  function result() {
    const { score, band } = savePgsi(answers);
    count.textContent = 'Resultado';
    lead.textContent = 'Obrigado por responder com sinceridade.';
    question.textContent = `${score} de 27 · ${band.label}`;
    back.hidden = true;
    const help = band.id === 'problem' || band.id === 'moderate';
    options.replaceChildren(
      h('p', { class: 'pgsi__text', text: help
        ? 'Isso não é um diagnóstico, mas mostra que vale a pena conversar com alguém. Ajuda gratuita e sigilosa está a um toque.'
        : 'Isso não é um diagnóstico. Continue cuidando de você: vamos repetir daqui a 3 meses para ver como está.' }),
      help && h('button', { class: 'btn', type: 'button', text: 'Ver onde buscar ajuda',
        onclick: () => { overlay.remove(); help(); } }),
      h('button', { class: `btn${help ? ' btn--ghost' : ''}`, type: 'button', text: 'Concluir',
        onclick: () => { overlay.remove(); onDone(); } }),
      h('p', { class: 'prog__note', text: 'Adaptado do Problem Gambling Severity Index (Ferris & Wynne, 2001).' }));
    onDone();
  }

  screen.append(overlay);
  step();
}
