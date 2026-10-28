import { ICONS } from '../config.js';
import { h } from './dom.js';
import { iconArt } from './art.js';

/**
 * Help tab: where to get support for problems with betting.
 *
 * Static on purpose - no AI, no network - so it always works, even offline
 * or with the chat server down. Links open in a new tab; nothing about the
 * player is sent anywhere.
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

export function renderHelp(host) {
  const screen = h('div', { class: 'screen help' },
    h('div', { class: 'help__hdr' },
      h('h1', { class: 'help__title display', text: 'Ajuda' }),
      h('p', { class: 'help__sub', text: 'Você não precisa enfrentar isso sozinho. Pedir ajuda é um passo de coragem.' })),
    h('div', { class: 'help__body', dataset: { scroll: '' } },
      PLACES.map((place, i) => h('section', { class: 'help__card panel' },
        h('div', { class: 'help__top' },
          h('span', { class: 'help__num', text: String(i + 1) }),
          h('div', {},
            h('h2', { class: 'help__name', text: place.title }),
            h('span', { class: 'help__tag', text: place.tag }))),
        h('ol', { class: 'help__steps' }, place.steps.map((step) => h('li', { text: step }))),
        h('a', { class: 'btn help__link', href: place.link.href, target: '_blank', rel: 'noopener noreferrer',
          text: place.link.text }))),

      h('section', { class: 'help__card help__card--urgent panel' },
        h('h2', { class: 'help__name', text: 'Precisa conversar agora?' }),
        h('p', { class: 'help__text',
          text: 'O CVV atende de graça, 24 horas, por telefone e chat, com sigilo. Em emergência, ligue 192 (SAMU).' }),
        h('a', { class: 'btn help__link', href: 'tel:188' },
          iconArt(ICONS.phone, 'help__phone'), 'Ligar para o CVV · 188'))));

  host.append(screen);
}
