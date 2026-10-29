/**
 * Player settings (Perfil > Configurações), on this device only.
 *
 * Volume drives the background music (music.js) and the sound effects
 * (sfx.js); each has its own on/off switch.
 * Notifications only reach the player while the game is open in a tab
 * (in the background is fine): reminders with the app fully closed need
 * push from a server, which the prototype does not have. They are shown
 * through the service worker (sw.js) when there is one - the only way on
 * Android - and with `new Notification` otherwise.
 */

const KEY = 'pet-tigrinho:settings';

const DEFAULTS = {
  volume: 80,            // 0-100
  music: true,
  sfx: true,             // button ticks and the short tones (sfx.js)
  notifications: false,  // phone alerts; turning it on asks the browser
  reminders: false,      // daily nudges (tasks, risk hours), needs notifications
  language: 'pt',        // 'pt' only for now; 'en' is planned
  haptics: true,
};

let data = load();

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function getSettings() {
  return data;
}

export function setSetting(key, value) {
  if (!(key in DEFAULTS)) throw new Error(`unknown setting: ${key}`);
  data = { ...data, [key]: value };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* unsaved */ }
  return data;
}

export function resetSettings() {
  data = { ...DEFAULTS };
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

/** A short buzz, if the player left haptics on and the device can vibrate. */
export function haptic(pattern = 12) {
  if (!data.haptics || typeof navigator === 'undefined' || !navigator.vibrate) return;
  // Before the first real tap the browser refuses (and logs an error).
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate(pattern);
}

/** Whether the browser can show notifications at all. */
export function canNotify() {
  return typeof Notification !== 'undefined';
}

/**
 * Turns phone alerts on, asking the browser first. Resolves to whether they
 * ended up on (the player may refuse, or have blocked the site before).
 */
export async function enableNotifications() {
  if (!canNotify()) return false;
  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  const on = permission === 'granted';
  setSetting('notifications', on);
  return on;
}

/**
 * Shows a reminder as a phone notification, only when the player asked for
 * reminders and the game is not on screen (on screen, Tigrin says it).
 * @returns {boolean} whether a notification was shown
 */
export function remind(text) {
  if (!data.notifications || !data.reminders || !canNotify()) return false;
  if (Notification.permission !== 'granted' || !document.hidden) return false;
  const options = { body: text, icon: 'assets/avatar/tigrin.webp', tag: 'pet-tigrinho' };
  const direct = () => {
    try { new Notification('Pet Tigrinho', options); } catch { /* Android: needs the worker */ }
  };
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready
      .then((registration) => registration.showNotification('Pet Tigrinho', options))
      .catch(direct);
  } else {
    direct();
  }
  return true;
}

/** Registers sw.js (for reminders on Android). Needs HTTPS or localhost. */
export function registerWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* reminders fall back to the page */ });
}
