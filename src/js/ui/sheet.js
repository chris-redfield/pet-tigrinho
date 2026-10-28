import { ACTIONS } from '../config.js';
import { logAction, remainingToday } from '../state.js';
import { h, num, plural } from './dom.js';
import { motionAvailable, startPedometer } from '../pedometer.js';

/**
 * Bottom sheet for logging one action.
 *
 * The XP a tap will pay is shown live, before the player commits. Nothing
 * here resolves after a delay and nothing is hidden until confirm - that
 * suspense is the slot machine's trick and it stays out of this game.
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
  let stopCounting = null;   // set while the step sensor is counting
  let counted = 0;           // steps the sensor has seen this session

  const close = () => {
    stopCounting?.();
    if (photo) URL.revokeObjectURL(photo.url);
    scrim.remove();
    sheet.remove();
  };

  const scrim = h('div', { class: 'scrim', onclick: close });

  const amount = h('div', { class: 'amount' });
  const gain = h('div', { class: 'sheet__gain' });
  const note = h('p', { class: 'sheet__note' });
  const minus = h('button', { class: 'step-btn', type: 'button', 'aria-label': 'menos',
    onclick: () => bump(-cfg.step) }, '−');
  const plus = h('button', { class: 'step-btn', type: 'button', 'aria-label': 'mais',
    onclick: () => bump(cfg.step) }, '+');
  const confirm = h('button', { class: 'btn', type: 'button', onclick: commit });

  /** Photo is a single yes/no event, so it gets a camera button instead of a stepper. */
  const file = cfg.capture
    ? h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true,
        onchange: onPick })
    : null;
  const preview = cfg.capture ? h('img', { class: 'shot', alt: '', hidden: true }) : null;

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

  const sheet = h('div', { class: 'sheet panel', role: 'dialog', 'aria-modal': 'true' },
    h('h2', { class: 'sheet__title display', text: cfg.verb }),
    preview,
    counter,
    counterNote,
    cfg.capture ? null : h('div', { class: 'sheet__row' }, minus, amount, plus),
    gain,
    note,
    confirm,
    h('button', { class: 'btn btn--ghost', type: 'button', text: 'Cancelar', onclick: close }),
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
    if (!picked) return;
    if (photo) URL.revokeObjectURL(photo.url);
    // The image is never stored or uploaded - it is shown once, then released.
    photo = { file: picked, url: URL.createObjectURL(picked) };
    preview.src = photo.url;
    preview.hidden = false;
    render();
  }

  function payable() {
    return Math.min(units, left);
  }

  function render() {
    const pays = payable();
    const xp = Math.round((pays / cfg.step) * cfg.xp);

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

    if (cfg.capture) {
      const ready = Boolean(photo);
      confirm.textContent = ready ? `Guardar  ·  +${xp} XP` : 'Abrir câmera';
      confirm.disabled = false;
      amount.hidden = true;
      gain.hidden = !ready;
    } else {
      confirm.textContent = `Registrar  ·  +${xp} XP`;
      confirm.disabled = units <= 0;
    }
  }

  function commit() {
    if (cfg.capture && !photo) { file.click(); return; }
    const result = logAction(type, cfg.capture ? 1 : units);
    close();
    onLogged(result);
  }

  render();
  host.append(scrim, sheet);
}
