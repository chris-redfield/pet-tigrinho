import { ICONS } from '../config.js';
import { TRILHA_COINS } from '../trilhas.js';
import { coins } from '../state.js';
import { h, num } from './dom.js';
import { iconArt, coinArt } from './art.js';

/**
 * Loja: where the trilha coins will buy adornos for the pet.
 *
 * Locked for now - what the adornos are is still being decided - but it is
 * already reachable, so the coins have a visible purpose from day one.
 *
 * Rules for when it opens (README, design rules): every item shown with its
 * fixed price, bought as seen. No boxes, rolls or surprise items, no timed
 * offers, and coins are never sold for money.
 *
 * @param {HTMLElement} host   element to mount into
 * @param {object}      [opts]
 * @param {() => void}  [opts.onEarn]  shows a button to go earn coins (the Trilhas tab)
 */
export function openShop(host, { onEarn } = {}) {
  const close = () => screen.remove();

  const screen = h('div', { class: 'ach shop', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Loja' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Loja' }),
      h('div', { class: 'wallet', 'aria-label': `${coins()} moedas` },
        coinArt('coin'), h('span', { text: num(coins()) }))),
    h('div', { class: 'shop__body', dataset: { scroll: '' } },
      h('section', { class: 'shop__hero panel' },
        h('div', { class: 'shop__lock' }, iconArt(ICONS.lock, 'shop__lock-icon')),
        h('h2', { class: 'shop__title display', text: 'Adornos' }),
        h('span', { class: 'shop__soon', text: 'Em breve' }),
        h('p', { class: 'shop__text',
          text: 'Aqui você vai trocar suas moedas por adornos para o seu pet. Guarde as moedas: elas não se perdem e não expiram.' }),
        h('p', { class: 'shop__earn' },
          'Cada trilha concluída rende ', coinArt('coin coin--inline'), ` ${TRILHA_COINS} moedas.`),
        onEarn && h('button', { class: 'btn', type: 'button', text: 'Ganhar moedas nas Trilhas',
          onclick: () => { close(); onEarn(); } })),
      h('div', { class: 'shop__grid', 'aria-hidden': 'true' },
        Array.from({ length: 6 }, () => h('div', { class: 'shop__slot' },
          iconArt(ICONS.lock, 'shop__slot-icon'),
          h('span', { class: 'shop__price' }, coinArt('coin coin--inline'), ' ?'))))));

  host.append(screen);
  screen.querySelector('.info__back').focus({ preventScroll: true });
}
