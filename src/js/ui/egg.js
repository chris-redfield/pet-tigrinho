import { EGGS } from '../config.js';
import { FORMS } from '../forms.js';
import { chooseEgg } from '../state.js';
import { h } from './dom.js';
import { eggArt } from './art.js';
import { reducedMotion } from '../motion.js';

/**
 * First-run egg pick: four 3D eggs spinning (see eggs3d.js). The first tap
 * on one hatches it - a burst of shell and the pet pops out.
 *
 * Each egg always hatches the same pet, nothing is rolled. The screen
 * itself carries only the title; what each egg hatches is in its button
 * label for screen readers.
 *
 * Under "reduce motion" the eggs fade in place instead of dropping in with a
 * bounce, and the hatch is a soft bloom (`?motion` forces the full
 * version, see motion.js).
 */
export function renderEgg(host, onHatched) {
  const reduced = reducedMotion();

  let hatching = false;
  let eggStage = null;

  const stage = h('div', { class: 'egg-stage' });

  // Real buttons for keyboard and screen readers; the canvas is the picture.
  const keys = h('div', { class: 'sr-only' },
    EGGS.map((egg, i) => {
      const base = FORMS[egg.base];
      return h('button', {
        type: 'button',
        'aria-label': `Ovo ${egg.name}: choca ${base.name}, tipo ${base.type}`,
        onclick: () => (eggStage ? eggStage.pick(i) : hatchFlat(egg, stage.children[i])),
      });
    }));

  const screen = h('div', { class: 'screen egg-screen' },
    h('h1', { class: 'egg-title display', text: 'Escolha um ovo' }),
    stage,
    keys);
  host.append(screen);

  /** The pet pops out where the shell burst, then the game starts. */
  function reveal(egg, at) {
    const pet = FORMS[egg.base];
    const art = h('img', {
      class: 'hatch-pet', src: pet.art, alt: pet.name,
      style: `left:${at.x}px;top:${at.y}px;width:${Math.round(at.size * 1.7)}px`,
    });
    stage.append(art);
    setTimeout(() => {
      eggStage?.destroy();
      chooseEgg(egg.id);
      onHatched();
    }, reduced ? 1700 : 2100);
  }

  import('./eggs3d.js')
    .then(({ createEggStage }) => {
      eggStage = createEggStage(stage, EGGS, {
        reduced,
        onPick: (egg, at) => { hatching = true; reveal(egg, at); },
      });
    })
    .catch(() => renderFlat());

  /** No WebGL: the flat SVG eggs, same one-tap hatch. */
  function renderFlat() {
    stage.classList.add('egg-stage--flat');
    stage.append(...EGGS.map((egg) => h('button', {
      class: 'egg', type: 'button', 'aria-hidden': 'true', tabindex: '-1',
      onclick: (e) => hatchFlat(egg, e.currentTarget),
    }, eggArt(egg))));
  }

  function hatchFlat(egg, button) {
    if (hatching || !button) return;
    hatching = true;
    button.classList.add('egg--hatching');
    setTimeout(() => {
      const box = button.getBoundingClientRect();
      const base = stage.getBoundingClientRect();
      button.style.visibility = 'hidden';
      reveal(egg, { x: box.left + box.width / 2 - base.left, y: box.top + box.height / 2 - base.top, size: box.height });
    }, 1250);
  }
}
