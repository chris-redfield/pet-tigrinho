import { ACTIONS, ACTION_ORDER, EGGS, LEVEL_STEP, STATS, WEEK_STARTS_ON } from './config.js';
import { FORMS, BRANCHES, EVOLVE_AT } from './forms.js';
import { TRILHA_XP, trilhaFor } from './trilhas.js';
import { MEDALS } from './medals.js';

const KEY = 'pet-tigrinho:save';
const VERSION = 3;

/** How many days of per-day history to keep. Older days drop off the record. */
const HISTORY_DAYS = 400;

/** Local calendar day, not UTC - the cap should roll over at the player's midnight. */
function dateKey(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function today() {
  return dateKey(new Date());
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
    history: {},          // 'YYYY-MM-DD' -> units per action + { xp, trilhas }
    trilhas: { done: [] },// [{ day, date }], oldest first
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
    // v2 knew no per-day history and no trilhas: the lifetime totals carry
    // over intact, "esta semana" simply starts empty on the next action.
    if (parsed.version !== 2 && parsed.version !== VERSION) return blank();
    const base = blank();
    return retireForm({
      ...base,
      ...parsed,
      version: VERSION,
      totals: { ...base.totals, ...parsed.totals },
      history: { ...base.history, ...parsed.history },
      trilhas: { ...base.trilhas, ...parsed.trilhas },
    });
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

/**
 * Saves can name a form that no longer exists (the tree was cut down to five
 * lines). Put the pet back on its egg's line at the depth its XP has reached,
 * taking the first listed branch where there is a choice.
 */
function retireForm(save) {
  if (!save.form || FORMS[save.form]) return save;
  const egg = EGGS.find((e) => e.id === save.pet?.egg) || EGGS[0];
  let id = egg.base;
  for (const at of EVOLVE_AT) {
    if (save.xp < levelStart(at) || !BRANCHES[id]) break;
    id = BRANCHES[id][0].id;
  }
  return { ...save, form: id };
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

/** The history row for today, created on demand. */
function dayRow() {
  const key = today();
  state.history[key] ||= { xp: 0 };
  return state.history[key];
}

/**
 * Adds one action to today's history row, which is what the achievements
 * screen reads for "esta semana". `units` are the units logged, including
 * the ones over the daily cap that earned no XP - the record is of what the
 * player did, the XP is a separate number.
 */
function recordDay(type, units, gained) {
  const row = dayRow();
  row[type] = (row[type] || 0) + units;
  row.xp += gained;
  trimHistory();
}

function trimHistory() {
  const keys = Object.keys(state.history).sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - HISTORY_DAYS))) {
    delete state.history[key];
  }
}

/** First day of the current week, at 00:00 local (see WEEK_STARTS_ON). */
function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() - WEEK_STARTS_ON + 7) % 7));
  return d;
}

/** Date keys from the start of this week up to today, oldest first. */
export function weekDays() {
  const out = [];
  const d = weekStart();
  const end = today();
  for (let i = 0; i < 7; i += 1) {
    const key = dateKey(d);
    if (key > end) break;
    out.push(key);
    d.setDate(d.getDate() + 1);
  }
  return out;
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
 * Deterministic and published - no roll anywhere. One rule covers every
 * case: each branch's margin is how far its weakest required bar sits above
 * (or below) its requirement, and the largest margin wins.
 *
 *   - one branch met: it is the only one with a margin >= 0, so it wins.
 *   - both met: the one the pet cleared by more wins, so it follows what
 *     the player actually focused on rather than favouring a harder route.
 *   - none met: the one the pet came closest to wins.
 *
 * A branch without `needs` is the only way forward and always wins. Ties go
 * to the branch listed first in forms.js.
 *
 * @returns {{form: object, options: {form: object, met: boolean}[]} | null}
 */
export function pickBranch(formId, bars) {
  const branches = BRANCHES[formId];
  if (!branches) return null;
  const by = Object.fromEntries(bars.map((b) => [b.id, b.raw]));

  const options = branches.map((form) => {
    if (!form.needs) return { form, met: true, margin: 0 };
    const margin = Math.min(...Object.entries(form.needs).map(([id, min]) => by[id] - min));
    return { form, met: margin >= 0, margin };
  });

  const best = options.reduce((a, b) => (b.margin > a.margin ? b : a));
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
 * Reaching an evolution level does not evolve the pet: it makes it ready,
 * and the player taps the pet to evolve it (see `evolve`).
 *
 * @returns {{gained:number, paidUnits:number, cappedUnits:number, ready:boolean}}
 */
export function logAction(type, units) {
  rollDay();
  const cfg = ACTIONS[type];
  if (!cfg) throw new Error(`unknown action: ${type}`);

  units = Math.max(0, Math.round(units));
  if (!units) return { gained: 0, paidUnits: 0, cappedUnits: 0, ready: canEvolve() };

  const paidUnits = Math.min(units, remainingToday(type));
  const gained = Math.round((paidUnits / cfg.step) * cfg.xp);

  state.xp += gained;
  state.totals[type] += units;
  state.phase[type] += gained;
  state.daily[type] = (state.daily[type] || 0) + paidUnits;
  recordDay(type, units, gained);

  state.log.unshift({ type, units, gained, at: new Date().toISOString() });
  state.log.length = Math.min(state.log.length, 100);

  persist();

  return { gained, paidUnits, cappedUnits: units - paidUnits, ready: canEvolve() };
}

/** True once XP has reached the next evolution level; the pet waits for a tap. */
export function canEvolve() {
  const { next } = phaseBounds();
  return Boolean(state.pet && next && state.xp >= levelStart(next));
}

/**
 * The player tapped the pet: evolve it one stage, along the branch its
 * status bars point to right now, and start a new phase. Nothing pushes the
 * player to do this - the pet waits, and XP keeps counting meanwhile. If
 * XP already covers the stage after this one, the pet is ready again.
 *
 * @returns {object|null} the new form, or null if it was not ready
 */
export function evolve() {
  if (!canEvolve()) return null;
  const form = nextBranch().form;
  state.form = form.id;
  state.phase = zeroes();
  persist();
  return form;
}

/**
 * Dev only (the home screen shows it with ?dev): grants exactly the XP
 * left to reach the next level. It feeds no status bar, so the branch the
 * pet takes is decided by whatever real actions were logged this phase.
 * Same result shape as logAction.
 */
export function devLevelUp() {
  if (!state.pet) return { gained: 0, paidUnits: 0, cappedUnits: 0, ready: false };
  const gained = levelStart(level().level + 1) - state.xp;
  state.xp += gained;
  persist();
  return { gained, paidUnits: 0, cappedUnits: 0, ready: canEvolve() };
}

/** Units of `type` that have paid XP today - what the trilha tasks read. */
export function doneToday(type) {
  rollDay();
  return state.daily[type] || 0;
}

/** How many times the pet has evolved so far. */
export function evolutions() {
  const form = currentForm();
  return form ? depth(form) : 0;
}

/**
 * What the player has done, for the achievements screen.
 *
 * `all` reads the lifetime totals, which every save has carried since v1.
 * `week` sums the per-day history from the start of this week, so a save
 * that predates the history (v2) shows an empty week until the next action.
 *
 * @param {'all'|'week'} period
 */
export function activity(period = 'all') {
  rollDay();
  const acted = (row) => ACTION_ORDER.some((type) => row[type]);

  if (period === 'all') {
    return {
      xp: state.xp,
      days: Object.values(state.history).filter(acted).length,
      trilhas: state.trilhas.done.length,
      units: { ...state.totals },
    };
  }

  const units = zeroes();
  let xp = 0;
  let days = 0;
  let trilhas = 0;
  for (const key of weekDays()) {
    const row = state.history[key];
    if (!row) continue;
    if (acted(row)) days += 1;
    xp += row.xp || 0;
    trilhas += row.trilhas || 0;
    for (const type of ACTION_ORDER) units[type] += row[type] || 0;
  }
  return { xp, days, trilhas, units };
}

/** Every medal with the counter it watches and whether it is earned. */
export function medals() {
  const all = activity('all');
  const lv = level().level;
  return MEDALS.map((medal) => {
    const value =
      medal.kind === 'units' ? all.units[medal.type] || 0
      : medal.kind === 'xp' ? all.xp
      : medal.kind === 'days' ? all.days
      : medal.kind === 'trilhas' ? all.trilhas
      : lv;
    return { ...medal, value, done: value >= medal.goal, ratio: Math.min(1, value / medal.goal) };
  });
}

/**
 * The trilha the player is on: the one after the last finished, with its
 * tasks checked against what was logged today.
 *
 * `waiting` is true when today's trilha is already done - there is one per
 * calendar day, so the next opens tomorrow. Nothing is lost by skipping a
 * day: the same trilha is simply still there.
 */
export function trilhaToday() {
  rollDay();
  const day = state.trilhas.done.length + 1;
  const def = trilhaFor(day);
  const tasks = def.tasks.map((task) => {
    const have = Math.min(doneToday(task.type), task.units);
    return { ...task, have, done: have >= task.units };
  });
  return {
    ...def,
    tasks,
    xp: TRILHA_XP,
    ready: tasks.every((task) => task.done),
    waiting: state.trilhas.done.at(-1)?.date === today(),
  };
}

/** Day 1 up to a few past the current one, for the path screen. */
export function trilhaPath(ahead = 5) {
  const current = trilhaToday();
  const nodes = [];
  for (let day = 1; day < current.day + ahead; day += 1) {
    const status = day < current.day ? 'done'
      : day > current.day ? 'locked'
      : current.waiting ? 'waiting' : 'current';
    nodes.push({ ...trilhaFor(day), status, date: state.trilhas.done[day - 1]?.date || null });
  }
  return nodes;
}

/**
 * Finishes today's trilha and pays the flat bonus. Same result shape as
 * `logAction`, so the home screen can react to it the same way.
 *
 * @returns {{gained:number, paidUnits:number, cappedUnits:number, ready:boolean}|null}
 */
export function completeTrilha() {
  const trilha = trilhaToday();
  if (!trilha.ready || trilha.waiting) return null;

  state.trilhas.done.push({ day: trilha.day, date: today() });
  state.xp += TRILHA_XP;
  const row = dayRow();
  row.xp += TRILHA_XP;
  row.trilhas = (row.trilhas || 0) + 1;
  trimHistory();
  persist();

  return { gained: TRILHA_XP, paidUnits: 0, cappedUnits: 0, ready: canEvolve() };
}

export function resetSave() {
  state = blank();
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
