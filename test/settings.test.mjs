/* Run: node test/settings.test.mjs */
const store = new Map();
globalThis.localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => store.set(k, v),
  removeItem: k => store.delete(k),
};

const S = await import('../src/js/settings.js');

let failed = 0;
const ok = (name, got, want) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failed++;
  console.log((pass ? 'PASS' : `FAIL got ${JSON.stringify(got)} want ${JSON.stringify(want)}`).padEnd(36), name);
};

ok('defaults', S.getSettings(), { volume: 80, music: true, sfx: true, notifications: false, reminders: false, language: 'pt', haptics: true,
  reduceMotion: null, contrast: false, colorblind: false, mobility: false });
S.setSetting('volume', 35);
S.setSetting('haptics', false);
ok('saved', JSON.parse(store.get('pet-tigrinho:settings')).volume, 35);
ok('kept in memory', S.getSettings().haptics, false);
ok('unknown key refused', (() => { try { S.setSetting('nope', 1); return false; } catch { return true; } })(), true);
ok('no notifications in node', S.canNotify(), false);
ok('remind is off by default', S.remind('x'), false);
S.resetSettings();
ok('reset back to defaults', [S.getSettings().volume, store.has('pet-tigrinho:settings')], [80, false]);

console.log(failed ? `\n${failed} FAILED` : '\nall green');
process.exit(failed ? 1 : 0);
