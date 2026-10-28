import { ACTION_ORDER } from './config.js';

/**
 * What the pet says, and when. Pure logic - no DOM - so it is testable.
 *
 * The pet talks *sometimes*, never on a schedule the player can feel:
 * a tap starts a line only now and then, and idle remarks are spaced
 * minutes apart and capped per visit. Reminders are invitations, never
 * guilt: the pet is not hungry or sad when an action is missing (README:
 * "no decay, no guilt"), and once the day is done it says to rest.
 *
 * Nothing here pays anything. A line is just a line - there is no reward
 * attached to tapping, so the random choice of words is not a draw.
 */

export const TAP_LINES = [
  'Hehe, faz cócegas!',
  'Gosto quando você aparece!',
  'Rrrawr! 🐯',
  'Tô orgulhoso de você!',
  'Cada passo conta.',
  'Juntos a gente vai longe!',
  'Você é o meu humano favorito.',
  'Sem pressa: um dia de cada vez.',
  'Que bom te ver por aqui!',
];

/** Unprompted lines: the tap lines minus the ones that answer a touch. */
export const IDLE_LINES = TAP_LINES.filter((line) => !/cócegas/i.test(line));

export const EMOJIS = ['💛', '🐾', '✨', '😺', '🌟', '😸', '🧡'];

/** One gentle invitation per action that has not been touched today. */
export const REMINDERS = {
  photo: 'Que tal uma foto de algo bonito hoje? 📷',
  steps: 'Bora dar uma volta? Eu adoro passear! 🐾',
  book: 'Lê umas páginas comigo? 📖',
  course: 'Que tal estudar um pouquinho hoje? 🎓',
  meal: 'Já comeu direitinho hoje? 🍽️',
};

export const ALL_DONE = 'Você já fez bastante hoje. Hora de descansar! 😌';

/** Tuning, in milliseconds. */
export const CHATTER = {
  tapChance: 0.3,          // share of taps that also get a line
  tapCooldown: 12_000,     // no two tap lines closer than this
  idleFirst: 25_000,       // first idle remark after opening the home screen
  idleMin: 90_000,         // then one every 90-150 s ...
  idleMax: 150_000,
  idleMaxPerVisit: 4,      // ... and no more than this per visit
  reminderShare: 0.6,      // idle remarks that are reminders, when one applies
};

const pick = (list, rand) => list[Math.floor(rand() * list.length) % list.length];

/**
 * A reminder for an action not done today, or ALL_DONE when every action
 * has hit its cap, or null when some are done and none is untouched.
 *
 * @param {(type: string) => number} doneToday   units logged today
 * @param {(type: string) => number} remaining   units still paying today
 */
export function reminder(doneToday, remaining, rand = Math.random) {
  if (ACTION_ORDER.every((type) => remaining(type) === 0)) return ALL_DONE;
  const untouched = ACTION_ORDER.filter((type) => doneToday(type) === 0 && REMINDERS[type]);
  return untouched.length ? REMINDERS[pick(untouched, rand)] : null;
}

/**
 * Decides when the pet speaks. One instance per home-screen visit.
 *
 * @param {{now?: () => number, rand?: () => number}} [deps]
 */
export function createChatter({ now = () => Date.now(), rand = Math.random } = {}) {
  let lastLine = -Infinity;
  let idleCount = 0;

  return {
    /** A line for this tap, or null (most taps are just hearts). */
    onTap() {
      if (now() - lastLine < CHATTER.tapCooldown || rand() >= CHATTER.tapChance) return null;
      lastLine = now();
      return rand() < 0.75 ? pick(TAP_LINES, rand) : pick(EMOJIS, rand);
    },

    /** Milliseconds until the next idle remark, or null when this visit is done. */
    nextIdleDelay() {
      if (idleCount >= CHATTER.idleMaxPerVisit) return null;
      if (idleCount === 0) return CHATTER.idleFirst;
      return CHATTER.idleMin + Math.round(rand() * (CHATTER.idleMax - CHATTER.idleMin));
    },

    /** The idle remark itself: mostly a reminder when one applies. */
    onIdle(doneToday, remaining) {
      idleCount += 1;
      lastLine = now();
      const nudge = reminder(doneToday, remaining, rand);
      if (nudge && rand() < CHATTER.reminderShare) return nudge;
      return rand() < 0.6 ? pick(IDLE_LINES, rand) : pick(EMOJIS, rand);
    },
  };
}
