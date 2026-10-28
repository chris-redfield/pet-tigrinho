import { h } from './dom.js';

let timer;

/** A short message that fades in at the bottom of `host`, then clears itself. */
export function toast(host, text) {
  host.querySelector('.toast')?.remove();
  const node = h('div', { class: 'toast', text });
  host.append(node);
  clearTimeout(timer);
  timer = setTimeout(() => node.remove(), 1900);
}
