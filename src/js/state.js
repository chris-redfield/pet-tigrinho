import { ACTIONS, ACTION_ORDER, EGGS, LEVEL_STEP, STATS } from './config.js';
import { FORMS, BRANCHES, EVOLVE_AT } from './forms.js';

const KEY = 'pet-tigrinho:save';
const VERSION = 2;

/** Local calendar day, not UTC - the cap should roll over at the player's midnight. */
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const zeroes = () => Object.fromEntries(ACTION_ORDER.map((type) => [type, 0]));

function blank() {
  return {
    version: VERSION,
    pet: null,            // set once the egg is chosen
    form: null,           // id in FORMS
    xp: 0,                // lifetime, never decreases
    phase: zeroes(),      // XP earned per action since the last evolution
    totals: zeroes(),
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
    if (parsed.version === 1) return migrateV1(parsed);
    if (parsed.version !== VERSION) return blank();
    const base = blank();
    return { ...base, ...parsed, totals: { ...base.totals, ...parsed.totals } };
  } catch {
    // Private mode, full quota, corrupt JSON - play anyway, just unsaved.
    return blank();
  }
}

/**
 * v1 had one linear three-stage line. Keep the XP, totals, log and name,
 * and restart as a Tigrin: the next logged action evolves it if its level
 * is already past Nv 16.
 */
function migrateV1(old) {
  const base = blank();
  return {
    ...base,
    pet: old.pet ? { egg: 'branco', bornAt: old.pet.bornAt, name: old.pet.name || null } : null,
    form: old.pet ? 'tigrin' : null,
    xp: old.xp || 0,
    totals: { ...base.totals, ...old.totals },
    daily: old.daily || base.daily,
    log: old.log || [],
  };
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
  const egg = EGGS.find((e) => e.id === eggId);
  if (!egg) throw new Error(`unknown egg: ${eggId}`);
  state.pet = { egg: eggId, bornAt: new Date().toISOString() };
  state.form = egg.base;
  state.phase = zeroes();
  persist();
  return state.pet;
}

export function currentForm() {
  return FORMS[state.form];
}

/** How many times the pet has evolved: 0 for a base form, 2 for a final one. */
function depth(form) {
  let n = 0;
  for (let f = form; f?.from; f = FORMS[f.from]) n += 1;
  return n;
}

const NAME_MAX = 16;

/** The player's name for the pet, or the current form name until they pick one. */
export function petName() {
  return state.pet?.name || currentForm()?.name || '';
}

/** Renames the pet. Blank clears the custom name back to the form name. */
export function renamePet(name) {
  if (!state.pet) return petName();
  const clean = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  state.pet.name = clean || null;
  persist();
  return petName();
}

/** XP at which level `n` starts: LEVEL_STEP * n(n-1)/2. */
export function levelStart(n) {
  return (LEVEL_STEP * n * (n - 1)) / 2;
}

/** Current level and the XP into it, derived from lifetime XP. */
export function level() {
  let n = 1;
  while (levelStart(n + 1) <= state.xp) n += 1;
  const start = levelStart(n);
  const span = levelStart(n + 1) - start;
  const into = state.xp - start;
  return { level: n, into, span, ratio: into / span };
}

/**
 * XP bounds of the current phase. After the final evolution the last
 * phase's span is kept, so the bars still mean the same thing.
 */
function phaseBounds() {
  const d = Math.min(depth(currentForm()), EVOLVE_AT.length);
  const from = d === 0 ? 0 : levelStart(EVOLVE_AT[d - 1]);
  if (d < EVOLVE_AT.length) return { from, to: levelStart(EVOLVE_AT[d]), next: EVOLVE_AT[d] };
  const prev = EVOLVE_AT.length > 1 ? levelStart(EVOLVE_AT[d - 2]) : 0;
  return { from, to: from + (from - prev), next: null };
}

/**
 * The status bars, filled by XP earned from their source actions this phase.
 * `pct` is clamped for display; `raw` is not, and is what breaks ties when
 * picking a branch.
 */
export function stats() {
  const { from, to } = phaseBounds();
  const span = to - from;
  return STATS.map((stat) => {
    const value = stat.from.reduce((sum, type) => sum + (state.phase[type] || 0), 0);
    const max = stat.share * span;
    const raw = (value / max) * 100;
    return { ...stat, value, max, raw, pct: Math.min(100, Math.round(raw)), ratio: Math.min(1, raw / 100) };
  });
}

/**
 * Which form `formId` evolves into, given the status bars.
 *
 * Deterministic and published - no roll anywhere:
 *   - branches with `needs`: of the branches whose requirements are all
 *     met, the most demanding one (highest sum of thresholds) wins, so the
 *     extra effort a harder branch asks for is what earns it. With nothing
 *     met, the branch the pet came closest to wins (largest smallest margin).
 *   - branches with `favors`: the one whose favoured bar is highest wins.
 * Ties go to the branch listed first in forms.js.
 *
 * @returns {{form: object, options: {form: object, met: boolean}[]} | null}
 */
export function pickBranch(formId, bars) {
  const branches = BRANCHES[formId];
  if (!branches) return null;
  const by = Object.fromEntries(bars.map((b) => [b.id, b.raw]));

  const options = branches.map((form) => {
    if (form.needs) {
      const needs = Object.entries(form.needs);
      const margin = Math.min(...needs.map(([id, min]) => by[id] - min));
      const demand = needs.reduce((sum, [, min]) => sum + min, 0);
      return { form, met: margin >= 0, margin, demand };
    }
    return { form, met: true, margin: Math.max(...form.favors.map((id) => by[id])), demand: 0 };
  });

  // Met beats unmet; among met, more demanding wins; then the larger margin.
  const beats = (b, a) =>
    b.met !== a.met ? b.met
      : b.met && b.demand !== a.demand ? b.demand > a.demand
        : b.margin > a.margin;
  const best = options.reduce((a, b) => (beats(b, a) ? b : a));
  return { form: best.form, options };
}

/** What the pet would evolve into if it reached the next evolution level right now. */
export function nextBranch() {
  return pickBranch(state.form, stats());
}

/** XP into the current phase and what reaching the next evolution costs. */
export function progress() {
  const form = currentForm();
  const { from, to, next } = phaseBounds();
  if (!next) return { form, next: null, into: 0, span: 0, ratio: 1 };
  const span = to - from;
  const into = Math.max(0, Math.min(span, state.xp - from));
  return { form, next, into, span, ratio: into / span };
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
 * Reaching an evolution level evolves the pet along the branch its status
 * bars point to, and starts a new phase.
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

  state.xp += gained;
  state.totals[type] += units;
  state.phase[type] += gained;
  state.daily[type] = (state.daily[type] || 0) + paidUnits;

  let evolved = null;
  while (phaseBounds().next && state.xp >= levelStart(phaseBounds().next)) {
    evolved = nextBranch().form;
    state.form = evolved.id;
    state.phase = zeroes();
  }

  state.log.unshift({ type, units, gained, at: new Date().toISOString() });
  state.log.length = Math.min(state.log.length, 100);

  persist();

  return { gained, paidUnits, cappedUnits: units - paidUnits, evolved };
}

export function resetSave() {
  state = blank();
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
