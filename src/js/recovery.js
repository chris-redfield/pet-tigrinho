import { WEEK_STARTS_ON } from './config.js';

/**
 * Recovery indicators: what shows whether the player is getting better,
 * beyond whether they like the game. Five of them, each one simple enough
 * to answer in seconds:
 *
 *   1. PGSI - the Problem Gambling Severity Index (9 questions, 0-27), at
 *      the start, after 3 months and after 6 months, then every 3 months.
 *   2. Days without betting - one answer a week, 0 to 7. Not a streak:
 *      nothing resets, a hard week is just a lower bar.
 *   3. Debt weight - monthly debt payments over monthly income, plus the
 *      balance still owed (payments can drop while the debt does not).
 *   4. Reaching care - three steps the player ticks: saw a contact, booked,
 *      went to the first appointment.
 *   5. Routine back - the hours betting used to happen, a plan for them, and
 *      how many days an action was logged inside that window.
 *
 * These are sensitive, so they live in their own key, on this device only.
 * Nothing here is sent anywhere, and nothing here pays XP by its value - an
 * honest bad week must never cost the player anything.
 */

const KEY = 'pet-tigrinho:recovery';
const DAY = 86_400_000;

/** Days after the first PGSI when the next ones are due; then every 90 days. */
export const PGSI_CHECKPOINTS = [
  { days: 0, label: 'Início' },
  { days: 90, label: '3 meses' },
  { days: 180, label: '6 meses' },
];
const PGSI_EVERY = 90;

/** Adapted to Portuguese from Ferris & Wynne (2001). */
export const PGSI_QUESTIONS = [
  'Você apostou mais do que realmente podia perder?',
  'Você precisou apostar valores cada vez maiores para sentir a mesma emoção?',
  'Depois de perder, você voltou outro dia para tentar recuperar o dinheiro?',
  'Você pegou dinheiro emprestado ou vendeu algo para conseguir dinheiro para apostar?',
  'Você sentiu que pode ter um problema com apostas?',
  'As apostas causaram algum problema de saúde para você, como estresse ou ansiedade?',
  'Alguém criticou suas apostas ou disse que você tinha um problema com isso, mesmo que você não concordasse?',
  'As apostas causaram problemas financeiros para você ou para a sua casa?',
  'Você se sentiu culpado pela forma como aposta ou pelo que acontece quando aposta?',
];

export const PGSI_OPTIONS = [
  { label: 'Nunca', value: 0 },
  { label: 'Às vezes', value: 1 },
  { label: 'Na maioria das vezes', value: 2 },
  { label: 'Quase sempre', value: 3 },
];

/** The published PGSI bands. */
export function pgsiBand(score) {
  if (score === 0) return { id: 'none', label: 'Sem sinais de problema' };
  if (score <= 2) return { id: 'low', label: 'Risco baixo' };
  if (score <= 7) return { id: 'moderate', label: 'Risco moderado' };
  return { id: 'problem', label: 'Sinais de problema com apostas' };
}

function blank() {
  return {
    weeks: {},                                        // 'YYYY-MM-DD' (week start) -> days without betting
    pgsi: [],                                         // [{ at, score, answers }], oldest first
    debt: [],                                         // [{ month: 'YYYY-MM', income, payment, balance }]
    care: { seen: null, booked: null, attended: null }, // ISO date each step was ticked
    routine: null,                                    // { from, to, plan } hours 0-23, an ACTIONS id
  };
}

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    const base = blank();
    return { ...base, ...parsed, care: { ...base.care, ...parsed.care } };
  } catch {
    return blank();
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* unsaved, still usable */ }
}

export function resetRecovery() {
  data = blank();
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function weekStartOf(d) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - ((s.getDay() - WEEK_STARTS_ON + 7) % 7));
  return s;
}

/** Key of the week `now` falls in: its first day. */
export function weekKey(now = new Date()) {
  return dateKey(weekStartOf(now));
}

// ---------- 2. days without betting ----------

/** This week's answer, or null if not given yet. */
export function thisWeek(now = new Date()) {
  return data.weeks[weekKey(now)] ?? null;
}

/**
 * Records how many of the last 7 days went without a bet. Can be changed
 * during the week. `first` is true the first time this week is answered.
 */
export function answerWeek(days, now = new Date()) {
  const key = weekKey(now);
  const first = !(key in data.weeks);
  data.weeks[key] = Math.max(0, Math.min(7, Math.round(days)));
  persist();
  return { first };
}

/** The last `count` weeks, oldest first; `days` is null for a week not answered. */
export function weekHistory(count = 8, now = new Date()) {
  const out = [];
  const d = weekStartOf(now);
  d.setDate(d.getDate() - 7 * (count - 1));
  for (let i = 0; i < count; i += 1) {
    const key = dateKey(d);
    out.push({ week: key, days: data.weeks[key] ?? null });
    d.setDate(d.getDate() + 7);
  }
  return out;
}

// ---------- 1. PGSI ----------

export function scorePgsi(answers) {
  return answers.reduce((sum, v) => sum + v, 0);
}

export function savePgsi(answers, now = new Date()) {
  if (answers.length !== PGSI_QUESTIONS.length) throw new Error('PGSI needs 9 answers');
  const score = scorePgsi(answers);
  data.pgsi.push({ at: now.toISOString(), score, answers: [...answers] });
  persist();
  return { score, band: pgsiBand(score) };
}

/** Day offset of the n-th PGSI (0-based) from the first one. */
function checkpointDays(n) {
  if (n < PGSI_CHECKPOINTS.length) return PGSI_CHECKPOINTS[n].days;
  return PGSI_CHECKPOINTS.at(-1).days + PGSI_EVERY * (n - PGSI_CHECKPOINTS.length + 1);
}

function checkpointLabel(n) {
  return PGSI_CHECKPOINTS[n]?.label ?? `${Math.round(checkpointDays(n) / 30)} meses`;
}

/**
 * The PGSI results so far, labelled by checkpoint, and when the next one is
 * due. `inDays` is 0 when it can be answered now.
 */
export function pgsiStatus(now = new Date()) {
  const results = data.pgsi.map((r, i) => ({ ...r, label: checkpointLabel(i), band: pgsiBand(r.score) }));
  const n = results.length;
  if (!n) return { results, due: true, inDays: 0, nextLabel: checkpointLabel(0) };
  const first = new Date(data.pgsi[0].at).getTime();
  const at = first + checkpointDays(n) * DAY;
  const inDays = Math.max(0, Math.ceil((at - now.getTime()) / DAY));
  return { results, due: inDays === 0, inDays, nextLabel: checkpointLabel(n) };
}

// ---------- 3. debt weight ----------

const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** Share of income going to debt payments, in percent (null without an income). */
export function debtShare({ income, payment }) {
  return income > 0 ? Math.round((payment / income) * 100) : null;
}

/** Saves this month's numbers; a second save in the same month replaces it. */
export function saveDebt({ income, payment, balance }, now = new Date()) {
  const clean = (v) => Math.max(0, Math.round(Number(v) || 0));
  const entry = { month: monthKey(now), income: clean(income), payment: clean(payment), balance: clean(balance) };
  const i = data.debt.findIndex((e) => e.month === entry.month);
  if (i >= 0) data.debt[i] = entry; else data.debt.push(entry);
  persist();
  return entry;
}

/** First and latest entries, with their shares; null before any entry. */
export function debtSummary() {
  if (!data.debt.length) return null;
  const first = data.debt[0];
  const last = data.debt.at(-1);
  return {
    first: { ...first, share: debtShare(first) },
    last: { ...last, share: debtShare(last) },
    months: data.debt.length,
  };
}

// ---------- 4. reaching care ----------

export const CARE_STEPS = [
  { id: 'seen', label: 'Vi um contato de ajuda' },
  { id: 'booked', label: 'Agendei um atendimento' },
  { id: 'attended', label: 'Fui à primeira consulta ou reunião' },
];

export function careSteps() {
  return CARE_STEPS.map((step) => ({ ...step, at: data.care[step.id] }));
}

/** Ticks a step (or unticks it with `done = false`). */
export function markCare(id, done = true, now = new Date()) {
  if (!(id in data.care)) throw new Error(`unknown care step: ${id}`);
  if (done && data.care[id]) return;
  data.care[id] = done ? now.toISOString() : null;
  persist();
}

// ---------- 5. routine ----------

export function getRoutine() {
  return data.routine;
}

/**
 * `from` and `to` are hours 0-23; the window can cross midnight (22 to 2).
 * `since` keeps the day the plan was first made, so the week count starts
 * there; changing the hours later keeps it.
 */
export function setRoutine({ from, to, plan }, now = new Date()) {
  const since = data.routine?.since ?? dateKey(now);
  data.routine = { from: Number(from), to: Number(to), plan, since };
  persist();
  return data.routine;
}

export function clearRoutine() {
  data.routine = null;
  persist();
}

/** Whether hour `hour` falls in [from, to), crossing midnight when to <= from. */
export function inWindow(hour, { from, to }) {
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

export function inRiskWindow(now = new Date()) {
  return Boolean(data.routine) && inWindow(now.getHours(), data.routine);
}

/**
 * This week so far: `planned` is the days with the plan in place (from the
 * start of the week, or from the day it was made if later), `done` the ones
 * with at least one action logged inside the risk window.
 *
 * @param {{at: string}[]} log  the game's action log (state.log)
 */
export function routineWeek(log, now = new Date()) {
  if (!data.routine) return null;
  const weekStart = weekStartOf(now);
  const [y, m, d] = (data.routine.since ?? dateKey(weekStart)).split('-').map(Number);
  const start = new Date(Math.max(weekStart, new Date(y, m - 1, d)));
  const planned = Math.round((new Date(now).setHours(0, 0, 0, 0) - start) / DAY) + 1;
  const days = new Set();
  for (const entry of log) {
    const at = new Date(entry.at);
    if (at < start || at > now) continue;
    if (inWindow(at.getHours(), data.routine)) days.add(dateKey(at));
  }
  return { planned, done: days.size };
}
