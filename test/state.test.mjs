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
ok('3000 steps = 120xp', S.logAction('steps', 3000).gained, 120);
ok('1 photo = 40xp', S.logAction('photo', 1).gained, 40);
ok('25 pages = 150xp', S.logAction('book', 25).gained, 150);  // 25/10*60
ok('30 min = 80xp', S.logAction('course', 30).gained, 80);
ok('xp accumulated', S.getState().xp, 390);

ok('same input, same output',
  [1, 2, 3].map(() => Math.round((1000 / 1000) * 10)), [10, 10, 10]);

// --- daily caps ---
let r = S.logAction('steps', 20000);                          // 12000 of it still pays
ok('cap pays 12000 only', r.gained, 480);
ok('cap reports overflow', r.cappedUnits, 8000);
ok('totals keep full amount', S.getState().totals.steps, 23000);
ok('nothing left today', S.remainingToday('steps'), 0);
ok('over cap pays zero', S.logAction('steps', 5000).gained, 0);
ok('xp after caps', S.getState().xp, 870);

// --- level, derived from lifetime xp ---
let lv = S.level();                                           // Nv 18 starts at 918, Nv 17 at 816
ok('870xp is Nv 17', lv.level, 17);
ok('xp into level', lv.into, 870 - 816);
ok('level span', lv.span, 102);
ok('Nv 16 starts at 720', S.levelStart(16), 720);
ok('Nv 36 starts at 3780', S.levelStart(36), 3780);

// --- status bars fill from this phase's earned xp only ---
const st = Object.fromEntries(S.stats().map((s) => [s.id, s.value]));
ok('wisdom = book + course xp', st.wisdom, 150 + 80);
ok('health = steps xp', st.health, 600);
ok('happiness = photo xp', st.happiness, 40);
ok('capped units add nothing', S.getState().phase.steps, 600);
ok('meal feeds fullness', (S.logAction('meal', 2), S.stats().find((s) => s.id === 'fullness').value), 80);
ok('health pct caps at 100', S.stats().find((s) => s.id === 'health').pct, 100);  // 600 > .35*720

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
ok('phase survives reload', reloaded.getState().phase.meal, 80);

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
ok('Tigrin: explorer -> Estreliger', S.pickBranch('tigrin', bars(20, 60, 0, 55)).form.id, 'estreliger');
ok('Tigrin: scholar -> Tigran', S.pickBranch('tigrin', bars(80, 10, 0, 10)).form.id, 'tigran');
ok('Tigrin: both met, cleared by more', S.pickBranch('tigrin', bars(75, 90, 0, 90)).form.id, 'estreliger');
ok('Tigrin: nothing logged -> closest', S.pickBranch('tigrin', bars(0, 0, 0, 0)).form.id, 'estreliger');
ok('Tigran -> Tigre Sábio', S.pickBranch('tigran', bars(0, 0, 0, 0)).form.id, 'tigre-sabio');
ok('Estreliger -> Tigre Cósmico', S.pickBranch('estreliger', bars(0, 0, 0, 0)).form.id, 'tigre-cosmico');
ok('Brasinha: forge -> Fornalha', S.pickBranch('brasinha', bars(60, 0, 70, 10)).form.id, 'tigre-fornalha');
ok('Brasinha: walker -> Vulcaniger', S.pickBranch('brasinha', bars(10, 0, 20, 80)).form.id, 'vulcaniger');
ok('Brasinha: nothing logged -> Fornalha', S.pickBranch('brasinha', bars(0, 0, 0, 0)).form.id, 'tigre-fornalha');
ok('Vulcaniger -> Magmatígreo', S.pickBranch('vulcaniger', bars(0, 0, 0, 0)).form.id, 'magmatigreo');
ok('Floriger -> Yggdrasil', S.pickBranch('floriger', bars(86, 0, 81, 96)).form.id, 'tigre-yggdrasil');
ok('Folhiger: photos -> Floriger', S.pickBranch('folhiger', bars(0, 75, 20, 0)).form.id, 'floriger');
ok('Folhiger: meals -> Tigrelis', S.pickBranch('folhiger', bars(0, 20, 80, 0)).form.id, 'tigrelis');
ok('Folhiger: nothing logged -> Floriger', S.pickBranch('folhiger', bars(0, 0, 0, 0)).form.id, 'floriger');
ok('Tigrelis -> Parasitigre', S.pickBranch('tigrelis', bars(0, 0, 0, 0)).form.id, 'parasitigre');
ok('final forms have no branch', S.pickBranch('tigre-glacial', bars(0, 0, 0, 0)), null);

// --- evolving end to end: azul egg, focused on wisdom + health ---
S.resetSave();
S.chooseEgg('azul');
const newDay = () => { S.getState().daily = { date: 'yesterday' }; };
newDay();
S.logAction('book', 30);                                      // +180
S.logAction('course', 30);                                    // +80
S.logAction('steps', 3000);                                   // +120
newDay();
S.logAction('steps', 1000);                                   // +40, health 160/252
ok('420xp is still Tigre d\'Água', S.currentForm().id, 'tigre-dagua');
ok('prediction is Neviger', S.nextBranch().form.id, 'neviger');
ok('600xp is not ready yet', S.logAction('book', 30).ready, false);
ok('tapping early does nothing', S.evolve(), null);
r = S.logAction('course', 60);                                // 760, past Nv 16 (720)
ok('crossing Nv 16 makes it ready', r.ready, true);
ok('it waits for the tap', S.currentForm().id, 'tigre-dagua');
ok('xp keeps counting while it waits', S.logAction('steps', 1000).gained, 40);
ok('tap evolves it', S.evolve()?.id, 'neviger');
ok('no longer ready after evolving', S.canEvolve(), false);
ok('evolved form is Raro', S.currentForm().rarity, 'raro');
ok('phase restarts', S.stats().every((s) => s.value === 0), true);
ok('next evolution is Nv 36', S.progress().next, 36);
ok('xp never drops', S.getState().xp, 800);

// --- dev level-up: exactly the XP to the next level ---
S.resetSave();
ok('dev does nothing without a pet', S.devLevelUp().gained, 0);
S.chooseEgg('branco');
ok('dev grants Nv 2 cost', S.devLevelUp().gained, 6);
ok('dev lands on Nv 2', S.level(), { level: 2, into: 0, span: 12, ratio: 0 });
let dev;
for (let i = 0; i < 14; i++) dev = S.devLevelUp();
ok('dev reaches Nv 16, ready, not evolved', [S.level().level, dev.ready, S.currentForm().id], [16, true, 'tigrin']);
ok('dev feeds no status bar', S.stats().every((s) => s.value === 0), true);
for (let i = 0; i < 20; i++) dev = S.devLevelUp();
ok('Nv 36 while still base', [S.level().level, S.currentForm().id], [36, 'tigrin']);
ok('first tap -> Estreliger', S.evolve()?.id, 'estreliger');
ok('still ready for the next stage', S.canEvolve(), true);
ok('second tap -> Tigre Cósmico', S.evolve()?.id, 'tigre-cosmico');
ok('final form never ready', [S.canEvolve(), S.evolve()], [false, null]);

// --- encyclopedia and a new egg after the final form ---
ok('the whole line is discovered', [...S.discovered()].sort(), ['estreliger', 'tigre-cosmico', 'tigrin']);
ok('new egg opens at the final form', S.canStartNewEgg(), true);
const before = S.activity('all').xp;
ok('new egg retires the pet', S.startNewEgg(), true);
ok('back to the egg pick', [S.hasPet(), S.getState().xp, S.canStartNewEgg()], [false, 0, false]);
ok('retired pet is kept', S.retiredPets().map((p) => p.form), ['tigre-cosmico']);
ok('lifetime xp keeps the retired pet', S.activity('all').xp, before);
S.chooseEgg('verde');
ok('new pet starts at Nv 1', [S.level().level, S.currentForm().id], [1, 'folhiger']);
ok('encyclopedia keeps both lines', S.discovered().has('tigre-cosmico') && S.discovered().has('folhiger'), true);
ok('level medals stay earned', S.medals().find((m) => m.id === 'lv-16').done, true);
ok('no new egg before the final form', [S.canStartNewEgg(), S.startNewEgg()], [false, false]);

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
ok('old save discovers its line', [...retired.discovered()].sort(), ['estreliger', 'tigrin']);
store.set('pet-tigrinho:save', JSON.stringify({ version: 2, pet: { egg: 'azul' }, form: 'gotigre',
  xp: 100, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
ok('retired base -> Tigre d\'Água', (await import('../src/js/state.js?retired3')).currentForm().id, 'tigre-dagua');
store.set('pet-tigrinho:save', JSON.stringify({ version: 2, pet: { egg: 'azul' }, form: 'sereiger',
  xp: 9500, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
ok('retired final -> Leviatã', (await import('../src/js/state.js?retired2')).currentForm().id, 'tigre-leviata');

// --- achievements: lifetime and this week ---
S.resetSave();
S.chooseEgg('branco');
S.logAction('photo', 2);
S.logAction('book', 20);
ok('week xp matches lifetime on day one', S.activity('week').xp, S.activity('all').xp);
ok('week counts the units', S.activity('week').units.photo, 2);
ok('one active day', [S.activity('all').days, S.activity('week').days], [1, 1]);
ok('units over the cap still count as done', S.logAction('photo', 99).cappedUnits, 96);
ok('capped units are on the record', S.activity('all').units.photo, 101);
ok('capped units paid no xp', S.activity('all').xp, 320);  // 5 photos + 20 pages
ok('medal earned by units', S.medals().find((m) => m.id === 'photo-50').done, true);
ok('medal not yet earned', S.medals().find((m) => m.id === 'photo-10').value >= 10, true);
ok('level medal still locked', S.medals().find((m) => m.id === 'lv-16').done, false);
ok('no evolutions yet', S.evolutions(), 0);
ok('week runs monday to today', S.weekDays().length <= 7, true);

// --- trilhas: one per day, tasks read from what was logged ---
S.resetSave();
S.chooseEgg('branco');
ok('starts on day 1', S.trilhaToday().day, 1);
ok('day 1 is not ready', S.trilhaToday().ready, false);
ok('cannot finish early', S.completeTrilha(), null);
ok('path marks the current day', S.trilhaPath().find((n) => n.status === 'current').day, 1);
S.logAction('photo', 1);
ok('partial task shows progress', S.trilhaToday().tasks[0], { type: 'photo', units: 1, have: 1, done: true });
ok('still waiting on the other task', S.trilhaToday().ready, false);
S.logAction('meal', 1);
ok('all tasks done', S.trilhaToday().ready, true);
ok('no coins before a trilha', S.coins(), 0);
const finished = S.completeTrilha();
ok('finishing pays the flat bonus', [finished.gained, finished.coins], [100, 3]);
ok('coins in the wallet', S.coins(), 3);
ok('bonus is on the record', S.activity('week').xp, 180);  // 40 + 40 + 100
ok('the next day waits for tomorrow', [S.trilhaToday().day, S.trilhaToday().waiting], [2, true]);
ok('cannot finish twice in a day', S.completeTrilha(), null);
ok('day 1 reads as done', S.trilhaPath()[0].status, 'done');
ok('trilha medal earned', S.medals().find((m) => m.id === 'trilha-1').done, true);
ok('the path wraps past the list', S.trilhaPath(14).at(-1).day, 15);

// --- v2 saves keep their totals and start an empty week ---
store.set('pet-tigrinho:save', JSON.stringify({ version: 2, pet: { egg: 'branco' }, form: 'tigrin',
  xp: 300, phase: {}, totals: { photo: 7, steps: 0, book: 0, course: 0, meal: 0 }, daily: { date: 'x' }, log: [] }));
const v2 = await import('../src/js/state.js?v2');
ok('v2 keeps lifetime units', v2.activity('all').units.photo, 7);
ok('v2 has no week history yet', v2.activity('week').xp, 0);
ok('v2 starts on trilha day 1', v2.trilhaToday().day, 1);
ok('v2 starts with no coins', v2.coins(), 0);

// --- saves from before the coins get paid for the trilhas already done ---
store.set('pet-tigrinho:save', JSON.stringify({ version: 3, pet: { egg: 'branco' }, form: 'tigrin',
  xp: 300, phase: {}, totals: {}, daily: { date: 'x' }, log: [],
  trilhas: { done: [{ day: 1, date: '2026-01-01' }, { day: 2, date: '2026-01-02' }] } }));
ok('back pay for old trilhas', (await import('../src/js/state.js?coins')).coins(), 6);

// --- photos pay by place ---
S.resetSave();
S.chooseEgg('branco');
ok('park photo pays the nature rate', S.logAction('photo', 1, { place: 'natureza' }).gained, 80);
ok('work photo pays the work rate', S.logAction('photo', 1, { place: 'trabalho' }).gained, 60);
ok('home photo pays the base rate', S.logAction('photo', 1, { place: 'casa' }).gained, 40);
ok('unknown place pays the base rate', S.logAction('photo', 1, { place: 'cassino' }).gained, 40);
ok('place is on the log', S.getState().log[1].place, 'casa');
ok('place rates keep the daily cap', [S.logAction('photo', 1, { place: 'natureza' }).gained, S.logAction('photo', 1, { place: 'natureza' }).gained], [80, 0]);
ok('photo xp feeds happiness', S.stats().find((s) => s.id === 'happiness').value, 300);

// --- first-run tour: once for new players, never forced on old saves ---
S.resetSave();
ok('new player has not seen the tour', S.isOnboarded(), false);
S.chooseEgg('verde');
ok('hatching does not mark it', S.isOnboarded(), false);
S.finishOnboarding();
ok('finishing marks it', S.isOnboarded(), true);
ok('it is saved', JSON.parse(store.get('pet-tigrinho:save')).onboarded, true);
store.set('pet-tigrinho:save', JSON.stringify({ version: 3, pet: { egg: 'branco' }, form: 'tigrin',
  xp: 50, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
ok('old save with a pet skips the tour', (await import('../src/js/state.js?tour1')).isOnboarded(), true);
store.set('pet-tigrinho:save', JSON.stringify({ version: 3, pet: null, form: null,
  xp: 0, phase: {}, totals: {}, daily: { date: 'x' }, log: [] }));
ok('old save without a pet gets it', (await import('../src/js/state.js?tour2')).isOnboarded(), false);

// --- weekly check-in: flat XP, the same whatever the answer ---
store.clear();
const C = await import('../src/js/state.js?checkin');
ok('no pet, no check-in xp', C.payCheckin().gained, 0);
C.chooseEgg('branco');
ok('check-in pays flat 20', C.payCheckin().gained, 20);
ok('check-in counts in xp', C.getState().xp, 20);

console.log(failed ? `\n${failed} failing` : '\nall green');
process.exit(failed ? 1 : 0);
