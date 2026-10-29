/* Run: node test/recovery.test.mjs */
const store = new Map();
globalThis.localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => store.set(k, v),
  removeItem: k => store.delete(k),
};

const R = await import('../src/js/recovery.js');

let failed = 0;
const ok = (name, got, want) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)} want ${JSON.stringify(want)}`).padEnd(36), name);
};

const day = (s) => new Date(`${s}T12:00:00`);

// --- PGSI ---
ok('9 questions', R.PGSI_QUESTIONS.length, 9);
ok('band 0', R.pgsiBand(0).id, 'none');
ok('band 2', R.pgsiBand(2).id, 'low');
ok('band 7', R.pgsiBand(7).id, 'moderate');
ok('band 8', R.pgsiBand(8).id, 'problem');
ok('first PGSI is due', R.pgsiStatus(day('2026-01-01')).due, true);
ok('score sums answers', R.savePgsi([3, 2, 2, 1, 2, 1, 1, 2, 1], day('2026-01-01')).score, 15);
let st = R.pgsiStatus(day('2026-01-02'));
ok('next is 3 months', [st.due, st.nextLabel, st.inDays], [false, '3 meses', 89]);
ok('due at 90 days', R.pgsiStatus(day('2026-04-01')).due, true);
R.savePgsi([1, 1, 1, 1, 1, 0, 1, 1, 0], day('2026-04-01'));
st = R.pgsiStatus(day('2026-04-02'));
ok('then 6 months, from the first', [st.nextLabel, st.inDays], ['6 meses', 89]);
ok('results labelled', st.results.map((r) => [r.label, r.score]), [['Início', 15], ['3 meses', 7]]);
ok('PGSI needs 9 answers', (() => { try { R.savePgsi([1]); return false; } catch { return true; } })(), true);

// --- days without betting: weekly, editable, never a streak ---
ok('week starts Monday', R.weekKey(day('2026-10-29')), '2026-10-26');
ok('unanswered week is null', R.thisWeek(day('2026-10-29')), null);
ok('first answer of the week', R.answerWeek(3, day('2026-10-27')).first, true);
ok('changing it is not first', R.answerWeek(5, day('2026-10-29')).first, false);
ok('answer kept', R.thisWeek(day('2026-10-29')), 5);
ok('clamped to 7', (R.answerWeek(9, day('2026-10-20')), R.weekHistory(2, day('2026-10-29')).map((w) => w.days)), [7, 5]);
ok('gaps stay null', R.weekHistory(3, day('2026-10-29'))[0].days, null);

// --- debt weight ---
ok('no debt yet', R.debtSummary(), null);
R.saveDebt({ income: 2000, payment: 800, balance: 9000 }, day('2026-08-10'));
R.saveDebt({ income: 2000, payment: 500, balance: 8000 }, day('2026-09-10'));
R.saveDebt({ income: 2000, payment: 400, balance: 7000 }, day('2026-09-28'));   // same month: replaces
let d = R.debtSummary();
ok('share first to last', [d.first.share, d.last.share], [40, 20]);
ok('one entry per month', d.months, 2);
ok('balance tracked', d.last.balance, 7000);
ok('no income, no share', R.debtShare({ income: 0, payment: 100 }), null);

// --- reaching care ---
ok('steps start open', R.careSteps().map((s) => s.at), [null, null, null]);
R.markCare('seen', true, day('2026-10-01'));
R.markCare('seen', true, day('2026-10-05'));                                     // keeps the first date
ok('first tick kept', R.careSteps()[0].at.slice(0, 10), '2026-10-01');
R.markCare('booked');
R.markCare('booked', false);
ok('untick', R.careSteps()[1].at, null);

// --- routine ---
ok('no routine, no window', R.inRiskWindow(day('2026-10-29')), false);
R.setRoutine({ from: '20', to: '22', plan: 'steps' }, day('2026-10-26'));
ok('window 20-22', [19, 20, 21, 22].map((h) => R.inWindow(h, R.getRoutine())), [false, true, true, false]);
ok('window across midnight', [21, 23, 1, 2].map((h) => R.inWindow(h, { from: 22, to: 2 })), [false, true, true, false]);
const at = (s) => ({ at: new Date(s).toISOString() });
const log = [at('2026-10-29T20:30'), at('2026-10-28T21:10'), at('2026-10-28T20:05'), at('2026-10-27T09:00'), at('2026-10-20T20:30')];
ok('days with an action in window', R.routineWeek(log, new Date('2026-10-29T23:00')), { planned: 4, done: 2 });
R.clearRoutine();
R.setRoutine({ from: 20, to: 22, plan: 'book' }, day('2026-10-29'));
ok('planned counts from the day it was made', R.routineWeek([], new Date('2026-10-29T23:00')).planned, 1);
R.setRoutine({ from: 21, to: 23, plan: 'book' }, day('2026-10-31'));
ok('changing the hours keeps the start', R.routineWeek([], new Date('2026-10-31T23:00')).planned, 3);

// --- persisted, and reset clears ---
ok('saved under its own key', store.has('pet-tigrinho:recovery'), true);
R.resetRecovery();
ok('reset clears', [R.debtSummary(), R.getRoutine(), R.pgsiStatus().results.length], [null, null, 0]);

console.log(failed ? `\n${failed} FAILED` : '\nall green');
process.exit(failed ? 1 : 0);
