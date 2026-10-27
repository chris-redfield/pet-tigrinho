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
S.chooseEgg('azul');
ok('azul hatches Gotigre', S.currentForm().id, 'gotigre');
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

// --- level, derived from lifetime xp ---
let lv = S.level();                                           // Nv 6 starts at 225, Nv 5 at 150
ok('218xp is Nv 5', lv.level, 5);
ok('xp into level', lv.into, 218 - 150);
ok('level span', lv.span, 75);
ok('Nv 16 starts at 1800', S.levelStart(16), 1800);
ok('Nv 36 starts at 9450', S.levelStart(36), 9450);

// --- status bars fill from this phase's earned xp only ---
const st = Object.fromEntries(S.stats().map((s) => [s.id, s.value]));
ok('wisdom = book + course xp', st.wisdom, 38 + 20);
ok('health = steps xp', st.health, 150);
ok('happiness = photo xp', st.happiness, 10);
ok('capped units add nothing', S.getState().phase.steps, 150);
ok('meal feeds fullness', (S.logAction('meal', 2), S.stats().find((s) => s.id === 'fullness').value), 20);
ok('health pct = 150 / (.35*1800)', S.stats().find((s) => s.id === 'health').pct, 24);

// --- naming ---
ok('unnamed pet uses form name', S.petName(), 'Gotigre');
ok('rename trims and collapses', S.renamePet('  Mimi   do   Sol  '), 'Mimi do Sol');
ok('rename caps length', S.renamePet('x'.repeat(40)).length, 16);
ok('blank rename restores form name', S.renamePet('   '), 'Gotigre');
S.renamePet('Mimi');

// --- persistence ---
const xp = S.getState().xp;
const reloaded = await import('../src/js/state.js?fresh');
ok('save survives reload', reloaded.getState().xp, xp);
ok('name survives reload', reloaded.petName(), 'Mimi');
ok('phase survives reload', reloaded.getState().phase.meal, 20);

// --- branch picking (pure) ---
const bars = (w, h, f, s) => [
  { id: 'wisdom', raw: w }, { id: 'happiness', raw: h }, { id: 'fullness', raw: f }, { id: 'health', raw: s },
];
ok('only Coraliger met', S.pickBranch('gotigre', bars(10, 95, 0, 10)).form.id, 'coraliger');
ok('Neviger met', S.pickBranch('gotigre', bars(75, 0, 0, 85)).form.id, 'neviger');
ok('harder Toxitigre beats Neviger', S.pickBranch('gotigre', bars(96, 0, 0, 91)).form.id, 'toxitigre');
ok('none met -> closest', S.pickBranch('gotigre', bars(60, 50, 0, 79)).form.id, 'neviger');
ok('Sombriger needs food + wisdom', S.pickBranch('tigrin', bars(81, 10, 91, 0)).form.id, 'sombriger');
ok('Vulcaniger needs fullness 95', S.pickBranch('brasinha', bars(0, 0, 96, 0)).form.id, 'vulcaniger');
ok('Espinhiger beats Troncotigre', S.pickBranch('folhiger', bars(86, 0, 81, 96)).form.id, 'espinhiger');
ok('Palatigre needs health 100', S.pickBranch('tigreluz', bars(95, 99, 0, 100)).form.id, 'palatigre');
ok('Nv36 by highest stat', S.pickBranch('mentetigre', bars(40, 90, 10, 20)).form.id, 'ilusioniger');
ok('Nv36 favors either stat', S.pickBranch('mentetigre', bars(40, 10, 95, 20)).form.id, 'tigre-mestre');
ok('final forms have no branch', S.pickBranch('palatigre', bars(0, 0, 0, 0)), null);

// --- evolving end to end: azul egg, focused on wisdom + health ---
S.resetSave();
S.chooseEgg('azul');
const newDay = () => { S.getState().daily = { date: 'yesterday' }; };
for (let day = 0; day < 4; day++) {
  newDay();
  S.logAction('book', 100);                                   // +150
  S.logAction('course', 180);                                 // +120
  S.logAction('steps', 15000);                                // +150
}
ok('1680xp is still Gotigre', S.currentForm().id, 'gotigre');
ok('prediction is Toxitigre', S.nextBranch().form.id, 'toxitigre');
newDay();
r = S.logAction('book', 100);
ok('crossing Nv 16 evolves', r.evolved?.id, 'toxitigre');
ok('evolved form is Raro', S.currentForm().rarity, 'raro');
ok('phase restarts', S.stats().every((s) => s.value === 0), true);
ok('next evolution is Nv 36', S.progress().next, 36);
ok('xp never drops', S.getState().xp, 1830);

// --- v1 saves migrate ---
store.set('pet-tigrinho:save', JSON.stringify({ version: 1, pet: { egg: 'jade', name: 'Rex' }, xp: 500, stage: 1,
  totals: { photo: 1, steps: 2000, book: 0, course: 0 }, daily: { date: 'x' }, log: [] }));
const migrated = await import('../src/js/state.js?v1');
ok('v1 becomes Tigrin', migrated.currentForm().id, 'tigrin');
ok('v1 keeps xp and name', [migrated.getState().xp, migrated.petName()], [500, 'Rex']);
ok('v1 gains meal totals', migrated.getState().totals.meal, 0);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
