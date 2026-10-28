import { ICONS, RARITIES, ACTIONS, STATS } from '../config.js';
import { level, stats, petName, renamePet, currentForm, nextBranch, progress, canEvolve } from '../state.js';
import { h, num } from './dom.js';
import { iconArt } from './art.js';

/**
 * Pet info screen: name, level, rarity, status bars, the next evolution and
 * the encyclopedia.
 *
 * The status bars have no "low" colour and no warning - an empty bar just
 * means that kind of action has not been logged this phase. The evolution
 * card shows, live, which form the pet would take if it evolved right now
 * and what each branch asks for, so the branch is always a choice the
 * player can see coming, never a surprise.
 *
 * @param {HTMLElement} host     element to mount into
 * @param {() => void}  onClose  called after the screen is dismissed
 */
export function openInfo(host, onClose) {
  const form = currentForm();
  const rarity = RARITIES[form.rarity];
  const lv = level();
  const bars = stats();

  const close = () => {
    screen.remove();
    onClose?.();
  };

  // ---------- name ----------

  const nameText = h('h2', { class: 'info__name display' });
  const nameInput = h('input', {
    class: 'info__input', type: 'text', maxlength: 16, enterkeyhint: 'done',
    'aria-label': 'Nome do tigrinho', autocomplete: 'off', spellcheck: 'false',
    hidden: true,
    onkeydown: (e) => {
      if (e.key === 'Enter') nameInput.blur();
      if (e.key === 'Escape') { nameInput.value = petName(); nameInput.blur(); }
    },
    onblur: () => finishRename(),
  });
  const editBtn = h('button', {
    class: 'info__edit', type: 'button', 'aria-label': 'Renomear',
    onclick: startRename,
  }, iconArt(ICONS.pencil, 'info__edit-icon'));

  function startRename() {
    nameInput.value = petName() === form.name ? '' : petName();
    nameInput.placeholder = form.name;
    nameText.hidden = true;
    editBtn.hidden = true;
    nameInput.hidden = false;
    nameInput.focus();
    nameInput.select();
  }

  function finishRename() {
    if (nameInput.hidden) return;
    renamePet(nameInput.value);
    nameInput.hidden = true;
    nameText.hidden = false;
    editBtn.hidden = false;
    nameText.textContent = petName();
  }

  nameText.textContent = petName();
  nameText.addEventListener('click', startRename);

  // ---------- progress ----------

  const rarityBadge = h('span', {
    class: 'rarity', style: `--rarity:${rarity.color}`, text: rarity.label,
  });

  const progressPanel = h('section', { class: 'info__card panel' },
    h('div', { class: 'info__row' },
      h('div', { class: 'info__level' }, h('small', { text: 'Nv.' }), String(lv.level)),
      h('div', { class: 'info__meta' },
        h('div', { class: 'info__stage', text: form.name }),
        h('div', { class: 'info__type', text: form.type }),
        rarityBadge)),
    h('div', { class: 'xpbar info__xpbar' },
      h('div', { class: 'xpbar__fill', style: `width:${Math.round(lv.ratio * 100)}%` })),
    h('div', { class: 'xpbar__next info__xpnext',
      text: `${num(lv.into)} / ${num(lv.span)} XP para Nv. ${lv.level + 1}` }));

  // ---------- status ----------

  const statusPanel = h('section', { class: 'info__card panel' },
    h('h3', { class: 'info__heading', text: 'Status desta fase' }),
    bars.map((stat) => {
      const pct = stat.pct;
      const source = stat.from.map((type) => ACTIONS[type].label).join(' · ');
      return h('div', { class: 'stat' },
        h('div', { class: 'stat__top' },
          h('span', { class: 'stat__label', text: stat.label }),
          h('span', { class: 'stat__pct', text: `${pct}%` })),
        h('div', { class: 'stat__bar', role: 'progressbar',
          'aria-label': stat.label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct },
          h('div', { class: 'stat__fill', dataset: { stat: stat.id }, style: `width:${pct}%` })),
        h('div', { class: 'stat__src', text: source }));
    }));

  // ---------- next evolution ----------

  const evolvePanel = evolutionCard();

  function evolutionCard() {
    const { next } = progress();
    const branch = nextBranch();
    if (!next || !branch) {
      return h('section', { class: 'info__card panel' },
        h('h3', { class: 'info__heading', text: 'Evolução' }),
        h('p', { class: 'evo__done', text: 'Forma final alcançada.' }));
    }

    const label = Object.fromEntries(STATS.map((s) => [s.id, s.label]));
    const by = Object.fromEntries(bars.map((b) => [b.id, b]));

    return h('section', { class: 'info__card panel' },
      h('h3', { class: 'info__heading', text: `Evolução no Nv. ${next}` }),
      h('p', { class: 'evo__now' },
        canEvolve() ? 'Pronto! Toque no tigrinho para evoluir em: ' : 'Se evoluísse agora: ',
        h('strong', { text: branch.form.name })),
      h('ul', { class: 'evo__list' },
        branch.options.map(({ form: option }) => {
          const tier = RARITIES[option.rarity];
          const rule = option.needs
            ? Object.entries(option.needs).map(([id, min]) => ({
                text: `${label[id]} ≥ ${min}%`, ok: by[id].raw >= min,
              }))
            : [{ text: 'evolução direta', ok: true }];
          return h('li', { class: 'evo', dataset: { picked: String(option === branch.form) } },
            h('div', { class: 'evo__top' },
              h('span', { class: 'evo__name', text: option.name }),
              h('span', { class: 'rarity rarity--sm', style: `--rarity:${tier.color}`, text: tier.label })),
            h('div', { class: 'evo__type', text: option.type }),
            h('div', { class: 'evo__needs' },
              rule.map((r) => h('span', { class: 'evo__need', dataset: { ok: String(r.ok) }, text: r.text }))));
        })),
      branch.options.length > 1 && h('p', { class: 'evo__rule',
        text: 'Vence a rota em que seu status mais fraco passou mais do requisito. Se nenhuma for cumprida, vence a que chegou mais perto. Os status recomeçam a cada evolução.' }));
  }

  // ---------- encyclopedia (locked for now) ----------

  const hint = h('p', { class: 'info__hint', hidden: true, role: 'status',
    text: 'A Enciclopédia chega numa próxima versão.' });

  const encyclopedia = h('button', {
    class: 'btn info__ency', type: 'button', 'aria-disabled': 'true',
    onclick: () => { hint.hidden = false; },
  },
    iconArt(ICONS.lock, 'info__lock'),
    h('span', { text: 'Enciclopédia' }),
    h('small', { class: 'info__soon', text: 'em breve' }));

  // ---------- frame ----------

  const screen = h('div', { class: 'info', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Informações do pet' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Informações' })),
    h('div', { class: 'info__body', dataset: { scroll: '' } },
      h('div', { class: 'info__hero' },
        h('img', { class: 'info__art', src: form.art, alt: '' }),
        h('div', { class: 'info__namerow' }, nameText, nameInput, editBtn)),
      progressPanel,
      statusPanel,
      evolvePanel,
      encyclopedia,
      hint));

  host.append(screen);
}
