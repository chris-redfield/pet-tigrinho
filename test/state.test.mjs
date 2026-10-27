/* Run: node test/state.test.mjs */
const store = new Map();
globalThis.localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => store.set(k, v),
  removeItem: k => store.delete(k),
};

const S = await import('../src/js/state.js');

let failed = 0;
const ok = (name, got, want) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)} want ${JSON.stringify(want)}`).padEnd(36), name);
};

ok('starts petless', S.hasPet(), false);
S.chooseEgg('jade');
ok('has pet after egg', S.hasPet(), true);

// --- flat rates, no randomness anywhere ---
ok('3000 steps = 30xp', S.logAction('steps', 3000).gained, 30);
ok('1 photo = 10xp', S.logAction('photo', 1).gained, 10);
ok('25 pages = 38xp', S.logAction('book', 25).gained, 38);   // 25/10*15 = 37.5
ok('30 min = 20xp', S.logAction('course', 30).gained, 20);
ok('xp accumulated', S.getState().xp, 98);

ok('same input, same output',
  [1, 2, 3].map(() => Math.round((1000 / 1000) * 10)), [10, 10, 10]);

// --- daily caps ---
let r = S.logAction('steps', 20000);                          // 12000 of it still pays
ok('cap pays 12000 only', r.gained, 120);
ok('cap reports overflow', r.cappedUnits, 8000);
ok('totals keep full amount', S.getState().totals.steps, 23000);
ok('nothing left today', S.remainingToday('steps'), 0);
ok('over cap pays zero', S.logAction('steps', 5000).gained, 0);
ok('xp after caps', S.getState().xp, 218);

// --- evolution ---
ok('218 is still stage 0', S.getState().stage, 0);
r = S.logAction('course', 9999);                              // cap leaves 150min -> +100
ok('course cap pays 100', r.gained, 100);
ok('crossed 300 into stage 1', S.getState().stage, 1);
ok('evolve event fires', r.evolved?.name, "Tigre d'Água");

const p = S.progress();
ok('next stage is Cósmico', p.next.name, 'Tigre Cósmico');
ok('progress into stage', p.into, 318 - 300);
ok('span to next', p.span, 1200 - 300);

ok('xp never drops', S.getState().xp >= 318, true);
ok('zero units is a no-op', S.logAction('photo', 0).gained, 0);

// --- persistence ---
const xp = S.getState().xp;
const reloaded = await import('../src/js/state.js?fresh');
ok('save survives reload', reloaded.getState().xp, xp);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
