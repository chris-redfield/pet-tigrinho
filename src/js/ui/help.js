import { ICONS } from '../config.js';
import { h } from './dom.js';
import { iconArt } from './art.js';
import { markCare } from '../recovery.js';

/**
 * Where to get support for problems with betting.
 *
 * Static on purpose - no AI, no network - so it always works, even offline
 * or with the chat server down. Links open in a new tab; nothing about the
 * player is sent anywhere. Opening one ticks "Vi um contato de ajuda" on
 * the Progresso tab, on this device only.
 */

const PLACES = [
  {
    title: 'Atendimento psicológico gratuito pela internet',
    tag: 'Online · gratuito · sigiloso',
    steps: [
      'Abra o aplicativo ou o site do Meu SUS Digital e entre com sua conta Gov.br.',
      'Vá em Miniapps e procure a opção sobre problemas com jogos de apostas.',
      'Faça o autoteste para receber orientação. Se for indicado, você é encaminhado para atendimento por videochamada.',
    ],
    link: { href: 'https://meususdigital.saude.gov.br', text: 'Acessar Meu SUS Digital' },
  },
  {
    title: 'Psicólogo pelo SUS',
    tag: 'Presencial · gratuito',
    steps: [
      'Procure a UBS (posto de saúde) mais próxima e explique que está com dificuldade para controlar as apostas.',
      'Você também pode procurar um CAPS, especialmente se a compulsão estiver prejudicando sua rotina, seu casamento ou suas finanças.',
    ],
    link: { href: 'https://www.google.com/maps/search/UBS+ou+CAPS+perto+de+mim', text: 'Ver UBS e CAPS perto de mim' },
  },
  {
    title: 'Jogadores Anônimos',
    tag: 'Grupos de apoio',
    steps: [
      'São grupos com pessoas que enfrentam o mesmo problema.',
      'Você pode participar das reuniões e compartilhar suas dificuldades com quem entende o que você está passando.',
    ],
    link: { href: 'https://www.jogadoresanonimos.com.br', text: 'Encontrar reuniões e grupos' },
  },
];

/**
 * Opens over the Progresso tab (no tab of its own), with a back button
 * that returns to it.
 *
 * @param {HTMLElement} host     element to mount into
 * @param {() => void}  onClose  called after the screen is dismissed
 */
export function openHelp(host, onClose) {
  const close = () => {
    screen.remove();
    onClose?.();
  };

  const screen = h('div', { class: 'ach help', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Onde buscar ajuda' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar para Progresso', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Onde buscar ajuda' })),
    h('p', { class: 'help__sub', text: 'Você não precisa enfrentar isso sozinho. Pedir ajuda é um passo de coragem.' }),
    h('div', { class: 'help__body', dataset: { scroll: '' } },
      PLACES.map((place, i) => h('section', { class: 'help__card panel' },
        h('div', { class: 'help__top' },
          h('span', { class: 'help__num', text: String(i + 1) }),
          h('div', {},
            h('h2', { class: 'help__name', text: place.title }),
            h('span', { class: 'help__tag', text: place.tag }))),
        h('ol', { class: 'help__steps' }, place.steps.map((step) => h('li', { text: step }))),
        h('a', { class: 'btn help__link', href: place.link.href, target: '_blank', rel: 'noopener noreferrer',
          text: place.link.text, onclick: () => markCare('seen') }))),

      h('section', { class: 'help__card help__card--urgent panel' },
        h('h2', { class: 'help__name', text: 'Precisa conversar agora?' }),
        h('p', { class: 'help__text',
          text: 'O CVV atende de graça, 24 horas, por telefone e chat, com sigilo. Em emergência, ligue 192 (SAMU).' }),
        h('a', { class: 'btn help__link', href: 'tel:188', onclick: () => markCare('seen') },
          iconArt(ICONS.phone, 'help__phone'), 'Ligar para o CVV · 188'))));

  host.append(screen);
  screen.querySelector('.info__back').focus({ preventScroll: true });
}
