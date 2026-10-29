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
