import { ACTIONS, STAGES } from './config.js';

const KEY = 'pet-tigrinho:save';
const VERSION = 1;

/** Local calendar day, not UTC - the cap should roll over at the player's midnight. */
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function blank() {
  return {
    version: VERSION,
    pet: null,            // set once the egg is chosen
    xp: 0,                // lifetime, never decreases
    stage: 0,
    totals: { photo: 0, steps: 0, book: 0, course: 0 },
    daily: { date: today() },
    log: [],
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    if (parsed.version !== VERSION) return blank();
    return { ...blank(), ...parsed };
  } catch {
    // Private mode, full quota, corrupt JSON - play anyway, just unsaved.
    return blank();
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* non-fatal: the session still works, it just will not survive a reload */
  }
}

/** Zeroes the per-day counters when the calendar day has rolled over. */
function rollDay() {
  const now = today();
  if (state.daily.date !== now) state.daily = { date: now };
}

export function getState() {
  rollDay();
  return state;
}

export function hasPet() {
  return Boolean(state.pet);
}

export function chooseEgg(eggId) {
  state.pet = { egg: eggId, bornAt: new Date().toISOString() };
  persist();
  return state.pet;
}

/** Lifetime XP already spent reaching the current stage, and what the next one costs. */
export function progress() {
  const stage = STAGES[state.stage];
  const next = STAGES[state.stage + 1];
  if (!next) return { stage, next: null, into: 0, span: 0, ratio: 1 };
  const span = next.at - stage.at;
  const into = Math.max(0, Math.min(span, state.xp - stage.at));
  return { stage, next, into, span, ratio: span ? into / span : 1 };
}

/** Units of `type` that would still earn XP today. */
export function remainingToday(type) {
  rollDay();
  const used = state.daily[type] || 0;
  return Math.max(0, ACTIONS[type].cap - used);
}

/**
 * Record a real-world action.
 *
 * XP is a flat rate per unit and is cut off at the daily cap - over the cap
 * the action is still logged to the player's totals, it just stops paying.
 *
 * @returns {{gained:number, paidUnits:number, cappedUnits:number, evolved:object|null}}
 */
export function logAction(type, units) {
  rollDay();
  const cfg = ACTIONS[type];
  if (!cfg) throw new Error(`unknown action: ${type}`);

  units = Math.max(0, Math.round(units));
  if (!units) return { gained: 0, paidUnits: 0, cappedUnits: 0, evolved: null };

  const paidUnits = Math.min(units, remainingToday(type));
  const gained = Math.round((paidUnits / cfg.step) * cfg.xp);

  const before = state.stage;
  state.xp += gained;
  state.totals[type] += units;
  state.daily[type] = (state.daily[type] || 0) + paidUnits;

  while (STAGES[state.stage + 1] && state.xp >= STAGES[state.stage + 1].at) {
    state.stage += 1;
  }

  state.log.unshift({ type, units, gained, at: new Date().toISOString() });
  state.log.length = Math.min(state.log.length, 100);

  persist();

  return {
    gained,
    paidUnits,
    cappedUnits: units - paidUnits,
    evolved: state.stage > before ? STAGES[state.stage] : null,
  };
}

export function resetSave() {
  state = blank();
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
