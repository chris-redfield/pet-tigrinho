import { ACTIONS } from '../config.js';
import { getSettings } from '../settings.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Minimal element builder. Everything is built as nodes, never innerHTML. */
export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  append(node, children);
  return node;
}

export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    node.setAttribute(key, value);
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat(4)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

/**
 * Runs `fn` once when the app swaps the current screen for another (a tab
 * change), so a screen can stop its timers and sensors instead of leaving
 * them running behind it. Returns a function that cancels it.
 */
export function onLeave(fn) {
  document.addEventListener('screens:leave', fn, { once: true });
  return () => document.removeEventListener('screens:leave', fn);
}

/** Tells the current screen it is about to be replaced (see `onLeave`). */
export function leaveScreens() {
  document.dispatchEvent(new Event('screens:leave'));
}

/** Thousands separators, pt-BR style: 15000 -> "15.000". */
export function num(n) {
  return n.toLocaleString('pt-BR');
}

/** Picks the singular or plural label for a count. */
export function plural(n, cfg) {
  return n === 1 ? cfg.unit : cfg.unitPlural;
}

/**
 * An action as the player sees it. For a player who uses a wheelchair
 * (Acessibilidade), Passos becomes Cadeira de rodas, counted in minutes;
 * it is still saved in steps. `factor` turns shown units into saved ones.
 */
export function actionCfg(type) {
  const cfg = ACTIONS[type];
  if (cfg.wheelchair && getSettings().mobility) {
    return { ...cfg, ...cfg.wheelchair, sensor: false, factor: cfg.wheelchair.perUnit, icon: 'wheelchair' };
  }
  return { ...cfg, factor: 1, icon: type };
}

/** A saved amount as a number in the units the player reads. */
export function amountNum(type, units) {
  return num(Math.round(units / actionCfg(type).factor));
}

/** "2.000 passos", "20 minutos", "3 refeições". */
export function amount(type, units) {
  const view = actionCfg(type);
  const shown = Math.round(units / view.factor);
  return `${num(shown)} ${plural(shown, view)}`;
}
