import { h } from './dom.js';
import { reducedMotion } from '../motion.js';
import { haptic } from '../settings.js';
import { play, pat } from '../sfx.js';

/**
 * Small "juice" effects around the pet: hearts on a tap, a speech bubble,
 * and the celebration when an action pays XP.
 *
 * Satisfying, never slot-like (README, "On the Fortune Tiger look"): no
 * number counts up, no coin shower, no flashing frame, no jingle. The XP a
 * log pays is shown as one fixed figure the player already saw on the
 * button. Under reduced motion only the static parts remain.
 */

const HEART = 'assets/fx/heart.webp';
const SIZES = ['s', 'm', 'l'];

const rand = (min, max) => min + Math.random() * (max - min);

/** Runs `fn` once the element's animation ends, with a timeout as backstop. */
function whenDone(node, ms, fn = () => node.remove()) {
  let done = false;
  const finish = () => { if (!done) { done = true; fn(); } };
  node.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, ms);
}

/** The pet's one-shot reactions. Their CSS rules tie, so a leftover one would win over the next. */
const ONE_SHOT = ['pet-stage--pet', 'pet-stage--hop'];

/** Restarts a one-shot CSS animation class on `node`, clearing the other reactions first. */
export function replay(node, cls) {
  node.classList.remove(...ONE_SHOT, cls);
  void node.offsetWidth;   // force a reflow so the animation starts over
  node.classList.add(cls);
}

/**
 * A heart floats up from the tap point, in one of three sizes.
 * Purely cosmetic: a tap pays nothing.
 *
 * @param {HTMLElement} stage   the .pet-stage
 * @param {{x:number, y:number}} [at]  client coordinates of the tap
 */
export function hearts(stage, at) {
  const box = stage.getBoundingClientRect();
  const x = at ? at.x - box.left : box.width / 2;
  const y = at ? at.y - box.top : box.height / 2;
  // One heart per tap, nudged sideways so quick taps fan out instead of
  // stacking inside each other.
  const size = SIZES[Math.floor(Math.random() * SIZES.length)];
  const heart = h('img', {
    class: `heart heart--${size}`, src: HEART, alt: '', 'aria-hidden': 'true',
    style: `left:${x + rand(-14, 14)}px;top:${y}px;--dx:${rand(-9, 9).toFixed(1)};--rot:${rand(-18, 18).toFixed(0)}deg`,
  });
  stage.append(heart);
  whenDone(heart, 2100);

  // The pet leans toward the hand: up to 6deg, by how far off-centre the tap is.
  const off = at ? Math.max(-1, Math.min(1, (x - box.width / 2) / (box.width / 4))) : 0.6;
  stage.style.setProperty('--lean', `${(off * 6).toFixed(1)}deg`);
  replay(stage, 'pet-stage--pet');
  haptic(10);
  pat();
}

/** A speech bubble above the pet; a new line replaces the current one. */
export function say(stage, text, ms = 3600) {
  stage.querySelector('.bubble')?.remove();
  const bubble = h('div', { class: 'bubble', role: 'status', text });
  stage.append(bubble);
  setTimeout(() => {
    bubble.classList.add('bubble--out');
    whenDone(bubble, 400);
  }, ms);
}

/**
 * Celebrates XP earned by a real action: the pet hops, "+N XP" rises from
 * it, golden orbs fly from the pet into the XP bar, and the bar answers
 * with a short glow and bounce when they land.
 *
 * @param {HTMLElement} screen  positioned container for the orbs
 * @param {HTMLElement} stage   the .pet-stage
 * @param {HTMLElement} bar     the .xpbar
 * @param {number} gained       XP paid by the action (already shown on the button)
 * @param {object} [opts]
 * @param {string} [opts.before]   the fill's width before the gain; the bar
 *                                 holds it until the gain lands, then grows
 * @param {boolean} [opts.levelUp] the gain crossed into a new level: the bar
 *                                 fills up, starts over from empty and grows
 *                                 to the new level's share
 * @param {() => void} [opts.onLevelUp]  runs as the bar starts over
 */
export function celebrateGain(screen, stage, bar, gained, { before, levelUp, onLevelUp } = {}) {
  replay(stage, 'pet-stage--hop');

  const label = h('div', { class: 'xp-float', text: `+${gained} XP`, 'aria-hidden': 'true' });
  stage.append(label);
  whenDone(label, 2200);

  const fill = bar.querySelector('.xpbar__fill') || bar;
  const after = fill.style.width;
  if (before && before !== after) fill.style.width = before;

  const grow = (width, then) => {
    bar.classList.add('xpbar--grow');
    fill.style.width = width;
    setTimeout(() => { bar.classList.remove('xpbar--grow'); then?.(); }, 1150);
  };
  const land = () => {
    haptic(levelUp ? [20, 60, 30] : 18);
    play('gain');
    replay(bar, 'xpbar--gain');
    if (!levelUp) { grow(after); return; }
    // Full, then empty in one frame, then up to the new level's share.
    grow('100%', () => {
      bar.classList.add('xpbar--snap');
      fill.style.width = '0%';
      void fill.offsetWidth;
      bar.classList.remove('xpbar--snap');
      onLevelUp?.();
      replay(bar, 'xpbar--gain');
      grow(after);
    });
  };

  if (reducedMotion()) { setTimeout(land, 450); return; }

  const base = screen.getBoundingClientRect();
  const from = stage.getBoundingClientRect();
  const to = fill.getBoundingClientRect();
  const sx = from.left + from.width / 2 - base.left;
  const sy = from.top + from.height * 0.45 - base.top;
  const tx = Math.max(to.right - 8, bar.getBoundingClientRect().left + 8) - base.left;
  const ty = to.top + to.height / 2 - base.top;

  const orbs = 8;
  let landed = 0;
  for (let i = 0; i < orbs; i++) {
    const orb = h('span', { class: 'xp-orb', 'aria-hidden': 'true', style: `left:${sx}px;top:${sy}px` });
    screen.append(orb);
    const midX = (sx + tx) / 2 + rand(-60, 60);
    const midY = Math.min(sy, ty) - rand(20, 70);
    const anim = orb.animate([
      { transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 },
      { transform: `translate(calc(${midX - sx}px - 50%), calc(${midY - sy}px - 50%)) scale(1.1)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(${tx - sx}px - 50%), calc(${ty - sy}px - 50%)) scale(.5)`, opacity: 0.9 },
    ], { duration: 620 + i * 40, delay: i * 55, easing: 'cubic-bezier(.5, 0, .75, .4)', fill: 'forwards' });
    anim.onfinish = () => {
      orb.remove();
      if (++landed === orbs) land();
    };
  }
}
