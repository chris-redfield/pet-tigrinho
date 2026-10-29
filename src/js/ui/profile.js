import { ICONS, APP_VERSION } from '../config.js';
import { resetSave } from '../state.js';
import { resetRecovery } from '../recovery.js';
import { getSettings, setSetting, resetSettings, enableNotifications, canNotify, haptic } from '../settings.js';
import { h } from './dom.js';
import { iconArt } from './art.js';
import { renderInfo } from './info.js';
import { renderAchievements } from './achievements.js';
import { toast } from './toast.js';
import { syncMusic } from '../music.js';

/**
 * Perfil: the person button on the home screen. One screen, three tabs:
 * Informações (the pet), Conquistas (what the player has done) and
 * Configurações.
 *
 * @param {HTMLElement} host     element to mount into
 * @param {() => void}  onClose  called after the screen is dismissed
 * @param {'info'|'conquistas'|'config'} [start]
 */
export function openProfile(host, onClose, start = 'info') {
  const close = () => {
    screen.remove();
    onClose?.();
  };

  const TABS = [
    { id: 'info', label: 'Informações', render: () => renderInfo(screen, close) },
    { id: 'conquistas', label: 'Conquistas', render: () => renderAchievements() },
    { id: 'config', label: 'Configurações', render: () => renderSettings(screen) },
  ];
  let current = start;

  const pane = h('div', { class: 'profile__pane' });
  const tabs = h('div', { class: 'seg profile__tabs', role: 'tablist', 'aria-label': 'Perfil' },
    TABS.map((tab) => h('button', {
      class: 'seg__btn', type: 'button', role: 'tab', text: tab.label, dataset: { tab: tab.id },
      onclick: () => show(tab.id),
    })));

  function show(id) {
    current = id;
    for (const btn of tabs.children) btn.setAttribute('aria-selected', String(btn.dataset.tab === id));
    pane.replaceChildren(...[TABS.find((tab) => tab.id === id).render()].flat());
  }

  const screen = h('div', { class: 'info profile', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Perfil' },
    h('div', { class: 'info__bar' },
      h('button', { class: 'info__back', type: 'button', 'aria-label': 'Voltar', onclick: close },
        iconArt(ICONS.back, 'info__back-icon')),
      h('div', { class: 'info__title', text: 'Perfil' })),
    tabs,
    pane);

  show(current);
  host.append(screen);
}

/** Perfil > Configurações. */
function renderSettings(screen) {
  const body = h('div', { class: 'info__body settings', dataset: { scroll: '' } });

  function render() {
    const s = getSettings();
    body.replaceChildren(
      section('Som', [
        h('label', { class: 'set__row set__row--col' },
          h('span', { class: 'set__label' }, 'Volume geral', h('output', { class: 'set__value', text: `${s.volume}%` })),
          h('input', { class: 'set__range', type: 'range', min: '0', max: '100', step: '5', value: String(s.volume),
            'aria-label': 'Volume geral',
            oninput: (e) => {
              e.target.previousElementSibling.lastChild.textContent = `${e.target.value}%`;
              setSetting('volume', Number(e.target.value));
              syncMusic();
            } })),
        toggle('Música de fundo', s.music, (on) => { setSetting('music', on); syncMusic(); }),
        toggle('Efeitos sonoros', s.sfx, (on) => setSetting('sfx', on), { hint: 'Botões, carinho, XP, atividades, ovos e evolução' }),
      ]),
      section('Notificações', [
        toggle('Alertas do celular', s.notifications, async (on) => {
          if (!on) { setSetting('notifications', false); render(); return; }
          if (!canNotify()) { toast(screen, 'Este navegador não mostra notificações'); render(); return; }
          const ok = await enableNotifications();
          if (!ok) toast(screen, 'As notificações estão bloqueadas no navegador');
          render();
        }),
        toggle('Lembretes diários', s.reminders && s.notifications, (on) => { setSetting('reminders', on); render(); },
          { disabled: !s.notifications, hint: 'Tarefas do dia e seu horário difícil' }),
        h('p', { class: 'set__note', text: 'Os avisos chegam enquanto o jogo estiver aberto, mesmo em segundo plano.' }),
      ]),
      section('Preferências', [
        h('div', { class: 'set__row' },
          h('span', { class: 'set__label', id: 'set-lang', text: 'Idioma' }),
          h('div', { class: 'seg set__seg', role: 'radiogroup', 'aria-labelledby': 'set-lang' },
            h('button', { class: 'seg__btn', type: 'button', role: 'radio', 'aria-checked': 'true', 'aria-selected': 'true',
              text: 'Português' }),
            h('button', { class: 'seg__btn', type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-disabled': 'true',
              text: 'English', title: 'Em breve',
              onclick: () => toast(screen, 'English: em breve') }))),
        toggle('Vibração', s.haptics, (on) => { setSetting('haptics', on); if (on) haptic(20); },
          { hint: 'Ao fazer carinho e ganhar XP' }),
      ]),
      section('Conta e dados', [
        h('button', { class: 'btn btn--ghost set__btn', type: 'button', 'aria-disabled': 'true',
          onclick: () => toast(screen, 'Login: em breve') },
          iconArt(ICONS.lock, 'set__lock'), 'Entrar na conta', h('small', { class: 'set__soon', text: 'Em breve' })),
        h('button', { class: 'btn btn--danger set__btn', type: 'button', text: 'Apagar dados e recomeçar', onclick: confirmReset }),
        h('p', { class: 'set__note', text: 'Apaga o pet, as conquistas, o progresso e as configurações deste aparelho. Não dá para desfazer.' }),
      ]),
      section('Créditos', [
        h('p', { class: 'set__credit' },
          'Música de fundo: ', h('strong', { text: '“forest”' }), ', por ', h('strong', { text: 'syncopika' }), '.'),
      ]),
      h('p', { class: 'set__version', text: `Pet Tigrinho v${APP_VERSION}` }));
  }

  /** Two taps: the first arms the button, the second wipes and restarts. */
  function confirmReset(e) {
    const button = e.currentTarget;
    if (button.dataset.confirm !== 'true') {
      button.dataset.confirm = 'true';
      button.textContent = 'Toque de novo para apagar tudo';
      setTimeout(() => {
        if (!button.isConnected) return;
        delete button.dataset.confirm;
        button.textContent = 'Apagar dados e recomeçar';
      }, 4000);
      return;
    }
    resetSave();
    resetRecovery();
    resetSettings();
    location.replace(location.pathname);
  }

  render();
  return body;
}

function section(title, children) {
  return h('section', { class: 'info__card panel set' },
    h('h3', { class: 'info__heading', text: title }),
    children);
}

/** A labelled on/off switch. */
function toggle(label, on, onChange, { disabled = false, hint } = {}) {
  const button = h('button', {
    class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': label,
    disabled,
    onclick: () => {
      const next = button.getAttribute('aria-checked') !== 'true';
      button.setAttribute('aria-checked', String(next));
      onChange(next);
    },
  }, h('span', { class: 'switch__knob' }));
  return h('div', { class: 'set__row', dataset: { disabled: String(disabled) } },
    h('span', { class: 'set__label' }, label, hint && h('small', { class: 'set__hint', text: hint })),
    button);
}
