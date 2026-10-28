import { ICONS } from '../config.js';
import { h } from './dom.js';
import { iconArt } from './art.js';

/**
 * Finance tab: a chat with the Gemini agent (server.js -> /api/finance).
 *
 * The player says an amount and the agent suggests where it could earn,
 * focused on Banco do Brasil products, and always says that bets and
 * online casinos are not an investment. That last part does not rely on
 * the model alone: the warning card below is fixed on screen.
 *
 * The conversation lives in memory only. Money amounts are personal, so
 * nothing here is written to localStorage and a reload clears it.
 */

const QUICK = [100, 500, 1000, 5000];

/** The agent speaks as Tigrin, the base pet, so the chat reads as talking to it. */
const AVATAR = 'assets/avatar/tigrin.webp';

const WELCOME = 'Oi, eu sou o Tigrin! Me diga um valor, por exemplo "tenho R$ 500", e eu mostro onde ele pode render ' +
  'com segurança, com foco no Banco do Brasil. Lembrete: aposta não é investimento.';

/** Kept across tab switches; cleared on reload. */
const history = [];

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function renderFinance(host) {
  const log = h('div', { class: 'chat__log', dataset: { scroll: '' }, 'aria-live': 'polite' });
  const input = h('input', {
    class: 'chat__input', type: 'text', maxlength: 800, enterkeyhint: 'send',
    placeholder: 'Ex.: tenho R$ 300, onde invisto?', 'aria-label': 'Sua pergunta',
    autocomplete: 'off',
  });
  const sendBtn = h('button', { class: 'chat__send', type: 'submit', 'aria-label': 'Enviar' },
    iconArt(ICONS.send, 'chat__send-icon'));
  const micBtn = speechButton(input, () => submit());

  const form = h('form', { class: 'chat__form', onsubmit: (e) => { e.preventDefault(); submit(); } },
    input, micBtn, sendBtn);

  const chips = h('div', { class: 'chat__chips' },
    QUICK.map((value) => h('button', {
      class: 'chip', type: 'button', text: brl(value),
      onclick: () => submit(`Tenho ${brl(value)}. Onde posso investir esse dinheiro?`),
    })));

  const screen = h('div', { class: 'screen finance' },
    h('div', { class: 'finance__hdr' },
      h('h1', { class: 'finance__title display', text: 'Finanças' }),
      h('p', { class: 'finance__sub', text: 'Seu dinheiro rendendo, sem apostar.' })),
    h('div', { class: 'finance__warn panel', role: 'note' },
      h('strong', { text: 'Aposta não é investimento.' }),
      ' Cassinos online, bets e o jogo do tigrinho são feitos para você perder. Precisa de ajuda? ',
      h('a', { href: 'https://www.jogadoresanonimos.org.br', target: '_blank', rel: 'noopener', text: 'Jogadores Anônimos' }),
      ' · CVV 188'),
    log,
    chips,
    form,
    h('p', { class: 'finance__legal',
      text: 'Sugestões educativas geradas por IA, não são recomendação de investimento. Confira taxas no app do BB.' }));

  let busy = false;

  /** Appends a message; Tigrin's own (replies and "pensando") get the avatar beside them. */
  function bubble(role, text) {
    const msg = h('div', { class: `msg msg--${role}` }, role === 'model' ? richText(text) : text);
    const node = role === 'model' || role === 'wait'
      ? h('div', { class: 'msg-row' }, h('img', { class: 'msg__avatar', src: AVATAR, alt: 'Tigrin' }), msg)
      : msg;
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  async function submit(preset) {
    const text = (preset ?? input.value).trim();
    if (!text || busy) return;
    input.value = '';
    history.push({ role: 'user', text });
    bubble('user', text);

    busy = true;
    form.dataset.busy = 'true';
    const thinking = bubble('wait', 'Tigrin está pensando…');

    try {
      const res = await fetch('api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      thinking.remove();
      if (!res.ok || !data.reply) {
        history.pop();          // let the player resend the same question
        bubble('error', data.error || 'Não consegui falar com a IA. O servidor está rodando? (node server.js)');
      } else {
        history.push({ role: 'model', text: data.reply });
        bubble('model', data.reply);
      }
    } catch {
      thinking.remove();
      history.pop();
      bubble('error', 'Sem conexão com o servidor. Rode "node server.js" e abra http://localhost:8000.');
    } finally {
      busy = false;
      delete form.dataset.busy;
    }
  }

  bubble('model', WELCOME);
  for (const m of history) bubble(m.role, m.text);

  host.append(screen);
}

/**
 * Renders the agent's reply as nodes: "- " lines become a list, **x**
 * becomes bold, everything else is text. Never innerHTML - the reply comes
 * from a model and is treated as untrusted.
 */
function richText(text) {
  const out = [];
  let list = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { list = null; continue; }
    const item = line.match(/^[-*•]\s+(.*)$/);
    if (item) {
      if (!list) { list = h('ul'); out.push(list); }
      list.append(h('li', {}, inline(item[1])));
    } else {
      list = null;
      out.push(h('p', {}, inline(line)));
    }
  }
  return out;
}

function inline(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? h('strong', { text: part }) : part));
}

/**
 * Optional voice input ("falar um valor"), via the browser's speech
 * recognition. Hidden where the browser has none (Firefox, most iOS webviews).
 */
function speechButton(input, onDone) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;

  const button = h('button', { class: 'chat__mic', type: 'button', 'aria-label': 'Falar' },
    iconArt(ICONS.mic, 'chat__mic-icon'));
  let rec = null;

  button.addEventListener('click', () => {
    if (rec) { rec.stop(); return; }
    rec = new Recognition();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    rec.onresult = (e) => {
      input.value = e.results[0][0].transcript;
      onDone();
    };
    rec.onend = () => { rec = null; button.dataset.on = 'false'; };
    button.dataset.on = 'true';
    rec.start();
  });
  return button;
}
