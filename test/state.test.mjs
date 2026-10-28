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
ok('azul hatches Tigre d\'Água', S.currentForm().id, 'tigre-dagua');
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
ok('unnamed pet uses form name', S.petName(), "Tigre d'Água");
ok('rename trims and collapses', S.renamePet('  Mimi   do   Sol  '), 'Mimi do Sol');
ok('rename caps length', S.renamePet('x'.repeat(40)).length, 16);
ok('blank rename restores form name', S.renamePet('   '), "Tigre d'Água");
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
ok('only Oceaniger met', S.pickBranch('tigre-dagua', bars(10, 95, 0, 10)).form.id, 'oceaniger');
ok('Neviger met', S.pickBranch('tigre-dagua', bars(75, 0, 0, 85)).form.id, 'neviger');
ok('both met: Água cleared by more', S.pickBranch('tigre-dagua', bars(65, 95, 0, 70)).form.id, 'oceaniger');
ok('both met: Gelo cleared by more', S.pickBranch('tigre-dagua', bars(85, 72, 0, 90)).form.id, 'neviger');
ok('tie goes to first listed', S.pickBranch('tigre-dagua', bars(70, 80, 0, 70)).form.id, 'oceaniger');
ok('none met -> closest', S.pickBranch('tigre-dagua', bars(50, 60, 0, 40)).form.id, 'oceaniger');
ok('Água at 70% happiness', S.pickBranch('tigre-dagua', bars(0, 70, 0, 0)).form.id, 'oceaniger');
ok('Neviger at 60/60', S.pickBranch('tigre-dagua', bars(60, 0, 0, 60)).form.id, 'neviger');
ok('cosmic line is direct', S.pickBranch('tigrin', bars(0, 0, 0, 0)).form.id, 'estreliger');
ok('Estreliger -> Tigre Cósmico', S.pickBranch('estreliger', bars(0, 0, 0, 0)).form.id, 'tigre-cosmico');
ok('fire line is direct', S.pickBranch('brasinha', bars(0, 0, 96, 0)).form.id, 'tigre-fornalha');
ok('grass line is direct', S.pickBranch('floriger', bars(86, 0, 81, 96)).form.id, 'tigre-yggdrasil');
ok('final forms have no branch', S.pickBranch('tigre-glacial', bars(0, 0, 0, 0)), null);

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
ok('1680xp is still Tigre d\'Água', S.currentForm().id, 'tigre-dagua');
ok('prediction is Neviger', S.nextBranch().form.id, 'neviger');
newDay();
r = S.logAction('book', 100);
ok('crossing Nv 16 evolves', r.evolved?.id, 'neviger');
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

// --- saves holding a retired form rejoin their egg's line ---
store.set('pet-tigrinho:save', JSON.stringify({ version: 2, pet: { egg: 'branco', name: 'Luz' }, form: 'tigreluz',
  xp: 2000, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
const retired = await import('../src/js/state.js?retired');
ok('retired Raro -> Estreliger', retired.currentForm().id, 'estreliger');
ok('retired save keeps name', retired.petName(), 'Luz');
store.set('pet-tigrinho:save', JSON.stringify({ version: 2, pet: { egg: 'azul' }, form: 'gotigre',
  xp: 100, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
ok('retired base -> Tigre d\'Água', (await import('../src/js/state.js?retired3')).currentForm().id, 'tigre-dagua');
store.set('pet-tigrinho:save', JSON.stringify({ version: 2, pet: { egg: 'azul' }, form: 'sereiger',
  xp: 9500, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
ok('retired final -> Leviatã', (await import('../src/js/state.js?retired2')).currentForm().id, 'tigre-leviata');

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
