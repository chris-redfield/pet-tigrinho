import { ACTIONS } from '../config.js';
import { logAction, remainingToday } from '../state.js';
import { checkPhoto } from '../vision.js';
import { h, num, plural, onLeave } from './dom.js';
import { motionAvailable, startPedometer } from '../pedometer.js';

/**
 * Bottom sheet for logging one action.
 *
 * The XP a tap will pay is shown live, before the player commits. Nothing
 * here is hidden until confirm - that suspense is the slot machine's trick
 * and it stays out of this game. Photos are checked by the AI first, but
 * the rates are on screen before the photo is taken (a rate table, not a
 * draw), and the result and its XP are shown before anything is saved.
 *
 *   capture   - a photo instead of a stepper
 *   verify    - the AI checks the photo: 'meal' (is it food?) or 'photo'
 *               (what kind of place - each place has its own rate)
 *   sensor    - steps can be counted by the phone
 *
 * @param {HTMLElement} host    element to mount into
 * @param {string}      type    key in ACTIONS
 * @param {(result: object) => void} onLogged
 */
export function openSheet(host, type, onLogged) {
  const cfg = ACTIONS[type];
  const left = remainingToday(type);

  let units = cfg.step;
  let photo = null;          // { file, url } once the camera returns
  let check = null;          // AI check: { busy } | { result } | { error }
  let checkSeq = 0;          // ignores answers for a photo already replaced
  let stopCounting = null;   // set while the step sensor is counting
  let counted = 0;           // steps the sensor has seen this session

  let closed = false;
  const close = () => {
    closed = true;
    cancelLeave();
    checkSeq += 1;
    stopCounting?.();
    stopCounting = null;
    if (photo) URL.revokeObjectURL(photo.url);
    scrim.remove();
    sheet.remove();
  };

  // A tab change removes the sheet without Cancelar: still stop the sensor.
  const cancelLeave = onLeave(close);
  const scrim = h('div', { class: 'scrim', onclick: close });

  const amount = h('div', { class: 'amount' });
  const gain = h('div', { class: 'sheet__gain' });
  const note = h('p', { class: 'sheet__note' });
  const minus = h('button', { class: 'step-btn', type: 'button', 'aria-label': 'menos',
    onclick: () => bump(-cfg.step) }, '−');
  const plus = h('button', { class: 'step-btn', type: 'button', 'aria-label': 'mais',
    onclick: () => bump(cfg.step) }, '+');
  const confirm = h('button', { class: 'btn', type: 'button', onclick: commit });

  // ---------- photo + AI check ----------

  const file = cfg.capture
    ? h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true,
        onchange: onPick })
    : null;
  const preview = cfg.capture ? h('img', { class: 'shot', alt: '', hidden: true }) : null;
  const verdict = cfg.verify ? h('div', { class: 'verdict', role: 'status', hidden: true }) : null;

  // The photo rates, on screen before the photo is taken.
  const rates = cfg.places
    ? h('ul', { class: 'rates', 'aria-label': 'XP por lugar' },
        Object.values(cfg.places).map((p) => h('li', { class: 'rates__item' },
            h('span', { class: 'rates__emoji', 'aria-hidden': 'true', text: p.emoji }),
            h('span', { class: 'rates__label', text: p.label }),
            h('span', { class: 'rates__xp', text: `+${p.xp}` }))))
    : null;
  const hint = cfg.verify
    ? h('p', { class: 'sheet__hint', text: cfg.verify === 'meal'
        ? 'Tire uma foto do seu prato. A IA confere se é comida antes de contar o XP.'
        : 'Sair de casa vale mais: a IA reconhece onde a foto foi tirada.' })
    : null;
  const privacy = cfg.verify
    ? h('p', { class: 'sheet__privacy', text: 'A foto é analisada pela IA e não fica guardada.' })
    : null;

  // ---------- steps sensor ----------

  /**
   * Steps can be counted live by the phone's accelerometer while the sheet
   * is open, then used as the amount. Typing stays available for walks the
   * phone did not see. The count is plain text: no spin-up, no flourish.
   */
  const sensorState = cfg.sensor ? motionAvailable() : 'unsupported';
  const counter = sensorState !== 'unsupported'
    ? h('button', { class: 'btn btn--ghost sheet__sensor', type: 'button', text: 'Contar com o celular',
        onclick: toggleCounting })
    : null;
  const counterNote = counter ? h('p', { class: 'sheet__note', hidden: true, role: 'status' }) : null;

  const stepper = cfg.capture ? null : h('div', { class: 'sheet__row' }, minus, amount, plus);

  const sheet = h('div', { class: 'sheet panel', role: 'dialog', 'aria-modal': 'true' },
    h('h2', { class: 'sheet__title display', text: cfg.verb }),
    hint,
    rates,
    preview,
    verdict,
    counter,
    counterNote,
    stepper,
    gain,
    note,
    confirm,
    h('button', { class: 'btn btn--ghost', type: 'button', text: 'Cancelar', onclick: close }),
    privacy,
    file);

  function bump(delta) {
    units = Math.max(cfg.step, Math.min(cfg.cap * 2, units + delta));
    render();
  }

  async function toggleCounting() {
    if (stopCounting) { finishCounting(); return; }
    if (sensorState === 'insecure') {
      showCounterNote('O sensor de passos só funciona em HTTPS.');
      return;
    }
    counted = 0;
    let failed = false;
    counter.disabled = true;   // until the permission prompt (iOS) is answered
    counter.textContent = 'Parar e usar 0 passos';
    showCounterNote('Contando... ande com o celular na mão ou no bolso, com a tela ligada.');
    const stop = await startPedometer(
      (steps) => {
        counted = steps;
        counter.textContent = `Parar e usar ${num(steps)} ${plural(steps, cfg)}`;
      },
      (reason) => {
        failed = true;
        stopCounting = null;
        counter.textContent = 'Contar com o celular';
        showCounterNote(reason === 'denied'
          ? 'Sem permissão para o sensor de movimento.'
          : 'Este aparelho não tem sensor de movimento. Digite os passos abaixo.');
      });
    counter.disabled = false;
    // Closed while the permission prompt was up: switch the sensor off now.
    if (closed) { stop(); return; }
    if (!failed) stopCounting = stop;
  }

  function finishCounting() {
    stopCounting?.();
    stopCounting = null;
    counter.textContent = 'Contar com o celular';
    if (counted > 0) {
      units = counted;
      showCounterNote(`${num(counted)} ${plural(counted, cfg)} ${counted === 1 ? 'contado' : 'contados'} pelo celular.`);
      render();
    } else {
      showCounterNote('Nenhum passo contado.');
    }
  }

  function showCounterNote(text) {
    counterNote.textContent = text;
    counterNote.hidden = false;
  }

  function onPick(event) {
    const picked = event.target.files?.[0];
    event.target.value = '';   // the same file can be picked again
    if (!picked) return;
    if (photo) URL.revokeObjectURL(photo.url);
    photo = { file: picked, url: URL.createObjectURL(picked) };
    preview.src = photo.url;
    preview.hidden = false;
    if (rates) rates.hidden = true;
    runCheck();
  }

  /** Sends the photo to the AI. Nothing is checked once today's cap is reached. */
  async function runCheck() {
    if (!cfg.verify || left === 0) { check = null; render(); return; }
    const seq = ++checkSeq;
    check = { busy: true };
    render();
    try {
      const result = await checkPhoto(cfg.verify, photo.file);
      if (seq === checkSeq) check = { result };
    } catch (err) {
      // No AI: the photo or meal pays the base rate under a friendly word, never an error.
      if (seq === checkSeq) check = cfg.praise
        ? { praise: cfg.praise[Math.floor(Math.random() * cfg.praise.length)] }
        : { error: err.message };
    }
    if (seq === checkSeq) render();
  }

  /** The photo's place, once the AI named one. */
  function place() {
    return check?.result?.place && cfg.places?.[check.result.place] ? check.result.place : null;
  }

  /** What one unit pays right now: a photo's place rate, else the base rate. */
  function rate() {
    return place() ? cfg.places[place()].xp : cfg.xp;
  }

  /**
   * A meal is held back only when the AI answered and saw no food. While it
   * thinks, nothing can be saved; if it cannot be reached, the meal pays.
   */
  function mealBlocked() {
    return cfg.verify === 'meal' && left > 0 && Boolean(check?.result) && !check.result.isFood;
  }

  function payable() {
    return Math.min(units, left);
  }

  function renderVerdict() {
    if (!verdict) return;
    verdict.hidden = !photo || !check;
    if (!check) return;
    verdict.dataset.state = check.busy ? 'busy' : check.error ? 'error' : 'done';
    if (check.busy) {
      verdict.textContent = 'Analisando a foto…';
    } else if (check.praise) {
      verdict.textContent = `${cfg.verify === 'meal' ? '🍽️' : '📷'} ${check.praise}`;
    } else if (check.error) {
      verdict.textContent = check.error;
    } else if (cfg.verify === 'meal') {
      verdict.dataset.state = check.result.isFood ? 'done' : 'no';
      verdict.textContent = check.result.isFood
        ? `🍽️ ${check.result.label || 'Comida reconhecida'}`
        : `Isso não parece comida${check.result.label ? ` (${check.result.label})` : ''}. Tente outra foto.`;
    } else {
      const p = cfg.places[place()] || cfg.places.outro;
      verdict.textContent = `${p.emoji} ${p.label}${check.result.label ? ` · ${check.result.label}` : ''}`;
    }
  }

  function render() {
    const pays = payable();
    const xp = Math.round((pays / cfg.step) * rate());

    if (!cfg.capture) {
      amount.replaceChildren(num(units), h('small', { text: plural(units, cfg) }));
      minus.disabled = units <= cfg.step;
      plus.disabled = units >= cfg.cap * 2;
    }

    gain.textContent = `+${xp} XP`;

    if (left === 0) {
      note.textContent = 'Você já rendeu o máximo de hoje. Volta amanhã.';
      note.className = 'sheet__note sheet__note--warn';
    } else if (units > left) {
      note.textContent = `Acima de ${num(left)} ${plural(left, cfg)} não rende XP hoje.`;
      note.className = 'sheet__note sheet__note--warn';
    } else {
      note.textContent = `Restam ${num(left)} ${plural(left, cfg)} hoje.`;
      note.className = 'sheet__note';
    }

    renderVerdict();

    if (cfg.capture) {
      const busy = Boolean(check?.busy);
      gain.hidden = !photo || busy || mealBlocked();
      confirm.disabled = busy;
      if (!photo) confirm.textContent = 'Abrir câmera';
      else if (busy) confirm.textContent = 'Analisando…';
      else if (mealBlocked()) confirm.textContent = 'Tirar outra foto';
      else confirm.textContent = `Guardar  ·  +${xp} XP`;
    } else {
      confirm.textContent = `Registrar  ·  +${xp} XP`;
      confirm.disabled = units <= 0;
    }
  }

  function commit() {
    if (cfg.capture && !photo) { file.click(); return; }
    if (mealBlocked()) {
      file.click();
      return;
    }
    const result = logAction(type, cfg.capture ? 1 : units, { place: place() });
    close();
    onLogged(result);
  }

  render();
  host.append(scrim, sheet);
}
