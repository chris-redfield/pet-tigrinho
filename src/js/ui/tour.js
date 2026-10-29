import { finishOnboarding } from '../state.js';
import { h } from './dom.js';

/**
 * First-run tour: Tigrin walks the player through the home screen, one
 * part at a time. A spotlight cuts a hole over the part being explained
 * and a card says what it is for; everything else is dimmed and inert
 * until the tour ends.
 *
 * It opens by itself once, right after the first egg hatches, and can be
 * replayed from the info screen. Skipping is always one tap away and is
 * never asked twice - a tour that nags is the opposite of the point.
 *
 * Steps point at elements by selector. A step whose element is not on
 * screen falls back to a centred card, so the tour never breaks when the
 * layout changes.
 */

const AVATAR = 'assets/avatar/tigrin.webp';

export const STEPS = [
  {
    target: null,
    title: 'Oi! Eu sou o Tigrin 🐯',
    text: 'Eu cresço com o que você faz na vida real. Vou te mostrar como tudo funciona: leva menos de um minuto.',
  },
  {
    target: '.pet-stage',
    title: 'Esse sou eu',
    text: 'Toque em mim para fazer carinho. De vez em quando eu também falo com você. 💛',
  },
  {
    target: '.actions',
    title: 'Suas tarefas do dia',
    text: 'Foto, passos, leitura, estudo e refeição. Toque em uma para ver quanto XP ela rende antes de registrar.',
  },
  {
    target: '.xprow',
    title: 'Nível e XP',
    text: 'O número no círculo é o meu nível. A barra enche com as tarefas e, quando completa, eu subo de nível. Em alguns níveis eu evoluo sozinho! Cada tarefa tem um limite por dia: descansar também faz parte.',
  },
  {
    target: '.wallet--hdr',
    title: 'Moedas',
    text: 'Cada trilha concluída rende moedas. Toque aqui para ver a loja: os adornos para mim chegam em breve, e as moedas não se perdem.',
  },
  {
    target: '.hdr__profile',
    title: 'Perfil',
    text: 'Aqui ficam minhas informações (status, próxima evolução, Enciclopédia), suas conquistas e as configurações do jogo.',
  },
  {
    target: '.tab[data-tab="trilhas"]',
    title: 'Trilhas',
    text: 'Uma missão curta por dia, com algo legal para aprender. Pulou um dia? Ela continua te esperando.',
  },
  {
    target: '.tab[data-tab="progresso"]',
    title: 'Seu progresso',
    text: 'Uma vez por semana, me conte quantos dias ficou sem apostar. Aqui também ficam suas dívidas e seu horário difícil. Só você vê.',
  },
  {
    target: '.tab[data-tab="progresso"]',
    title: 'Ajuda',
    text: 'Se bater a vontade de apostar ou o dia pesar, toque em Ajuda no topo do Progresso: lá tem contatos de apoio gratuitos. Ninguém precisa passar por isso sozinho.',
  },
  {
    target: '.tab[data-tab="financas"]',
    title: 'Finanças',
    text: 'Converse comigo sobre dinheiro: guardar, organizar, investir com segurança. Aposta não é investimento.',
  },
  {
    target: null,
    title: 'Tudo pronto!',
    text: 'Sem pressa: um dia de cada vez. Que tal começar registrando uma tarefa?',
  },
];

let open = null;   // the running tour, so it never opens twice

/**
 * @param {{onDone?: () => void}} [opts]
 */
export function startTour({ onDone } = {}) {
  if (open) return;
  const stage = document.getElementById('stage');
  let index = 0;

  const hole = h('div', { class: 'tour__hole', 'aria-hidden': 'true' });
  const count = h('div', { class: 'tour__count' });
  const title = h('h2', { class: 'tour__title display', id: 'tour-title' });
  const text = h('p', { class: 'tour__text', 'aria-live': 'polite' });
  const dots = h('div', { class: 'tour__dots', 'aria-hidden': 'true' },
    STEPS.map(() => h('span', { class: 'tour__dot' })));
  const back = h('button', { class: 'btn btn--ghost tour__back', type: 'button', text: 'Voltar',
    onclick: () => go(index - 1) });
  const next = h('button', { class: 'btn tour__next', type: 'button', onclick: () => go(index + 1) });
  const skip = h('button', { class: 'tour__skip', type: 'button', text: 'Pular', onclick: finish });

  const card = h('div', { class: 'tour__card panel' },
    h('div', { class: 'tour__head' },
      h('img', { class: 'tour__avatar', src: AVATAR, alt: '' }),
      count,
      skip),
    title,
    text,
    dots,
    h('div', { class: 'tour__actions' }, back, next));

  const overlay = h('div', {
    class: 'tour', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tour-title',
    onkeydown: onKey,
  }, hole, card);

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); finish(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    else if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); go(index - 1); }
  }

  function go(to) {
    if (to >= STEPS.length) { finish(); return; }
    index = Math.max(0, to);
    render();
    next.focus({ preventScroll: true });
  }

  /** The step's element, if it is on screen. */
  function targetOf(step) {
    const el = step.target && document.querySelector(step.target);
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return box.width && box.height ? box : null;
  }

  function render() {
    const step = STEPS[index];
    const last = index === STEPS.length - 1;
    count.textContent = `${index + 1} de ${STEPS.length}`;
    title.textContent = step.title;
    text.textContent = step.text;
    [...dots.children].forEach((d, i) => { d.dataset.on = String(i === index); });
    back.hidden = index === 0;
    skip.hidden = last;
    next.textContent = index === 0 ? 'Vamos lá!' : last ? 'Começar' : 'Próximo';
    place(targetOf(step));
  }

  /** Moves the spotlight over the target and the card above or below it. */
  function place(box) {
    const frame = stage.getBoundingClientRect();
    const u = frame.width / 100;
    if (!box) {
      overlay.dataset.centred = 'true';
      Object.assign(hole.style, {
        left: `${frame.width / 2}px`, top: `${frame.height / 2}px`, width: '0px', height: '0px',
      });
      card.style.top = '';
      card.style.bottom = '';
      return;
    }
    overlay.dataset.centred = 'false';
    const pad = u * 2;
    const left = box.left - frame.left - pad;
    const top = box.top - frame.top - pad;
    const width = box.width + pad * 2;
    const height = box.height + pad * 2;
    Object.assign(hole.style, {
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
    });
    // The card goes on the side with more room; over a big target (the pet)
    // it sits at the bottom, overlapping the spotlight's lower edge.
    const gap = u * 4;
    if (height > frame.height * 0.45) {
      card.style.top = '';
      card.style.bottom = `${gap}px`;
    } else if (top + height / 2 > frame.height / 2) {
      card.style.top = '';
      card.style.bottom = `${Math.max(gap, frame.height - top + gap)}px`;
    } else {
      card.style.bottom = '';
      card.style.top = `${Math.max(gap, top + height + gap)}px`;
    }
  }

  function finish() {
    finishOnboarding();
    removeEventListener('resize', onResize);
    overlay.remove();
    open = null;
    onDone?.();
  }

  const onResize = () => render();
  addEventListener('resize', onResize);

  open = overlay;
  stage.append(overlay);
  render();
  next.focus({ preventScroll: true });
}

/** Whether the tour is on screen (the pet stays quiet meanwhile). */
export function tourOpen() {
  return Boolean(open);
}
